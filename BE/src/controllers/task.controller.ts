import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'
import { createNotification } from './notification.controller'

// Cập nhật điểm sức khỏe của nhóm liên quan đến dự án
const updateTeamHealth = async (projectId: string): Promise<void> => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { teamId: true }
    })
    if (!project) return
    const teamId = project.teamId
    const projects = await prisma.project.findMany({ where: { teamId } })
    const allTasks = await prisma.task.findMany({ where: { projectId: { in: projects.map(p => p.id) } } })
    
    let score = 80
    if (allTasks.length > 0) {
      const completed = allTasks.filter(t => t.status === 'completed').length
      const overdue = allTasks.filter(t => t.dueDate && t.dueDate < new Date() && t.status !== 'completed').length
      score = Math.max(0, Math.round((completed / allTasks.length) * 100) - overdue * 5)
      score = Math.min(100, score)
    }
    
    await prisma.team.update({
      where: { id: teamId },
      data: { healthScore: score }
    })
  } catch (err) {
    console.error('Error updating team health score:', err)
  }
}

// GET /api/tasks?projectId=xxx&assignedTo=xxx
export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, assignedTo, status } = req.query
    const where: any = {}
    if (projectId) where.projectId = String(projectId)
    if (assignedTo) where.assignedTo = String(assignedTo)
    if (status) where.status = status

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true, teamId: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: tasks })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/tasks/:id
export const getTaskById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true } },
      },
    })
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' })
      return
    }
    res.json({ success: true, data: task })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/tasks
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, title, description, assignedTo, priority, dueDate } = req.body
    if (!projectId || !title || !assignedTo) {
      res.status(400).json({ success: false, message: 'projectId, title, and assignedTo are required' })
      return
    }
    const task = await prisma.task.create({
      data: {
        projectId, title,
        description: description || '',
        assignedTo, priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
      include: { assignee: { select: { id: true, name: true, avatar: true } } },
    })
    await updateTeamHealth(projectId)

    // Notify assignee if it's someone else
    if (assignedTo !== req.user!.id) {
      await createNotification(
        assignedTo,
        'Bạn được giao công việc mới 📋',
        `Trưởng nhóm đã giao cho bạn công việc: "${title}"`,
        '/workspace'
      )
    }

    res.status(201).json({ success: true, data: task })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// PATCH /api/tasks/:id
export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const { title, description, status, priority, assignedTo, dueDate } = req.body

    const originalTask = await prisma.task.findUnique({
      where: { id },
      include: { project: { include: { team: true } } }
    })

    const task = await prisma.task.update({
      where: { id },
      data: { title, description, status, priority, assignedTo, dueDate: dueDate ? new Date(dueDate) : undefined },
      include: { assignee: { select: { id: true, name: true, avatar: true } } },
    })
    await updateTeamHealth(task.projectId)

    // Notify assignee or team leader on changes
    if (originalTask) {
      // 1. If assigned to a new person, notify them
      if (assignedTo && assignedTo !== originalTask.assignedTo && assignedTo !== req.user!.id) {
        await createNotification(
          assignedTo,
          'Bạn được giao công việc mới 📋',
          `Bạn được giao công việc: "${task.title}"`,
          '/workspace'
        )
      }
      // 2. If status changes to completed, notify team leader
      if (status === 'completed' && originalTask.status !== 'completed') {
        const teamLeaderId = originalTask.project.team.leaderId
        if (teamLeaderId && teamLeaderId !== req.user!.id) {
          await createNotification(
            teamLeaderId,
            'Công việc nhóm hoàn thành 🏆',
            `Thành viên ${req.user!.name} đã hoàn thành công việc: "${task.title}"`,
            '/workspace'
          )
        }
      }
    }

    res.json({ success: true, data: task })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// DELETE /api/tasks/:id
export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const task = await prisma.task.findUnique({ where: { id }, select: { projectId: true } })
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' })
      return
    }
    await prisma.task.delete({ where: { id } })
    await updateTeamHealth(task.projectId)
    res.json({ success: true, message: 'Task deleted' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/tasks/my — tasks assigned to current user
export const getMyTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await prisma.task.findMany({
      where: { assignedTo: req.user!.id },
      include: {
        project: { select: { id: true, name: true, teamId: true } },
      },
      orderBy: { dueDate: 'asc' },
    })
    res.json({ success: true, data: tasks })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
