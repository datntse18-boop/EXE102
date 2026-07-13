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
    const { name, email, password, phone } = req.body
    if (!name || !email || !password || !phone) {
      res.status(400).json({ success: false, message: 'Họ tên, email, mật khẩu và số điện thoại là bắt buộc' })
      return
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } })
    if (existingEmail) {
      res.status(409).json({ success: false, message: 'Email đã được sử dụng' })
      return
    }

    const existingPhone = await prisma.user.findUnique({ where: { phone } })
    if (existingPhone) {
      res.status(409).json({ success: false, message: 'Số điện thoại đã được sử dụng' })
      return
    }

    const hashed = await bcrypt.hash(password, 10)
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Create user but set isVerified = false
    const user = await prisma.user.create({
      data: { 
        name, 
        email, 
        password: hashed, 
        phone, 
        role: 'member', 
        isVerified: false,
        verificationCode: otp
      },
      select: { id: true, name: true, email: true, phone: true, role: true, avatar: true, subscription: true, subscriptionExpiresAt: true, status: true, classCode: true },
    })

    console.log(`\n======================================================`)
    console.log(`[SMS OTP MOCK] Gửi mã xác nhận ${otp} đến SĐT: ${phone}`)
    console.log(`======================================================\n`)

    res.status(201).json({ 
      success: true, 
      message: 'Đăng ký thành công. Vui lòng nhập mã OTP để kích hoạt tài khoản.',
      data: { 
        user, 
        verificationRequired: true,
        mockOtp: otp 
      } 
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/auth/verify-otp
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, code } = req.body
    if (!identifier || !code) {
      res.status(400).json({ success: false, message: 'Thông tin nhận diện và mã OTP là bắt buộc' })
      return
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    })

    if (!user) {
      res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' })
      return
    }

    if (user.verificationCode !== code) {
      res.status(400).json({ success: false, message: 'Mã xác thực OTP không chính xác' })
      return
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationCode: null },
      select: { id: true, name: true, email: true, phone: true, role: true, avatar: true, subscription: true, subscriptionExpiresAt: true, status: true, classCode: true }
    })

    const { accessToken, refreshToken } = generateTokens(updatedUser.id, updatedUser.role, updatedUser.email)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: updatedUser.id, expiresAt } })

    res.json({
      success: true,
      message: 'Xác thực tài khoản thành công! 🎉',
      data: { user: updatedUser, accessToken, refreshToken }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body
    if (!identifier || !password) {
      res.status(400).json({ success: false, message: 'Email/Số điện thoại và mật khẩu là bắt buộc' })
      return
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    })

    if (!user) {
      res.status(401).json({ success: false, message: 'Thông tin đăng nhập không chính xác' })
      return
    }

    if (user.status === 'suspended') {
      res.status(403).json({ success: false, message: 'Tài khoản đã bị tạm khóa' })
      return
    }

    if (!user.isVerified) {
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString()
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationCode: newOtp }
      })
      console.log(`\n======================================================`)
      console.log(`[SMS OTP MOCK] Gửi lại mã xác nhận ${newOtp} đến SĐT: ${user.phone}`)
      console.log(`======================================================\n`)

      res.status(403).json({ 
        success: false, 
        message: 'Tài khoản chưa được xác thực OTP. Mã mới đã được gửi.', 
        verificationRequired: true,
        mockOtp: newOtp
      })
      return
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      res.status(401).json({ success: false, message: 'Thông tin đăng nhập không chính xác' })
      return
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastActive: new Date() } })

    const { accessToken, refreshToken } = generateTokens(user.id, user.role, user.email)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } })

    res.json({
      success: true,
      data: {
        user: {
          id: user.id, name: user.name, email: user.email, phone: user.phone,
          role: user.role, avatar: user.avatar,
          subscription: user.subscription,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
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
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(stored.user.id, stored.user.role, stored.user.email)

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
      select: { id: true, name: true, email: true, phone: true, role: true, avatar: true, subscription: true, subscriptionExpiresAt: true, status: true, lastActive: true, createdAt: true, classCode: true, balance: true },
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

