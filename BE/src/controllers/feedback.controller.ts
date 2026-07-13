import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

// POST /api/feedbacks - Submit new feedback
export const createFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content } = req.body
    if (!content || content.trim() === '') {
      res.status(400).json({ success: false, message: 'Nội dung góp ý không được để trống' })
      return
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: req.user!.id,
        content: content.trim()
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true } }
      }
    })

    res.status(201).json({ success: true, message: 'Gửi góp ý thành công!', data: feedback })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/feedbacks/my-feedbacks - Get feedbacks submitted by the logged in user
export const getUserFeedbacks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      where: { userId: req.user!.id },
      include: {
        repliedBy: { select: { id: true, name: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ success: true, data: feedbacks })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/feedbacks - Get all feedbacks (Admin only)
export const getAllFeedbacks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        repliedBy: { select: { id: true, name: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ success: true, data: feedbacks })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// PATCH /api/feedbacks/:id/reply - Reply to feedback (Admin only)
export const replyFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const { reply } = req.body

    if (!reply || reply.trim() === '') {
      res.status(400).json({ success: false, message: 'Nội dung phản hồi không được để trống' })
      return
    }

    const existing = await prisma.feedback.findUnique({ where: { id } })
    if (!existing) {
      res.status(404).json({ success: false, message: 'Không tìm thấy góp ý' })
      return
    }

    const updated = await prisma.feedback.update({
      where: { id },
      data: {
        reply: reply.trim(),
        repliedById: req.user!.id
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        repliedBy: { select: { id: true, name: true, avatar: true } }
      }
    })

    // Send notification to user who submitted the feedback
    try {
      await prisma.notification.create({
        data: {
          userId: existing.userId,
          title: 'Ý kiến góp ý đã được phản hồi 💬',
          content: `Phản hồi của quản trị viên: "${reply.trim().substring(0, 50)}${reply.trim().length > 50 ? '...' : ''}"`,
          link: '/profile'
        }
      })
    } catch (notifErr) {
      console.error('Failed to create notification for feedback reply:', notifErr)
    }

    res.json({ success: true, message: 'Gửi phản hồi thành công!', data: updated })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
