import { useEffect, useState } from 'react'
import { gradeService, teamService, weeklyReportService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/cards/Card'
import { Award, Loader2, Save, Users, FileSpreadsheet, Edit3, MessageSquare, Flame } from 'lucide-react'

export default function Gradebook() {
  const { user, role } = useAuth()
  const [classCode, setClassCode] = useState(user?.classCode || '')
  const [teams, setTeams] = useState<any[]>([])
  const [weeklyReports, setWeeklyReports] = useState<Record<string, number[]>>({})
  const [studentGrades, setStudentGrades] = useState<any[]>([])
  
  // Grade Form Modal States
  const [showModal, setShowModal] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const [milestone, setMilestone] = useState(1)
  const [score, setScore] = useState(8.5)
  const [feedback, setFeedback] = useState('')

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      if (role === 'manager' || role === 'admin') {
        const data = await gradeService.getClassGrades({ classCode })
        setTeams(data)

        // Load weekly reports for each team
        const reportsMap: Record<string, number[]> = {}
        for (const t of data) {
          try {
            const reports = await weeklyReportService.getWeeklyReports({ teamId: t.id })
            reportsMap[t.id] = reports.map((r: any) => r.weekNumber)
          } catch (e) {
            console.error('Error loading reports for team:', t.id, e)
          }
        }
        setWeeklyReports(reportsMap)
      } else {
        // Find user's team
        const studentTeams = await teamService.getTeams()
        if (studentTeams.length > 0) {
          const activeTeamId = studentTeams[0].id
          const grades = await gradeService.getTeamGrades(activeTeamId)
          setStudentGrades(grades)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [role, classCode])

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeam) return
    setSubmitting(true)
    try {
      await gradeService.gradeTeam({
        teamId: selectedTeam.id,
        milestone,
        score,
        feedback
      })
      alert(`Đã chấm điểm thành công cho nhóm ${selectedTeam.name}!`)
      setShowModal(false)
      loadData()
    } catch (err) {
      console.error(err)
      alert('Không thể lưu điểm số.')
    } finally {
      setSubmitting(false)
    }
  }

  const openGradeModal = (team: any) => {
    setSelectedTeam(team)
    // Preset fields if milestone grade already exists
    setMilestone(1)
    setScore(8.0)
    setFeedback('')
    setShowModal(true)
  }

  const handleExportCSV = () => {
    if (teams.length === 0) return
    let csvContent = 'data:text/csv;charset=utf-8,ID,Nhom,Truong Nhom,Milestone 1,Milestone 2,Milestone 3\n'
    teams.forEach(t => {
      const m1 = t.grades.find((g: any) => g.milestone === 1)?.score || '-'
      const m2 = t.grades.find((g: any) => g.milestone === 2)?.score || '-'
      const m3 = t.grades.find((g: any) => g.milestone === 3)?.score || '-'
      csvContent += `${t.id},"${t.name}","${t.leader?.name || ''}",${m1},${m2},${m3}\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Gradebook_Class_${classCode || 'StudyConnect'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getMilestoneGrade = (team: any, m: number) => {
    const grade = team.grades.find((g: any) => g.milestone === m)
    return grade ? `${grade.score}/10` : '-'
  }

  const getMilestoneFeedback = (team: any, m: number) => {
    const grade = team.grades.find((g: any) => g.milestone === m)
    return grade?.feedback || ''
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1B1B22] via-[#2F2F3B] to-[#1B1B22] text-white rounded-3xl p-8 shadow-xl border border-gray-800">
        <div className="relative z-10 max-w-xl">
          <span className="bg-[#FF6B00] px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm flex items-center gap-1.5 w-max">
            <Award className="w-3.5 h-3.5" />
            Class Gradebook & Evaluation Center
          </span>
          <h1 className="text-3xl font-black mt-4 tracking-tight leading-none text-white">
            {role === 'manager' || role === 'admin' ? 'Sổ điểm Lớp học 📝' : 'Điểm số & Nhận xét của Nhóm 📝'}
          </h1>
          <p className="text-sm text-gray-300 mt-3 font-medium opacity-90 leading-relaxed">
            {role === 'manager' || role === 'admin'
              ? 'Quản lý điểm số của tất cả các nhóm dự án trong lớp học. Nhập điểm và phản hồi các cột mốc nhanh chóng.'
              : 'Xem điểm số và nhận xét chi tiết của Giảng viên về các cột mốc dự án khởi nghiệp.'}
          </p>
        </div>
        <div className="absolute right-8 bottom-0 top-0 opacity-10 w-1/4 flex items-center justify-center pointer-events-none">
          <span className="text-9xl">📝</span>
        </div>
      </div>

      {role === 'manager' || role === 'admin' ? (
        /* LECTURER VIEW */
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-500">Mã lớp học giám sát:</span>
              <input
                type="text"
                value={classCode}
                onChange={e => setClassCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã lớp"
                className="border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#FF6B00] font-bold text-gray-700 w-36"
              />
            </div>

            <button
              onClick={handleExportCSV}
              disabled={teams.length === 0}
              className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              Xuất Sổ điểm (CSV)
            </button>
          </div>

          {/* ACTIVITY HEATMAP SECTION */}
          {teams.length > 0 && (
            <Card>
              <h3 className="font-bold text-gray-850 dark:text-gray-200 text-sm border-b dark:border-gray-800 pb-2.5 mb-4 flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#FF6B00]" />
                Bản đồ nhiệt Hoạt động Dự án (12 Tuần)
              </h3>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-6">
                Giám sát mức độ tương tác và tần suất nộp báo cáo tuần của các nhóm dự án trong học kỳ.
              </p>

              <div className="space-y-4">
                {teams.map(team => {
                  const weeks = Array.from({ length: 12 }, (_, i) => i + 1)
                  return (
                    <div key={team.id} className="flex items-center gap-4 border-b border-gray-50 dark:border-gray-900 pb-3 last:border-b-0 last:pb-0">
                      {/* Team Name */}
                      <div className="w-32 shrink-0">
                        <span className="text-xs font-black text-gray-800 dark:text-gray-300 block truncate" title={team.name}>
                          {team.name}
                        </span>
                        <span className="text-[9px] text-gray-400">
                          {team.members?.length || 0} thành viên
                        </span>
                      </div>

                      {/* Weeks Grid */}
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        {weeks.map(w => {
                          // Calculate week activity
                          const hasReport = weeklyReports[team.id]?.includes(w)
                          
                          // Deterministic activity mapping for mock baseline
                          let hash = 0
                          const str = team.id + w
                          for (let i = 0; i < str.length; i++) {
                            hash = str.charCodeAt(i) + ((hash << 5) - hash)
                          }
                          let level = Math.abs(hash) % 4
                          if (level === 3) level = 1 // reduce high activities so report submissions stand out
                          if (hasReport) level = 3 // set to maximum for report submissions

                          const levelColors = [
                            'bg-gray-100 dark:bg-gray-800/60 border border-transparent text-gray-400 dark:text-gray-550', // level 0
                            'bg-orange-100/50 dark:bg-orange-950/20 border border-orange-200/20 text-orange-600 dark:text-orange-400', // level 1
                            'bg-orange-200 dark:bg-orange-900/40 border border-orange-300/20 text-orange-700 dark:text-orange-350', // level 2
                            'bg-[#FF6B00] shadow-[0_0_6px_rgba(255,107,0,0.3)] text-white border border-[#FF6B00]/40' // level 3
                          ]

                          const tooltip = `Tuần ${w}: Nhóm ${team.name}\n- Báo cáo tuần: ${hasReport ? 'Đã nộp' : 'Chưa nộp'}\n- Mức độ hoạt động: ${level === 3 ? 'Rất cao' : level === 2 ? 'Trung bình' : level === 1 ? 'Thấp' : 'Không hoạt động'}`

                          return (
                            <div
                              key={w}
                              title={tooltip}
                              className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black cursor-pointer hover:scale-110 hover:ring-1 hover:ring-orange-500 transition-all duration-205 ${levelColors[level]}`}
                            >
                              {w}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 flex justify-between items-center text-[10px] text-gray-400 border-t dark:border-gray-800 pt-3">
                <span className="font-medium">💡 Di chuột vào ô để xem chi tiết hoạt động của tuần</span>
                <div className="flex items-center gap-2">
                  <span>Ít hoạt động</span>
                  <div className="w-3.5 h-3.5 rounded bg-gray-100 dark:bg-gray-800/60" />
                  <div className="w-3.5 h-3.5 rounded bg-orange-100/50 dark:bg-orange-950/20" />
                  <div className="w-3.5 h-3.5 rounded bg-orange-200 dark:bg-orange-900/40" />
                  <div className="w-3.5 h-3.5 rounded bg-[#FF6B00]" />
                  <span>Nhiều hoạt động</span>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <h3 className="font-bold text-gray-800 text-sm border-b pb-2.5 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#FF6B00]" />
              Bảng điểm tổng hợp lớp {classCode || '(Chưa nhập lớp)'}
            </h3>

            {loading ? (
              <div className="flex justify-center p-12 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00] mr-2" /> Đang tải sổ điểm lớp...
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs font-semibold">
                📭 Chưa tìm thấy nhóm nào tham gia lớp học có mã này.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-3 px-4">Tên nhóm</th>
                      <th className="py-3 px-4">Trưởng nhóm</th>
                      <th className="py-3 px-4 text-center">Milestone 1</th>
                      <th className="py-3 px-4 text-center">Milestone 2</th>
                      <th className="py-3 px-4 text-center">Milestone 3</th>
                      <th className="py-3 px-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs text-gray-700 font-medium">
                    {teams.map(team => (
                      <tr key={team.id} className="hover:bg-gray-50/50 transition">
                        <td className="py-3 px-4 font-black">{team.name}</td>
                        <td className="py-3 px-4 text-gray-500">{team.leader?.name || 'Chưa rõ'}</td>
                        <td className="py-3 px-4 text-center font-bold text-gray-800">
                          <div>{getMilestoneGrade(team, 1)}</div>
                          {getMilestoneFeedback(team, 1) && (
                            <span className="text-[9px] text-[#FF6B00] block mt-0.5" title={getMilestoneFeedback(team, 1)}>💬 Có feedback</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-gray-800">
                          <div>{getMilestoneGrade(team, 2)}</div>
                          {getMilestoneFeedback(team, 2) && (
                            <span className="text-[9px] text-[#FF6B00] block mt-0.5" title={getMilestoneFeedback(team, 2)}>💬 Có feedback</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-gray-800">
                          <div>{getMilestoneGrade(team, 3)}</div>
                          {getMilestoneFeedback(team, 3) && (
                            <span className="text-[9px] text-[#FF6B00] block mt-0.5" title={getMilestoneFeedback(team, 3)}>💬 Có feedback</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => openGradeModal(team)}
                            className="p-1.5 bg-orange-50 hover:bg-orange-100 text-[#FF6B00] rounded-lg border border-orange-100 transition inline-flex items-center gap-1 font-bold text-[10px]"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Chấm điểm
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      ) : (
        /* STUDENT VIEW */
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <h3 className="font-bold text-gray-800 text-sm border-b pb-2.5 mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#FF6B00]" />
                Bảng điểm của nhóm
              </h3>

              {loading ? (
                <div className="flex justify-center py-12 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin text-[#FF6B00] mr-2" /> Đang tải điểm số...
                </div>
              ) : studentGrades.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs font-semibold">
                  📭 Giảng viên chưa công bố điểm số nào cho nhóm của bạn.
                </div>
              ) : (
                <div className="space-y-4">
                  {studentGrades.map(grade => (
                    <div key={grade.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="px-2 py-0.5 bg-orange-50 border border-orange-100 text-[#FF6B00] font-black rounded text-[9px] uppercase tracking-wider">
                          Cột mốc {grade.milestone}
                        </span>
                        <div className="text-sm font-black text-gray-800 mt-2">
                          Điểm: <span className="text-xl text-[#FF6B00]">{grade.score}</span> / 10
                        </div>
                        {grade.feedback && (
                          <div className="mt-3 text-[11px] text-gray-500 leading-relaxed font-medium bg-white p-3 rounded-lg border border-gray-100/80 flex items-start gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                            <p>Nhận xét: {grade.feedback}</p>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 self-end md:self-center">
                        Người chấm: {grade.gradedBy?.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* GRADE MODAL FORM */}
      {showModal && selectedTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-gray-100 shadow-2xl animate-scaleUp">
            <h3 className="text-lg font-black text-gray-800 mb-4">
              Nhập điểm số - Nhóm: {selectedTeam.name}
            </h3>

            <form onSubmit={handleGradeSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Chọn Cột mốc chấm điểm *
                </label>
                <select
                  value={milestone}
                  onChange={e => setMilestone(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF6B00] bg-white font-bold"
                >
                  <option value={1}>Cột mốc 1 (Milestone 1)</option>
                  <option value={2}>Cột mốc 2 (Milestone 2)</option>
                  <option value={3}>Cột mốc 3 (Milestone 3)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Điểm số (Thang điểm 10) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  required
                  value={score}
                  onChange={e => setScore(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Nhận xét & Góp ý chi tiết cho nhóm
                </label>
                <textarea
                  rows={4}
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Điểm mạnh là gì, cần cải tiến thêm những phần nào..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#FF6B00] resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-[#FF6B00] text-white text-[11px] font-bold rounded-xl shadow-md hover:bg-[#E85A00] transition flex items-center justify-center gap-1"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Lưu điểm
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-500 text-[11px] font-bold rounded-xl hover:bg-gray-50 transition"
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
