import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'
import { getGeminiModel } from '../utils/gemini'

// POST /api/weekly/submit
export const submitReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId, weekNumber, achievements, plans, blockers } = req.body
    if (!teamId || !weekNumber || !achievements || !plans || !blockers) {
      res.status(400).json({ success: false, message: 'All fields are required' })
      return
    }

    // Call Gemini AI to analyze report and generate summary advice
    const prompt = `Bạn là trợ lý cố vấn AI cho môn học khởi nghiệp (EXE101/EXE201).
Hãy đánh giá báo cáo tuần này của một nhóm dự án khởi nghiệp sinh viên:
- Thành quả tuần này: ${achievements}
- Kế hoạch tuần tới: ${plans}
- Khó khăn gặp phải: ${blockers}

Hãy tóm tắt và cho lời khuyên ngắn gọn (khoảng 3-4 câu) bằng tiếng Việt cho sinh viên về cách vượt qua khó khăn và đẩy nhanh tiến độ.`

    let aiSummary = 'AI chưa phân tích được báo cáo này.'
    try {
      const model = getGeminiModel(req)
      const result = await model.generateContent(prompt)
      aiSummary = result.response.text().trim()

      // Log AI usage
      await prisma.aIUsage.create({
        data: {
          userId: req.user!.id,
          feature: 'analytics',
          prompt,
          response: aiSummary
        }
      })
    } catch (aiErr) {
      console.error('Gemini AI error on weekly report:', aiErr)
    }

    const report = await prisma.weeklyReport.create({
      data: {
        teamId,
        weekNumber: Number(weekNumber),
        achievements,
        plans,
        blockers,
        aiSummary
      }
    })

    res.status(201).json({ success: true, data: report })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/weekly/reports
export const getWeeklyReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId } = req.query
    const where: any = {}
    if (teamId) {
      where.teamId = String(teamId)
    } else {
      // If student (member), filter by their teams
      if (req.user!.role === 'member') {
        where.team = { members: { some: { userId: req.user!.id } } }
      }
      // If lecturer (manager), filter by teams in their classCode
      else if (req.user!.role === 'manager') {
        where.team = { classCode: req.user!.classCode || 'NO_CLASS' }
      }
      // If Dean (leader) or Admin, see everything
    }

    const reports = await prisma.weeklyReport.findMany({
      where,
      include: {
        team: { select: { id: true, name: true, classCode: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ success: true, data: reports })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
