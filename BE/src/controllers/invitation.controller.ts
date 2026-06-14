import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

// GET /api/invitations — Get invitations for current user
export const getInvitations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type = 'received' } = req.query
    const where: any = type === 'sent'
      ? { fromUserId: req.user!.id }
      : { toUserId: req.user!.id }

    const invitations = await prisma.invitation.findMany({
      where,
      include: {
        fromUser: { select: { id: true, name: true, avatar: true } },
        toUser: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: invitations })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/invitations/team/:teamId — Get all invitations for a team (manager/leader)
export const getTeamInvitations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId } = req.params as { teamId: string }
    const invitations = await prisma.invitation.findMany({
      where: { teamId },
      include: {
        fromUser: { select: { id: true, name: true, avatar: true } },
        toUser: { select: { id: true, name: true, avatar: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: invitations })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/invitations — Send invitation
export const createInvitation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId, toUserId } = req.body
    if (!teamId || !toUserId) {
      res.status(400).json({ success: false, message: 'teamId and toUserId are required' })
      return
    }

    // Check if already invited
    const existing = await prisma.invitation.findFirst({
      where: { teamId, toUserId, status: 'pending' },
    })
    if (existing) {
      res.status(409).json({ success: false, message: 'Invitation already sent' })
      return
    }

    const invitation = await prisma.invitation.create({
      data: { teamId, fromUserId: req.user!.id, toUserId },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
    })
    res.status(201).json({ success: true, data: invitation })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// PATCH /api/invitations/:id — Accept or reject
export const respondToInvitation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const { status } = req.body
    if (!['accepted', 'rejected'].includes(status)) {
      res.status(400).json({ success: false, message: 'Status must be accepted or rejected' })
      return
    }

    const invitation = await prisma.invitation.findUnique({ where: { id } })
    if (!invitation || invitation.toUserId !== req.user!.id) {
      res.status(404).json({ success: false, message: 'Invitation not found' })
      return
    }

    const updated = await prisma.invitation.update({
      where: { id },
      data: { status },
    })

    // If accepted, add to team
    if (status === 'accepted') {
      const existing = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: invitation.teamId, userId: req.user!.id } },
      })
      if (!existing) {
        await prisma.teamMember.create({ data: { teamId: invitation.teamId, userId: req.user!.id } })
      }
    }

    res.json({ success: true, data: updated })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
