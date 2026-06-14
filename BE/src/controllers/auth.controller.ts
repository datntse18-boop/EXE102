import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

const generateTokens = (userId: string, role: string, email: string) => {
  const accessToken = jwt.sign(
    { id: userId, role, email },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any }
  )
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any }
  )
  return { accessToken, refreshToken }
}

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required' })
      return
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      res.status(409).json({ success: false, message: 'Email already in use' })
      return
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: 'member' },
      select: { id: true, name: true, email: true, role: true, avatar: true, subscription: true, status: true, classCode: true },
    })

    const { accessToken, refreshToken } = generateTokens(user.id, user.role, user.email)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } })

    res.status(201).json({ success: true, data: { user, accessToken, refreshToken } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' })
      return
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' })
      return
    }
    if (user.status === 'suspended') {
      res.status(403).json({ success: false, message: 'Account suspended' })
      return
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      res.status(401).json({ success: false, message: 'Invalid credentials' })
      return
    }

    // Update lastActive
    await prisma.user.update({ where: { id: user.id }, data: { lastActive: new Date() } })

    const { accessToken, refreshToken } = generateTokens(user.id, user.role, user.email)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } })

    res.json({
      success: true,
      data: {
        user: {
          id: user.id, name: user.name, email: user.email,
          role: user.role, avatar: user.avatar,
          subscription: user.subscription, status: user.status,
          classCode: user.classCode,
        },
        accessToken,
        refreshToken,
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/auth/refresh
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'Refresh token required' })
      return
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken }, include: { user: true } })
    if (!stored || stored.expiresAt < new Date()) {
      res.status(401).json({ success: false, message: 'Invalid or expired refresh token' })
      return
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!)
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(stored.user.id, stored.user.role, stored.user.email)

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { token: refreshToken } })
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await prisma.refreshToken.create({ data: { token: newRefreshToken, userId: stored.user.id, expiresAt } })

    res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } })
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid refresh token' })
  }
}

// POST /api/auth/logout
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
    }
    res.json({ success: true, message: 'Logged out successfully' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/auth/me
export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, role: true, avatar: true, subscription: true, status: true, lastActive: true, createdAt: true, classCode: true },
    })
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }
    res.json({ success: true, data: user })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
