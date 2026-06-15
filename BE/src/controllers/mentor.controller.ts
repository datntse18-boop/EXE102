import { Response } from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

// GET /api/chat/projects/:projectId/mentor
export const getMentorMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as { projectId: string }
    const messages = await prisma.aIMentorMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' }
    })
    res.json({ success: true, data: messages })
  } catch (err) {
    console.error('Get mentor messages error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/chat/projects/:projectId/mentor
export const sendMentorMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as { projectId: string }
    const { message } = req.body

    if (!message) {
      res.status(400).json({ success: false, message: 'Message is required' })
      return
    }

    // Save user message
    const userMsg = await prisma.aIMentorMessage.create({
      data: {
        projectId,
        role: 'user',
        message
      }
    })

    // Fetch project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { team: true }
    })

    // Fetch chat history
    const history = await prisma.aIMentorMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 15
    })
    const reversedHistory = history.reverse()
    const historyPrompt = reversedHistory.map(h => `${h.role === 'user' ? 'Sinh viên' : 'AI Mentor'}: "${h.message}"`).join('\n')

    const canvasText = project?.canvasModel 
      ? `\n\nDưới đây là mô hình Canvas kinh doanh hiện tại của dự án: ${project.canvasModel}` 
      : ''

    const systemPrompt = `Bạn là Trợ lý Cố vấn AI (AI Startup Mentor) thuộc nền tảng StudyConnect.
Môn học quản lý: Khởi nghiệp sáng tạo (EXE101/EXE201).
Tên dự án hiện tại: "${project?.name || 'Chưa đặt tên'}"
Mô tả dự án: "${project?.description || 'Chưa có mô tả'}"${canvasText}

Nhiệm vụ của bạn:
- Hãy trả lời câu hỏi của sinh viên dưới vai trò một giảng viên cố vấn khởi nghiệp tận tâm, chuyên nghiệp, thông thái.
- Định hướng sinh viên về pháp lý (luật doanh nghiệp Việt Nam, đăng ký hộ kinh doanh, sở hữu trí tuệ), mô hình doanh thu, lập kế hoạch tài chính (chi phí cố định, biến đổi, CAC, LTV), phát triển sản phẩm MVP và chiến lược tiếp thị (GTM).
- Câu trả lời nên mang tính xây dựng, ngắn gọn, có cấu trúc rõ ràng bằng tiếng Việt. Tránh lý thuyết suông, hãy hướng sinh viên tới các bước thực thi thực tế.

Lịch sử trò chuyện gần đây:
${historyPrompt}

Hãy phản hồi tin nhắn cuối cùng của Sinh viên: "${message}"`

    let aiReply = 'Tôi đang gặp lỗi kết nối với máy chủ AI. Vui lòng thử lại sau.'
    try {
      const result = await model.generateContent(systemPrompt)
      aiReply = result.response.text().trim()
      
      // Save AI reply
      await prisma.aIMentorMessage.create({
        data: {
          projectId,
          role: 'model',
          message: aiReply
        }
      })

      // Log AI Usage
      await prisma.aIUsage.create({
        data: {
          userId: req.user!.id,
          feature: 'analytics',
          prompt: message,
          response: aiReply
        }
      })
    } catch (aiErr) {
      console.error('Gemini AI mentor error:', aiErr)
    }

    res.json({ success: true, data: { userMsg, aiReply } })
  } catch (err) {
    console.error('Send mentor message error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
