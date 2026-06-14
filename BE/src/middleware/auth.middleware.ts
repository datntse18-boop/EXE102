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

    req.user = { id: decoded.id, role: decoded.role, email: decoded.email, name: user.name, classCode: user.classCode }
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
