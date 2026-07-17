import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'
import { generateViaN8nOrGemini, emitN8nEvent } from '../services/n8n.service'

// GET /api/mentor/projects/:projectId/mentor
export const getMentorMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as { projectId: string }
    const messages = await prisma.aIMentorMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    })
    res.json({ success: true, data: messages })
  } catch (err) {
    console.error('Get mentor messages error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/mentor/projects/:projectId/mentor
export const sendMentorMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as { projectId: string }
    const { message } = req.body

    if (!message) {
      res.status(400).json({ success: false, message: 'Message is required' })
      return
    }

    const userMsg = await prisma.aIMentorMessage.create({
      data: { projectId, role: 'user', message },
    })

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { team: true, financialModel: true },
    })

    const history = await prisma.aIMentorMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 15,
    })
    const reversedHistory = history.reverse()

    const canvasText = project?.canvasModel
      ? `\nCanvas hiện tại: ${String(project.canvasModel).slice(0, 1200)}`
      : ''
    const financeText = project?.financialModel
      ? `\nTài chính: CAC=${project.financialModel.cac}, LTV=${project.financialModel.ltv}, price=${project.financialModel.sellingPrice}`
      : ''

    const systemPrompt = `Bạn là Trợ lý Cố vấn AI (AI Startup Mentor) thuộc StudyConnect — môn EXE101/EXE201.
Tên dự án: "${project?.name || 'Chưa đặt tên'}"
Mô tả: "${project?.description || 'Chưa có mô tả'}"
Nhóm: "${project?.team?.name || 'N/A'}"${canvasText}${financeText}

Nhiệm vụ: cố vấn khởi nghiệp thực chiến (pháp lý VN, doanh thu, MVP, GTM, tài chính).
Trả lời tiếng Việt, có cấu trúc, actionable.`

    let aiReply = 'Tôi đang gặp lỗi kết nối với máy chủ AI. Vui lòng thử lại sau.'
    try {
      const { text, source } = await generateViaN8nOrGemini(
        {
          feature: 'mentor_chat',
          systemPrompt,
          prompt: message,
          history: reversedHistory.slice(0, -1).map((h) => ({
            role: h.role === 'user' ? 'user' : 'model',
            content: h.message,
          })),
          context: { projectId },
          user: { id: req.user!.id, role: req.user!.role, name: req.user!.name },
        },
        req
      )
      aiReply = text

      await prisma.aIMentorMessage.create({
        data: { projectId, role: 'model', message: aiReply },
      })

      await prisma.aIUsage.create({
        data: {
          userId: req.user!.id,
          feature: 'analytics',
          prompt: message,
          response: aiReply,
        },
      })

      void emitN8nEvent('mentor_chat', { userId: req.user!.id, projectId, source })
    } catch (aiErr) {
      console.error('Gemini AI mentor error:', aiErr)
    }

    res.json({ success: true, data: { userMsg, aiReply } })
  } catch (err) {
    console.error('Send mentor message error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
