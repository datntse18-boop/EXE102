import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'
import { createNotification } from './notification.controller'

// POST /api/evaluation/submit
export const submitEvaluation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      evaluateeId,
      teamId,
      milestone,
      contribution,
      professionalism,
      communication,
      punctuality,
      qualityOfWork,
      feedback
    } = req.body

    const evaluatorId = req.user!.id

    if (!evaluateeId || !teamId || !milestone || contribution === undefined) {
      res.status(400).json({ success: false, message: 'Missing required fields' })
      return
    }

    if (evaluatorId === evaluateeId) {
      res.status(400).json({ success: false, message: 'You cannot evaluate yourself' })
      return
    }

    // Verify both are in the team
    const memberships = await prisma.teamMember.findMany({
      where: {
        teamId,
        userId: { in: [evaluatorId, evaluateeId] }
      }
    })

    if (memberships.length < 2) {
      res.status(400).json({ success: false, message: 'Evaluator and evaluatee must be in the same team' })
      return
    }

    // Check for double submission
    const existing = await prisma.peerEvaluation.findFirst({
      where: {
        evaluatorId,
        evaluateeId,
        teamId,
        milestone: Number(milestone)
      }
    })

    if (existing) {
      res.status(400).json({ success: false, message: 'You have already evaluated this member for this milestone' })
      return
    }

    const evaluation = await prisma.peerEvaluation.create({
      data: {
        evaluatorId,
        evaluateeId,
        teamId,
        milestone: Number(milestone),
        contribution: Number(contribution),
        professionalism: Number(professionalism || 5),
        communication: Number(communication || 5),
        punctuality: Number(punctuality || 5),
        qualityOfWork: Number(qualityOfWork || 5),
        feedback
      }
    })

    // Send a notification to the evaluatee
    await createNotification(
      evaluateeId,
      'Đánh giá đồng đội mới 📊',
      `Bạn vừa nhận được một phản hồi đánh giá đồng đội ẩn danh cho Cột mốc ${milestone}.`,
      '/peer-evaluation'
    )

    res.status(201).json({ success: true, data: evaluation })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/evaluation/stats
export const getEvaluationStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId, userId } = req.query
    if (!teamId) {
      res.status(400).json({ success: false, message: 'teamId is required' })
      return
    }

    let targetUserId = req.user!.id
    // Lecturers, Admins or Team Leaders can inspect other team members
    if (userId && userId !== req.user!.id) {
      const isAuthorized = req.user!.role === 'manager' || req.user!.role === 'admin'
      
      if (!isAuthorized) {
        // Check if current user is the team leader
        const team = await prisma.team.findUnique({
          where: { id: String(teamId) }
        })
        if (team?.leaderId !== req.user!.id) {
          res.status(403).json({ success: false, message: 'Unauthorized to view other member stats' })
          return
        }
      }
      targetUserId = String(userId)
    }

    // Get all evaluations received by targetUserId in teamId
    const evals = await prisma.peerEvaluation.findMany({
      where: {
        evaluateeId: targetUserId,
        teamId: String(teamId)
      }
    })

    if (evals.length === 0) {
      res.json({
        success: true,
        data: {
          count: 0,
          averages: {
            contribution: 0,
            professionalism: 0,
            communication: 0,
            punctuality: 0,
            qualityOfWork: 0
          },
          feedbacks: []
        }
      })
      return
    }

    const count = evals.length
    const sum = evals.reduce(
      (acc, curr) => {
        acc.contribution += curr.contribution
        acc.professionalism += curr.professionalism
        acc.communication += curr.communication
        acc.punctuality += curr.punctuality
        acc.qualityOfWork += curr.qualityOfWork
        return acc
      },
      { contribution: 0, professionalism: 0, communication: 0, punctuality: 0, qualityOfWork: 0 }
    )

    const averages = {
      contribution: Math.round((sum.contribution / count) * 10) / 10,
      professionalism: Math.round((sum.professionalism / count) * 10) / 10,
      communication: Math.round((sum.communication / count) * 10) / 10,
      punctuality: Math.round((sum.punctuality / count) * 10) / 10,
      qualityOfWork: Math.round((sum.qualityOfWork / count) * 10) / 10
    }

    // Map comments anonymously
    const feedbacks = evals.map(e => e.feedback).filter(Boolean)

    res.json({
      success: true,
      data: {
        count,
        averages,
        feedbacks
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
