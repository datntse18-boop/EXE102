import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

// Helper function to create notification
export const createNotification = async (userId: string, title: string, content: string, link?: string) => {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        content,
        link,
        isRead: false
      }
    })
  } catch (err) {
    console.error('Failed to create notification:', err)
  }
}

// GET /api/notifications
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to last 50 notifications
    })

    res.json({ success: true, data: notifications })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// PUT /api/notifications/:id/read
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }

    const notification = await prisma.notification.findUnique({
      where: { id }
    })

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' })
      return
    }

    if (notification.userId !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Unauthorized' })
      return
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    })

    res.json({ success: true, data: updated })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
