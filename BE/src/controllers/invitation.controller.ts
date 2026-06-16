import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'
import { createNotification } from './notification.controller'

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

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { name: true }
    })

    await createNotification(
      toUserId,
      'Bạn nhận được lời mời tham gia nhóm 📬',
      `Người dùng ${req.user!.name} đã mời bạn gia nhập nhóm "${team?.name || ''}".`,
      '/workspace'
    )

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
        const team = await prisma.team.findUnique({ where: { id: invitation.teamId } })
        if (!team) {
          res.status(404).json({ success: false, message: 'Team not found' })
          return
        }
        // Check team size limit (max 6 members, bypass for enterprise/corporate)
        if (team.subscription !== 'enterprise') {
          const currentMemberCount = await prisma.teamMember.count({
            where: { teamId: invitation.teamId }
          })
          if (currentMemberCount >= 6) {
            res.status(400).json({ success: false, message: 'Nhóm đã đạt số lượng tối đa 6 thành viên (1 nhóm trưởng và 5 thành viên).' })
            return
          }
        }

        await prisma.teamMember.create({ data: { teamId: invitation.teamId, userId: req.user!.id } })
        
        // Also inherit the team's classCode if any
        if (team.classCode) {
          await prisma.user.update({
            where: { id: req.user!.id },
            data: { classCode: team.classCode }
          })
        }
      }
    }

    const team = await prisma.team.findUnique({
      where: { id: invitation.teamId },
      select: { name: true }
    })

    await createNotification(
      invitation.fromUserId,
      status === 'accepted' ? 'Lời mời tham gia nhóm được chấp nhận ✅' : 'Lời mời tham gia nhóm bị từ chối ❌',
      `Người dùng ${req.user!.name} đã ${status === 'accepted' ? 'đồng ý' : 'từ chối'} gia nhập nhóm "${team?.name || ''}".`,
      '/workspace'
    )

    res.json({ success: true, data: updated })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
