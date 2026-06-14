import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

// POST /api/mentoring/slots - Lecturer creates available mentoring slots
export const createSlots = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startTime, endTime, meetingLink } = req.body
    if (!startTime || !endTime) {
      res.status(400).json({ success: false, message: 'Start time and end time are required' })
      return
    }

    if (req.user!.role !== 'manager' && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Only lecturers and admins can create slots' })
      return
    }

    const slot = await prisma.mentoringSlot.create({
      data: {
        lecturerId: req.user!.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        meetingLink,
        status: 'available'
      }
    })

    res.status(201).json({ success: true, data: slot })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/mentoring/slots - Get available mentoring slots
export const getSlots = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lecturerId, status } = req.query
    const where: any = {}

    if (status) {
      where.status = String(status)
    }

    if (lecturerId) {
      where.lecturerId = String(lecturerId)
    } else {
      // If student (member), show slots of their lecturer (matching team classCode)
      if (req.user!.role === 'member') {
        const studentTeams = await prisma.team.findMany({
          where: { members: { some: { userId: req.user!.id } } }
        })
        const classCodes = studentTeams.map(t => t.classCode).filter(Boolean) as string[]

        if (classCodes.length > 0) {
          const lecturersInClasses = await prisma.user.findMany({
            where: { role: 'manager', classCode: { in: classCodes } }
          })
          where.lecturerId = { in: lecturersInClasses.map(l => l.id) }
        }
      } 
      // If lecturer, show only their slots
      else if (req.user!.role === 'manager') {
        where.lecturerId = req.user!.id
      }
    }

    const slots = await prisma.mentoringSlot.findMany({
      where,
      include: {
        lecturer: { select: { id: true, name: true, avatar: true, email: true } },
        bookedByTeam: { select: { id: true, name: true } }
      },
      orderBy: { startTime: 'asc' }
    })

    res.json({ success: true, data: slots })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/mentoring/slots/:id/book - Book a slot
export const bookSlot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const { teamId, topic } = req.body

    if (!teamId || !topic) {
      res.status(400).json({ success: false, message: 'teamId and topic are required' })
      return
    }

    const slot = await prisma.mentoringSlot.findUnique({ where: { id } })
    if (!slot) {
      res.status(404).json({ success: false, message: 'Mentoring slot not found' })
      return
    }

    if (slot.status !== 'available') {
      res.status(400).json({ success: false, message: 'This slot is already booked' })
      return
    }

    // Verify student is member of the team
    const isMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: req.user!.id } }
    })
    if (!isMember && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'You must be a member of the team to book a slot' })
      return
    }

    const updatedSlot = await prisma.mentoringSlot.update({
      where: { id },
      data: {
        status: 'booked',
        bookedByTeamId: teamId,
        topic
      },
      include: {
        lecturer: { select: { id: true, name: true, email: true } },
        bookedByTeam: { select: { id: true, name: true } }
      }
    })

    res.json({ success: true, message: 'Đặt lịch cố vấn thành công', data: updatedSlot })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
