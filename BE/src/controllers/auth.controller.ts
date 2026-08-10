import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

const generateTokens = (userId: string, role: string, phone: string) => {
  const accessToken = jwt.sign(
    { id: userId, role, phone },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any }
  )
  const refreshToken = jwt.sign(
    { id: userId, jti: crypto.randomBytes(16).toString('hex') },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any }
  )
  return { accessToken, refreshToken }
}

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, password, email } = req.body

    if (!name || !phone || !password) {
      res.status(400).json({ success: false, message: 'Họ tên, số điện thoại và mật khẩu là bắt buộc' })
      return
    }

    // Validate phone number: đúng 10 số, bắt đầu bằng 0
    if (!/^0[0-9]{9}$/.test(phone)) {
      res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 chữ số bắt đầu bằng số 0.' })
      return
    }

    // Validate password: chỉ gồm 6 số từ 1-9
    if (!/^[1-9]{6}$/.test(password)) {
      res.status(400).json({ success: false, message: 'Mật khẩu chỉ gồm đúng 6 chữ số từ 1 đến 9.' })
      return
    }

    const existingPhone = await prisma.user.findUnique({ where: { phone } })
    if (existingPhone) {
      res.status(409).json({ success: false, message: 'Số điện thoại đã được đăng ký trên hệ thống' })
      return
    }

    const hashed = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: { 
        name, 
        phone, 
        email: email ? email : null,
        password: hashed, 
        role: 'member', 
        isVerified: true
      }
    })

    res.status(201).json({ 
      success: true, 
      message: 'Đăng ký tài khoản thành công! Vui lòng đăng nhập. 🎉'
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password } = req.body
    if (!phone || !password) {
      res.status(400).json({ success: false, message: 'Số điện thoại và mật khẩu là bắt buộc' })
      return
    }

    // Validate phone number format
    if (!/^0[0-9]{9}$/.test(phone)) {
      res.status(400).json({ success: false, message: 'Số điện thoại phải gồm đúng 10 chữ số bắt đầu bằng số 0' })
      return
    }

    // Validate password format
    if (!/^[1-9]{6}$/.test(password)) {
      res.status(400).json({ success: false, message: 'Mật khẩu phải gồm 6 chữ số từ 1 đến 9' })
      return
    }

    const user = await prisma.user.findUnique({ where: { phone } })

    if (!user) {
      res.status(401).json({ success: false, message: 'Số điện thoại hoặc mật khẩu không chính xác' })
      return
    }

    if (user.status === 'suspended') {
      res.status(403).json({ success: false, message: 'Tài khoản đã bị tạm khóa' })
      return
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      res.status(401).json({ success: false, message: 'Số điện thoại hoặc mật khẩu không chính xác' })
      return
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastActive: new Date() } })

    const { accessToken, refreshToken } = generateTokens(user.id, user.role, user.phone!)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } })

    res.json({
      success: true,
      data: {
        user: {
          id: user.id, 
          name: user.name, 
          phone: user.phone, 
          email: user.email,
          role: user.role, 
          avatar: user.avatar,
          subscription: user.subscription,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          hasUsedTrial: user.hasUsedTrial,
          status: user.status,
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
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(stored.user.id, stored.user.role, stored.user.phone!)

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
      select: { 
        id: true, 
        name: true, 
        phone: true, 
        email: true, 
        role: true, 
        avatar: true, 
        subscription: true, 
        subscriptionExpiresAt: true, 
        hasUsedTrial: true, 
        status: true, 
        lastActive: true, 
        createdAt: true, 
        classCode: true, 
        balance: true 
      },
    })
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    if (user.subscription !== 'free' && user.subscriptionExpiresAt) {
      const expiresAt = new Date(user.subscriptionExpiresAt)
      const now = new Date()
      const diffTime = expiresAt.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays >= 0 && diffDays <= 5) {
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        
        const titleText = `Gói Premium sắp hết hạn (Còn ${diffDays} ngày)`
        const existing = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            title: titleText,
            createdAt: { gte: todayStart }
          }
        })
        
        if (!existing) {
          await prisma.notification.create({
            data: {
              userId: user.id,
              title: titleText,
              content: `Gói Premium Pro của bạn chỉ còn lại ${diffDays} ngày sử dụng (hết hạn ngày ${expiresAt.toLocaleDateString('vi-VN')}). Vui lòng gia hạn sớm để tránh gián đoạn các tính năng AI.`,
              link: '/pricing'
            }
          })
        }
      }
    }

    res.json({ success: true, data: user })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}