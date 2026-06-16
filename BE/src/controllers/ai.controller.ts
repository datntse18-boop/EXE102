import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'
import { getGeminiModel } from '../utils/gemini'

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

    let idea = null
    try {
      const model = getGeminiModel(req)
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        idea = JSON.parse(jsonMatch[0])
        await logAIUsage(req.user!.id, 'idea_generator', prompt, text)
      }
    } catch (err) {
      console.error('AI Error:', err)
    }

    if (!idea) {
      idea = {
        name: `${technology || 'Smart'} ${problemArea.substring(0, 15)} Hub`,
        problem: `Lớp học hoặc nhóm đối tượng "${targetUsers}" đang gặp khó khăn nghiêm trọng về "${problemArea}".`,
        solution: `Ứng dụng thông minh tích hợp công nghệ giúp "${targetUsers}" giải quyết vấn đề "${problemArea}" một cách hiệu quả và tự động.`,
        market: `Thị trường Việt Nam với quy mô hàng trăm ngàn người dùng tiềm năng thuộc đối tượng "${targetUsers}".`,
        techStack: [technology || 'React/NodeJS', "TailwindCSS", "PostgreSQL", "Google Gemini API"],
        features: [
          `Đăng ký tài khoản và thiết lập hồ sơ người dùng cá nhân hóa.`,
          `Hệ thống gợi ý giải pháp tự động dựa trên học máy.`,
          `Báo cáo thống kê và phân tích tiến độ thực tế.`
        ],
        potential: "High",
        timeline: "4-6 tuần phát triển MVP",
        isFallback: true
      }
    }

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

    let matching = null
    try {
      const model = getGeminiModel(req)
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        matching = JSON.parse(jsonMatch[0])
        await logAIUsage(req.user!.id, 'team_matching', prompt, text)
      }
    } catch (err) {
      console.error('AI Error:', err)
    }

    if (!matching) {
      matching = {
        recommendations: [
          {
            teamName: teams[0]?.name || "AgriGreen Project",
            matchScore: 92,
            reason: `Kỹ năng của bạn (${skills || 'Lập trình/Thiết kế'}) rất phù hợp với vị trí mà nhóm đang tuyển dụng để phát triển sản phẩm thực tế.`,
            skills_needed: ["React", "UI/UX Design"]
          },
          {
            teamName: teams[1]?.name || "StudyBuddy App",
            matchScore: 85,
            reason: `Sở thích học tập và nghiên cứu công nghệ mới của bạn tương thích cao với văn hóa làm việc và định hướng của nhóm.`,
            skills_needed: ["NodeJS", "Database Management"]
          }
        ],
        tips: "Hãy chủ động nhắn tin cho Trưởng nhóm trên StudyConnect để trao đổi thêm về chuyên môn!"
      }
    }

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

    let analysis = null
    try {
      const model = getGeminiModel(req)
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
        await logAIUsage(req.user!.id, 'analytics', prompt, text)
      }
    } catch (err) {
      console.error('AI Error:', err)
    }

    if (!analysis) {
      const total = allTasks.length
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
      analysis = {
        overallStatus: completionRate >= 60 ? "Tốt" : overdue > 0 ? "Cần chú ý" : "Trung bình",
        strengths: [
          `Đã hoàn thành được ${completed} công việc trên bảng Kanban.`,
          `Các thành viên được phân công nhiệm vụ rõ ràng.`
        ],
        weaknesses: [
          overdue > 0 ? `Có ${overdue} công việc đã quá hạn hoàn thành.` : `Tiến độ hoàn thành công việc ở mức trung bình.`,
          `Tốc độ triển khai cần được cải tiến để kịp Demo Day.`
        ],
        recommendations: [
          `Họp nhóm nhanh 10 phút hàng ngày (Daily Standup) để tháo gỡ khó khăn trực tiếp.`,
          `Tập trung xử lý triệt để các công việc quá hạn trong tuần này.`
        ],
        riskLevel: overdue > 0 ? "Medium" : "Low",
        summary: `Nhóm ${team.name} đang vận hành với điểm sức khỏe ${team.healthScore}%. Tỷ lệ hoàn thành công việc đạt ${completionRate}%.`
      }
    }

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

    let analysis = null
    try {
      const model = getGeminiModel(req)
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
        await logAIUsage(req.user!.id, 'analytics', prompt, text)
      }
    } catch (err) {
      console.error('AI Pitch Deck Error:', err)
    }

    if (!analysis) {
      analysis = {
        scores: {
          marketSize: 80,
          problemSolution: 75,
          businessModel: 75,
          overall: 77
        },
        feedback: {
          marketSize: "Thị trường đề xuất có tiềm năng tăng trưởng tốt. Cần bổ sung số liệu TAM/SAM/SOM đáng tin cậy.",
          problemSolution: "Vấn đề và giải pháp được liên kết hợp lý, tuy nhiên cần làm rõ hơn lợi thế cạnh tranh cốt lõi (Unfair Advantage).",
          businessModel: "Mô hình doanh thu trực quan, nên đưa thêm các phân tích chi tiết về dòng tiền và điểm hòa vốn."
        },
        suggestions: [
          "Bổ sung dẫn chứng nghiên cứu thị trường thực tế hoặc khảo sát khách hàng mục tiêu để chứng minh nỗi đau khách hàng.",
          "Minh họa rõ ràng hơn về kiến trúc sản phẩm hoặc quy trình hoạt động của dịch vụ ở slide giải pháp.",
          "Cấu trúc lại chi phí cố định và biến đổi để làm nổi bật unit economics của dự án."
        ],
        conclusion: "Bản thảo Pitch Deck có bộ khung khá hoàn chỉnh và tính khả thi ở mức khá tốt. Hãy tiếp tục tối ưu hóa slide theo các góp ý trên."
      }
    }

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

      let data = null
      try {
        const model = getGeminiModel(req)
        const result = await model.generateContent(prompt)
        const text = result.response.text()
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          data = JSON.parse(jsonMatch[0])
        }
      } catch (err) {
        console.error('Demo Day AI Start Error:', err)
      }

      if (!data) {
        data = {
          introductions: "Chào bạn. Hội đồng giám khảo Demo Day hôm nay gồm có: Victor Chen (Đại diện Quỹ đầu tư mạo hiểm), Clara Tech (Chuyên gia công nghệ & phát triển sản phẩm) và Marcus GTM (Chuyên gia tiếp thị/Go-to-market). Chúng tôi rất muốn lắng nghe phần trả lời Q&A của bạn.",
          nextJudge: "Victor Chen (VC)",
          nextQuestion: `Với dự án "${pitchIdea.substring(0, 50)}...", bạn có thể cho biết quy mô thị trường mục tiêu (TAM) của bạn lớn đến thế nào và bạn định vị lợi thế cạnh tranh của mình ra sao so với các đối thủ hiện tại?`
        }
      }

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

      let data = null
      try {
        const model = getGeminiModel(req)
        const result = await model.generateContent(prompt)
        const text = result.response.text()
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          data = JSON.parse(jsonMatch[0])
        }
      } catch (err) {
        console.error('Demo Day AI Chat Error:', err)
      }

      if (!data) {
        data = {
          critique: `Cảm ơn câu trả lời của bạn. Tôi là ${currentJudge}, tôi thấy câu trả lời của bạn khá thiết thực tuy nhiên cần có thêm số liệu kiểm chứng và mô tả rõ nét quy trình vận hành thực tế.`,
          nextJudge: nextJudge,
          nextQuestion: nextJudge === 'CTO' 
            ? "Về mặt công nghệ, kiến trúc sản phẩm của bạn có điểm gì đặc biệt để ngăn chặn đối thủ copy ý tưởng trong vòng 3 tháng?" 
            : nextJudge === 'CMO'
            ? "Làm thế nào để bạn thuyết phục những khách hàng đầu tiên dùng thử sản phẩm với ngân sách marketing bằng 0?"
            : "Kế hoạch doanh thu của bạn có phụ thuộc quá nhiều vào quảng cáo không, có nguồn thu nào ổn định hơn không?"
        }
      }

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

      let data = null
      try {
        const model = getGeminiModel(req)
        const result = await model.generateContent(prompt)
        const text = result.response.text()
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          data = JSON.parse(jsonMatch[0])
        }
      } catch (err) {
        console.error('Demo Day AI End Error:', err)
      }

      if (!data) {
        data = {
          vcScore: 82,
          vcCritique: "Mô hình kinh doanh khá rõ ràng nhưng quy mô thị trường cần được chứng minh thuyết phục hơn qua doanh thu thực tế.",
          ctoScore: 85,
          ctoCritique: "Tính khả thi kỹ thuật cao, sản phẩm MVP thiết kế thông minh và có khả năng mở rộng tốt.",
          cmoScore: 78,
          cmoCritique: "Chiến lược GTM sáng tạo, tận dụng tốt các kênh truyền thông mạng xã hội giá rẻ.",
          overallScore: 82,
          verdict: "Invested",
          verdictText: "Đồng ý rót vốn đầu tư 50,000 USD vòng thiên thần (Angel Round) cho 10% cổ phần để nhóm hoàn thiện sản phẩm MVP.",
          generalAdvice: "Hãy tập trung tối ưu hóa trải nghiệm người dùng cốt lõi và củng cố thêm pháp lý doanh nghiệp."
        }
      }

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

    let slidesData = null
    try {
      const model = getGeminiModel(req)
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        slidesData = JSON.parse(jsonMatch[0])
      }
    } catch (err) {
      console.error('Generate Slides Error:', err)
    }

    if (!slidesData) {
      slidesData = {
        slides: [
          {
            slideNum: 1,
            title: `Trang bìa - Dự án ${project.name}`,
            bullets: [
              `Ý tưởng khởi nghiệp sáng tạo: ${descText.substring(0, 80)}...`,
              `StudyConnect Incubator Program.`
            ],
            visualSuggestion: "Logo dự án nổi bật chính giữa slide, nền tối obsidian sang trọng."
          },
          {
            slideNum: 2,
            title: "Vấn đề của thị trường",
            bullets: [
              "Giải pháp hiện tại chưa đáp ứng được nhu cầu thực tế.",
              "Khách hàng mất nhiều thời gian và chi phí không cần thiết."
            ],
            visualSuggestion: "Biểu đồ tròn thể hiện nỗi đau khách hàng chiếm 80%."
          },
          {
            slideNum: 3,
            title: "Giải pháp đột phá",
            bullets: [
              `Giải pháp từ dự án ${project.name} giúp tự động hóa và tối ưu hóa quy trình.`,
              "Trải nghiệm người dùng thân thiện, hiện đại."
            ],
            visualSuggestion: "Ảnh chụp màn hình (Mockup) sản phẩm thực tế."
          },
          {
            slideNum: 4,
            title: "Quy mô thị trường (TAM/SAM/SOM)",
            bullets: [
              "Tổng dung lượng thị trường Việt Nam (TAM) ước tính rất lớn.",
              "Thị trường mục tiêu (SOM) tiếp cận ban đầu là sinh viên."
            ],
            visualSuggestion: "Đồ thị 3 hình tròn đồng tâm mô tả TAM, SAM, SOM."
          },
          {
            slideNum: 5,
            title: "Mô hình kinh doanh (Business Model)",
            bullets: [
              "Bán sản phẩm trực tiếp (B2C).",
              "Gói dịch vụ định kỳ Subscription hàng tháng cho doanh nghiệp."
            ],
            visualSuggestion: "Bảng so sánh các gói định giá sản phẩm."
          },
          {
            slideNum: 6,
            title: "Sản phẩm & Công nghệ cốt lõi",
            bullets: [
              "Tích hợp công nghệ hiện đại và thông minh.",
              "Bảo mật và hiệu suất vận hành cao."
            ],
            visualSuggestion: "Sơ đồ khối cấu trúc kỹ thuật của hệ thống."
          },
          {
            slideNum: 7,
            title: "Chiến lược Go-To-Market",
            bullets: [
              "Hợp tác với các đối tác chiến lược để tiếp cận tệp khách hàng nhanh nhất.",
              "Chiến dịch marketing phủ sóng trực tuyến."
            ],
            visualSuggestion: "Sơ đồ mốc thời gian (Timeline) chiến dịch GTM."
          },
          {
            slideNum: 8,
            title: "Phân tích đối thủ cạnh tranh",
            bullets: [
              "Lợi thế cạnh tranh vượt trội về giá cả và chất lượng dịch vụ.",
              "Unfair advantage: Đội ngũ am hiểu sâu sắc hành vi khách hàng."
            ],
            visualSuggestion: "Ma trận định vị cạnh tranh 4 phần tư."
          },
          {
            slideNum: 9,
            title: "Đội ngũ sáng lập (Team co-founders)",
            bullets: [
              "Đội ngũ sáng lập đầy nhiệt huyết, giàu chuyên môn.",
              "Đồng cam cộng khổ hướng tới mục tiêu chung."
            ],
            visualSuggestion: "Ảnh chân dung của các co-founder kèm vị trí đảm nhận."
          },
          {
            slideNum: 10,
            title: "Kêu gọi đầu tư & Phân bổ vốn",
            bullets: [
              "Kêu gọi nguồn vốn đầu tư ban đầu để phát triển MVP và tiếp thị.",
              "Phân bổ: 50% R&D phát triển sản phẩm, 30% Marketing, 20% Vận hành."
            ],
            visualSuggestion: "Biểu đồ hình quạt (Pie chart) tỷ lệ phân bổ vốn gọi."
          }
        ]
      }
    }

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

// POST /api/ai/save-key
export const saveGeminiKey = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { apiKey } = req.body
    if (!apiKey || apiKey.trim() === '') {
      res.status(400).json({ success: false, message: 'API key is required' })
      return
    }

    // Update in memory
    process.env.GEMINI_API_KEY = apiKey.trim()

    // Update in .env file
    const fs = require('fs')
    const path = require('path')
    const envPath = path.join(__dirname, '../../../.env')
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8')
      const reg = /^GEMINI_API_KEY=.*$/m
      if (reg.test(envContent)) {
        envContent = envContent.replace(reg, `GEMINI_API_KEY=${apiKey.trim()}`)
      } else {
        envContent += `\nGEMINI_API_KEY=${apiKey.trim()}\n`
      }
      fs.writeFileSync(envPath, envContent, 'utf8')
    }

    res.json({ success: true, message: 'Gemini API key updated successfully on Server!' })
  } catch (err) {
    console.error('Save API key error:', err)
    res.status(500).json({ success: false, message: 'Failed to update API key on Server' })
  }
}

// POST /api/ai/global-audit
export const globalAudit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId, userQuestion } = req.body
    if (!teamId) {
      res.status(400).json({ success: false, message: 'teamId is required' })
      return
    }

    // Fetch team, members, projects, tasks, weekly reports, financial model, and peer evaluations
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        leader: { select: { name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, skills: true, desiredRole: true } } } },
        projects: {
          include: {
            tasks: { include: { assignee: { select: { id: true, name: true, email: true } } } },
            financialModel: true,
          }
        },
        weeklyReports: true,
        peerEvaluations: {
          include: {
            evaluator: { select: { name: true } },
            evaluatee: { select: { id: true, name: true } }
          }
        }
      }
    })

    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' })
      return
    }

    // Calculate dynamic member work completion metrics & peer evaluation scores
    const memberStatsList = team.members.map(m => {
      const userId = m.user.id
      let totalTasks = 0
      let completedTasks = 0
      let todoTasks = 0
      let inProgressTasks = 0

      team.projects.forEach(p => {
        p.tasks.forEach(t => {
          if (t.assignedTo === userId) {
            totalTasks++
            if (t.status === 'completed') {
              completedTasks++
            } else if (t.status === 'in_progress') {
              inProgressTasks++
            } else {
              todoTasks++
            }
          }
        })
      })

      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      // Get peer evaluations received by this member
      const evals = team.peerEvaluations.filter(e => e.evaluateeId === userId)
      let avgContribution = 0
      let avgQuality = 0
      let avgPunctuality = 0
      if (evals.length > 0) {
        const sumContrib = evals.reduce((sum, e) => sum + e.contribution, 0)
        const sumQuality = evals.reduce((sum, e) => sum + e.qualityOfWork, 0)
        const sumPunctual = evals.reduce((sum, e) => sum + e.punctuality, 0)
        avgContribution = Number((sumContrib / evals.length).toFixed(1))
        avgQuality = Number((sumQuality / evals.length).toFixed(1))
        avgPunctuality = Number((sumPunctual / evals.length).toFixed(1))
      }

      return `- Thành viên: ${m.user.name} (${m.user.email})
  * Vai trò mong muốn: ${m.user.desiredRole || 'Chưa đặt'} | Kỹ năng: ${m.user.skills || 'Chưa điền'}
  * Thống kê Task: Đã giao: ${totalTasks} | Hoàn thành: ${completedTasks} | Đang làm: ${inProgressTasks} | Cần làm: ${todoTasks} | Tỷ lệ hoàn thành: ${completionRate}%
  * Đánh giá chéo từ đồng đội: ${evals.length > 0 ? `Đóng góp: ${avgContribution}/5, Chất lượng: ${avgQuality}/5, Đúng hạn: ${avgPunctuality}/5 (Dựa trên ${evals.length} lượt đánh giá)` : 'Chưa có đánh giá chéo'}`
    }).join('\n\n')

    // Parse and summarize project documents (Business Model Canvas, Slides outline, Tasks details)
    const projectsList = team.projects.map(p => {
      const tasksList = p.tasks.map(t => `  * Task: "${t.title}" | Trạng thái: ${t.status} | Người làm: ${t.assignee?.name || 'Chưa giao'} | Hạn chót: ${t.dueDate ? t.dueDate.toISOString() : 'Không'}`).join('\n')
      
      const fin = p.financialModel 
        ? `  * Kế hoạch tài chính: Chi phí cố định: ${p.financialModel.fixedCosts} VNĐ | Chi phí biến đổi: ${p.financialModel.variableCosts} VNĐ | Giá bán sản phẩm: ${p.financialModel.sellingPrice} VNĐ | Dự kiến doanh số: ${p.financialModel.projectedSales} sản phẩm | CAC (Chi phí tìm khách): ${p.financialModel.cac} VNĐ | LTV (Giá trị vòng đời khách): ${p.financialModel.ltv} VNĐ`
        : '  * Kế hoạch tài chính: Chưa thiết lập.'

      let canvasBrief = '  * Tài liệu Business Model Canvas: Chưa thiết lập.'
      if (p.canvasModel) {
        try {
          const parsedCanvas = JSON.parse(p.canvasModel)
          const items = Object.entries(parsedCanvas)
            .map(([key, val]) => `    + ${key}: ${val}`)
            .join('\n')
          canvasBrief = `  * Tài liệu Business Model Canvas:\n${items}`
        } catch (e) {
          canvasBrief = `  * Tài liệu Business Model Canvas (Raw): ${p.canvasModel}`
        }
      }

      let slideBrief = '  * Tài liệu Slide Outline (Dàn ý thuyết trình): Chưa thiết lập.'
      if (p.slideOutline) {
        try {
          const parsedSlides = JSON.parse(p.slideOutline)
          if (Array.isArray(parsedSlides)) {
            const items = parsedSlides.map((s: any, idx: number) => `    + Slide ${idx + 1}: ${s.title || s.header || 'Không tiêu đề'} - ${s.content || 'Không nội dung'}`).join('\n')
            slideBrief = `  * Tài liệu Slide Outline:\n${items}`
          } else {
            slideBrief = `  * Tài liệu Slide Outline: ${p.slideOutline}`
          }
        } catch (e) {
          slideBrief = `  * Tài liệu Slide Outline: ${p.slideOutline}`
        }
      }

      return `- Dự án: "${p.name}"\n  Mô tả: ${p.description || 'Chưa có mô tả'}\n${fin}\n${canvasBrief}\n${slideBrief}\n  Danh sách công việc chi tiết:\n${tasksList}`
    }).join('\n\n')

    const reportsList = team.weeklyReports.map(r => `- Tuần ${r.weekNumber}: Thành tựu: "${r.achievements}" | Kế hoạch tuần tới: "${r.plans}" | Khó khăn (Blockers): "${r.blockers}"`).join('\n')

    const context = `DỮ LIỆU DỰ ÁN & TIẾN ĐỘ THỰC TẾ CỦA NHÓM "${team.name}":
- Trưởng nhóm: ${team.leader?.name || 'N/A'}

- CHI TIẾT BÁO CÁO HOÀN THÀNH & ĐÁNH GIÁ THÀNH VIÊN:
${memberStatsList}

- THÔNG TIN DỰ ÁN, TÀI LIỆU (BMC, SLIDES) VÀ KẾ HOẠCH:
${projectsList}

- NHẬT KÝ BÁO CÁO TUẦN (ACHIEVEMENTS & BLOCKERS):
${reportsList}`

    let prompt = ''
    if (userQuestion) {
      prompt = `Bạn là AI Cố Vấn Toàn Năng của StudyConnect. Dưới đây là toàn bộ dữ liệu dự án, tài liệu (Business Model Canvas, Slide Outline), tiến độ hoàn thành công việc và điểm số đánh giá chéo thực tế của từng thành viên:
${context}

Dựa trên dữ liệu thực tế trên, hãy trả lời câu hỏi sau của người dùng bằng tiếng Việt một cách sâu sắc, thực tế, chỉ rõ các số liệu hoặc tên thành viên nếu cần thiết:
"${userQuestion}"`
    } else {
      prompt = `Bạn là AI Cố Vấn Toàn Năng của StudyConnect. Dưới đây là toàn bộ dữ liệu dự án, tài liệu (Business Model Canvas, Slide Outline), tiến độ hoàn thành công việc và điểm số đánh giá chéo thực tế của từng thành viên:
${context}

Hãy thực hiện chẩn đoán toàn diện (Global Project Audit) dự án bằng tiếng Việt. Bố cục trả lời gồm 4 phần rõ ràng (sử dụng Markdown):
1. **Phân tích đóng góp & tiến độ thành viên**: Chỉ rõ ai hoàn thành tốt (dựa trên tỷ lệ hoàn thành task, số lượng task, và điểm đánh giá chéo trung bình từ đồng đội), ai đang bị chậm trễ/quá hạn công việc, sự mất cân bằng công việc (nếu có).
2. **Đánh giá tính khả thi tài chính**: Phân tích giá bán, chi phí, điểm hòa vốn và tỷ lệ LTV/CAC xem có ổn không, đưa ra cảnh báo cụ thể.
3. **Kiểm tra tài liệu dự án (BMC & Slide Outline)**: Đánh giá xem nhóm đã thiết lập Business Model Canvas và dàn ý slide đầy đủ chưa, ý tưởng dự án có điểm nghẽn gì về tài liệu hay không.
4. **Đánh giá báo cáo tuần & giải pháp vượt qua khó khăn (Blockers)**: Phân tích các khó khăn hiện tại nhóm gặp phải trong báo cáo tuần và đề xuất cách giải quyết.
5. **Hành động chiến lược đề xuất**: Liệt kê 3 hành động cụ thể cần làm ngay để đảm bảo dự án kịp tiến độ và đạt kết quả cao.`
    }

    let responseText = 'AI chưa thể chẩn đoán toàn diện dự án lúc này.'
    try {
      const model = getGeminiModel(req)
      const result = await model.generateContent(prompt)
      responseText = result.response.text().trim()
      
      // Log usage
      await prisma.aIUsage.create({
        data: {
          userId: req.user!.id,
          feature: 'analytics',
          prompt: prompt.substring(0, 500),
          response: responseText.substring(0, 1000)
        }
      })
    } catch (err) {
      console.error('Gemini Global Audit Error:', err)
      responseText = `Lỗi kết nối Gemini AI. Chi tiết dữ liệu dự án:\n${context}\n\nVui lòng kiểm tra lại cấu hình API Key.`
    }

    res.json({ success: true, data: responseText })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Global audit failed' })
  }
}

// POST /api/ai/auto-grouping
export const autoGrouping = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classCode } = req.body
    if (!classCode) {
      res.status(400).json({ success: false, message: 'classCode is required' })
      return
    }

    // Fetch students in the class
    const students = await prisma.user.findMany({
      where: {
        classCode: classCode,
        role: 'member',
      },
      include: {
        teamMemberships: true
      }
    })

    // Filter unassigned students (not in team_members)
    const unassignedStudents = students.filter(s => s.teamMemberships.length === 0)

    if (unassignedStudents.length === 0) {
      res.status(400).json({ success: false, message: 'Không tìm thấy học viên chưa xếp nhóm trong lớp này.' })
      return
    }

    // Prepare prompt
    const studentsDataText = unassignedStudents.map(s => 
      `- ID: "${s.id}" | Tên: "${s.name}" | Email: "${s.email}" | Kỹ năng: "${s.skills || 'Chưa có'}" | Vai trò mong muốn: "${s.desiredRole || 'Chưa có'}"`
    ).join('\n')

    const prompt = `Bạn là Trợ lý AI Quản lý Lớp học của StudyConnect. Dưới đây là danh sách sinh viên chưa được xếp vào bất kỳ nhóm dự án nào:
${studentsDataText}

Hãy chia toàn bộ số sinh viên trên thành các nhóm khởi nghiệp (mỗi nhóm từ 3 đến 5 người, nếu số lượng lẻ có thể linh hoạt).
Đảm bảo mỗi nhóm có sự cân bằng về kỹ năng (phân bổ đủ Frontend, Backend, BA/Marketing). Chỉ định 1 Trưởng nhóm (Leader) cho mỗi nhóm.
Đặt cho mỗi nhóm một tên ý tưởng dự án khởi nghiệp bằng tiếng Việt thật sáng tạo.

Yêu cầu trả về kết quả ở định dạng JSON thô (không có thẻ markdown \`\`\`json ở đầu và cuối), là một mảng các đối tượng nhóm, mỗi nhóm có cấu trúc chính xác như sau:
[
  {
    "teamName": "Tên Nhóm Khởi Nghiệp",
    "description": "Mô tả ngắn gọn ý tưởng dự án",
    "leaderId": "ID_CỦA_TRƯỞNG_NHÓM",
    "memberIds": ["ID_THÀNH_VIÊN_1", "ID_THÀNH_VIÊN_2", ...]
  }
]
Chú ý: "leaderId" phải nằm trong danh sách "memberIds" của chính nhóm đó.`

    let suggestedTeams = []
    try {
      const model = getGeminiModel(req)
      const result = await model.generateContent(prompt)
      let text = result.response.text().trim()
      
      // Strip markdown code block wrappers if any
      if (text.startsWith('```json')) {
        text = text.replace(/^```json/, '').replace(/```$/, '').trim()
      } else if (text.startsWith('```')) {
        text = text.replace(/^```/, '').replace(/```$/, '').trim()
      }

      suggestedTeams = JSON.parse(text)
    } catch (err) {
      console.error('Gemini auto grouping parse error:', err)
      // Fallback heuristics: group them manually if Gemini fails
      const chunk = 3 // 3 students per team
      const groupsCount = Math.ceil(unassignedStudents.length / chunk)
      suggestedTeams = []
      for (let i = 0; i < groupsCount; i++) {
        const slice = unassignedStudents.slice(i * chunk, (i + 1) * chunk)
        if (slice.length > 0) {
          suggestedTeams.push({
            teamName: `AI Startup Group ${i + 1}`,
            description: 'Dự án khởi nghiệp công nghệ đột phá tự động xếp nhóm.',
            leaderId: slice[0].id,
            memberIds: slice.map(s => s.id)
          })
        }
      }
    }

    // Perform DB operations to create teams
    const createdTeams = []
    for (const group of suggestedTeams) {
      if (!group.leaderId || !group.memberIds || group.memberIds.length === 0) continue
      
      const isValidLeader = unassignedStudents.some(s => s.id === group.leaderId)
      if (!isValidLeader) {
        group.leaderId = group.memberIds[0]
      }

      // Create Team
      const newTeam = await prisma.team.create({
        data: {
          name: group.teamName,
          description: group.description || 'Dự án khởi nghiệp StudyConnect',
          leaderId: group.leaderId,
          classCode: classCode,
        }
      })

      // Create TeamMembers
      const memberInserts = group.memberIds.map((uid: string) => ({
        teamId: newTeam.id,
        userId: uid
      }))

      await prisma.teamMember.createMany({
        data: memberInserts,
        skipDuplicates: true
      })

      // Create a default project for this team
      await prisma.project.create({
        data: {
          teamId: newTeam.id,
          name: group.teamName + ' Project',
          description: group.description || 'Dự án khởi nghiệp của nhóm',
        }
      })

      const fullTeam = await prisma.team.findUnique({
        where: { id: newTeam.id },
        include: {
          leader: { select: { name: true, email: true } },
          members: { include: { user: { select: { name: true, email: true, skills: true, desiredRole: true } } } }
        }
      })
      if (fullTeam) {
        createdTeams.push(fullTeam)
      }
    }

    res.json({
      success: true,
      message: `Tự động phân chia thành công ${createdTeams.length} nhóm học phần bằng AI!`,
      data: createdTeams
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Auto grouping failed' })
  }
}


