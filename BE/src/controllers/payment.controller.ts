import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

const PLAN_PRICES: Record<string, number> = {
  premium: 199000,
  enterprise: 499000,
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
    const { plan, txId, discountCode } = req.body
    const validPlans = ['premium', 'enterprise']
    if (!plan || !validPlans.includes(plan)) {
      res.status(400).json({ success: false, message: 'Valid plan required: premium or enterprise' })
      return
    }

    let amount = PLAN_PRICES[plan]
    if (discountCode === 'STUDYCONNECT30') {
      amount = Math.round(amount * 0.7)
    }

    // Create PENDING payment record — admin must confirm
    const payment = await prisma.payment.create({
      data: {
        userId: req.user!.id,
        amount,
        plan,
        status: 'pending',
        // Store txId in a note field via amount for now (schema note: txId not in schema)
      },
    })

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Đơn thanh toán đã được ghi nhận. Vui lòng chờ admin xác nhận.',
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// PATCH /api/payments/:id/confirm — Admin confirms payment → upgrade subscription
export const confirmPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

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

    // Upgrade user subscription
    await prisma.user.update({
      where: { id: payment.userId },
      data: { subscription: payment.plan },
    })

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: payment.userId,
        title: '🎉 Thanh toán xác nhận thành công!',
        content: `Gói ${payment.plan === 'premium' ? 'Premium Pro' : 'Enterprise'} của bạn đã được kích hoạt. Chúc mừng bạn!`,
        link: '/pricing',
      },
    })

    res.json({ success: true, data: updated, message: 'Payment confirmed & subscription upgraded' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// PATCH /api/payments/:id/reject — Admin rejects payment
export const rejectPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
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
