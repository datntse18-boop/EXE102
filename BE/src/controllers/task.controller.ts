import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

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
    const task = await prisma.task.update({
      where: { id },
      data: { title, description, status, priority, assignedTo, dueDate: dueDate ? new Date(dueDate) : undefined },
      include: { assignee: { select: { id: true, name: true, avatar: true } } },
    })
    res.json({ success: true, data: task })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// DELETE /api/tasks/:id
export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    await prisma.task.delete({ where: { id } })
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
