import { useEffect, useState } from 'react'
import { teamService, aiService } from '../../services/apiServices'
import Card from '../../components/cards/Card'
import { 
  Brain, 
  Sparkles, 
  Users, 
  CheckCircle2, 
  Clock, 
  Activity, 
  Send, 
  MessageSquare, 
  Loader2, 
  TrendingUp, 
  FolderGit2, 
  UserSquare, 
  Lightbulb, 
  FlameKindling
} from 'lucide-react'

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [teamDetail, setTeamDetail] = useState<any>(null)
  const [memberStats, setMemberStats] = useState<any[]>([])

  // AI states
  const [aiResult, setAiResult] = useState<string>('')
  const [aiAuditing, setAiAuditing] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([])

  // Fetch teams led by user or member of
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await teamService.getTeams()
        setTeams(data)
        if (data.length > 0) {
          setSelectedTeamId(data[0].id)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchTeams()
  }, [])

  // Load team details & compute dynamic member completion statistics
  useEffect(() => {
    if (!selectedTeamId) return
    const fetchTeamDetail = async () => {
      setLoading(true)
      try {
        const detail = await teamService.getTeamById(selectedTeamId)
        setTeamDetail(detail)
        
        // Aggregate completed and overdue tasks per member from live DB
        const allTasks = detail.projects?.flatMap((p: any) => p.tasks || []) || []
        const stats = detail.members?.map((m: any) => {
          const mTasks = allTasks.filter((t: any) => t.assignedTo === m.userId)
          const completed = mTasks.filter((t: any) => t.status === 'completed').length
          const inProgress = mTasks.filter((t: any) => t.status === 'in_progress').length
          const todo = mTasks.filter((t: any) => t.status === 'todo').length
          const rate = mTasks.length > 0 ? Math.round((completed / mTasks.length) * 100) : 0
          return {
            id: m.userId,
            name: m.user?.name || 'Thành viên',
            avatar: m.user?.avatar || '👤',
            email: m.user?.email,
            role: m.userId === detail.leaderId ? 'Trưởng nhóm' : 'Thành viên',
            total: mTasks.length,
            completed,
            inProgress,
            todo,
            rate
          }
        }) || []
        setMemberStats(stats)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchTeamDetail()
  }, [selectedTeamId])

  // Run Omnipotent AI Diagnostic
  const handleGlobalAudit = async () => {
    if (!selectedTeamId) return
    setAiAuditing(true)
    setAiResult('')
    setChatMessages([])
    try {
      const data = await aiService.globalAudit(selectedTeamId)
      setAiResult(data)
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || 'Không thể chạy chẩn đoán AI toàn năng.')
    } finally {
      setAiAuditing(false)
    }
  }

  // Interactive AI chat submission
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !selectedTeamId) return
    const userMsg = chatInput.trim()
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }])
    setChatInput('')
    setChatLoading(true)
    try {
      const reply = await aiService.globalAudit(selectedTeamId, userMsg)
      setChatMessages(prev => [...prev, { sender: 'ai', text: reply }])
    } catch (err: any) {
      console.error(err)
      setChatMessages(prev => [...prev, { sender: 'ai', text: 'Lỗi: Không thể nhận phản hồi từ Cố văn AI toàn năng.' }])
    } finally {
      setChatLoading(false)
    }
  }

  // Simple Markdown Line Parser to match our premium typography standards
  const formatAiResponse = (text: string) => {
    if (!text) return null
    return text.split('\n').map((line, idx) => {
      // Headers
      if (line.startsWith('###') || line.startsWith('##') || line.startsWith('#')) {
        const title = line.replace(/#/g, '').trim()
        return (
          <h4 key={idx} className="font-extrabold text-[#FF6B00] text-sm mt-5 mb-2.5 first:mt-0 flex items-center gap-1.5 border-b border-gray-800 pb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" />
            {title}
          </h4>
        )
      }
      // Bullet points
      if (line.startsWith('-') || line.startsWith('*')) {
        const cleanLine = line.substring(1).trim()
        return (
          <div key={idx} className="flex items-start gap-2 ml-2 my-2 text-xs text-gray-300">
            <span className="text-[#FF6B00] font-bold mt-0.5">•</span>
            <span>{cleanLine}</span>
          </div>
        )
      }
      // Number lists
      if (/^\d+\./.test(line)) {
        return (
          <p key={idx} className="font-bold text-[#FF6B00] text-xs mt-4 mb-2 flex items-center gap-1">
            {line}
          </p>
        )
      }
      // Plain text
      return <p key={idx} className="text-xs text-gray-300 leading-relaxed my-2">{line}</p>
    })
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Premium Obsidian Dark Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0F0F12] via-[#1C1C24] to-[#0A0A0D] text-white rounded-3xl p-8 shadow-2xl border border-gray-800/80">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF6B00] via-[#FFA64D] to-[#FF6B00] shadow-[0_0_10px_rgba(255,107,0,0.5)]"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="bg-[#FF6B00]/25 text-[#FF6B00] border border-[#FF6B00]/40 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,107,0,0.1)] flex items-center gap-1.5 w-max">
            <Brain className="w-3.5 h-3.5 text-[#FF6B00] animate-pulse" />
            OMNIPOTENT AI SYSTEM & CO-PILOT
          </span>
          <h1 className="text-3xl font-black mt-4 tracking-tight leading-none">Cố Vấn AI Toàn Năng & Phân Tích Đóng Góp 🧠</h1>
          <p className="text-sm text-gray-400 mt-3 font-medium opacity-90 leading-relaxed">
            Hệ thống AI cấp cao tích hợp Gemini. Tự động đọc và chẩn đoán toàn bộ dữ liệu từ cơ sở dữ liệu: từ tài liệu định hướng, tiến độ hoàn thành công việc của từng thành viên, kế hoạch tài chính cho đến báo cáo tuần.
          </p>
        </div>
        <div className="absolute right-8 bottom-0 top-0 opacity-5 w-1/4 flex items-center justify-center pointer-events-none">
          <span className="text-9xl">🧠</span>
        </div>
      </div>

      {/* Selector & Team Info Box */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#13131C] p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800/80">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Chọn nhóm dự án:</span>
          <select
            value={selectedTeamId}
            onChange={e => setSelectedTeamId(e.target.value)}
            className="border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] font-bold text-gray-700 dark:text-gray-300 bg-transparent shadow-sm cursor-pointer"
          >
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        
        {teamDetail && (
          <div className="flex items-center gap-6 text-xs text-gray-500 font-medium">
            <div className="flex items-center gap-1">
              <FolderGit2 className="w-4 h-4 text-[#FF6B00]" />
              <span>Dự án: <strong className="text-gray-850 dark:text-gray-300">{teamDetail.projects?.[0]?.name || 'N/A'}</strong></span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>Điểm sức khỏe: <strong className="text-emerald-500 font-extrabold">{teamDetail.healthScore}%</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Left statistics, Right AI Center */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* LEFT COLUMN: Real-Time Member Tasks & Participation Stats (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
              <Users className="w-4 h-4 text-[#FF6B00]" />
              <h3 className="font-bold text-gray-800 dark:text-white text-sm">Thống kê tiến độ các thành viên</h3>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00] mb-2" />
                <span className="text-xs">Đang truy vấn dữ liệu...</span>
              </div>
            ) : memberStats.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-10 text-gray-400 text-xs">
                Không tìm thấy dữ liệu thành viên trong nhóm này.
              </div>
            ) : (
              <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                {memberStats.map(member => (
                  <div key={member.id} className="p-4 rounded-2xl bg-gray-50/50 dark:bg-[#1C1C28]/60 border border-gray-100 dark:border-gray-800/40 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center border dark:border-orange-900/30">
                          {member.avatar}
                        </span>
                        <div>
                          <p className="text-xs font-extrabold text-gray-800 dark:text-white leading-tight">{member.name}</p>
                          <p className="text-[10px] text-[#FF6B00] font-bold mt-1 uppercase tracking-wider">{member.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-[#FF6B00]">{member.rate}%</span>
                        <span className="text-[8px] font-bold text-gray-400 block uppercase">Hoàn thành</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#FF6B00] to-[#FF801A] h-full rounded-full transition-all duration-500"
                        style={{ width: `${member.rate}%` }}
                      ></div>
                    </div>

                    {/* Mini Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[10px] text-gray-500 dark:text-gray-450">
                      <div className="bg-white dark:bg-[#13131C] py-1.5 rounded-lg border dark:border-gray-800">
                        <span className="font-extrabold text-gray-800 dark:text-gray-300 block">{member.completed}</span>
                        <span>Đã nộp</span>
                      </div>
                      <div className="bg-white dark:bg-[#13131C] py-1.5 rounded-lg border dark:border-gray-800">
                        <span className="font-extrabold text-gray-800 dark:text-gray-300 block">{member.inProgress}</span>
                        <span>Đang làm</span>
                      </div>
                      <div className="bg-white dark:bg-[#13131C] py-1.5 rounded-lg border dark:border-gray-800">
                        <span className="font-extrabold text-gray-800 dark:text-gray-300 block">{member.total}</span>
                        <span>Tổng việc</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: AI Omnipotent Command & Interaction Hub (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-t-4 border-amber-500 flex flex-col h-full min-h-[500px]">
            
            {/* Header info */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-gray-800 dark:text-white text-sm">Trung tâm Cố vấn AI toàn năng</h3>
              </div>
              <span className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-900/30 uppercase tracking-wider">
                Gemini Analytics
              </span>
            </div>

            {/* AI Control or Output view */}
            {!aiResult && chatMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/15 border border-amber-100 dark:border-amber-900/30 flex items-center justify-center text-amber-500 shadow-sm animate-pulse">
                  <FlameKindling className="w-8 h-8 text-[#FF6B00]" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-850 dark:text-gray-200 text-sm">Chẩn đoán dữ liệu dự án cấp cao</h4>
                  <p className="text-xs text-gray-400 max-w-sm mt-1.5 leading-relaxed">
                    Hệ thống sẽ tổng hợp toàn bộ các bảng dữ liệu thực của nhóm: tài liệu ý tưởng, lịch sử báo cáo tuần ( achievements/blockers), kế hoạch điểm hòa vốn tài chính (LTV/CAC) và phân lượng công việc thành viên để chẩn đoán toàn diện.
                  </p>
                </div>
                <button
                  onClick={handleGlobalAudit}
                  disabled={aiAuditing || !selectedTeamId}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-[#FF6B00] hover:shadow-lg transition text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md disabled:opacity-60 cursor-pointer"
                >
                  {aiAuditing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Đang đọc và chẩn đoán toàn diện...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 text-white" />
                      Kích hoạt Chẩn đoán AI Toàn Năng
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between space-y-4">
                {/* Result Output Panel */}
                <div className="flex-1 overflow-y-auto max-h-[480px] p-5 rounded-2xl bg-gray-50/50 dark:bg-[#181824]/30 border border-gray-100 dark:border-gray-850 shadow-inner space-y-4 scrollbar-thin">
                  {/* Primary diagnostic result */}
                  {aiResult && (
                    <div className="space-y-1 bg-white dark:bg-[#13131C]/60 p-4.5 rounded-2xl border dark:border-gray-800 shadow-sm">
                      <div className="flex items-center gap-2 text-[#FF6B00] border-b dark:border-gray-800 pb-2 mb-3">
                        <Activity className="w-4 h-4 text-[#FF6B00]" />
                        <span className="text-xs font-black uppercase tracking-wider">Báo cáo Kiểm toán Dự án (Project Audit)</span>
                      </div>
                      <div className="space-y-1">{formatAiResponse(aiResult)}</div>
                    </div>
                  )}

                  {/* Chat dialog bubble logic */}
                  {chatMessages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`flex gap-3 text-xs leading-relaxed max-w-[85%] p-4 rounded-2xl shadow-sm border ${
                        msg.sender === 'user'
                          ? 'ml-auto bg-gradient-to-r from-orange-500/10 to-orange-600/5 text-gray-250 border-orange-500/20'
                          : 'bg-white dark:bg-[#13131C]/80 text-gray-300 border-gray-100 dark:border-gray-800'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-xl bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center font-bold text-[10px] shrink-0 border dark:border-orange-900/30">
                        {msg.sender === 'user' ? '👩‍💻' : '🧠'}
                      </div>
                      <div className="space-y-1">
                        <span className="font-extrabold text-gray-850 dark:text-white block mb-0.5">
                          {msg.sender === 'user' ? 'Founder (Bạn)' : 'AI Cố Vấn Toàn Năng'}
                        </span>
                        <div className="whitespace-pre-line">{msg.sender === 'ai' ? formatAiResponse(msg.text) : msg.text}</div>
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {chatLoading && (
                    <div className="flex gap-3 text-xs text-gray-400 items-center bg-white dark:bg-[#13131C]/40 p-3 rounded-2xl border dark:border-gray-850 max-w-[50%]">
                      <Loader2 className="w-4 h-4 animate-spin text-[#FF6B00]" />
                      <span className="font-semibold">AI đang đọc dữ liệu & phân tích...</span>
                    </div>
                  )}
                </div>

                {/* Interactive Chat Form */}
                <form onSubmit={handleSendMessage} className="flex gap-2 border border-gray-250 dark:border-gray-800 p-2 rounded-2xl bg-gray-50 dark:bg-[#1C1C28]/60 focus-within:border-[#FF6B00] transition">
                  <input
                    type="text"
                    required
                    disabled={chatLoading}
                    placeholder="Hỏi AI thêm về các tài liệu, tiến độ thành viên, hoặc chỉ số tài chính..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    className="flex-1 text-xs focus:outline-none bg-transparent px-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="p-2.5 bg-[#FF6B00] hover:bg-[#E85A00] text-white rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </form>

                {/* Reset button to show initial diagnostic option */}
                <div className="flex justify-between items-center text-[10px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    AI Cố vấn đồng hành dựa trên dữ liệu Neon DB thực tế.
                  </span>
                  <button 
                    type="button"
                    onClick={() => { setAiResult(''); setChatMessages([]); }}
                    className="text-[#FF6B00] hover:underline font-bold"
                  >
                    Chẩn đoán lại ↻
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  )
}
