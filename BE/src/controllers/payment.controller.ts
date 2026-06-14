import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

// GET /api/payments — Admin: all, others: own
export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const where: any = {}
    if (req.user!.role !== 'admin') where.userId = req.user!.id

    const payments = await prisma.payment.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: payments })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/payments — Simulate a payment / upgrade subscription
export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { plan } = req.body
    const validPlans = ['premium', 'enterprise']
    if (!plan || !validPlans.includes(plan)) {
      res.status(400).json({ success: false, message: 'Valid plan required: premium or enterprise' })
      return
    }

    const amount = plan === 'premium' ? 9.99 : 49.99

    // Create payment record
    const payment = await prisma.payment.create({
      data: { userId: req.user!.id, amount, plan, status: 'completed' },
    })

    // Update user subscription
    await prisma.user.update({ where: { id: req.user!.id }, data: { subscription: plan } })

    res.status(201).json({ success: true, data: payment, message: `Upgraded to ${plan} successfully` })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/payments/stats — Admin only
export const getPaymentStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payments = await prisma.payment.findMany({ where: { status: 'completed' } })
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
    const byPlan = {
      premium: payments.filter(p => p.plan === 'premium').reduce((s, p) => s + p.amount, 0),
      enterprise: payments.filter(p => p.plan === 'enterprise').reduce((s, p) => s + p.amount, 0),
    }
    res.json({ success: true, data: { totalRevenue, byPlan, total: payments.length } })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
