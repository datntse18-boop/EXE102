import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

// GET /api/users — Admin only
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, role, status } = req.query
    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
      ]
    }
    if (role && role !== 'all') where.role = role
    if (status && status !== 'all') where.status = status

    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, avatar: true, status: true, subscription: true, lastActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: users })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/users/:id
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, avatar: true, status: true, subscription: true, lastActive: true, createdAt: true, skills: true, desiredRole: true, commitmentHours: true, pastProjects: true, classCode: true },
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

// PATCH /api/users/:id/role — Admin only
export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const { role } = req.body
    const validRoles = ['member', 'leader', 'manager', 'admin']
    if (!role || !validRoles.includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid role' })
      return
    }
    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true, status: true },
    })
    res.json({ success: true, data: user })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// PATCH /api/users/:id/status — Admin only
export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }
    const newStatus = user.status === 'active' ? 'suspended' : 'active'
    const updated = await prisma.user.update({
      where: { id },
      data: { status: newStatus },
      select: { id: true, name: true, email: true, role: true, status: true },
    })
    res.json({ success: true, data: updated })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// PATCH /api/users/profile — Self update
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, avatar, classCode, skills, desiredRole, commitmentHours, pastProjects } = req.body
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name, avatar, classCode, skills, desiredRole, commitmentHours, pastProjects },
      select: { id: true, name: true, email: true, role: true, avatar: true, status: true, subscription: true, classCode: true, skills: true, desiredRole: true, commitmentHours: true, pastProjects: true },
    })
    res.json({ success: true, data: user })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
