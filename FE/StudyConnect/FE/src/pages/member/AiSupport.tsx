import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Bot,
  Send,
  Plus,
  Trash2,
  Paperclip,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  FileText,
  GraduationCap,
  Lightbulb,
  X,
  MessageSquare,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { aiSupportService, AiSupportAttachment } from '../../services/apiServices'

interface ConversationItem {
  id: string
  title: string
  mode: string
  updatedAt: string
  lastMessage?: { content: string; role: string; createdAt: string } | null
}

interface ChatMessage {
  id?: string
  role: 'user' | 'model' | 'assistant'
  content: string
  attachments?: string | null
  createdAt?: string
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
        textReader.onload = () =>
          resolve({
            name: file.name,
            mimeType: file.type || 'text/plain',
            textExcerpt: String(textReader.result || '').slice(0, 12000),
          })
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

export default function AiSupport() {
  const { role } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const defaultMode = role === 'manager' ? 'teacher' : 'student'
  const mode = (searchParams.get('mode') as 'student' | 'teacher') || defaultMode

  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(true)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const title = mode === 'teacher' ? 'AI Hỗ trợ Giảng viên' : 'AI Hỗ trợ Sinh viên'
  const subtitle =
    mode === 'teacher'
      ? 'Phân tích báo cáo nhóm, gợi ý nhận xét/chấm điểm, upload ảnh & tài liệu — lịch sử được lưu.'
      : 'Tạo ý tưởng, phân tích BMC/báo cáo/pitch, upload file & hình ảnh — lịch sử trò chuyện được lưu.'

  const welcome = useMemo(
    () =>
      mode === 'teacher'
        ? 'Xin chào giảng viên! Hãy dán nội dung báo cáo tuần, upload ảnh slide nhóm, hoặc hỏi cách xử lý free-rider / chấm điểm công bằng.'
        : 'Xin chào! Mô tả ý tưởng, dán BMC/báo cáo, hoặc upload ảnh/slide để AI phân tích và đề xuất bước tiếp theo cho dự án EXE.',
    [mode]
  )

  const loadList = async () => {
    setListLoading(true)
    try {
      const list = await aiSupportService.listConversations(mode)
      setConversations(list || [])
    } catch {
      setConversations([])
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    loadList()
    setActiveId(null)
    setMessages([{ role: 'model', content: welcome }])
  }, [mode, welcome])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const openConversation = async (id: string) => {
    setActiveId(id)
    setError('')
    try {
      const full = await aiSupportService.getConversation(id)
      setMessages(full.messages?.length ? full.messages : [{ role: 'model', content: welcome }])
    } catch {
      setError('Không tải được lịch sử chat')
    }
  }

  const startNew = () => {
    setActiveId(null)
    setMessages([{ role: 'model', content: welcome }])
    setPendingFiles([])
    setInput('')
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await aiSupportService.deleteConversation(id)
      if (activeId === id) startNew()
      await loadList()
    } catch {
      setError('Xóa cuộc trò chuyện thất bại')
    }
  }

  const switchMode = (next: 'student' | 'teacher') => {
    setSearchParams({ mode: next })
  }

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if ((!input.trim() && pendingFiles.length === 0) || loading) return

    const text = input.trim()
    const files = [...pendingFiles]
    setInput('')
    setPendingFiles([])
    setError('')
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: text || '(Đã gửi tệp đính kèm để phân tích)',
        attachments: JSON.stringify(files.map((f) => ({ name: f.name, mimeType: f.type }))),
      },
    ])
    setLoading(true)

    try {
      const attachments = await Promise.all(files.map(fileToAttachment))
      const data = await aiSupportService.chat({
        conversationId: activeId || undefined,
        mode,
        message: text,
        attachments,
        pageContext: '/ai-support',
      })
      setActiveId(data.conversationId)
      setMessages((prev) => [...prev, { role: 'model', content: data.aiReply }])
      await loadList()
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Lỗi kết nối AI (Gemini/n8n)'
      setError(msg)
      setMessages((prev) => [...prev, { role: 'model', content: `⚠️ ${msg}` }])
    } finally {
      setLoading(false)
    }
  }

  const parseAttachments = (raw?: string | null) => {
    if (!raw) return [] as Array<{ name: string; mimeType: string }>
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  }

  return (
    <div className="h-[calc(100vh-7rem)] min-h-[560px] flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-[#FF6B00]/15 border border-[#FF6B00]/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#FF6B00]" />
            </div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
          </div>
          <p className="text-sm text-gray-400 max-w-2xl">{subtitle}</p>
          <p className="text-[11px] text-emerald-400/90 mt-1 font-medium">
            Pipeline: Frontend → Backend → n8n Webhook → Gemini · Fallback Gemini trực tiếp nếu n8n offline
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(role === 'manager' || role === 'admin' || role === 'leader') && (
            <div className="flex rounded-xl border border-gray-800 overflow-hidden text-xs">
              <button
                onClick={() => switchMode('student')}
                className={`px-3 py-2 flex items-center gap-1.5 ${
                  mode === 'student' ? 'bg-[#FF6B00] text-white' : 'bg-[#13131C] text-gray-400'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" /> Sinh viên
              </button>
              <button
                onClick={() => switchMode('teacher')}
                className={`px-3 py-2 flex items-center gap-1.5 ${
                  mode === 'teacher' ? 'bg-[#FF6B00] text-white' : 'bg-[#13131C] text-gray-400'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" /> Giảng viên
              </button>
            </div>
          )}
          <Link
            to="/idea-generator"
            className="text-xs px-3 py-2 rounded-xl border border-gray-800 text-gray-300 hover:border-[#FF6B00]/50 hover:text-[#FF6B00]"
          >
            Idea Generator
          </Link>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 min-h-0">
        {/* History sidebar */}
        <aside className="rounded-2xl border border-gray-800 bg-[#0F0F16]/80 flex flex-col min-h-0 overflow-hidden">
          <div className="p-3 border-b border-gray-850 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#FF6B00]" /> Lịch sử
            </span>
            <button
              onClick={startNew}
              className="text-[10px] px-2 py-1 rounded-lg bg-[#FF6B00]/15 text-[#FF6B00] hover:bg-[#FF6B00]/25 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Mới
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {listLoading && (
              <div className="text-xs text-gray-500 p-3 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải...
              </div>
            )}
            {!listLoading && conversations.length === 0 && (
              <p className="text-xs text-gray-600 p-3">Chưa có cuộc trò chuyện nào.</p>
            )}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => openConversation(c.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl group transition ${
                  activeId === c.id
                    ? 'bg-[#FF6B00]/15 border border-[#FF6B00]/30'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-200 truncate">{c.title}</p>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">
                      {c.lastMessage?.content || '—'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(c.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat panel */}
        <section className="rounded-2xl border border-gray-800 bg-[#0F0F16]/80 flex flex-col min-h-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-850 flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#FF6B00]" />
            <span className="text-sm font-semibold text-white">
              {mode === 'teacher' ? 'Cố vấn giảng dạy AI' : 'Startup Mentor AI'}
            </span>
            <span className="text-[10px] text-emerald-400 ml-auto">Online · n8n + Gemini</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, idx) => {
              const isUser = m.role === 'user'
              const atts = parseAttachments(m.attachments)
              return (
                <div key={m.id || idx} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-[#FF6B00]" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-[#FF6B00] text-white rounded-tr-md'
                        : 'bg-[#1C1C28] border border-gray-800 text-gray-200 rounded-tl-md'
                    }`}
                  >
                    {m.content}
                    {atts.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {atts.map((a, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-black/25"
                          >
                            {a.mimeType?.startsWith('image/') ? (
                              <ImageIcon className="w-3 h-3" />
                            ) : (
                              <FileText className="w-3 h-3" />
                            )}
                            {a.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#FF6B00]" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-[#1C1C28] border border-gray-800 text-sm text-gray-500 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#FF6B00]" /> Đang phân tích qua n8n/Gemini...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {error && (
            <div className="mx-4 mb-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          {pendingFiles.length > 0 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {pendingFiles.map((f, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-orange-500/10 text-orange-300 px-2 py-1 rounded-full flex items-center gap-1"
                >
                  {f.type.startsWith('image/') ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                  {f.name}
                  <button type="button" onClick={() => setPendingFiles((p) => p.filter((_, idx) => idx !== i))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <form onSubmit={handleSend} className="p-4 border-t border-gray-850 flex gap-2 items-end">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.txt,.md,.csv,.json,.pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                setPendingFiles((prev) => [...prev, ...files].slice(0, 5))
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="p-2.5 rounded-xl border border-gray-800 text-gray-400 hover:text-[#FF6B00] hover:border-[#FF6B00]/40"
              title="Upload ảnh / báo cáo / tài liệu"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              rows={2}
              placeholder={
                mode === 'teacher'
                  ? 'Ví dụ: Phân tích báo cáo tuần nhóm A, gợi ý nhận xét...'
                  : 'Ví dụ: Tạo ý tưởng app cho sinh viên khó tìm nhóm + phân tích file BMC...'
              }
              className="flex-1 resize-none bg-[#1C1C28] border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FF6B00]"
            />
            <button
              type="submit"
              disabled={loading}
              className="p-2.5 rounded-xl bg-[#FF6B00] hover:bg-orange-600 text-white disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
