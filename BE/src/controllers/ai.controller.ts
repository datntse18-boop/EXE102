import { Response } from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

const logAIUsage = async (userId: string, feature: 'idea_generator' | 'team_matching' | 'analytics', prompt: string, response: string) => {
  await prisma.aIUsage.create({ data: { userId, feature, prompt, response } })
}

// POST /api/ai/idea-generator
export const generateIdea = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { targetUsers, problemArea, technology } = req.body
    if (!targetUsers || !problemArea) {
      res.status(400).json({ success: false, message: 'targetUsers and problemArea are required' })
      return
    }

    const prompt = `Bạn là trợ lý AI của StudyConnect - nền tảng kết nối sinh viên.
Hãy tạo ra một ý tưởng dự án sáng tạo dựa trên các thông tin sau:
- Đối tượng người dùng: ${targetUsers}
- Vấn đề cần giải quyết: ${problemArea}
- Công nghệ muốn sử dụng: ${technology || 'Bất kỳ'}

Trả lời theo định dạng JSON (chỉ JSON, không giải thích thêm):
{
  "name": "Tên dự án",
  "problem": "Mô tả vấn đề chi tiết",
  "solution": "Giải pháp đề xuất",
  "market": "Thị trường mục tiêu",
  "techStack": ["Tech 1", "Tech 2", "Tech 3"],
  "features": ["Tính năng 1", "Tính năng 2", "Tính năng 3"],
  "potential": "High/Medium/Low",
  "timeline": "Ước tính thời gian phát triển"
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      res.status(500).json({ success: false, message: 'AI response parsing error' })
      return
    }
    const idea = JSON.parse(jsonMatch[0])

    await logAIUsage(req.user!.id, 'idea_generator', prompt, text)
    res.json({ success: true, data: idea })
  } catch (err) {
    console.error('AI Error:', err)
    res.status(500).json({ success: false, message: 'AI generation failed' })
  }
}

// POST /api/ai/team-matching
export const teamMatching = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skills, interests, availability } = req.body

    // Get available users and teams from DB
    const teams = await prisma.team.findMany({
      where: { status: 'active' },
      include: {
        members: { include: { user: { select: { id: true, name: true, role: true } } } },
        _count: { select: { members: true } },
      },
      take: 10,
    })

    const teamsInfo = teams.map(t => `- ${t.name}: ${t._count.members} members, ${t.description}`).join('\n')

    const prompt = `Bạn là AI trợ lý ghép nhóm của StudyConnect.
Dữ liệu sinh viên cần ghép nhóm:
- Kỹ năng: ${skills || 'Không xác định'}
- Sở thích: ${interests || 'Không xác định'}  
- Thời gian rảnh: ${availability || 'Linh hoạt'}

Các nhóm hiện có trên platform:
${teamsInfo}

Hãy gợi ý 3 nhóm phù hợp nhất và lý do, theo format JSON:
{
  "recommendations": [
    {
      "teamName": "Tên nhóm",
      "matchScore": 85,
      "reason": "Lý do phù hợp",
      "skills_needed": ["Skill cần thiết"]
    }
  ],
  "tips": "Lời khuyên để tìm nhóm phù hợp"
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      res.status(500).json({ success: false, message: 'AI response parsing error' })
      return
    }
    const matching = JSON.parse(jsonMatch[0])

    await logAIUsage(req.user!.id, 'team_matching', prompt, text)
    res.json({ success: true, data: matching })
  } catch (err) {
    console.error('AI Error:', err)
    res.status(500).json({ success: false, message: 'AI matching failed' })
  }
}

// POST /api/ai/analyze-progress
export const analyzeProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId } = req.body
    if (!teamId) {
      res.status(400).json({ success: false, message: 'teamId is required' })
      return
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: { include: { user: { select: { name: true, role: true } } } },
        projects: {
          include: {
            tasks: { include: { assignee: { select: { name: true } } } },
          },
        },
      },
    })

    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' })
      return
    }

    const allTasks = team.projects.flatMap(p => p.tasks)
    const completed = allTasks.filter(t => t.status === 'completed').length
    const inProgress = allTasks.filter(t => t.status === 'in_progress').length
    const todo = allTasks.filter(t => t.status === 'todo').length
    const overdue = allTasks.filter(t => t.dueDate && t.dueDate < new Date() && t.status !== 'completed').length

    const prompt = `Bạn là AI phân tích tiến độ dự án của StudyConnect. Hãy phân tích và đưa ra gợi ý bằng tiếng Việt.

Thông tin nhóm "${team.name}":
- Số thành viên: ${team.members.length}
- Health Score: ${team.healthScore}%
- Số dự án: ${team.projects.length}
- Tổng tasks: ${allTasks.length} (Hoàn thành: ${completed}, Đang làm: ${inProgress}, Chờ: ${todo}, Quá hạn: ${overdue})

Trả lời JSON:
{
  "overallStatus": "Tốt/Trung bình/Cần chú ý",
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "weaknesses": ["Điểm yếu 1", "Điểm yếu 2"],
  "recommendations": ["Gợi ý 1", "Gợi ý 2", "Gợi ý 3"],
  "riskLevel": "Low/Medium/High",
  "summary": "Tóm tắt tổng quan về nhóm"
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      res.status(500).json({ success: false, message: 'AI response parsing error' })
      return
    }
    const analysis = JSON.parse(jsonMatch[0])

    await logAIUsage(req.user!.id, 'analytics', prompt, text)
    res.json({ success: true, data: { ...analysis, teamStats: { completed, inProgress, todo, overdue } } })
  } catch (err) {
    console.error('AI Error:', err)
    res.status(500).json({ success: false, message: 'AI analysis failed' })
  }
}

// POST /api/ai/pitch-deck-advisor
export const analyzePitchDeck = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content } = req.body
    if (!content || content.trim() === '') {
      res.status(400).json({ success: false, message: 'Pitch deck content is required' })
      return
    }

    const prompt = `Bạn là trợ lý AI chuyên gia tư vấn khởi nghiệp và là giảng viên phản biện môn EXE101/EXE201.
Hãy đánh giá chi tiết bản đề cương ý tưởng / dàn ý slide Pitch Deck sau đây:
${content}

Hãy đánh giá dự án và trả về chính xác định dạng JSON (chỉ JSON, không giải thích thêm, không markdown \`\`\`json):
{
  "scores": {
    "marketSize": 80,
    "problemSolution": 75,
    "businessModel": 70,
    "overall": 75
  },
  "feedback": {
    "marketSize": "Nhận xét chi tiết về thị trường...",
    "problemSolution": "Nhận xét chi tiết về vấn đề và giải pháp...",
    "businessModel": "Nhận xét chi tiết về mô hình kinh doanh..."
  },
  "suggestions": [
    "Khuyến nghị cải tiến 1 (Cụ thể cách khắc phục)",
    "Khuyến nghị cải tiến 2 (Cụ thể cách khắc phục)",
    "Khuyến nghị cải tiến 3 (Cụ thể cách khắc phục)"
  ],
  "conclusion": "Kết luận tổng quan về dự án"
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      res.status(500).json({ success: false, message: 'AI response parsing error' })
      return
    }
    const analysis = JSON.parse(jsonMatch[0])

    await logAIUsage(req.user!.id, 'analytics', prompt, text)
    res.json({ success: true, data: analysis })
  } catch (err) {
    console.error('AI Pitch Deck Error:', err)
    res.status(500).json({ success: false, message: 'AI evaluation failed' })
  }
}

// POST /api/ai/demo-day
export const virtualDemoDay = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pitchIdea, chatHistory, action, lastQuestion, userAnswer, currentJudge } = req.body

    if (!pitchIdea) {
      res.status(400).json({ success: false, message: 'pitchIdea is required' })
      return
    }

    if (action === 'start') {
      const prompt = `Bạn là trợ lý AI của StudyConnect - nền tảng kết nối sinh viên khởi nghiệp.
Hãy mô phỏng một buổi Demo Day thuyết trình dự án cho ý tưởng sau:
"${pitchIdea}"

Nhiệm vụ của bạn:
1. Đóng vai và giới thiệu ngắn gọn hội đồng 3 vị giám khảo ảo (mỗi người 1-2 câu ngắn):
   - Victor Chen (VC - Đại diện Quỹ đầu tư, quan tâm đến quy mô thị trường, mô hình kinh doanh và doanh thu).
   - Clara Tech (CTO - Chuyên gia công nghệ, quan tâm đến kiến trúc kỹ thuật, tính khả thi và khả năng mở rộng).
   - Marcus GTM (CMO - Chuyên gia tiếp thị, quan tâm đến cách tiếp cận thị trường (GTM), CAC và LTV).
2. Để Victor Chen (VC) đặt câu hỏi đầu tiên (1 câu ngắn gọn, sắc bén) về thị trường hoặc tài chính của dự án này để thách thức người sáng lập.

Hãy trả về chính xác định dạng JSON (chỉ JSON, không có mã markdown \`\`\`json):
{
  "introductions": "Đoạn giới thiệu ngắn từ 3 vị giám khảo...",
  "nextJudge": "VC",
  "nextQuestion": "Câu hỏi đầu tiên từ VC dành cho dự án..."
}`

      const result = await model.generateContent(prompt)
      const text = result.response.text()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        res.status(500).json({ success: false, message: 'AI response parsing error' })
        return
      }
      const data = JSON.parse(jsonMatch[0])
      res.json({ success: true, data })
      return
    }

    if (action === 'submit_answer') {
      if (!userAnswer || !currentJudge || !lastQuestion) {
        res.status(400).json({ success: false, message: 'userAnswer, currentJudge, and lastQuestion are required' })
        return
      }

      // Determine who is next
      let nextJudge = 'CTO'
      if (currentJudge === 'CTO') nextJudge = 'CMO'
      if (currentJudge === 'CMO') nextJudge = 'VC'

      const historyText = (chatHistory || []).map((h: any) => `${h.role === 'user' ? 'Founder' : h.panelMember}: ${h.content}`).join('\n')

      const prompt = `Bạn là trợ lý AI mô phỏng buổi Demo Day. Dự án: "${pitchIdea}".
Lịch sử đối thoại trước đó:
${historyText}

Giám khảo vừa đặt câu hỏi là ${currentJudge}: "${lastQuestion}"
Người sáng lập (Founder) trả lời: "${userAnswer}"

Nhiệm vụ:
1. Hãy đưa ra nhận xét ngắn gọn, sắc bén (critique) từ góc nhìn chuyên môn của ${currentJudge} về câu trả lời của Founder (khen hoặc chê trực diện, 2-3 câu).
2. Hãy để giám khảo tiếp theo là ${nextJudge} đặt câu hỏi tiếp theo (1 câu ngắn gọn, chuyên sâu) liên quan đến lĩnh vực của họ (${nextJudge === 'CTO' ? 'công nghệ/khả thi' : nextJudge === 'CMO' ? 'GTM/marketing/khách hàng' : 'tài chính/mô hình doanh thu'}).

Hãy trả về chính xác định dạng JSON (chỉ JSON, không có mã markdown \`\`\`json):
{
  "critique": "Nhận xét của ${currentJudge} về câu trả lời...",
  "nextJudge": "${nextJudge}",
  "nextQuestion": "Câu hỏi tiếp theo từ ${nextJudge}..."
}`

      const result = await model.generateContent(prompt)
      const text = result.response.text()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        res.status(500).json({ success: false, message: 'AI response parsing error' })
        return
      }
      const data = JSON.parse(jsonMatch[0])
      res.json({ success: true, data })
      return
    }

    if (action === 'finalize') {
      const historyText = (chatHistory || []).map((h: any) => `${h.role === 'user' ? 'Founder' : h.panelMember}: ${h.content}`).join('\n')

      const prompt = `Bạn là trợ lý AI mô phỏng buổi Demo Day. Dự án: "${pitchIdea}".
Toàn bộ lịch sử thuyết trình và Q&A giữa Founder và ban giám khảo:
${historyText}

Nhiệm vụ:
Hãy đóng vai ban giám khảo hội ý và đưa ra kết quả đánh giá cuối cùng.
Trả về chính xác định dạng JSON (chỉ JSON, không có mã markdown \`\`\`json):
{
  "vcScore": 85,
  "vcCritique": "Nhận xét tổng kết của VC Victor Chen...",
  "ctoScore": 80,
  "ctoCritique": "Nhận xét tổng kết của CTO Clara Tech...",
  "cmoScore": 75,
  "cmoCritique": "Nhận xét tổng kết của CMO Marcus GTM...",
  "overallScore": 80,
  "verdict": "Invested",
  "verdictText": "Giải thích quyết định đầu tư (ví dụ: Đồng ý rót vốn 100,000 USD cho 10% cổ phần hoặc Từ chối đầu tư vì rủi ro kỹ thuật...)",
  "generalAdvice": "Lời khuyên tổng quát để dự án hoàn thiện hơn..."
}

Lưu ý:
- "verdict" phải thuộc một trong ba giá trị: "Invested" (Đồng ý đầu tư), "Seed-Funded" (Đồng ý đầu tư vòng thiên thần), hoặc "Rejected" (Từ chối đầu tư, khuyên pivot).
- Điểm số nằm trong khoảng từ 0 đến 100.`

      const result = await model.generateContent(prompt)
      const text = result.response.text()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        res.status(500).json({ success: false, message: 'AI response parsing error' })
        return
      }
      const data = JSON.parse(jsonMatch[0])
      res.json({ success: true, data })
      return
    }

    res.status(400).json({ success: false, message: 'Invalid action' })
  } catch (err) {
    console.error('Virtual Demo Day Error:', err)
    res.status(500).json({ success: false, message: 'Demo Day simulation failed' })
  }
}

// POST /api/ai/projects/:projectId/generate-slides
export const generateSlides = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as { projectId: string }

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' })
      return
    }

    const canvasText = project.canvasModel || 'Chưa thiết lập mô hình Canvas'
    const descText = project.description || 'Chưa thiết lập mô tả dự án'

    const prompt = `Bạn là chuyên gia tư vấn khởi nghiệp và thiết kế Pitch Deck của StudyConnect.
Hãy phân tích thông tin dự án và mô hình Business Model Canvas sau đây để tạo một dàn ý Slide thuyết trình (Pitch Deck) 10 trang chuẩn gọi vốn quốc tế:
- Tên dự án: ${project.name}
- Mô tả dự án: ${descText}
- Chi tiết mô hình Canvas: ${canvasText}

Nhiệm vụ:
Hãy thiết lập dàn ý chi tiết gồm đúng 10 slide. Trả về chính xác định dạng JSON (chỉ JSON, không markdown \`\`\`json, không giải thích gì ngoài JSON):
{
  "slides": [
    {
      "slideNum": 1,
      "title": "Tiêu đề slide (ví dụ: Trang bìa / Giới thiệu)",
      "bullets": [
        "Ý chính thuyết trình 1...",
        "Ý chính thuyết trình 2..."
      ],
      "visualSuggestion": "Gợi ý hình ảnh/đồ họa hiển thị trên slide..."
    }
  ]
}

Lưu ý:
- 10 slide phải đi qua các phần:
  1. Title / Intro (Trang bìa)
  2. Problem (Vấn đề)
  3. Solution (Giải pháp)
  4. Market Size / TAM-SAM-SOM (Thị trường)
  5. Product / MVP (Sản phẩm)
  6. Business Model / Revenue (Mô hình doanh thu)
  7. Go-To-Market / Marketing (Chiến lược tiếp cận)
  8. Competitors / Competitive Advantage (Đối thủ & Lợi thế cạnh tranh)
  9. Team (Đội ngũ)
  10. Call to Action / Ask (Kêu gọi hành động / Vốn)
- Cung cấp dữ liệu chi tiết, thực tế, liên kết chặt chẽ với dự án.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      res.status(500).json({ success: false, message: 'AI response parsing error' })
      return
    }
    const slidesData = JSON.parse(jsonMatch[0])

    // Update project
    await prisma.project.update({
      where: { id: projectId },
      data: {
        slideOutline: JSON.stringify(slidesData)
      }
    })

    res.json({ success: true, data: slidesData })
  } catch (err) {
    console.error('Generate Slides Error:', err)
    res.status(500).json({ success: false, message: 'AI generation failed' })
  }
}


