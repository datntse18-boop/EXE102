import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'

export interface AuthRequest extends Request {
  user?: {
    id: string
    role: string
    email: string
    name: string
    classCode?: string | null
    subscription?: string
  }
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'No token provided' })
      return
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string; email: string }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user || user.status === 'suspended') {
      res.status(401).json({ success: false, message: 'User not found or suspended' })
      return
    }

    req.user = { 
      id: decoded.id, 
      role: decoded.role, 
      email: decoded.email, 
      name: user.name, 
      classCode: user.classCode,
      subscription: user.subscription
    }
    next()
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' })
      return
    }
    next()
  }
}

export const checkAiLimit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' })
      return
    }

    const { id, role, subscription } = req.user
    
    // Admin, manager, leader bypass limit
    if (role === 'admin' || role === 'manager' || role === 'leader') {
      next()
      return
    }

    // Premium or enterprise bypass limit
    if (subscription === 'premium' || subscription === 'enterprise') {
      next()
      return
    }

    // Check if user belongs to any team with premium/enterprise subscription
    const userTeams = await prisma.teamMember.findMany({
      where: { userId: id },
      include: { team: true }
    })
    const hasTeamPremium = userTeams.some(m => m.team.subscription === 'premium' || m.team.subscription === 'enterprise')
    if (hasTeamPremium) {
      next()
      return
    }

    // Check limit (3 times/day)
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const count = await prisma.aIUsage.count({
      where: {
        userId: id,
        date: {
          gte: startOfToday,
        },
      },
    })

    if (count >= 3) {
      res.status(403).json({
        success: false,
        isLimitReached: true,
        message: 'Bạn đã dùng hết lượt sử dụng AI miễn phí trong ngày (3 lần/ngày). Vui lòng nâng cấp gói Pro Premium để sử dụng không giới hạn!',
      })
      return
    }

    next()
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error checking AI limit' })
  }
}
