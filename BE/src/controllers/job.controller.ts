import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'
import { createNotification } from './notification.controller'

// POST /api/jobs/create
export const createJobPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId, title, description, commitmentHours } = req.body

    if (!teamId || !title || !description || commitmentHours === undefined) {
      res.status(400).json({ success: false, message: 'All fields are required' })
      return
    }

    // Verify user is leader of the team
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    })

    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' })
      return
    }

    if (team.leaderId !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Only team leaders can post jobs' })
      return
    }

    const jobPost = await prisma.jobPost.create({
      data: {
        teamId,
        title,
        description,
        commitmentHours: Number(commitmentHours),
        status: 'open'
      }
    })

    res.status(201).json({ success: true, data: jobPost })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/jobs
export const getJobPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search } = req.query
    const where: any = { status: 'open' }

    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
        { team: { name: { contains: String(search), mode: 'insensitive' } } }
      ]
    }

    const posts = await prisma.jobPost.findMany({
      where,
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            leader: { select: { name: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ success: true, data: posts })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/jobs/apply
export const applyJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobPostId, introduction } = req.body
    const userId = req.user!.id

    if (!jobPostId || !introduction) {
      res.status(400).json({ success: false, message: 'jobPostId and introduction are required' })
      return
    }

    const post = await prisma.jobPost.findUnique({
      where: { id: jobPostId },
      include: { team: true }
    })

    if (!post || post.status !== 'open') {
      res.status(404).json({ success: false, message: 'Job post not found or closed' })
      return
    }

    // Check if user is already a member of the team
    const isMember = await prisma.teamMember.findFirst({
      where: { teamId: post.teamId, userId }
    })

    if (isMember || post.team.leaderId === userId) {
      res.status(400).json({ success: false, message: 'You are already in this team' })
      return
    }

    // Check if user already applied
    const existingApp = await prisma.jobApplication.findFirst({
      where: { jobPostId, userId, status: 'pending' }
    })

    if (existingApp) {
      res.status(400).json({ success: false, message: 'You have a pending application for this post' })
      return
    }

    const application = await prisma.jobApplication.create({
      data: {
        jobPostId,
        userId,
        introduction,
        status: 'pending'
      }
    })

    // Notify team leader
    await createNotification(
      post.team.leaderId,
      'Ứng viên mới ứng tuyển! 💼',
      `Người dùng ${req.user!.name} đã ứng tuyển vào vị trí "${post.title}" trong nhóm của bạn.`,
      `/workspace`
    )

    res.status(201).json({ success: true, data: application })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/jobs/applications/:jobPostId
export const getApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobPostId } = req.params as { jobPostId: string }

    const post = await prisma.jobPost.findUnique({
      where: { id: jobPostId },
      include: { team: true }
    })

    if (!post) {
      res.status(404).json({ success: false, message: 'Job post not found' })
      return
    }

    if (post.team.leaderId !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Only team leaders can view applications' })
      return
    }

    const applications = await prisma.jobApplication.findMany({
      where: { jobPostId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            skills: true,
            desiredRole: true,
            commitmentHours: true,
            pastProjects: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ success: true, data: applications })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// PUT /api/jobs/applications/:id/review
export const reviewApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const { status } = req.body // 'accepted' | 'rejected'

    if (status !== 'accepted' && status !== 'rejected') {
      res.status(400).json({ success: false, message: 'Invalid status. Must be accepted or rejected' })
      return
    }

    const application = await prisma.jobApplication.findUnique({
      where: { id },
      include: {
        jobPost: {
          include: { team: true }
        }
      }
    })

    if (!application || application.status !== 'pending') {
      res.status(404).json({ success: false, message: 'Application not found or already reviewed' })
      return
    }

    const team = application.jobPost.team
    if (team.leaderId !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Only team leaders can review applications' })
      return
    }

    // Update application status
    const updatedApp = await prisma.jobApplication.update({
      where: { id },
      data: { status }
    })

    if (status === 'accepted') {
      // Add applicant as team member
      // Check if user is already in the team (double safety)
      const existingMember = await prisma.teamMember.findFirst({
        where: { teamId: team.id, userId: application.userId }
      })

      if (!existingMember) {
        await prisma.teamMember.create({
          data: {
            teamId: team.id,
            userId: application.userId
          }
        })
      }

      // Close the job post
      await prisma.jobPost.update({
        where: { id: application.jobPostId },
        data: { status: 'closed' }
      })

      await createNotification(
        application.userId,
        'Ứng tuyển được thông qua! 🎉',
        `Chúc mừng! Yêu cầu ứng tuyển vào nhóm "${team.name}" của bạn đã được duyệt.`,
        '/workspace'
      )
    } else {
      await createNotification(
        application.userId,
        'Kết quả tuyển dụng 💼',
        `Yêu cầu ứng tuyển vào nhóm "${team.name}" của bạn đã bị từ chối. Đừng nản chí nhé!`,
        '/job-board'
      )
    }

    res.json({ success: true, data: updatedApp })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
