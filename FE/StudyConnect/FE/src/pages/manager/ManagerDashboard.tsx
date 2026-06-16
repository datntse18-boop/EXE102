import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/cards/Card'
import { teamService, reportService, aiService, projectService, userService } from '../../services/apiServices'
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

  // AI Classroom & Grouping States
  const [unassignedStudents, setUnassignedStudents] = useState<any[]>([])
  const [groupingLoading, setGroupingLoading] = useState(false)
  const [importingMock, setImportingMock] = useState(false)

  const loadUnassignedStudents = async () => {
    try {
      const data = await userService.getUnassignedStudents(user?.classCode || 'EXE101-2026')
      setUnassignedStudents(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleImportMockStudents = async () => {
    setImportingMock(true)
    try {
      const mockStudents = [
        { name: 'Nguyễn Minh Quân', email: 'quan.nm@example.com', role: 'member', classCode: user?.classCode || 'EXE101-2026', skills: 'Figma, UI/UX Design', desiredRole: 'UI/UX Designer' },
        { name: 'Trần Thanh Sơn', email: 'son.tt@example.com', role: 'member', classCode: user?.classCode || 'EXE101-2026', skills: 'Node.js, Postgres, Express', desiredRole: 'Backend Developer' },
        { name: 'Đặng Thùy Dương', email: 'duong.dt@example.com', role: 'member', classCode: user?.classCode || 'EXE101-2026', skills: 'React, Tailwind CSS, JS', desiredRole: 'Frontend Developer' },
        { name: 'Lê Tuấn Kiệt', email: 'kiet.lt@example.com', role: 'member', classCode: user?.classCode || 'EXE101-2026', skills: 'PowerPoint, Pitching, BA', desiredRole: 'Business Analyst' },
        { name: 'Vũ Quốc Anh', email: 'anh.vq@example.com', role: 'member', classCode: user?.classCode || 'EXE101-2026', skills: 'QA/QC, Testing, Cypress', desiredRole: 'Tester/QA' },
        { name: 'Phạm Hồng Nhung', email: 'nhung.ph@example.com', role: 'member', classCode: user?.classCode || 'EXE101-2026', skills: 'Financial Modeling, Pitching', desiredRole: 'Product Owner' }
      ]

      await Promise.all(mockStudents.map(student => userService.createUser(student)))
      await loadUnassignedStudents()
      alert('Giả lập nạp 6 học viên từ tệp Excel thành công! Danh sách học viên chưa phân nhóm đã được cập nhật.')
    } catch (err) {
      console.error(err)
      alert('Không thể nạp học viên giả lập. Có thể email đã tồn tại.')
    } finally {
      setImportingMock(false)
    }
  }

  const handleAIAutoGrouping = async () => {
    setGroupingLoading(true)
    try {
      const res = await aiService.autoGrouping(user?.classCode || 'EXE101-2026')
      if (res.success) {
        alert(res.message)
        const teamsData = await teamService.getTeams()
        setTeams(teamsData)
        setUnassignedStudents([])
      } else {
        alert(res.message || 'Xếp nhóm thất bại.')
      }
    } catch (err) {
      console.error(err)
      alert('AI xếp nhóm thất bại. Vui lòng kiểm tra lại kết nối hoặc tài khoản API Key.')
    } finally {
      setGroupingLoading(false)
    }
  }

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
      await loadUnassignedStudents()
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

  // Handle feedback submit to database project comments
  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedbackText || !inspectingTeamId) return

    const selectedTeam = teams.find(t => t.id === inspectingTeamId)
    const activeProject = selectedTeam?.projects?.[0]
    
    if (!activeProject) {
      alert('Nhóm này hiện chưa có dự án nào được khởi tạo để nhận phản hồi!')
      return
    }

    setSendingFeedback(true)
    try {
      await projectService.addComment(activeProject.id, feedbackText)
      alert('Gửi phản hồi hướng dẫn thành công và đã lưu vào dự án!')
      setFeedbackText('')
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || 'Không thể gửi phản hồi. Vui lòng thử lại.')
    } finally {
      setSendingFeedback(false)
    }
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

          {/* AI Classroom & Auto-Grouping Widget */}
          <Card className="border-t-4 border-indigo-500 bg-indigo-50/5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-600 animate-pulse" />
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">Quản lý Lớp học & Xếp nhóm Tự động bằng AI</h3>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Mã lớp: {user?.classCode || 'EXE101-2026'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleImportMockStudents}
                  disabled={importingMock}
                  className="px-3.5 py-1.5 border border-indigo-100 text-indigo-600 bg-indigo-50/30 hover:bg-indigo-50 text-[10px] font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  {importingMock ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Đang nạp...
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-3 h-3" />
                      Nạp học viên (Excel)
                    </>
                  )}
                </button>

                <button
                  onClick={handleAIAutoGrouping}
                  disabled={groupingLoading || unassignedStudents.length === 0}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-[10px] font-bold rounded-xl shadow-sm hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {groupingLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Đang xếp nhóm...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      Kích hoạt AI Xếp nhóm
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-indigo-50/20 p-3 rounded-2xl border border-indigo-100/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">
                    Học viên chưa phân nhóm ({unassignedStudents.length})
                  </span>
                  {unassignedStudents.length > 0 && (
                    <span className="text-[9px] font-medium text-indigo-600 bg-indigo-100/50 px-2 py-0.5 rounded-full">
                      Cần tối thiểu 3 học viên để bắt đầu xếp nhóm
                    </span>
                  )}
                </div>

                {unassignedStudents.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {unassignedStudents.map((student, idx) => (
                      <div key={student.id || idx} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-100 hover:border-indigo-100 transition">
                        <div>
                          <p className="text-xs font-bold text-gray-800">{student.name}</p>
                          <p className="text-[9px] text-gray-400">{student.email}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-lg">
                            {student.desiredRole || 'Chưa chọn vai trò'}
                          </span>
                          <p className="text-[8px] text-gray-400 mt-0.5 max-w-[150px] truncate">
                            Kỹ năng: {student.skills || 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <span className="text-2xl mb-1 block">🎉</span>
                    <p className="text-xs font-bold text-gray-500">Lớp học hiện tại không có học viên tự do!</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Hãy nhấn "Nạp học viên (Excel)" để giả lập nhập danh sách học viên mới.</p>
                  </div>
                )}
              </div>

              {unassignedStudents.length > 0 && (
                <div className="p-3 bg-yellow-50/30 rounded-xl border border-yellow-100 text-[10px] text-yellow-800 leading-relaxed flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Nguyên tắc xếp nhóm của AI:</span>
                    Hệ thống sẽ chuyển thông tin danh sách học viên chưa phân nhóm cho Gemini AI để phân tích kỹ năng và vai trò mong muốn (BA, Frontend, Backend, UI/UX). AI sẽ tự động gom các thành viên thành nhóm startup đồng sáng lập cân bằng và gán nhóm trưởng ngẫu nhiên phù hợp nhất.
                  </div>
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
