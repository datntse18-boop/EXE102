import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'
import { createNotification } from './notification.controller'

// POST /api/grades/submit
export const gradeTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId, milestone, score, feedback } = req.body
    const lecturerId = req.user!.id

    // Check permissions
    if (req.user!.role !== 'manager' && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden. Only lecturers or admins can grade.' })
      return
    }

    if (!teamId || milestone === undefined || score === undefined) {
      res.status(400).json({ success: false, message: 'teamId, milestone, and score are required' })
      return
    }

    // Upsert team grade
    const existing = await prisma.teamGrade.findFirst({
      where: {
        teamId,
        milestone: Number(milestone)
      }
    })

    let grade
    if (existing) {
      grade = await prisma.teamGrade.update({
        where: { id: existing.id },
        data: {
          score: Number(score),
          feedback,
          gradedById: lecturerId
        }
      })
    } else {
      grade = await prisma.teamGrade.create({
        data: {
          teamId,
          milestone: Number(milestone),
          score: Number(score),
          feedback,
          gradedById: lecturerId
        }
      })
    }

    // Send notifications to all team members
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId }
    })

    for (const member of teamMembers) {
      await createNotification(
        member.userId,
        'Điểm số & Nhận xét mới 📝',
        `Giảng viên đã công bố điểm Cột mốc ${milestone} cho nhóm của bạn. Điểm: ${score}/10.`,
        '/workspace'
      )
    }

    res.json({ success: true, data: grade })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/grades/team/:teamId
export const getTeamGrades = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId } = req.params as { teamId: string }

    // Check if user is in team, lecturer, or admin
    if (req.user!.role !== 'manager' && req.user!.role !== 'admin') {
      const membership = await prisma.teamMember.findFirst({
        where: { teamId, userId: req.user!.id }
      })
      if (!membership) {
        res.status(403).json({ success: false, message: 'Unauthorized' })
        return
      }
    }

    const grades = await prisma.teamGrade.findMany({
      where: { teamId },
      include: {
        gradedBy: { select: { name: true } }
      },
      orderBy: { milestone: 'asc' }
    })

    res.json({ success: true, data: grades })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/grades/class
export const getClassGrades = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let classCode = req.query.classCode ? String(req.query.classCode) : req.user!.classCode

    if (!classCode) {
      res.status(400).json({ success: false, message: 'classCode is required' })
      return
    }

    // Find all teams associated with this classCode
    const teams = await prisma.team.findMany({
      where: { classCode },
      include: {
        grades: {
          include: {
            gradedBy: { select: { name: true } }
          }
        },
        leader: { select: { name: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        }
      }
    })

    res.json({ success: true, data: teams })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
