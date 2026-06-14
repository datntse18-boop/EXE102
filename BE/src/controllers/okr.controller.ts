import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

// Helper to recompute objective progress percentage
const recomputeObjectiveProgress = async (objectiveId: string) => {
  const krs = await prisma.projectKeyResult.findMany({
    where: { objectiveId }
  })

  if (krs.length === 0) {
    await prisma.projectObjective.update({
      where: { id: objectiveId },
      data: { progress: 0 }
    })
    return
  }

  let totalPercent = 0
  krs.forEach(kr => {
    const target = kr.targetValue || 100
    const current = kr.currentValue || 0
    const percent = Math.min(100, Math.max(0, Math.round((current / target) * 100)))
    totalPercent += percent
  })

  const averageProgress = Math.round(totalPercent / krs.length)

  await prisma.projectObjective.update({
    where: { id: objectiveId },
    data: { progress: averageProgress }
  })
}

// GET /api/okr/:projectId
export const getObjectives = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as { projectId: string }

    const objectives = await prisma.projectObjective.findMany({
      where: { projectId },
      include: {
        keyResults: true
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ success: true, data: objectives })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/okr/:projectId
export const createObjective = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as { projectId: string }
    const { title } = req.body

    if (!title || title.trim() === '') {
      res.status(400).json({ success: false, message: 'Objective title is required' })
      return
    }

    const objective = await prisma.projectObjective.create({
      data: {
        projectId,
        title: title.trim(),
        progress: 0
      },
      include: {
        keyResults: true
      }
    })

    res.status(201).json({ success: true, data: objective })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/okr/objective/:objectiveId/key-result
export const createKeyResult = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { objectiveId } = req.params as { objectiveId: string }
    const { title, targetValue, unit } = req.body

    if (!title || !targetValue) {
      res.status(400).json({ success: false, message: 'Title and targetValue are required' })
      return
    }

    const kr = await prisma.projectKeyResult.create({
      data: {
        objectiveId,
        title: title.trim(),
        targetValue: Number(targetValue),
        currentValue: 0,
        unit: unit || '%'
      }
    })

    // Recompute progress
    await recomputeObjectiveProgress(objectiveId)

    res.status(201).json({ success: true, data: kr })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// PUT /api/okr/key-result/:id
export const updateKeyResult = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const { currentValue } = req.body

    if (currentValue === undefined) {
      res.status(400).json({ success: false, message: 'currentValue is required' })
      return
    }

    const kr = await prisma.projectKeyResult.findUnique({
      where: { id }
    })

    if (!kr) {
      res.status(404).json({ success: false, message: 'Key result not found' })
      return
    }

    const updated = await prisma.projectKeyResult.update({
      where: { id },
      data: { currentValue: Number(currentValue) }
    })

    // Recompute parent objective progress
    await recomputeObjectiveProgress(kr.objectiveId)

    res.json({ success: true, data: updated })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
