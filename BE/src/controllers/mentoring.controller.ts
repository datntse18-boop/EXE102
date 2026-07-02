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

    // Auto-generate Zoom meeting link if not set
    const zoomLink = slot.meetingLink || `https://zoom.us/j/${Math.floor(100000000 + Math.random() * 900000000)}?pwd=${Math.random().toString(36).substring(2, 10)}`

    const updatedSlot = await prisma.mentoringSlot.update({
      where: { id },
      data: {
        status: 'booked',
        bookedByTeamId: teamId,
        topic,
        meetingLink: zoomLink
      },
      include: {
        lecturer: { select: { id: true, name: true, email: true } },
        bookedByTeam: { select: { id: true, name: true } }
      }
    })

    // Create notification for Lecturer
    try {
      const lecturerNotification = await prisma.notification.create({
        data: {
          userId: slot.lecturerId,
          title: 'Lịch hẹn mới được đặt 📅',
          content: `Nhóm ${updatedSlot.bookedByTeam?.name} đã đặt lịch hẹn cố vấn vào lúc ${new Date(slot.startTime).toLocaleString('vi-VN')} về chủ đề: "${topic}".`,
          link: '/mentorship'
        }
      })

      // Broadcast notification via socket
      const io = req.app.get('io')
      if (io) {
        io.to(`user_${slot.lecturerId}`).emit('notification', lecturerNotification)
      }
    } catch (notifErr) {
      console.error('Failed to create booking notification:', notifErr)
    }

    res.json({ success: true, message: 'Đặt lịch cố vấn thành công', data: updatedSlot })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// PUT /api/mentoring/slots/:id/minutes - Lecturer updates meeting minutes
export const updateMeetingMinutes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const { meetingMinutes } = req.body

    if (req.user!.role !== 'manager' && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Only lecturers and admins can update meeting minutes' })
      return
    }

    const slot = await prisma.mentoringSlot.findUnique({ where: { id } })
    if (!slot) {
      res.status(404).json({ success: false, message: 'Slot not found' })
      return
    }

    const updated = await prisma.mentoringSlot.update({
      where: { id },
      data: {
        meetingMinutes,
        isSigned: false // Reset sign status when minutes are updated
      }
    })

    res.json({ success: true, data: updated })
  } catch (err) {
    console.error('Update Minutes Error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/mentoring/slots/:id/co-sign - Student co-signs meeting minutes
export const coSignMeetingMinutes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }

    const slot = await prisma.mentoringSlot.findUnique({ where: { id } })
    if (!slot) {
      res.status(404).json({ success: false, message: 'Slot not found' })
      return
    }

    if (!slot.bookedByTeamId) {
      res.status(400).json({ success: false, message: 'This slot is not booked' })
      return
    }

    // Verify student belongs to the team
    const isMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: slot.bookedByTeamId,
          userId: req.user!.id
        }
      }
    })

    if (!isMember && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Only team members can co-sign meeting minutes' })
      return
    }

    const updated = await prisma.mentoringSlot.update({
      where: { id },
      data: {
        isSigned: true
      }
    })

    res.json({ success: true, data: updated })
  } catch (err) {
    console.error('Co-sign Minutes Error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

