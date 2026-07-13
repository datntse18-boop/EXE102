import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

const PLAN_PRICES: Record<string, number> = {
  premium: 699000,
  team_premium: 3149000,
  enterprise: 899000,
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

// POST /api/payments — Create PENDING payment (user declares they will pay)
export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { plan, txId, discountCode, evidence, bankId, teamId, durationMonths } = req.body
    const validPlans = ['premium', 'enterprise']
    if (!plan || !validPlans.includes(plan)) {
      res.status(400).json({ success: false, message: 'Valid plan required: premium or enterprise' })
      return
    }

    // Check if it is a team subscription
    let amountKey = plan
    if (teamId && plan === 'premium') {
      amountKey = 'team_premium'
      
      // Verify team existence and that the current user is the leader
      const team = await prisma.team.findUnique({ where: { id: teamId } })
      if (!team) {
        res.status(404).json({ success: false, message: 'Team not found' })
        return
      }
      if (team.leaderId !== req.user!.id) {
        res.status(403).json({ success: false, message: 'Chỉ Trưởng nhóm mới có quyền nâng cấp gói cho nhóm.' })
        return
      }
    }

    const duration = Number(durationMonths) || 1
    let amount = PLAN_PRICES[amountKey] * duration
    
    // Apply bulk month discounts
    if (duration === 3) {
      amount = Math.round(amount * 0.8) // 20% discount
    } else if (duration === 12) {
      amount = Math.round(amount * 0.7) // 30% discount
    }

    if (discountCode === 'STUDYCONNECT30') {
      amount = Math.round(amount * 0.7)
    }

    // Create PENDING payment record — admin must confirm
    const payment = await prisma.payment.create({
      data: {
        userId: req.user!.id,
        amount,
        plan: plan as any,
        status: 'pending',
        txId,
        evidence,
        bankId,
        teamId: teamId || null,
        durationMonths: duration,
      },
    })

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Đơn thanh toán đã được ghi nhận. Vui lòng chờ kích hoạt tự động.',
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// PATCH /api/payments/:id/confirm — Admin confirms payment → upgrade subscription
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
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + duration)

    // Upgrade subscription (Team or User)
    if (payment.teamId) {
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
          content: `Gói Premium của nhóm đã được kích hoạt. Ngày hết hạn: ${expiresAt.toLocaleDateString('vi-VN')}`,
          link: '/pricing',
        },
      })
    } else {
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
          content: `Gói ${payment.plan === 'premium' ? 'Premium Pro' : 'Enterprise'} của bạn đã được kích hoạt. Ngày hết hạn: ${expiresAt.toLocaleDateString('vi-VN')}`,
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

// POST /api/payments/webhook — Public bank webhook (SePay / Casso)
export const handleBankWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactionContent, amountIn, body } = req.body
    
    console.log('Received bank webhook body:', req.body)

    if (!transactionContent) {
      res.status(400).json({ success: false, message: 'Invalid webhook data' })
      return
    }

    // Try to parse transaction content (e.g. SC8F9G0H) using regex
    const match = transactionContent.toUpperCase().match(/SC[A-Z0-9]{8}/)
    if (!match) {
      res.json({ success: true, message: 'Webhook received but transactionContent does not contain valid SC transaction code' })
      return
    }

    const txId = match[0]

    // Find the pending payment
    const payment = await prisma.payment.findFirst({
      where: { txId, status: 'pending' }
    })

    if (!payment) {
      res.json({ success: true, message: `No pending payment found for code ${txId}` })
      return
    }

    // Update payment to completed
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'completed' }
    })

    const duration = payment.durationMonths || 1
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + duration)

    // Upgrade subscription (Team or User)
    if (payment.teamId) {
      await prisma.team.update({
        where: { id: payment.teamId },
        data: { 
          subscription: payment.plan,
          subscriptionExpiresAt: expiresAt,
        }
      })

      // Create system notification
      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: '🎉 Nâng cấp gói Nhóm thành công!',
          content: `Cảm ơn bạn đã thanh toán. Hệ thống đã nhận được tiền và kích hoạt gói Premium cho nhóm của bạn tự động. Ngày hết hạn: ${expiresAt.toLocaleDateString('vi-VN')}`,
          link: '/pricing',
        }
      })
    } else {
      await prisma.user.update({
        where: { id: payment.userId },
        data: { 
          subscription: payment.plan,
          subscriptionExpiresAt: expiresAt,
        }
      })

      // Create system notification
      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: '🎉 Nâng cấp gói thành công!',
          content: `Cảm ơn bạn đã thanh toán. Hệ thống đã nhận được tiền và kích hoạt gói ${payment.plan === 'premium' ? 'Premium Pro' : 'Enterprise'} của bạn một cách tự động. Ngày hết hạn: ${expiresAt.toLocaleDateString('vi-VN')}`,
          link: '/pricing',
        }
      })
    }

    res.json({ success: true, message: `Payment ${txId} confirmed & subscription upgraded automatically` })
  } catch (err) {
    console.error('Webhook Error:', err)
    res.status(500).json({ success: false, message: 'Webhook processing failed' })
  }
}
