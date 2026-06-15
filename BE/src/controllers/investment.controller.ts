import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

// POST /api/projects/:projectId/invest
export const investInProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as { projectId: string }
    const { amount } = req.body

    if (!amount || Number(amount) <= 0) {
      res.status(400).json({ success: false, message: 'Số tiền đầu tư phải lớn hơn 0' })
      return
    }

    const investAmount = Number(amount)

    // Check user balance
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { balance: true }
    })

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    if (user.balance < investAmount) {
      res.status(400).json({ success: false, message: 'Số dư StudyCoins của bạn không đủ' })
      return
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      res.status(404).json({ success: false, message: 'Không tìm thấy dự án' })
      return
    }

    // Perform transaction: deduct user balance, create investment
    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user!.id },
        data: { balance: { decrement: investAmount } }
      }),
      prisma.investment.create({
        data: {
          userId: req.user!.id,
          projectId,
          amount: investAmount
        }
      })
    ])

    // Fetch updated balance
    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { balance: true }
    })

    res.json({
      success: true,
      message: `Đầu tư ${investAmount.toLocaleString()} StudyCoins vào dự án "${project.name}" thành công!`,
      data: {
        balance: updatedUser?.balance
      }
    })
  } catch (err) {
    console.error('Invest error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/projects/leaderboard
export const getProjectLeaderboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        team: {
          select: { name: true }
        },
        investments: {
          select: { amount: true }
        }
      }
    })

    const leaderboard = projects.map(p => {
      const totalFunded = p.investments.reduce((sum, inv) => sum + inv.amount, 0)
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        teamName: p.team?.name || 'N/A',
        progress: p.progress,
        totalFunded,
        investorCount: p.investments.length
      }
    })

    leaderboard.sort((a, b) => b.totalFunded - a.totalFunded)

    res.json({ success: true, data: leaderboard })
  } catch (err) {
    console.error('Leaderboard error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
