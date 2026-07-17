import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'
import { generateViaN8nOrGemini, AiAttachmentPayload, emitN8nEvent } from '../services/n8n.service'

type ChatMode = 'student' | 'teacher' | 'copilot'

interface AttachmentInput {
  name: string
  mimeType: string
  data?: string
  textExcerpt?: string
}

const STUDENT_SYSTEM = `Bạn là Trợ lý AI Startup Mentor của StudyConnect (môn EXE101/EXE201).
Vai trò: cố vấn khởi nghiệp tận tâm cho SINH VIÊN Việt Nam.
Nhiệm vụ:
- Giúp tạo ý tưởng startup, Business Model Canvas, GTM, MVP, tài chính (CAC/LTV/Runway), pitching.
- Trả lời có cấu trúc, tiếng Việt, hành động cụ thể (checklist, bước tiếp theo).
- Khi người dùng đính kèm file/báo cáo/ảnh: phân tích nội dung và đưa nhận xét rõ ràng.
- Không bịa số liệu; nếu thiếu dữ liệu thì hỏi thêm hoặc nêu giả định.`

const TEACHER_SYSTEM = `Bạn là Trợ lý AI dành cho GIẢNG VIÊN trên StudyConnect (EXE101/EXE201).
Nhiệm vụ:
- Hỗ trợ giám sát nhóm, chẩn đoán free-rider, gợi ý nhận xét/chấm điểm công bằng.
- Phân tích báo cáo tuần, tiến độ Kanban, peer evaluation.
- Khi có file/báo cáo/ảnh đính kèm: tóm tắt, chỉ ra rủi ro và đề xuất phản hồi gửi sinh viên.
- Trả lời tiếng Việt, chuyên nghiệp, có cấu trúc (điểm mạnh / điểm yếu / hành động).`

const COPILOT_SYSTEM = `Bạn là StudyConnect AI Copilot — trợ lý nhanh đi kèm toàn hệ thống.
Hỗ trợ điều hướng tính năng, giải thích công cụ (Canvas, Financial Hub, Pitch Lab, Workspace),
và tư vấn khởi nghiệp ngắn gọn bằng tiếng Việt. Khi có ngữ cảnh dự án, ưu tiên trả lời dựa trên dữ liệu đó.`

function systemForMode(mode: ChatMode): string {
  if (mode === 'teacher') return TEACHER_SYSTEM
  if (mode === 'copilot') return COPILOT_SYSTEM
  return STUDENT_SYSTEM
}

function sanitizeAttachments(raw?: AttachmentInput[]): {
  forAi: AiAttachmentPayload[]
  forDb: Array<{ name: string; mimeType: string; size: number; textExcerpt?: string }>
} {
  const forAi: AiAttachmentPayload[] = []
  const forDb: Array<{ name: string; mimeType: string; size: number; textExcerpt?: string }> = []
  if (!Array.isArray(raw)) return { forAi, forDb }

  for (const a of raw.slice(0, 5)) {
    if (!a?.name || !a?.mimeType) continue
    const data = typeof a.data === 'string' ? a.data.replace(/^data:[^;]+;base64,/, '') : undefined
    const size = data ? Math.ceil((data.length * 3) / 4) : (a.textExcerpt?.length || 0)
    // Cap ~4MB per file for Gemini safety
    if (data && size > 4 * 1024 * 1024) continue

    const excerpt =
      a.textExcerpt?.slice(0, 12_000) ||
      (a.mimeType.startsWith('text/') || a.mimeType.includes('json') || a.mimeType.includes('csv')
        ? undefined
        : undefined)

    forAi.push({
      name: a.name,
      mimeType: a.mimeType,
      data: a.mimeType.startsWith('image/') ? data : undefined,
      textExcerpt: a.textExcerpt?.slice(0, 12_000) || excerpt,
    })
    forDb.push({
      name: a.name,
      mimeType: a.mimeType,
      size,
      textExcerpt: a.textExcerpt?.slice(0, 500),
    })
  }
  return { forAi, forDb }
}

async function buildProjectContext(userId: string, projectId?: string | null): Promise<string> {
  try {
    let project: any = null

    if (projectId) {
      project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          team: {
            include: {
              members: { include: { user: { select: { name: true, skills: true } } } },
              weeklyReports: { take: 3, orderBy: { createdAt: 'desc' } },
            },
          },
          tasks: { take: 30, orderBy: { updatedAt: 'desc' } },
          financialModel: true,
        },
      })
    } else {
      const membership = await prisma.teamMember.findFirst({
        where: { userId },
        include: {
          team: {
            include: {
              projects: {
                take: 1,
                include: {
                  tasks: { take: 20, orderBy: { updatedAt: 'desc' } },
                  financialModel: true,
                },
              },
              members: { include: { user: { select: { name: true } } } },
              weeklyReports: { take: 2, orderBy: { createdAt: 'desc' } },
            },
          },
        },
      })
      const p = membership?.team?.projects?.[0]
      project = p ? { ...p, team: membership!.team } : null
    }

    if (!project) return 'Người dùng chưa gắn dự án/nhóm cụ thể.'

    const taskStats = {
      todo: project.tasks?.filter((t: any) => t.status === 'todo').length || 0,
      in_progress: project.tasks?.filter((t: any) => t.status === 'in_progress').length || 0,
      completed: project.tasks?.filter((t: any) => t.status === 'completed').length || 0,
    }
    const reports = project.team?.weeklyReports || []

    return [
      `Dự án: ${project.name}`,
      `Mô tả: ${project.description || 'N/A'}`,
      `Nhóm: ${project.team?.name || 'N/A'}`,
      `Canvas: ${project.canvasModel ? String(project.canvasModel).slice(0, 1500) : 'Chưa có'}`,
      `Slide outline: ${project.slideOutline ? String(project.slideOutline).slice(0, 800) : 'Chưa có'}`,
      `Task: todo=${taskStats.todo}, doing=${taskStats.in_progress}, done=${taskStats.completed}`,
      project.financialModel
        ? `Tài chính: fixed=${project.financialModel.fixedCosts}, var=${project.financialModel.variableCosts}, price=${project.financialModel.sellingPrice}, CAC=${project.financialModel.cac}, LTV=${project.financialModel.ltv}`
        : 'Tài chính: chưa có',
      reports.length
        ? `Báo cáo tuần gần nhất: achievements=${reports[0].achievements?.slice(0, 200)}; blockers=${reports[0].blockers?.slice(0, 200)}`
        : 'Chưa có báo cáo tuần',
    ].join('\n')
  } catch (err) {
    console.error('buildProjectContext error:', err)
    return 'Không tải được ngữ cảnh dự án.'
  }
}

// GET /api/ai-support/conversations?mode=student
export const listConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mode = (req.query.mode as string) || undefined
    const where: any = { userId: req.user!.id }
    if (mode) where.mode = mode

    const conversations = await prisma.aIConversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, role: true, createdAt: true },
        },
      },
    })

    res.json({
      success: true,
      data: conversations.map((c) => ({
        id: c.id,
        title: c.title,
        mode: c.mode,
        projectId: c.projectId,
        updatedAt: c.updatedAt,
        createdAt: c.createdAt,
        lastMessage: c.messages[0] || null,
      })),
    })
  } catch (err) {
    console.error('listConversations error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/ai-support/conversations
export const createConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { mode = 'student', title, projectId } = req.body as {
      mode?: ChatMode
      title?: string
      projectId?: string
    }
    const allowed: ChatMode[] = ['student', 'teacher', 'copilot']
    const safeMode = allowed.includes(mode) ? mode : 'student'

    const conversation = await prisma.aIConversation.create({
      data: {
        userId: req.user!.id,
        mode: safeMode,
        title: title?.trim() || (safeMode === 'teacher' ? 'Cố vấn giảng viên' : 'Cuộc trò chuyện mới'),
        projectId: projectId || null,
      },
    })

    res.json({ success: true, data: conversation })
  } catch (err) {
    console.error('createConversation error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/ai-support/conversations/:id
export const getConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const conversation = await prisma.aIConversation.findFirst({
      where: { id, userId: req.user!.id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })
    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversation not found' })
      return
    }
    res.json({ success: true, data: conversation })
  } catch (err) {
    console.error('getConversation error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// DELETE /api/ai-support/conversations/:id
export const deleteConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const existing = await prisma.aIConversation.findFirst({
      where: { id, userId: req.user!.id },
    })
    if (!existing) {
      res.status(404).json({ success: false, message: 'Conversation not found' })
      return
    }
    await prisma.aIConversation.delete({ where: { id } })
    res.json({ success: true, message: 'Deleted' })
  } catch (err) {
    console.error('deleteConversation error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/ai-support/chat
// Body: { conversationId?, mode?, message, projectId?, attachments?, pageContext? }
export const sendSupportChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      conversationId,
      mode = 'student',
      message,
      projectId,
      attachments,
      pageContext,
    } = req.body as {
      conversationId?: string
      mode?: ChatMode
      message: string
      projectId?: string
      attachments?: AttachmentInput[]
      pageContext?: string
    }

    if (!message?.trim() && (!attachments || attachments.length === 0)) {
      res.status(400).json({ success: false, message: 'Message or attachment is required' })
      return
    }

    const allowed: ChatMode[] = ['student', 'teacher', 'copilot']
    const safeMode = allowed.includes(mode) ? mode : 'student'
    const { forAi, forDb } = sanitizeAttachments(attachments)

    let conversation = conversationId
      ? await prisma.aIConversation.findFirst({
          where: { id: conversationId, userId: req.user!.id },
        })
      : null

    if (!conversation) {
      const autoTitle = (message || 'File đính kèm').trim().slice(0, 60) || 'Cuộc trò chuyện mới'
      conversation = await prisma.aIConversation.create({
        data: {
          userId: req.user!.id,
          mode: safeMode,
          title: autoTitle,
          projectId: projectId || null,
        },
      })
    }

    const userContent = message?.trim() || '(Đã gửi tệp đính kèm để phân tích)'
    const userMsg = await prisma.aIChatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: userContent,
        attachments: forDb.length ? JSON.stringify(forDb) : null,
      },
    })

    const historyRows = await prisma.aIChatMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    const history = historyRows
      .reverse()
      .slice(0, -1)
      .map((m) => ({
        role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
        content: m.content,
      }))

    const projectCtx = await buildProjectContext(req.user!.id, projectId || conversation.projectId)
    const roleLabel =
      req.user!.role === 'manager'
        ? 'Giảng viên'
        : req.user!.role === 'admin'
          ? 'Admin'
          : req.user!.role === 'leader'
            ? 'Quản lý khoa'
            : 'Sinh viên'

    const systemPrompt = `${systemForMode(safeMode)}

Người dùng hiện tại: ${req.user!.name || 'User'} (${roleLabel}).
Ngữ cảnh dự án/nhóm:
${projectCtx}
${pageContext ? `Trang đang mở: ${pageContext}` : ''}`

    let aiReply =
      'Xin lỗi, tôi đang gặp sự cố kết nối AI. Vui lòng kiểm tra cấu hình Gemini/n8n và thử lại.'
    let source: 'n8n' | 'gemini_direct' = 'gemini_direct'

    try {
      const result = await generateViaN8nOrGemini(
        {
          feature: 'support_chat',
          systemPrompt,
          prompt: userContent,
          history,
          attachments: forAi,
          context: { mode: safeMode, projectId: projectId || conversation.projectId, pageContext },
          user: { id: req.user!.id, role: req.user!.role, name: req.user!.name },
        },
        req
      )
      aiReply = result.text
      source = result.source
    } catch (aiErr) {
      console.error('AI support chat error:', aiErr)
    }

    const modelMsg = await prisma.aIChatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'model',
        content: aiReply,
      },
    })

    // Auto-title from first user message if still default
    if (conversation.title === 'Cuộc trò chuyện mới' || conversation.title === 'Cố vấn giảng viên') {
      await prisma.aIConversation.update({
        where: { id: conversation.id },
        data: { title: userContent.slice(0, 60), updatedAt: new Date() },
      })
    } else {
      await prisma.aIConversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      })
    }

    await prisma.aIUsage.create({
      data: {
        userId: req.user!.id,
        feature: 'analytics',
        prompt: userContent.slice(0, 2000),
        response: aiReply.slice(0, 4000),
      },
    })

    void emitN8nEvent('ai_support_chat', {
      userId: req.user!.id,
      mode: safeMode,
      conversationId: conversation.id,
      source,
    })

    res.json({
      success: true,
      data: {
        conversationId: conversation.id,
        userMsg,
        modelMsg,
        aiReply,
        source,
      },
    })
  } catch (err) {
    console.error('sendSupportChat error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
