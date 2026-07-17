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
  const model = getGeminiModel(req)

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

  const result = await model.generateContent({ contents: [{ role: 'user', parts }] })
  return result.response.text().trim()
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
