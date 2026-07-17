import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Bot,
  Send,
  X,
  Sparkles,
  Loader2,
  Paperclip,
  Plus,
  Image as ImageIcon,
  FileText,
  ExternalLink,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { aiSupportService, AiSupportAttachment } from '../../services/apiServices'

interface ChatMessage {
  id?: string
  role: 'user' | 'assistant'
  content: string
  attachments?: Array<{ name: string; mimeType: string }>
}

function fileToAttachment(file: File): Promise<AiSupportAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Không đọc được file'))
    reader.onload = () => {
      const result = String(reader.result || '')
      const base64 = result.includes(',') ? result.split(',')[1] : result
      const isText =
        file.type.startsWith('text/') ||
        file.type.includes('json') ||
        file.type.includes('csv') ||
        /\.(txt|md|csv|json|log)$/i.test(file.name)

      if (isText) {
        const textReader = new FileReader()
        textReader.onload = () => {
          resolve({
            name: file.name,
            mimeType: file.type || 'text/plain',
            textExcerpt: String(textReader.result || '').slice(0, 12000),
          })
        }
        textReader.onerror = () =>
          resolve({ name: file.name, mimeType: file.type || 'application/octet-stream', data: base64 })
        textReader.readAsText(file)
        return
      }

      resolve({
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        data: base64,
      })
    }
    reader.readAsDataURL(file)
  })
}

export default function FloatingAiCopilot() {
  const { user, role } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const mode = role === 'manager' ? 'teacher' : 'copilot'
  const hubPath = role === 'manager' ? '/ai-support?mode=teacher' : '/ai-support'

  const getContextualGreeting = useCallback((): string => {
    const path = window.location.pathname
    if (path.includes('workspace')) {
      return 'Chào bạn! Tôi là StudyConnect AI — đã kết nối Gemini/n8n. Hỏi tôi về Kanban, OKR hoặc chiến lược MVP của nhóm.'
    }
    if (path.includes('pitch')) {
      return 'Xin chào! Tôi hỗ trợ pitching, slide outline và luyện nói. Gửi dàn ý hoặc ảnh slide để tôi nhận xét.'
    }
    if (path.includes('startup-tools') || path.includes('financial')) {
      return 'Cố vấn tài chính & Canvas sẵn sàng. Hỏi về LTV/CAC, Runway hoặc gửi báo cáo để phân tích.'
    }
    if (role === 'manager') {
      return 'Xin chào giảng viên! Tôi hỗ trợ chẩn đoán nhóm, nhận xét báo cáo tuần và gợi ý chấm điểm. Lịch sử chat được lưu lại.'
    }
    return 'Xin chào! StudyConnect AI Copilot đã liên kết AI trung tâm. Lịch sử được lưu — bạn cũng có thể mở trang AI Support đầy đủ để upload file/báo cáo.'
  }, [role])

  useEffect(() => {
    if (!isOpen || !user) return

    const load = async () => {
      try {
        const list = await aiSupportService.listConversations(mode)
        const latest = list?.[0]
        if (latest?.id) {
          const full = await aiSupportService.getConversation(latest.id)
          setConversationId(full.id)
          const mapped: ChatMessage[] = (full.messages || []).map((m: any) => ({
            id: m.id,
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
            attachments: m.attachments ? JSON.parse(m.attachments) : undefined,
          }))
          setMessages(
            mapped.length
              ? mapped
              : [{ role: 'assistant', content: getContextualGreeting() }]
          )
        } else if (messages.length === 0) {
          setMessages([{ role: 'assistant', content: getContextualGreeting() }])
        }
      } catch {
        if (messages.length === 0) {
          setMessages([{ role: 'assistant', content: getContextualGreeting() }])
        }
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user?.id, mode])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if ((!input.trim() && pendingFiles.length === 0) || loading) return

    const userMsg = input.trim()
    const files = [...pendingFiles]
    setInput('')
    setPendingFiles([])
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: userMsg || '(Đã gửi tệp đính kèm)',
        attachments: files.map((f) => ({ name: f.name, mimeType: f.type })),
      },
    ])
    setLoading(true)

    try {
      const attachments = await Promise.all(files.map(fileToAttachment))
      const data = await aiSupportService.chat({
        conversationId: conversationId || undefined,
        mode,
        message: userMsg,
        attachments,
        pageContext: window.location.pathname,
      })
      setConversationId(data.conversationId)
      setMessages((prev) => [...prev, { role: 'assistant', content: data.aiReply }])
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Không kết nối được AI. Kiểm tra Gemini API key hoặc cấu hình n8n.'
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${msg}` }])
    } finally {
      setLoading(false)
    }
  }

  const startNewChat = () => {
    setConversationId(null)
    setMessages([{ role: 'assistant', content: getContextualGreeting() }])
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9998] font-sans no-print">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-[#FF6B00] hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-xl hover:shadow-orange-500/20 transition-all duration-300 relative group cursor-pointer border-4 border-orange-100 dark:border-orange-950"
          aria-label="Mở AI Copilot"
        >
          <span className="absolute inset-0 rounded-full border-2 border-orange-500 animate-ping opacity-25" />
          <Bot className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="w-[360px] h-[520px] bg-gradient-to-br from-[#13131C] to-[#0A0A0D] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-fadeIn">
          <div className="bg-gradient-to-r from-orange-600/10 to-[#FF6B00]/5 px-4 py-3 border-b border-gray-850 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center border border-[#FF6B00]/30">
                <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">StudyConnect AI</h4>
                <span className="text-[8px] text-emerald-400 font-extrabold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Gemini + n8n · Đã lưu lịch sử
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={startNewChat}
                className="text-gray-500 hover:text-white p-1"
                title="Chat mới"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <Link
                to={hubPath}
                className="text-gray-500 hover:text-[#FF6B00] p-1"
                title="Mở AI Support đầy đủ"
                onClick={() => setIsOpen(false)}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-none select-text">
            {messages.map((m, idx) => (
              <div
                key={m.id || idx}
                className={`flex gap-2.5 items-start ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#FF6B00] flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl text-[11px] leading-relaxed max-w-[82%] font-medium whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-[#FF6B00] text-white rounded-tr-none'
                      : 'bg-[#1C1C28]/60 border border-gray-850/20 text-gray-300 rounded-tl-none'
                  }`}
                >
                  {m.content}
                  {m.attachments && m.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.attachments.map((a, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-black/20"
                        >
                          {a.mimeType?.startsWith('image/') ? (
                            <ImageIcon className="w-2.5 h-2.5" />
                          ) : (
                            <FileText className="w-2.5 h-2.5" />
                          )}
                          {a.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5 items-start">
                <div className="w-7 h-7 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-[#FF6B00]" />
                </div>
                <div className="p-3 bg-[#1C1C28]/60 border border-gray-850/20 rounded-2xl rounded-tl-none text-[11px] text-gray-500 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF6B00]" /> AI đang suy nghĩ qua n8n/Gemini...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {pendingFiles.length > 0 && (
            <div className="px-3 py-1.5 flex flex-wrap gap-1 border-t border-gray-900">
              {pendingFiles.map((f, i) => (
                <span
                  key={i}
                  className="text-[9px] bg-orange-500/10 text-orange-300 px-2 py-0.5 rounded-full flex items-center gap-1"
                >
                  {f.name}
                  <button
                    type="button"
                    onClick={() => setPendingFiles((p) => p.filter((_, idx) => idx !== i))}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <form onSubmit={handleSend} className="p-3 border-t border-gray-850 bg-black/20 flex gap-2 shrink-0">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.txt,.md,.csv,.json,.pdf"
              className="hidden"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                setPendingFiles((prev) => [...prev, ...files].slice(0, 5))
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="p-2 text-gray-500 hover:text-[#FF6B00] transition"
              title="Đính kèm ảnh/báo cáo"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              placeholder="Hỏi AI hoặc đính kèm file..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-[#1C1C28]/80 border border-gray-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF6B00] text-white font-medium placeholder-gray-600"
            />
            <button
              type="submit"
              disabled={loading}
              className="p-2 bg-[#FF6B00] hover:bg-orange-600 text-white rounded-xl transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
