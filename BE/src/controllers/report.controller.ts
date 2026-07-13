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

// GET /api/reports/revenue-stats
export const getRevenueStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query

    const whereClause: any = { status: 'completed' }
    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) whereClause.createdAt.gte = new Date(startDate as string)
      if (endDate) {
        const end = new Date(endDate as string)
        end.setHours(23, 59, 59, 999)
        whereClause.createdAt.lte = end
      }
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' }
    })

    const aiUsages = await prisma.aIUsage.findMany()

    let totalRevenue = 0
    const byDay: Record<string, number> = {}
    const byMonth: Record<string, number> = {}
    const byQuarter: Record<string, number> = {}
    const byYear: Record<string, number> = {}

    for (const p of payments) {
      const amt = p.amount
      totalRevenue += amt

      const dateObj = new Date(p.createdAt)
      const yyyy = dateObj.getFullYear()
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0')
      const dd = String(dateObj.getDate()).padStart(2, '0')
      
      const dayKey = `${yyyy}-${mm}-${dd}`
      const monthKey = `${yyyy}-${mm}`
      
      const monthNum = dateObj.getMonth()
      let quarterNum = 1
      if (monthNum >= 3 && monthNum <= 5) quarterNum = 2
      else if (monthNum >= 6 && monthNum <= 8) quarterNum = 3
      else if (monthNum >= 9) quarterNum = 4
      const quarterKey = `${yyyy}-Q${quarterNum}`
      
      const yearKey = `${yyyy}`

      byDay[dayKey] = (byDay[dayKey] || 0) + amt
      byMonth[monthKey] = (byMonth[monthKey] || 0) + amt
      byQuarter[quarterKey] = (byQuarter[quarterKey] || 0) + amt
      byYear[yearKey] = (byYear[yearKey] || 0) + amt
    }

    const servicesBySales: Record<string, { plan: string; count: number; revenue: number }> = {
      free: { plan: 'Free', count: 0, revenue: 0 },
      premium: { plan: 'Pro Premium', count: 0, revenue: 0 },
      enterprise: { plan: 'Enterprise', count: 0, revenue: 0 }
    }

    for (const p of payments) {
      if (servicesBySales[p.plan]) {
        servicesBySales[p.plan].count++
        servicesBySales[p.plan].revenue += p.amount
      }
    }

    const aiBreakdown = aiUsages.reduce((acc: Record<string, number>, curr) => {
      const f = curr.feature
      acc[f] = (acc[f] || 0) + curr.count
      return acc
    }, { idea_generator: 0, team_matching: 0, analytics: 0 })

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalPayments: payments.length,
        breakdowns: {
          byDay,
          byMonth,
          byQuarter,
          byYear
        },
        services: Object.values(servicesBySales).sort((a, b) => b.revenue - a.revenue),
        aiUsage: Object.entries(aiBreakdown).map(([feature, count]) => ({ feature, count })).sort((a, b) => b.count - a.count)
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

