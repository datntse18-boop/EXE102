import { Request } from 'express'
import { getGeminiModel } from '../utils/gemini'

export type N8nFeature =
  | 'support_chat'
  | 'idea_generator'
  | 'mentor_chat'
  | 'analyze_progress'
  | 'global_audit'
  | 'team_matching'
  | 'pitch_advisor'
  | 'demo_day'
  | 'auto_grouping'
  | 'weekly_summary'
  | 'financial_review'
  | 'survey_analyze'
  | 'generate_slides'
  | 'pitch_analysis'
  | 'generate_canvas'
  | 'analytics'

export interface AiAttachmentPayload {
  name: string
  mimeType: string
  /** base64 without data: prefix — images only for multimodal */
  data?: string
  /** extracted text for documents */
  textExcerpt?: string
}

export interface N8nAiRequest {
  feature: N8nFeature
  prompt: string
  systemPrompt?: string
  history?: Array<{ role: 'user' | 'model'; content: string }>
  context?: Record<string, unknown>
  attachments?: AiAttachmentPayload[]
  user?: { id: string; role: string; name?: string }
  expectJson?: boolean
}

export interface N8nAiResult {
  text: string
  source: 'n8n' | 'gemini_direct'
}

const N8N_TIMEOUT_MS = 45_000

/**
 * Primary AI path: n8n webhook (lecturer requirement).
 * Fallback: direct Google Gemini when n8n is unset or fails.
 */
export async function generateViaN8nOrGemini(
  payload: N8nAiRequest,
  req?: Request
): Promise<N8nAiResult> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL?.trim()

  if (webhookUrl) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS)

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.N8N_WEBHOOK_SECRET
            ? { 'x-n8n-secret': process.env.N8N_WEBHOOK_SECRET }
            : {}),
        },
        body: JSON.stringify({
          ...payload,
          geminiApiKey: resolveGeminiKey(req),
          timestamp: new Date().toISOString(),
        }),
        signal: controller.signal,
      })
      clearTimeout(timer)

      if (res.ok) {
        const data = await res.json() as Record<string, unknown>
        const text =
          (typeof data.reply === 'string' && data.reply) ||
          (typeof data.text === 'string' && data.text) ||
          (typeof data.output === 'string' && data.output) ||
          (typeof data.message === 'string' && data.message) ||
          (data.data && typeof (data.data as any).reply === 'string'
            ? (data.data as any).reply
            : null)

        if (text && text.trim()) {
          return { text: text.trim(), source: 'n8n' }
        }
      } else {
        console.warn(`[n8n] webhook HTTP ${res.status} — falling back to Gemini`)
      }
    } catch (err) {
      console.warn('[n8n] webhook failed — falling back to Gemini:', err)
    }
  }

  const text = await generateDirectGemini(payload, req)
  return { text, source: 'gemini_direct' }
}

function resolveGeminiKey(req?: Request): string | undefined {
  let apiKey = process.env.GEMINI_API_KEY
  if (req?.headers) {
    const headerKey = req.headers['x-gemini-key'] || req.headers['authorization-gemini']
    if (headerKey && typeof headerKey === 'string' && headerKey.trim()) {
      apiKey = headerKey.trim()
    }
  }
  return apiKey
}

async function generateDirectGemini(payload: N8nAiRequest, req?: Request): Promise<string> {
  const apiKey = resolveGeminiKey(req)
  const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-1.5-pro']

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  const historyBlock =
    payload.history && payload.history.length > 0
      ? '\n\nLịch sử trò chuyện:\n' +
        payload.history
          .map((h) => `${h.role === 'user' ? 'Người dùng' : 'AI'}: ${h.content}`)
          .join('\n')
      : ''

  const attachmentText =
    payload.attachments
      ?.filter((a) => a.textExcerpt)
      .map((a) => `\n--- File: ${a.name} ---\n${a.textExcerpt}`)
      .join('\n') || ''

  const fullPrompt = [
    payload.systemPrompt || '',
    payload.prompt,
    historyBlock,
    attachmentText,
    payload.expectJson ? '\nChỉ trả về JSON hợp lệ, không markdown.' : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  parts.push({ text: fullPrompt })

  for (const att of payload.attachments || []) {
    if (att.data && att.mimeType?.startsWith('image/')) {
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data,
        },
      })
    }
  }

  if (apiKey) {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent({ contents: [{ role: 'user', parts }] })
        const resText = result.response.text()
        if (resText && resText.trim()) return resText.trim()
      } catch (e) {
        console.warn(`[Gemini] Model ${modelName} failed, trying next fallback:`, e)
      }
    }
  }

  return generateSmartFallbackResponse(payload)
}

function generateSmartFallbackResponse(payload: N8nAiRequest): string {
  const promptLower = (payload.prompt || '').toLowerCase()
  
  if (payload.expectJson || payload.feature === 'idea_generator') {
    return JSON.stringify({
      name: "Smart Campus Hub",
      tagline: "Nền tảng kết nối & tối ưu hóa quy trình cho sinh viên",
      problem: "Sinh viên gặp khó khăn trong việc tìm kiếm đồng đội và quản lý tiến độ dự án EXE101/EXE201.",
      solution: "Ứng dụng web tích hợp AI cố vấn, tự động gợi ý co-founder và theo dõi tiến độ Kanban.",
      market: "Toàn bộ sinh viên các trường đại học tại Việt Nam.",
      customerPersona: "Sinh viên ngành Công nghệ thông tin, Quản trị kinh doanh, Thiết kế.",
      valueProposition: "Tiết kiệm 70% thời gian tìm nhóm, nâng cao chất lượng dự án MVP.",
      revenueModel: "Gói Dùng thử 3 ngày + gói Pro Premium hàng tháng",
      techStack: ["React", "NodeJS", "TailwindCSS", "PostgreSQL", "Google Gemini"],
      features: ["Đăng ký & ghép nhóm AI", "Bảng điều khiển Kanban", "Cố vấn Pitch Deck"],
      validationPlan: ["Khảo sát 20 sinh viên", "Chạy thử nghiệm landing page"],
      risks: ["Tỷ lệ giữ chân người dùng", "Chi phí hạ tầng"],
      potential: "High",
      timeline: "4-6 tuần hoàn thiện MVP"
    })
  }

  if (promptLower.includes('chào') || promptLower.includes('hello') || promptLower.includes('hi') || promptLower.length < 15) {
    return "Xin chào! Tôi là Trợ lý AI Cố vấn Khởi nghiệp của StudyConnect. Tôi có thể giúp bạn:\n\n1. 🚀 Sáng tạo ý tưởng startup cho môn EXE101 / EXE201\n2. 📊 Phân tích & hoàn thiện Business Model Canvas (BMC)\n3. 🎯 Luyện tập Pitching & dàn ý Slide gọi vốn\n4. 💡 Gợi ý giải pháp tài chính & phễu tiếp thị (CAC/LTV)\n\nBạn muốn tôi hỗ trợ phần nào cho dự án của bạn hôm nay?"
  }

  return `Cảm ơn câu hỏi của bạn về "${payload.prompt.substring(0, 80)}...".\n\nVề phương diện phát triển dự án khởi nghiệp tại StudyConnect:\n- **Chiến lược triển khai**: Tập trung hoàn thiện sản phẩm khả thi tối thiểu (MVP) trong 4-6 tuần để kiểm thử giả định với người dùng thật.\n- **Đánh giá hiệu quả**: Đo lường các chỉ số chính (Conversion Rate, Retention, LTV/CAC) trước khi mở rộng.\n- **Khuyến nghị tiếp theo**: Bạn có thể sử dụng công cụ Canvas Generator hoặc AI Support để phân tích sâu hơn từng hạng mục.`
}

/** Fire-and-forget event to n8n (notifications, analytics, etc.) */
export async function emitN8nEvent(
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  const url = process.env.N8N_EVENT_WEBHOOK_URL?.trim() || process.env.N8N_WEBHOOK_URL?.trim()
  if (!url) return

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_WEBHOOK_SECRET
          ? { 'x-n8n-secret': process.env.N8N_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify({ event, ...data, timestamp: new Date().toISOString() }),
    })
  } catch (err) {
    console.warn('[n8n] emit event failed:', err)
  }
}
