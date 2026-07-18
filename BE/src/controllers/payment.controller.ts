import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

const PLAN_PRICES: Record<string, number> = {
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

// GET /api/payments — Admin: all, others: own
export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const where: any = {}
    if (req.user!.role !== 'admin' && req.user!.role !== 'leader') {
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

// POST /api/payments — Create PENDING payment
export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { plan, txId, discountCode, bankId, teamId, durationMonths } = req.body;
    
    const validPlans = ['premium', 'enterprise'];
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
    let amount = PLAN_PRICES[amountKey] * duration;
    if (duration === 3) amount = Math.round(amount * 0.8);
    else if (duration === 12) amount = Math.round(amount * 0.7);

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

    const payment = await prisma.payment.findUnique({ where: { id } })
    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment not found' })
      return
    }
    if (payment.status === 'completed') {
      res.status(400).json({ success: false, message: 'Payment already confirmed' })
      return
    }

    // Mark as completed
    const updated = await prisma.payment.update({
      where: { id },
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

      // Create notification for team leader
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
      expiresAt.setMonth(expiresAt.getMonth() + duration)

      await prisma.user.update({
        where: { id: payment.userId },
        data: { 
          subscription: payment.plan,
          subscriptionExpiresAt: expiresAt,
        },
      })

      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: '🎉 Thanh toán xác nhận thành công!',
          content: `Gói ${payment.plan === 'premium' ? 'Premium Pro' : 'Enterprise'} của bạn đã được kích hoạt. Ngày hết hạn: ${expiresAt.toLocaleDateString('vi-VN')} (Gia hạn cộng dồn thành công)`,
          link: '/pricing',
        },
      })
    }

    res.json({ success: true, data: updated, message: 'Payment confirmed & subscription upgraded' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// PATCH /api/payments/:id/reject — Admin rejects payment
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

    // Notify user
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

// GET /api/payments/stats — Admin only
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

// POST /api/payments/webhook — TỰ ĐỘNG PHÊ DUYỆT THANH TOÁN THỰC TẾ QUA SEPAY / CASSO WH
export const handleBankWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    // Linh hoạt nhận dữ liệu từ các bên (SePay dùng body chứa transactionContent hoặc content)
    const transactionContent = req.body.transactionContent || req.body.content || req.body.description || ''
    const amountIn = Number(req.body.amountIn || req.body.transferAmount || 0)
    
    console.log(`[BANK WEBHOOK RECEIVE] Nội dung: "${transactionContent}", Số tiền: ${amountIn}`)

    if (!transactionContent) {
      res.status(400).json({ success: false, message: 'Invalid webhook data' })
      return
    }

    // Biến đổi chuỗi thành chữ hoa và lọc mã khớp định dạng chuẩn mã giao dịch: SCxxxxxx
    const match = transactionContent.toUpperCase().match(/SC[A-Z0-9]{6,8}/)
    if (!match) {
      res.json({ success: true, message: 'Webhook received but contents do not contain standard SC code' })
      return
    }

    const extractedTxId = match[0]

    // Truy vấn hóa đơn đang treo khớp với mã chuyển khoản sinh ra từ hệ thống
    const payment = await prisma.payment.findFirst({
      where: { txId: extractedTxId, status: 'pending' }
    })

    if (!payment) {
      res.json({ success: true, message: `No pending bill found for transaction code: ${extractedTxId}` })
      return
    }

    // Kiểm tra tính hợp lệ về số tiền nhận được (Sai số tối đa cho phép là 0 VNĐ để tránh gian lận)
    if (amountIn > 0 && amountIn < payment.amount) {
      console.warn(`[PAYMENT WARNING] Hóa đơn ${payment.id} cần ${payment.amount} nhưng chỉ nhận được ${amountIn}`)
      res.json({ success: true, message: 'Amount in is less than billing amount. Keeping pending status.' })
      return
    }

    // Cập nhật trạng thái hóa đơn thành Thành Công ngay lập tức
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'completed' }
    })

    const duration = payment.durationMonths || 1
    let expiresAt = new Date()

    // Lấy thông tin user để lưu vết thông báo hệ thống
    const userObj = await prisma.user.findUnique({ where: { id: payment.userId } })
    const userEmail = userObj?.email || 'N/A'

    // XỬ LÝ NÂNG CẤP TỰ ĐỘNG & CỘNG DỒN HẠN DÙNG
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

      // Tạo thông báo tự động cho Trưởng nhóm
      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: '🎉 Nâng cấp gói Nhóm tự động thành công!',
          content: `Hệ thống ngân hàng đối soát thành công hóa đơn ${extractedTxId}. Gói Premium của nhóm đã kích hoạt. Hết hạn: ${expiresAt.toLocaleDateString('vi-VN')}`,
          link: '/pricing',
        }
      })

      console.log(`\n======================================================`)
      console.log(`[AUTOMATED SUCCESS] Đã nâng cấp Gói Nhóm tự động thành công qua Webhook`)
      console.log(`Đến: ${userEmail} | Hạn dùng mới: ${expiresAt.toLocaleString('vi-VN')}`)
      console.log(`======================================================\n`)
    } else {
      let baseDate = new Date()
      if (userObj && userObj.subscriptionExpiresAt && new Date(userObj.subscriptionExpiresAt) > baseDate) {
        baseDate = new Date(userObj.subscriptionExpiresAt)
      }
      expiresAt = new Date(baseDate)
      expiresAt.setMonth(expiresAt.getMonth() + duration)

      await prisma.user.update({
        where: { id: payment.userId },
        data: { 
          subscription: payment.plan,
          subscriptionExpiresAt: expiresAt,
        }
      })

      // Tạo thông báo tự động cho Cá nhân người dùng
      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: '🎉 Nâng cấp gói thành công tự động!',
          content: `Hệ thống đã xác nhận khoản chuyển khoản của bạn cho hóa đơn ${extractedTxId}. Gói ${payment.plan === 'premium' ? 'Premium Pro' : 'Enterprise'} đã được mở khóa tự động. Hết hạn: ${expiresAt.toLocaleDateString('vi-VN')}`,
          link: '/pricing',
        }
      })

      console.log(`\n======================================================`)
      console.log(`[AUTOMATED SUCCESS] Đã nâng cấp Gói Cá nhân tự động thành công qua Webhook`)
      console.log(`Đến: ${userEmail} | Hạn dùng mới: ${expiresAt.toLocaleString('vi-VN')}`)
      console.log(`======================================================\n`)
    }

    res.json({ success: true, message: `Payment ${extractedTxId} confirmed & subscription upgraded automatically` })
  } catch (err) {
    console.error('Webhook Error:', err)
    res.status(500).json({ success: false, message: 'Webhook processing failed' })
  }
}

// POST /api/payments/trial — Activate 3-day free trial
export const activateTrial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    if (user.hasUsedTrial) {
      res.status(400).json({ success: false, message: 'Bạn đã sử dụng gói dùng thử 3 ngày rồi. Mỗi tài khoản chỉ được dùng thử 1 lần duy nhất.' })
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
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}