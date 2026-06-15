import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'
import { createNotification } from './notification.controller'

// GET /api/projects?teamId=xxx
export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId } = req.query
    const where: any = {}
    if (teamId) where.teamId = String(teamId)

    const projects = await prisma.project.findMany({
      where,
      include: {
        team: { select: { id: true, name: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: projects })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/projects/:id
export const getProjectById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        team: { select: { id: true, name: true } },
        tasks: { include: { assignee: { select: { id: true, name: true, avatar: true } } } },
      },
    })
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' })
      return
    }
    res.json({ success: true, data: project })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/projects
export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId, name, description, dueDate } = req.body
    if (!teamId || !name) {
      res.status(400).json({ success: false, message: 'teamId and name are required' })
      return
    }
    const project = await prisma.project.create({
      data: { teamId, name, description: description || '', dueDate: dueDate ? new Date(dueDate) : undefined },
    })
    res.status(201).json({ success: true, data: project })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// PATCH /api/projects/:id
export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const { name, description, status, progress, milestone, dueDate, logoUrl, pitchVideoUrl, canvasModel, isPublic } = req.body
    const updated = await prisma.project.update({
      where: { id },
      data: { 
        name, 
        description, 
        status, 
        progress, 
        milestone, 
        dueDate: dueDate ? new Date(dueDate) : undefined,
        logoUrl,
        pitchVideoUrl,
        canvasModel,
        isPublic
      },
    })
    res.json({ success: true, data: updated })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// DELETE /api/projects/:id
export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    await prisma.project.delete({ where: { id } })
    res.json({ success: true, message: 'Project deleted' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/projects/:id/generate-canvas
export const generateCanvasAI = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const project = await prisma.project.findUnique({ where: { id } })
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' })
      return
    }

    const { getGeminiModel } = require('../utils/gemini')
    const model = getGeminiModel(req)

    const prompt = `Bạn là trợ lý AI chuyên gia phân tích mô hình kinh doanh Canvas (Business Model Canvas - BMC).
Hãy phác thảo mô hình Canvas 9 ô cho dự án khởi nghiệp sinh viên sau:
- Tên dự án: ${project.name}
- Mô tả dự án: ${project.description}

Hãy điền chi tiết và trả về chính xác định dạng JSON (chỉ JSON, không giải thích thêm, không markdown \`\`\`json):
{
  "customerSegments": "Phân khúc khách hàng mục tiêu",
  "valuePropositions": "Giá trị cốt lõi / Giải pháp độc đáo mang lại cho khách hàng",
  "channels": "Các kênh tiếp cận khách hàng và truyền thông",
  "customerRelationships": "Cách xây dựng và duy trì mối quan hệ với khách hàng",
  "revenueStreams": "Các nguồn doanh thu dự kiến",
  "keyResources": "Các nguồn lực chủ chốt cần thiết để vận hành",
  "keyActivities": "Các hoạt động chủ chốt cần làm",
  "keyPartners": "Các đối tác và nhà cung cấp chủ chốt",
  "costStructure": "Các khoản chi phí chính khi vận hành"
}`

    let canvasJson = ''
    try {
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        canvasJson = jsonMatch[0]
      }
    } catch (aiErr) {
      console.error(aiErr)
    }

    if (!canvasJson) {
      const fallbackObj = {
        customerSegments: "Sinh viên các trường đại học tại Việt Nam, đặc biệt là nhóm sinh viên thực hiện dự án khởi nghiệp môn học; Giảng viên hướng dẫn khởi nghiệp cần công cụ quản lý dự án.",
        valuePropositions: `Nền tảng quản lý dự án học đường StudyConnect giúp tối ưu hóa làm việc nhóm, kết nối mentor 1-on-1, chấm điểm theo rubrics và gọi vốn giả lập StudyCoins giúp tăng 50% hiệu suất làm việc nhóm.`,
        channels: "Kênh truyền thông mạng xã hội (Facebook, TikTok, LinkedIn), Đại sứ sinh viên tại các trường Đại học, Tích hợp trực tiếp vào hệ thống LMS của nhà trường.",
        customerRelationships: "Hỗ trợ trực tuyến 24/7 qua chatbox, Cộng đồng chia sẻ kiến thức khởi nghiệp, Hệ thống tự phục vụ (Self-service) với tài liệu hướng dẫn chi tiết.",
        revenueStreams: "Phí đăng ký tài khoản gói Premium của nhà trường (SaaS B2B), Bán thêm các tiện ích (add-ons) như xuất slide chuyên nghiệp, mở khóa thêm tính năng AI Mentor cho sinh viên (B2C).",
        keyResources: "Đội ngũ phát triển phần mềm, Bản quyền thuật toán AI phân tích năng lực đồng đội, Cơ sở dữ liệu tài liệu luật và startup Việt Nam.",
        keyActivities: "Phát triển và bảo trì nền tảng web/app, Huấn luyện mô hình AI cố vấn RAG, Tiếp thị và kết nối các trường Đại học đối tác.",
        keyPartners: "Các khoa/trường Đại học đào tạo môn Khởi nghiệp, Các vườn ươm khởi nghiệp sinh viên (Incubators), Google Cloud & Open AI cung cấp hạ tầng AI API.",
        costStructure: "Chi phí vận hành máy chủ server, Chi phí gọi API Gemini/OpenAI, Lương đội ngũ nhân viên phát triển và chi phí quảng bá truyền thông."
      }
      if (project.name) {
        fallbackObj.customerSegments = `Nhóm đối tượng khách hàng mục tiêu gặp vấn đề trực tiếp được giải quyết bởi sản phẩm/dịch vụ của dự án "${project.name}".`
        fallbackObj.valuePropositions = `Giải pháp độc đáo từ dự án "${project.name}" giúp giải quyết triệt để vấn đề hiện tại của thị trường bằng sản phẩm/dịch vụ chất lượng cao, tối ưu chi phí và tăng trải nghiệm người dùng.`
        fallbackObj.keyResources = `Thương hiệu và bản quyền công thức/sản phẩm của "${project.name}", Đội ngũ sáng lập nhiệt huyết có chuyên môn, Kênh phân phối và hạ tầng công nghệ.`
      }
      canvasJson = JSON.stringify(fallbackObj)
    }

    // Save generated canvas to project
    const updated = await prisma.project.update({
      where: { id },
      data: { canvasModel: canvasJson }
    })

    // Log AI Usage
    await prisma.aIUsage.create({
      data: {
        userId: req.user!.id,
        feature: 'idea_generator',
        prompt,
        response: canvasJson
      }
    })

    res.json({ success: true, data: JSON.parse(canvasJson) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/projects/showcase/public
export const getPublicProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projects = await prisma.project.findMany({
      where: { isPublic: true },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            leader: { select: { id: true, name: true, avatar: true } }
          }
        },
        votes: {
          select: { userId: true }
        },
        investments: {
          select: { amount: true }
        },
        _count: {
          select: { votes: true, comments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ success: true, data: projects })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/projects/:id/vote
export const voteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const userId = req.user!.id

    const project = await prisma.project.findUnique({ where: { id } })
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' })
      return
    }

    // Check if user already voted
    const existingVote = await prisma.projectVote.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId
        }
      }
    })

    if (existingVote) {
      // Toggle off (unvote)
      await prisma.projectVote.delete({
        where: { id: existingVote.id }
      })
      res.json({ success: true, message: 'Vote removed', voted: false })
    } else {
      // Toggle on (vote)
      await prisma.projectVote.create({
        data: {
          projectId: id,
          userId
        }
      })
      res.json({ success: true, message: 'Voted successfully', voted: true })
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/projects/:id/comments
export const getProjectComments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }

    const comments = await prisma.projectComment.findMany({
      where: { projectId: id },
      include: {
        user: { select: { name: true, avatar: true, role: true } }
      },
      orderBy: { createdAt: 'asc' }
    })

    res.json({ success: true, data: comments })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/projects/:id/comments
export const addProjectComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const { content } = req.body
    const userId = req.user!.id

    if (!content || content.trim() === '') {
      res.status(400).json({ success: false, message: 'Comment content is required' })
      return
    }

    const comment = await prisma.projectComment.create({
      data: {
        projectId: id,
        userId,
        content: content.trim()
      },
      include: {
        user: { select: { name: true, avatar: true, role: true } }
      }
    })

    // Optional: Notify project/team leader
    const proj = await prisma.project.findUnique({
      where: { id },
      include: { team: true }
    })
    if (proj && proj.team.leaderId !== userId) {
      await createNotification(
        proj.team.leaderId,
        'Bình luận mới trên dự án của bạn 💬',
        `Người dùng ${req.user!.name} đã bình luận: "${content.substring(0, 30)}..."`,
        `/project-showcase`
      )
    }

    res.status(201).json({ success: true, data: comment })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
