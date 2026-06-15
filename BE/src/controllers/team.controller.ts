import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

// Compute health score based on tasks
const computeHealthScore = async (teamId: string): Promise<number> => {
  const projects = await prisma.project.findMany({ where: { teamId } })
  if (projects.length === 0) return 100
  const allTasks = await prisma.task.findMany({ where: { projectId: { in: projects.map(p => p.id) } } })
  if (allTasks.length === 0) return 80
  const completed = allTasks.filter(t => t.status === 'completed').length
  const overdue = allTasks.filter(t => t.dueDate && t.dueDate < new Date() && t.status !== 'completed').length
  const score = Math.max(0, Math.round((completed / allTasks.length) * 100) - overdue * 5)
  return Math.min(100, score)
}

// GET /api/teams
export const getTeams = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, search, classCode } = req.query
    const where: any = {}
    if (status && status !== 'all') where.status = status
    if (search) where.name = { contains: String(search), mode: 'insensitive' }

    // Role-based filtering
    if (req.user!.role === 'member') {
      // Sinh viên (member) sees only their teams
      where.members = { some: { userId: req.user!.id } }
    } else if (req.user!.role === 'manager') {
      // Giảng viên (manager) sees teams in their class
      where.classCode = req.user!.classCode || 'NO_CLASS_CODE_SET'
    } else if (req.user!.role === 'leader') {
      // Quản lý (leader) sees all teams, optionally filtered by classCode (Lecturer class code)
      if (classCode) {
        where.classCode = String(classCode)
      }
    }
    // Admin (admin) sees everything

    const teams = await prisma.team.findMany({
      where,
      include: {
        leader: { select: { id: true, name: true, avatar: true } },
        members: { include: { user: { select: { id: true, name: true, avatar: true, role: true } } } },
        projects: { select: { id: true, name: true, status: true, progress: true } },
        _count: { select: { projects: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: teams })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/teams/:id
export const getTeamById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        leader: { select: { id: true, name: true, avatar: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, avatar: true, role: true, email: true } } } },
        projects: { include: { tasks: true } },
      },
    })
    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' })
      return
    }
    res.json({ success: true, data: team })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/teams
export const createTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body
    if (!name) {
      res.status(400).json({ success: false, message: 'Team name is required' })
      return
    }
    const team = await prisma.team.create({
      data: {
        name,
        description: description || '',
        leaderId: req.user!.id,
        classCode: req.user!.classCode, // Auto inherit joined class code if any
        members: { create: { userId: req.user!.id } },
      },
      include: {
        leader: { select: { id: true, name: true, avatar: true } },
        members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      },
    })

    res.status(201).json({ success: true, data: team })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// PATCH /api/teams/:id
export const updateTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const { name, description, status } = req.body
    const team = await prisma.team.findUnique({ where: { id } })
    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' })
      return
    }
    // Only leader, manager, admin can edit
    if (team.leaderId !== req.user!.id && !['manager', 'admin'].includes(req.user!.role)) {
      res.status(403).json({ success: false, message: 'Forbidden' })
      return
    }
    const updated = await prisma.team.update({
      where: { id },
      data: { name, description, status },
    })
    res.json({ success: true, data: updated })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// DELETE /api/teams/:id
export const deleteTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const team = await prisma.team.findUnique({ where: { id } })
    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' })
      return
    }
    if (team.leaderId !== req.user!.id && !['manager', 'admin'].includes(req.user!.role)) {
      res.status(403).json({ success: false, message: 'Forbidden' })
      return
    }
    await prisma.team.delete({ where: { id } })
    res.json({ success: true, message: 'Team deleted' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/teams/:id/members — Add member
export const addMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const { userId } = req.body
    const existing = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: id, userId } },
    })
    if (existing) {
      res.status(409).json({ success: false, message: 'User is already a member' })
      return
    }
    await prisma.teamMember.create({ data: { teamId: id, userId } })
    // Recalculate health
    const score = await computeHealthScore(id)
    await prisma.team.update({ where: { id }, data: { healthScore: score } })
    res.json({ success: true, message: 'Member added' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// DELETE /api/teams/:id/members/:userId — Remove member
export const removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, userId } = req.params as { id: string; userId: string }
    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId: id, userId } },
    })
    res.json({ success: true, message: 'Member removed' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/teams/:id/health
export const getTeamHealth = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const projects = await prisma.project.findMany({ where: { teamId: id } })
    const allTasks = await prisma.task.findMany({ where: { projectId: { in: projects.map(p => p.id) } } })
    const members = await prisma.teamMember.count({ where: { teamId: id } })
    const completed = allTasks.filter(t => t.status === 'completed').length
    const inProgress = allTasks.filter(t => t.status === 'in_progress').length
    const score = await computeHealthScore(id)

    await prisma.team.update({ where: { id }, data: { healthScore: score } })

    res.json({
      success: true,
      data: {
        healthScore: score,
        members,
        totalTasks: allTasks.length,
        completedTasks: completed,
        inProgressTasks: inProgress,
        totalProjects: projects.length,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/teams/:id/join-class
export const joinClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const { classCode } = req.body
    if (!classCode) {
      res.status(400).json({ success: false, message: 'Class code is required' })
      return
    }

    const normalizedCode = String(classCode).trim().toUpperCase()

    // Check if lecturer exists with this classCode
    const lecturer = await prisma.user.findFirst({
      where: { role: 'manager', classCode: normalizedCode },
    })
    if (!lecturer) {
      res.status(404).json({ success: false, message: 'Không tìm thấy giảng viên với mã lớp này' })
      return
    }

    const team = await prisma.team.findUnique({ where: { id } })
    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' })
      return
    }

    // Update team with the classCode
    const updated = await prisma.team.update({
      where: { id },
      data: { classCode: normalizedCode },
      include: { members: true }
    })

    // Propagate classCode to all team members
    const memberIds = updated.members.map(m => m.userId)
    await prisma.user.updateMany({
      where: { id: { in: memberIds } },
      data: { classCode: normalizedCode }
    })

    res.json({ success: true, message: 'Tham gia lớp học thành công', data: updated })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
