import { useEffect, useState } from 'react'
import { teamService, weeklyReportService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/cards/Card'
import { Sparkles, Loader2, Calendar, FileText, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react'

export default function WeeklyCheckin() {
  const { user, role } = useAuth()
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [weeklyReports, setWeeklyReports] = useState<any[]>([])
  
  // Submit Form States
  const [weekNumber, setWeekNumber] = useState(1)
  const [achievements, setAchievements] = useState('')
  const [plans, setPlans] = useState('')
  const [blockers, setBlockers] = useState('')
  
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      if (role === 'member' || role === 'manager') {
        const teamsData = await teamService.getTeams()
        setTeams(teamsData)
        if (role === 'member' && teamsData.length > 0) {
          setSelectedTeamId(teamsData[0].id)
        }
      }
      
      const reports = await weeklyReportService.getWeeklyReports(
        selectedTeamId ? { teamId: selectedTeamId } : undefined
      )
      setWeeklyReports(reports)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [role, selectedTeamId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeamId) {
      alert('Vui lòng chọn nhóm của bạn')
      return
    }
    setSubmitting(true)
    try {
      await weeklyReportService.submitReport({
        teamId: selectedTeamId,
        weekNumber,
        achievements,
        plans,
        blockers
      })
      alert('Nộp báo cáo tuần thành công! Trợ lý AI đã phân tích báo cáo của bạn.')
      setAchievements('')
      setPlans('')
      setBlockers('')
      loadData()
    } catch (err) {
      console.error(err)
      alert('Nộp báo cáo thất bại.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && weeklyReports.length === 0) {
    return (
      <div className="flex justify-center p-20 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00] mr-2" /> Đang tải báo cáo tuần...
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1E1E24] via-[#2D2D38] to-[#1E1E26] text-white rounded-3xl p-8 shadow-xl border border-gray-800/80">
        <div className="relative z-10 max-w-xl">
          <span className="bg-[#FF6B00] px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm flex items-center gap-1.5 w-max">
            <Calendar className="w-3.5 h-3.5" />
            Weekly Check-ins & AI Diagnostics
          </span>
          <h1 className="text-3xl font-black mt-4 tracking-tight leading-none text-white">
            Báo cáo tuần & Chẩn đoán AI 📊
          </h1>
          <p className="text-sm text-gray-300 mt-3 font-medium opacity-90 leading-relaxed">
            {role === 'manager' 
              ? 'Giám sát báo cáo tiến độ tuần của tất cả các nhóm khởi nghiệp và xem phân tích tóm tắt tự động bằng AI.' 
              : 'Trưởng nhóm báo cáo thành quả, kế hoạch tuần tới và nhận các đề xuất tháo gỡ khó khăn từ Gemini AI.'}
          </p>
        </div>
        <div className="absolute right-8 bottom-0 top-0 opacity-10 w-1/4 flex items-center justify-center pointer-events-none">
          <span className="text-9xl">📅</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* LEFT PANEL: Student Submit Form or filtering options */}
        <div className="md:col-span-1 space-y-6">
          {role === 'member' ? (
            <Card>
              <h3 className="font-bold text-gray-800 text-sm border-b pb-2 mb-4 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#FF6B00]" />
                Nộp báo cáo tuần mới
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Chọn nhóm dự án *
                  </label>
                  <select
                    value={selectedTeamId}
                    onChange={e => setSelectedTeamId(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] bg-white font-bold"
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Tuần báo cáo (Số)*
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    required
                    value={weekNumber}
                    onChange={e => setWeekNumber(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Thành quả trong tuần (Achievements) *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Ví dụ: Đã khảo sát 50 khách hàng, thiết lập xong Figma mockup..."
                    value={achievements}
                    onChange={e => setAchievements(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Kế hoạch tuần tới *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Ví dụ: Chạy thử sản phẩm demo (MVP), thiết kế bộ nhận diện thương hiệu..."
                    value={plans}
                    onChange={e => setPlans(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Khó khăn gặp phải (Blockers) *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Ví dụ: Chưa tiếp cận được nhà bán lẻ, thiếu lập trình viên backend..."
                    value={blockers}
                    onChange={e => setBlockers(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-gradient-to-r from-[#FF6B00] to-[#FF801A] text-white text-[11px] font-bold rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang phân tích & nộp...
                    </>
                  ) : (
                    'Nộp báo cáo cho Giảng viên'
                  )}
                </button>
              </form>
            </Card>
          ) : (
            <Card>
              <h3 className="font-bold text-gray-800 text-sm border-b pb-2 mb-4">
                Bộ lọc Giám sát Nhóm
              </h3>
              <p className="text-[10px] text-gray-500 leading-relaxed mb-4">
                Giảng viên có thể xem tổng hợp báo cáo của tất cả các nhóm trong lớp hoặc lọc cụ thể theo mã dự án của nhóm khởi nghiệp bên dưới.
              </p>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                  Chọn lọc theo Nhóm
                </label>
                <select
                  value={selectedTeamId}
                  onChange={e => setSelectedTeamId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF6B00] bg-white font-bold text-gray-700"
                >
                  <option value="">Tất cả các nhóm</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </Card>
          )}
        </div>

        {/* RIGHT PANEL: History logs & AI Diagnostics summaries */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <h3 className="font-bold text-gray-800 text-sm border-b pb-2 mb-4 flex items-center gap-1.5">
              <span>📋</span> Nhật ký báo cáo & Cố vấn AI
            </h3>

            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
              {weeklyReports.length > 0 ? (
                weeklyReports.map(report => (
                  <div key={report.id} className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100 hover:border-orange-100 transition duration-300 space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <div>
                        <span className="font-black text-xs text-gray-800">{report.team?.name}</span>
                        <span className="text-[9px] text-gray-400 block font-semibold">
                          Lớp liên kết: {report.team?.classCode || 'Tự do'}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 bg-orange-50 text-[#FF6B00] text-[10px] font-black rounded-lg border border-orange-100">
                        Tuần {report.weekNumber}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="font-bold text-green-700 block mb-1">✓ Thành tựu:</span>
                        <p className="text-gray-600 leading-normal text-[11px]">{report.achievements}</p>
                      </div>
                      <div>
                        <span className="font-bold text-blue-700 block mb-1">🎯 Kế hoạch:</span>
                        <p className="text-gray-600 leading-normal text-[11px]">{report.plans}</p>
                      </div>
                      <div>
                        <span className="font-bold text-red-600 block mb-1">⚠ Khó khăn:</span>
                        <p className="text-gray-600 leading-normal text-[11px]">{report.blockers}</p>
                      </div>
                    </div>

                    {report.aiSummary && (
                      <div className="p-4 rounded-xl border border-amber-200/50 bg-amber-50/5 shadow-inner space-y-2 text-[11px] text-gray-600 leading-relaxed font-medium">
                        <div className="font-bold text-amber-700 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 shrink-0" />
                          Phân tích & Lời khuyên cố vấn từ Gemini AI:
                        </div>
                        <p>{report.aiSummary}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400 text-xs font-semibold">
                  📭 Chưa có báo cáo tiến độ tuần nào được gửi.
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>

    </div>
  )
}
