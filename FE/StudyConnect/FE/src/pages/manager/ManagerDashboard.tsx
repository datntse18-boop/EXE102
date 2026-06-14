import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/cards/Card'
import { teamService, reportService, aiService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Brain, 
  Sparkles, 
  BookOpen, 
  Loader2, 
  ChevronRight,
  TrendingUp
} from 'lucide-react'

export default function ManagerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [teams, setTeams] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // AI Inspection states
  const [inspectingTeamId, setInspectingTeamId] = useState<string>('')
  const [aiInspecting, setAiInspecting] = useState(false)
  const [aiReport, setAiReport] = useState<any>(null)

  // Feedback simulation states
  const [feedbackText, setFeedbackText] = useState('')
  const [sendingFeedback, setSendingFeedback] = useState(false)

  const loadData = async () => {
    try {
      const [teamsData, statsData] = await Promise.all([
        teamService.getTeams(),
        reportService.getPlatformStats(),
      ])
      setTeams(teamsData)
      setStats(statsData)
      if (teamsData.length > 0 && !inspectingTeamId) {
        setInspectingTeamId(teamsData[0].id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const activeTeams = teams.filter(t => t.status === 'active')
  const atRiskTeams = teams.filter(t => t.status === 'at_risk')

  // Handle AI Inspection for manager
  const handleAIInspect = async () => {
    if (!inspectingTeamId) return
    setAiInspecting(true)
    setAiReport(null)
    try {
      const data = await aiService.analyzeProgress(inspectingTeamId)
      setAiReport(data)
    } catch (err) {
      console.error(err)
      alert('Không thể chạy phân tích AI cho nhóm này')
    } finally {
      setAiInspecting(false)
    }
  }

  // Handle mock feedback submit
  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedbackText) return
    setSendingFeedback(true)
    setTimeout(() => {
      alert('Gửi phản hồi hướng dẫn thành công đến nhóm!')
      setFeedbackText('')
      setSendingFeedback(false)
    }, 800)
  }

  const StatBox = ({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) => (
    <div className={`card border-l-4 ${color} flex items-center justify-between p-5 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:shadow-md transition-all duration-300`}>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-gray-800 mt-1">{loading ? '...' : value}</p>
      </div>
      <div className="text-2xl">{icon}</div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-500">
        <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin mb-2" />
        <span className="text-sm font-semibold">Đang tải bảng quản trị giảng viên...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Premium Lecturer Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1E1E24] via-[#2F2F3D] to-[#3E3E52] text-white rounded-3xl p-8 shadow-xl border border-gray-800">
        <div className="relative z-10 max-w-xl">
          <span className="bg-[#FF6B00] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm flex items-center gap-1 w-max">
            <BookOpen className="w-3.5 h-3.5" />
            Lecturer / Mentor Hub
          </span>
          <h1 className="text-3xl font-black mt-4 tracking-tight leading-none text-white">Chào Giảng viên, {user?.name}! 🎓</h1>
          <p className="text-sm text-gray-300 mt-3 font-medium opacity-95 leading-relaxed">
            Hệ thống quản trị và giám sát các nhóm dự án EXE đang hoạt động. Sử dụng Cố vấn AI tích hợp bên dưới để đánh giá nhanh tiến độ và cảnh báo sớm rủi ro.
          </p>
        </div>
        <div className="absolute right-8 bottom-0 top-0 opacity-10 w-1/4 flex items-center justify-center pointer-events-none">
          <span className="text-9xl">📖</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Tổng số nhóm phụ trách" value={teams.length} icon="👥" color="border-[#FF6B00]" />
        <StatBox label="Nhóm đang hoạt động" value={activeTeams.length} icon="✓" color="border-green-500" />
        <StatBox label="Nhóm rủi ro cao" value={atRiskTeams.length} icon="⚠️" color="border-yellow-500" />
        <StatBox label="Sinh viên hoạt động" value={stats?.users?.active ?? '...'} icon="🌍" color="border-blue-500" />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* LEFT & CENTER PANEL (Width: 2/3) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* AI Team Inspector Widget */}
          <Card className="border-t-4 border-emerald-500 bg-emerald-50/5">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50">
              <Brain className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-gray-800 text-sm">Chẩn đoán và Giám sát Nhóm bằng Gemini AI</h3>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Chọn nhóm cần chẩn đoán</label>
                  <select
                    value={inspectingTeamId}
                    onChange={e => setInspectingTeamId(e.target.value)}
                    className="w-full text-xs font-bold text-gray-800 border rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 bg-white shadow-sm"
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} (Health Score: {t.healthScore}%)
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAIInspect}
                  disabled={aiInspecting || !inspectingTeamId}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-60 flex items-center justify-center gap-1.5 shrink-0"
                >
                  {aiInspecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      AI đang chẩn đoán...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Chẩn đoán nhanh bằng AI
                    </>
                  )}
                </button>
              </div>

              {/* AI Report display */}
              {aiReport && (
                <div className="mt-4 p-5 rounded-2xl border border-emerald-100 bg-emerald-50/10 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-emerald-100/30 pb-2">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-bold">Báo cáo sức khỏe dự án</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      aiReport.riskLevel === 'High' ? 'bg-red-50 text-red-600 border-red-200' :
                      aiReport.riskLevel === 'Medium' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                      'bg-green-50 text-green-600 border-green-200'
                    }`}>
                      Rủi ro: {aiReport.riskLevel}
                    </span>
                  </div>

                  <div className="text-xs text-gray-700 leading-relaxed font-medium bg-white p-3.5 rounded-xl border border-gray-50">
                    <span className="font-bold text-gray-800 block mb-1">Tóm tắt của AI:</span>
                    {aiReport.summary}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <h5 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Điểm mạnh nhóm:</h5>
                      <ul className="text-xs text-gray-600 space-y-1 bg-white p-3 rounded-xl border border-gray-50 min-h-[60px]">
                        {aiReport.strengths?.map((s: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1.5">
                      <h5 className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Điểm yếu cần khắc phục:</h5>
                      <ul className="text-xs text-gray-600 space-y-1 bg-white p-3 rounded-xl border border-gray-50 min-h-[60px]">
                        {aiReport.weaknesses?.map((w: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-red-500 font-bold">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Đề xuất hành động cho Giảng viên:</h5>
                    <ol className="text-xs text-gray-600 space-y-1.5 bg-white p-4 rounded-xl border border-gray-50">
                      {aiReport.recommendations?.map((r: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="font-extrabold text-emerald-600">{idx + 1}.</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Feedback Simulator Form */}
                  <form onSubmit={handleSendFeedback} className="pt-3 border-t border-emerald-100/30 space-y-2">
                    <label className="text-[10px] font-bold text-gray-600 block">Gửi nhận xét hướng dẫn của bạn cho nhóm này</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Nhập lời khuyên hoặc yêu cầu chỉnh sửa..."
                        value={feedbackText}
                        onChange={e => setFeedbackText(e.target.value)}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                      />
                      <button
                        type="submit"
                        disabled={sendingFeedback}
                        className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition"
                      >
                        {sendingFeedback ? 'Đang gửi...' : 'Gửi nhanh'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </Card>

          {/* Teams Status List */}
          <Card>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                <h3 className="font-bold text-gray-800 text-sm">Trạng thái tiến độ các nhóm</h3>
              </div>
              <button 
                onClick={() => navigate('/manager/teams')} 
                className="text-xs text-[#FF6B00] hover:underline font-bold"
              >
                Giám sát chi tiết →
              </button>
            </div>
            <div className="space-y-3">
              {teams.length > 0 ? (
                teams.map(team => (
                  <div 
                    key={team.id} 
                    onClick={() => navigate(`/manager/team/${team.id}`)}
                    className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:border-orange-100 bg-gray-50/25 hover:bg-[#FFF4E8]/20 transition duration-300 cursor-pointer"
                  >
                    <div>
                      <p className="font-extrabold text-gray-800 text-xs">{team.name}</p>
                      <p className="text-[9px] text-gray-400 font-bold mt-1">
                        {team.members?.length ?? 0} thành viên • {team.projects?.length ?? 0} dự án đang chạy
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="text-lg font-black text-[#FF6B00]">{team.healthScore}%</div>
                        <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Health Score</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                        team.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                      }`}>
                        {team.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-xs text-center py-6">Không có nhóm nào đang hoạt động</p>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT PANEL (Width: 1/3) */}
        <div className="md:col-span-1 space-y-6">
          {/* Actions List */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50">
              <span className="text-xl">⚡</span>
              <h3 className="font-bold text-gray-800 text-xs">Hành động của Giảng viên</h3>
            </div>
            <div className="space-y-2">
              <button 
                onClick={() => navigate('/team-matching')} 
                className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF801A] text-white hover:shadow-md transition font-bold text-xs text-center cursor-pointer"
              >
                + Đăng ký nhóm mới
              </button>
              <button 
                onClick={() => navigate('/manager/teams')} 
                className="w-full px-4 py-2.5 rounded-xl border border-orange-100 text-[#FF6B00] bg-[#FFF4E8]/20 hover:bg-[#FFF4E8] font-bold text-xs text-center transition cursor-pointer"
              >
                📋 Xem tất cả các nhóm
              </button>
              <button 
                onClick={() => navigate('/manager/invitations')} 
                className="w-full px-4 py-2.5 rounded-xl border border-orange-100 text-[#FF6B00] bg-[#FFF4E8]/20 hover:bg-[#FFF4E8] font-bold text-xs text-center transition cursor-pointer"
              >
                📬 Quản lý lời mời (Invitations)
              </button>
              <button 
                onClick={() => navigate('/syllabus')} 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs text-center transition cursor-pointer"
              >
                📚 Xem đề cương môn học
              </button>
            </div>
          </Card>

          {/* At Risk warning box */}
          {atRiskTeams.length > 0 && (
            <div className="card border-l-4 border-yellow-500 bg-yellow-50/30 p-5 space-y-3 rounded-2xl shadow-sm">
              <h3 className="font-extrabold text-yellow-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                Nhóm cần chú ý gấp ({atRiskTeams.length})
              </h3>
              <div className="space-y-2 text-xs">
                {atRiskTeams.map(team => (
                  <div key={team.id} className="flex justify-between items-center text-yellow-800 border-b border-yellow-100/50 pb-1.5 last:border-0 last:pb-0">
                    <span className="font-bold text-gray-800">{team.name}</span>
                    <strong className="font-bold text-yellow-600">{team.healthScore}% health</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
