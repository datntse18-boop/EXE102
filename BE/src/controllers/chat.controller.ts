import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

// GET /api/chat/:teamId
export const getChatMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId } = req.params as { teamId: string }
    const userId = req.user!.id

    // Verify user is in team
    const membership = await prisma.teamMember.findFirst({
      where: { teamId, userId }
    })
    
    // Allow lecturer/admin as well
    const isLecturerOrAdmin = req.user!.role === 'manager' || req.user!.role === 'admin'

    if (!membership && !isLecturerOrAdmin) {
      res.status(403).json({ success: false, message: 'Forbidden: not a team member' })
      return
    }

    const messages = await prisma.chatMessage.findMany({
      where: { teamId },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } }
      },
      orderBy: { createdAt: 'asc' },
      take: 100 // Last 100 messages
    })

    res.json({ success: true, data: messages })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/chat/:teamId
export const sendChatMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId } = req.params as { teamId: string }
    const { message } = req.body
    const userId = req.user!.id

    if (!message || message.trim() === '') {
      res.status(400).json({ success: false, message: 'Message content is required' })
      return
    }

    // Verify member is in team
    const membership = await prisma.teamMember.findFirst({
      where: { teamId, userId }
    })

    if (!membership) {
      res.status(403).json({ success: false, message: 'Forbidden' })
      return
    }

    const newMessage = await prisma.chatMessage.create({
      data: {
        teamId,
        userId,
        message: message.trim()
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } }
      }
    })

    res.status(201).json({ success: true, data: newMessage })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
