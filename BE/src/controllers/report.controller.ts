import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

// GET /api/reports/platform-stats
export const getPlatformStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalUsers, activeUsers, suspendedUsers, premiumUsers, enterpriseUsers, totalTeams, teamsWithClass, activeTeams, atRiskTeams, totalProjects, totalTasks, completedTasks, payments, aiUsages] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { status: 'suspended' } }),
      prisma.user.count({ where: { subscription: 'premium' } }),
      prisma.user.count({ where: { subscription: 'enterprise' } }),
      prisma.team.count(),
      prisma.team.count({ where: { NOT: { classCode: null } } }),
      prisma.team.count({ where: { status: 'active' } }),
      prisma.team.count({ where: { status: 'at_risk' } }),
      prisma.project.count(),
      prisma.task.count(),
      prisma.task.count({ where: { status: 'completed' } }),
      prisma.payment.findMany({ where: { status: 'completed' } }),
      prisma.aIUsage.findMany(),
    ])

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
    const totalAIRequests = aiUsages.reduce((sum, a) => sum + a.count, 0)

    // Compute breakdown of AI usages
    const aiBreakdown = aiUsages.reduce((acc: Record<string, number>, curr) => {
      const f = curr.feature;
      if (acc[f] !== undefined) {
        acc[f] += curr.count;
      } else {
        acc[f] = curr.count;
      }
      return acc;
    }, { idea_generator: 0, team_matching: 0, analytics: 0 })

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers, suspended: suspendedUsers, premium: premiumUsers, enterprise: enterpriseUsers },
        teams: { total: totalTeams, withClass: teamsWithClass, active: activeTeams, atRisk: atRiskTeams },
        projects: { total: totalProjects },
        tasks: { total: totalTasks, completed: completedTasks },
        revenue: { total: totalRevenue, payments: payments.length },
        ai: { 
          totalRequests: totalAIRequests,
          breakdown: aiBreakdown
        },
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/reports/ai-usage
export const getAIUsageReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const usages = await prisma.aIUsage.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { date: 'desc' },
    })

    // Aggregate by user
    const byUser: Record<string, { name: string; email: string; total: number; features: Record<string, number> }> = {}
    for (const u of usages) {
      if (!byUser[u.userId]) byUser[u.userId] = { name: u.user.name, email: u.user.email, total: 0, features: {} }
      byUser[u.userId].total += u.count
      byUser[u.userId].features[u.feature] = (byUser[u.userId].features[u.feature] || 0) + u.count
    }

    const topUsers = Object.entries(byUser)
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.total - a.total)

    res.json({ success: true, data: { topUsers, totalLogs: usages.length } })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
