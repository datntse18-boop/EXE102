import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

const PLAN_PRICES: Record<string, number> = {
  trial: 69000,
  premium: 699000,
  team_premium: 3149000,
  enterprise: 899000,
}

// Hàm bổ trợ sinh mã giao dịch ngẫu nhiên duy nhất (Ví dụ: SC87A9F2)
const generateTransactionCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456780'
  let result = 'SC'
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 1. GET /api/payments — Admin/Supervisor/Manager: tất cả, người dùng thường: đơn của chính họ
export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const where: any = {}
    const userRole = req.user!.role
    // Cho phép admin, supervisor, manager xem toàn bộ danh sách thanh toán
    if (userRole !== 'admin' && userRole !== 'supervisor' && userRole !== 'manager' && userRole !== 'leader') {
      where.userId = req.user!.id
    }

    const payments = await prisma.payment.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: payments })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// 2. GET /api/payments/:id — Lấy chi tiết đơn hàng
export const getPaymentDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!id) {
      res.status(400).json({ success: false, message: 'Yêu cầu mã định danh đơn hàng' });
      return;
    }

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { id: id },
          { txId: id }
        ]
      }
    });

    if (!payment) {
      res.status(404).json({ success: false, message: 'Không tìm thấy đơn thanh toán này' });
      return;
    }

    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/payments — Create PENDING payment
export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { plan, txId, discountCode, bankId, teamId, durationMonths } = req.body;
    
    const validPlans = ['trial', 'premium', 'enterprise'];
    if (!plan || !validPlans.includes(plan)) {
      res.status(400).json({ success: false, message: 'Valid plan required' });
      return;
    }

    let amountKey = plan;
    if (teamId && plan === 'premium') {
      amountKey = 'team_premium';
      const team = await prisma.team.findUnique({ where: { id: teamId } });
      if (!team || team.leaderId !== req.user!.id) {
        res.status(403).json({ success: false, message: 'Quyền trưởng nhóm không hợp lệ' });
        return;
      }
    }

    const duration = Number(durationMonths) || 1;
    let amount = PLAN_PRICES[amountKey] || 0;
    if (plan === 'trial') {
      const dbUser = await prisma.user.findUnique({ where: { id: req.user!.id } })
      if (dbUser?.hasUsedTrial) {
        res.status(400).json({
          success: false,
          message: 'Tài khoản của bạn đã sử dụng gói Dùng Thử 3 Ngày trước đó. Mỗi tài khoản chỉ được dùng 1 lần duy nhất.'
        })
        return
      }
      amount = 69000;
    } else {
      amount = amount * duration;
      if (duration === 3) amount = Math.round(amount * 0.8);
      else if (duration === 12) amount = Math.round(amount * 0.7);
    }

    if (discountCode === 'STUDYCONNECT30') amount = Math.round(amount * 0.7);
    const finalTxId = txId || generateTransactionCode();

    const payment = await prisma.payment.create({
      data: {
        userId: req.user!.id,
        amount,
        plan: plan as any,
        status: 'pending',
        txId: finalTxId, 
        evidence: null,
        bankId,
        teamId: teamId || null,
        durationMonths: duration,
      },
    });

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Đơn thanh toán đã được khởi tạo thành công.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/payments/:id/confirm — Admin confirms payment manually (Fallback)
export const confirmPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { id: id },
          { txId: id }
        ]
      }
    })
    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment not found' })
      return
    }

    const userRole = req.user!.role
    if (payment.userId !== req.user!.id && userRole !== 'admin' && userRole !== 'supervisor' && userRole !== 'manager' && userRole !== 'leader') {
      res.status(403).json({ success: false, message: 'Không có quyền xác nhận đơn thanh toán này' })
      return
    }

    if (payment.status === 'completed') {
      res.json({ success: true, message: 'Đơn thanh toán đã được xác nhận thành công trước đó.', data: payment })
      return
    }

    // Mark as completed
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'completed' },
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    const duration = payment.durationMonths || 1
    let expiresAt = new Date()

    // Upgrade subscription (Team or User)
    if (payment.teamId) {
      const team = await prisma.team.findUnique({ where: { id: payment.teamId } })
      let baseDate = new Date()
      if (team && team.subscriptionExpiresAt && new Date(team.subscriptionExpiresAt) > baseDate) {
        baseDate = new Date(team.subscriptionExpiresAt)
      }
      expiresAt = new Date(baseDate)
      expiresAt.setMonth(expiresAt.getMonth() + duration)

      await prisma.team.update({
        where: { id: payment.teamId },
        data: { 
          subscription: payment.plan,
          subscriptionExpiresAt: expiresAt,
        }
      })

      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: '🎉 Thanh toán gói Nhóm thành công!',
          content: `Gói Premium của nhóm đã được kích hoạt. Ngày hết hạn: ${expiresAt.toLocaleDateString('vi-VN')} (Gia hạn cộng dồn thành công)`,
          link: '/pricing',
        },
      })
    } else {
      const user = await prisma.user.findUnique({ where: { id: payment.userId } })
      let baseDate = new Date()
      if (user && user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > baseDate) {
        baseDate = new Date(user.subscriptionExpiresAt)
      }
      expiresAt = new Date(baseDate)
      if (payment.plan === 'trial') {
        expiresAt.setDate(expiresAt.getDate() + 3)
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + duration)
      }

      await prisma.user.update({
        where: { id: payment.userId },
        data: { 
          subscription: payment.plan === 'trial' ? 'trial' : payment.plan,
          subscriptionExpiresAt: expiresAt,
          hasUsedTrial: payment.plan === 'trial' ? true : undefined,
        },
      })

      const planTitle = payment.plan === 'trial' ? 'Gói Dùng Thử 3 Ngày (69.000 VNĐ)' : (payment.plan === 'premium' ? 'Gói Pro Premium' : 'Gói Enterprise')
      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: '🎉 Thanh toán xác nhận thành công!',
          content: `${planTitle} của bạn đã được kích hoạt thành công. Ngày hết hạn: ${expiresAt.toLocaleDateString('vi-VN')} (Gia hạn cộng dồn thành công)`,
          link: '/pricing',
        },
      })
    }

    res.json({ success: true, data: updated, message: 'Payment confirmed & subscription upgraded' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// PATCH /api/payments/:id/reject — Admin/Supervisor rejects payment
export const rejectPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string
    const { reason } = req.body

    const payment = await prisma.payment.findUnique({ where: { id } })
    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment not found' })
      return
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: { status: 'failed' },
    })

    await prisma.notification.create({
      data: {
        userId: payment.userId,
        title: '⚠️ Thanh toán không được xác nhận',
        content: reason || 'Đơn thanh toán của bạn không được xác nhận. Vui lòng liên hệ hỗ trợ.',
        link: '/pricing',
      },
    })

    res.json({ success: true, data: updated, message: 'Payment rejected' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/payments/stats
export const getPaymentStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payments = await prisma.payment.findMany()
    const completed = payments.filter(p => p.status === 'completed')
    const pending = payments.filter(p => p.status === 'pending')

    const totalRevenue = completed.reduce((sum, p) => sum + p.amount, 0)
    const byPlan = {
      premium: completed.filter(p => p.plan === 'premium').reduce((s, p) => s + p.amount, 0),
      enterprise: completed.filter(p => p.plan === 'enterprise').reduce((s, p) => s + p.amount, 0),
    }
    res.json({
      success: true,
      data: {
        totalRevenue,
        byPlan,
        total: completed.length,
        pending: pending.length,
        allPayments: payments.length,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/payments/webhook
export const handleBankWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawBodyStr = JSON.stringify(req.body || {})
    console.log('Received Payment Webhook Payload:', rawBodyStr)

    // Extract transaction code SCxxxxxx from request body or nested JSON string
    const match = rawBodyStr.toUpperCase().match(/SC[A-Z0-9]{6,10}/)
    const extractedTxId = match ? match[0] : null
    const orderCodeStr = req.body?.data?.orderCode ? String(req.body.data.orderCode) : (req.body?.orderCode ? String(req.body.orderCode) : null)

    // Find pending payment matching txId, orderCode, or latest pending bill
    let payment = null
    if (extractedTxId) {
      payment = await prisma.payment.findFirst({
        where: {
          OR: [
            { txId: extractedTxId },
            { id: extractedTxId }
          ],
          status: 'pending'
        }
      })
    }
    if (!payment && orderCodeStr) {
      payment = await prisma.payment.findFirst({
        where: {
          OR: [
            { txId: orderCodeStr },
            { id: orderCodeStr }
          ],
          status: 'pending'
        }
      })
    }
    if (!payment) {
      payment = await prisma.payment.findFirst({
        where: { status: 'pending' },
        orderBy: { createdAt: 'desc' }
      })
    }

    if (!payment) {
      res.json({ success: true, message: 'PayOS Webhook received (No pending payment found to upgrade)' })
      return
    }

    // Mark payment status as completed
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'completed' }
    })

    // Upgrade user or team subscription
    const duration = payment.durationMonths || 1
    let expiresAt = new Date()
    const userObj = await prisma.user.findUnique({ where: { id: payment.userId } })

    if (payment.teamId) {
      const team = await prisma.team.findUnique({ where: { id: payment.teamId } })
      let baseDate = new Date()
      if (team && team.subscriptionExpiresAt && new Date(team.subscriptionExpiresAt) > baseDate) {
        baseDate = new Date(team.subscriptionExpiresAt)
      }
      expiresAt = new Date(baseDate)
      expiresAt.setMonth(expiresAt.getMonth() + duration)

      await prisma.team.update({
        where: { id: payment.teamId },
        data: { 
          subscription: payment.plan,
          subscriptionExpiresAt: expiresAt,
        }
      })

      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: '🎉 Nâng cấp gói Nhóm tự động thành công!',
          content: `Hệ thống đã xác nhận thanh toán chuyển khoản cho mã ${payment.txId}. Gói Premium của nhóm đã được mở khóa tự động. Hết hạn: ${expiresAt.toLocaleDateString('vi-VN')}`,
          link: '/pricing',
        }
      })
    } else {
      let baseDate = new Date()
      if (userObj && userObj.subscriptionExpiresAt && new Date(userObj.subscriptionExpiresAt) > baseDate) {
        baseDate = new Date(userObj.subscriptionExpiresAt)
      }
      expiresAt = new Date(baseDate)
      if (payment.plan === 'trial') {
        expiresAt.setDate(expiresAt.getDate() + 3)
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + duration)
      }

      await prisma.user.update({
        where: { id: payment.userId },
        data: { 
          subscription: payment.plan === 'trial' ? 'trial' : payment.plan,
          subscriptionExpiresAt: expiresAt,
          hasUsedTrial: payment.plan === 'trial' ? true : undefined,
        }
      })

      const planNameWeb = payment.plan === 'trial' ? 'Gói Dùng Thử 3 Ngày (69.000 VNĐ)' : (payment.plan === 'premium' ? 'Gói Pro Premium' : 'Gói Enterprise')
      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: '🎉 Nâng cấp gói tự động thành công!',
          content: `Hệ thống đã nhận thanh toán ngân hàng cho hóa đơn ${payment.txId}. ${planNameWeb} đã được mở khóa tự động. Hết hạn: ${expiresAt.toLocaleDateString('vi-VN')}`,
          link: '/pricing',
        }
      })
    }

    res.json({ success: true, message: `Payment ${payment.txId} auto-confirmed successfully!`, data: payment })
  } catch (err) {
    console.error('Webhook error:', err)
    res.status(500).json({ success: false, message: 'Server webhook error' })
  }
}

// POST /api/payments/trial
export const activateTrial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    if (user.hasUsedTrial) {
      res.status(400).json({ success: false, message: 'Bạn đã sử dụng gói dùng thử 3 ngày rồi.' })
      return
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 3)

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscription: 'premium',
        subscriptionExpiresAt: expiresAt,
        hasUsedTrial: true,
      },
      select: {
        id: true, name: true, email: true, phone: true, role: true, avatar: true, subscription: true, subscriptionExpiresAt: true, hasUsedTrial: true, status: true, classCode: true,
      }
    })

    await prisma.notification.create({
      data: {
        userId,
        title: '🎉 Kích hoạt dùng thử 3 ngày thành công!',
        content: `Chúc mừng bạn! Gói Premium dùng thử 3 ngày đã được kích hoạt. Hạn sử dụng đến: ${expiresAt.toLocaleString('vi-VN')}.`,
        link: '/pricing',
      }
    })

    res.json({
      success: true,
      message: 'Kích hoạt dùng thử 3 ngày thành công! 🎉',
      data: updatedUser
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}