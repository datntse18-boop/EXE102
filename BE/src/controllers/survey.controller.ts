import { Response } from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

// POST /api/projects/:projectId/surveys
export const addSurvey = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as { projectId: string }
    const { respondentName, feedbackText, willPayRate, demographics } = req.body

    if (!feedbackText || willPayRate === undefined) {
      res.status(400).json({ success: false, message: 'feedbackText and willPayRate are required' })
      return
    }

    const survey = await prisma.customerSurvey.create({
      data: {
        projectId,
        respondentName,
        feedbackText,
        willPayRate: Number(willPayRate),
        demographics
      }
    })

    res.json({ success: true, data: survey })
  } catch (err) {
    console.error('Add Survey Error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/projects/:projectId/surveys
export const getSurveys = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as { projectId: string }
    const surveys = await prisma.customerSurvey.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ success: true, data: surveys })
  } catch (err) {
    console.error('Get Surveys Error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/projects/:projectId/surveys/analyze
export const analyzeSurveys = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as { projectId: string }
    const surveys = await prisma.customerSurvey.findMany({
      where: { projectId }
    })

    if (surveys.length === 0) {
      res.status(400).json({ success: false, message: 'No surveys found for this project to analyze' })
      return
    }

    // Prepare content for Gemini
    const surveyDataText = surveys.map((s, idx) => `Khảo sát ${idx + 1}:
- Người trả lời: ${s.respondentName || 'Ẩn danh'}
- Độ tuổi/Đối tượng: ${s.demographics || 'Không rõ'}
- Ý kiến: "${s.feedbackText}"
- Mức độ sẵn sàng chi trả (1-5): ${s.willPayRate}`).join('\n\n')

    const prompt = `Bạn là trợ lý AI phân tích khảo sát khách hàng của StudyConnect.
Hãy phân tích dữ liệu khảo sát khách hàng mục tiêu sau đây của một dự án startup sinh viên:

${surveyDataText}

Nhiệm vụ:
Hãy đánh giá tổng quan khảo sát và trả về một đối tượng JSON phân tích chất lượng (chỉ JSON, không markdown \`\`\`json, không giải thích gì thêm ngoài JSON):
{
  "totalResponses": ${surveys.length},
  "willingToPayRate": 75,
  "fitScore": 80,
  "keyInsights": [
    "Insight chính 1 rút ra từ khảo sát...",
    "Insight chính 2 rút ra từ khảo sát..."
  ],
  "customerPains": [
    "Nỗi đau cốt lõi 1 của khách hàng...",
    "Nỗi đau cốt lõi 2 của khách hàng..."
  ],
  "recommendations": [
    "Đề xuất cải tiến sản phẩm 1...",
    "Đề xuất cải tiến sản phẩm 2..."
  ],
  "conclusion": "Kết luận tổng quan của AI về tính khả thi dự án từ phản hồi khách hàng..."
}

Lưu ý:
- "willingToPayRate" là tỉ lệ % số người sẵn sàng chi trả (willPayRate >= 3). Điền số nguyên từ 0-100.
- "fitScore" là Điểm đánh giá mức độ Problem-Solution Fit (0-100).`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      res.status(500).json({ success: false, message: 'AI response parsing error' })
      return
    }
    const analysis = JSON.parse(jsonMatch[0])

    res.json({ success: true, data: analysis })
  } catch (err) {
    console.error('Analyze Surveys Error:', err)
    res.status(500).json({ success: false, message: 'AI analysis failed' })
  }
}
