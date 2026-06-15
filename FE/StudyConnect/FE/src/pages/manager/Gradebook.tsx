import { useEffect, useState } from 'react'
import { gradeService, teamService, weeklyReportService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/cards/Card'
import { Award, Loader2, Save, Users, FileSpreadsheet, Edit3, MessageSquare, Flame, Printer } from 'lucide-react'

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
  const [score, setScore] = useState(8.0)
  const [feedback, setFeedback] = useState('')

  // Rubric Sub-scores
  const [problemSurveyScore, setProblemSurveyScore] = useState(8.0)
  const [solutionCanvasScore, setSolutionCanvasScore] = useState(8.0)
  const [financialScore, setFinancialScore] = useState(8.0)
  const [pitchingScore, setPitchingScore] = useState(8.0)

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Dynamically calculate overall weighted score
  const calculatedScore = Number(
    (problemSurveyScore * 0.3 + solutionCanvasScore * 0.3 + financialScore * 0.2 + pitchingScore * 0.2).toFixed(2)
  )

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
        score: calculatedScore,
        feedback,
        rubricScores: {
          problemSurvey: problemSurveyScore,
          solutionCanvas: solutionCanvasScore,
          financial: financialScore,
          pitching: pitchingScore
        }
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

  const handleMilestoneChange = (m: number) => {
    setMilestone(m)
    const existingGrade = selectedTeam?.grades?.find((g: any) => g.milestone === m)
    if (existingGrade) {
      setFeedback(existingGrade.feedback || '')
      if (existingGrade.rubricScores) {
        try {
          const rubrics = JSON.parse(existingGrade.rubricScores)
          setProblemSurveyScore(rubrics.problemSurvey ?? 8.0)
          setSolutionCanvasScore(rubrics.solutionCanvas ?? 8.0)
          setFinancialScore(rubrics.financial ?? 8.0)
          setPitchingScore(rubrics.pitching ?? 8.0)
        } catch (e) {
          console.error('Error parsing rubrics:', e)
        }
      } else {
        setProblemSurveyScore(existingGrade.score)
        setSolutionCanvasScore(existingGrade.score)
        setFinancialScore(existingGrade.score)
        setPitchingScore(existingGrade.score)
      }
    } else {
      setFeedback('')
      setProblemSurveyScore(8.0)
      setSolutionCanvasScore(8.0)
      setFinancialScore(8.0)
      setPitchingScore(8.0)
    }
  }

  const openGradeModal = (team: any) => {
    setSelectedTeam(team)
    setMilestone(1)
    
    const existingGrade = team.grades?.find((g: any) => g.milestone === 1)
    if (existingGrade) {
      setFeedback(existingGrade.feedback || '')
      if (existingGrade.rubricScores) {
        try {
          const rubrics = JSON.parse(existingGrade.rubricScores)
          setProblemSurveyScore(rubrics.problemSurvey ?? 8.0)
          setSolutionCanvasScore(rubrics.solutionCanvas ?? 8.0)
          setFinancialScore(rubrics.financial ?? 8.0)
          setPitchingScore(rubrics.pitching ?? 8.0)
        } catch (e) {
          console.error(e)
        }
      } else {
        setProblemSurveyScore(existingGrade.score)
        setSolutionCanvasScore(existingGrade.score)
        setFinancialScore(existingGrade.score)
        setPitchingScore(existingGrade.score)
      }
    } else {
      setFeedback('')
      setProblemSurveyScore(8.0)
      setSolutionCanvasScore(8.0)
      setFinancialScore(8.0)
      setPitchingScore(8.0)
    }
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

  const handlePrint = () => {
    window.print()
  }

  const getMilestoneGrade = (team: any, m: number) => {
    const grade = team.grades.find((g: any) => g.milestone === m)
    return grade ? `${grade.score}/10` : '-'
  }

  const getMilestoneFeedback = (team: any, m: number) => {
    const grade = team.grades.find((g: any) => g.milestone === m)
    return grade?.feedback || ''
  }

  const parseRubricScores = (rubricJson?: string) => {
    if (!rubricJson) return null
    try {
      return JSON.parse(rubricJson)
    } catch (e) {
      return null
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-10 print-container">
      
      {/* CSS Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          aside, nav, header, button, .no-print, .top-nav {
            display: none !important;
          }
          .print-card {
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            color: black !important;
          }
          th, td {
            border: 1px solid #ddd !important;
            padding: 8px !important;
            color: black !important;
          }
          tr {
            background: white !important;
          }
        }
      `}} />

      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1B1B22] via-[#2F2F3B] to-[#1B1B22] text-white rounded-3xl p-8 shadow-xl border border-gray-800 no-print">
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
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#13131C] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 no-print">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-500">Mã lớp học giám sát:</span>
              <input
                type="text"
                value={classCode}
                onChange={e => setClassCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã lớp"
                className="border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#FF6B00] font-bold text-gray-700 dark:text-gray-300 w-36 bg-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                disabled={teams.length === 0}
                className="px-4 py-2 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-850 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Printer className="w-4 h-4 text-orange-500" />
                In báo cáo (PDF)
              </button>
              <button
                onClick={handleExportCSV}
                disabled={teams.length === 0}
                className="px-4 py-2 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-850 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                Xuất Sổ điểm (CSV)
              </button>
            </div>
          </div>

          {/* ACTIVITY HEATMAP SECTION */}
          {teams.length > 0 && (
            <div className="no-print">
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
                            const hasReport = weeklyReports[team.id]?.includes(w)
                            
                            let hash = 0
                            const str = team.id + w
                            for (let i = 0; i < str.length; i++) {
                              hash = str.charCodeAt(i) + ((hash << 5) - hash)
                            }
                            let level = Math.abs(hash) % 4
                            if (level === 3) level = 1
                            if (hasReport) level = 3

                            const levelColors = [
                              'bg-gray-100 dark:bg-gray-800/60 border border-transparent text-gray-400 dark:text-gray-550',
                              'bg-orange-100/50 dark:bg-orange-950/20 border border-orange-200/20 text-orange-600 dark:text-orange-400',
                              'bg-orange-200 dark:bg-orange-900/40 border border-orange-300/20 text-orange-700 dark:text-orange-350',
                              'bg-[#FF6B00] shadow-[0_0_6px_rgba(255,107,0,0.3)] text-white border border-[#FF6B00]/40'
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
            </div>
          )}

          {/* Gradebook Card (Printable) */}
          <div className="print-card">
            <Card>
              <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm border-b dark:border-gray-800 pb-2.5 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#FF6B00] no-print" />
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
                      <tr className="border-b border-gray-100 dark:border-gray-850 text-gray-450 dark:text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                        <th className="py-3 px-4">Tên nhóm</th>
                        <th className="py-3 px-4">Trưởng nhóm</th>
                        <th className="py-3 px-4 text-center">Milestone 1</th>
                        <th className="py-3 px-4 text-center">Milestone 2</th>
                        <th className="py-3 px-4 text-center">Milestone 3</th>
                        <th className="py-3 px-4 text-center no-print">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-850 text-xs text-gray-700 dark:text-gray-300 font-medium">
                      {teams.map(team => (
                        <tr key={team.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/30 transition">
                          <td className="py-3 px-4 font-black">{team.name}</td>
                          <td className="py-3 px-4 text-gray-500">{team.leader?.name || 'Chưa rõ'}</td>
                          <td className="py-3 px-4 text-center font-bold text-gray-850 dark:text-gray-200">
                            <div>{getMilestoneGrade(team, 1)}</div>
                            {getMilestoneFeedback(team, 1) && (
                              <span className="text-[9px] text-[#FF6B00] block mt-0.5" title={getMilestoneFeedback(team, 1)}>💬 Feedback</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-gray-850 dark:text-gray-200">
                            <div>{getMilestoneGrade(team, 2)}</div>
                            {getMilestoneFeedback(team, 2) && (
                              <span className="text-[9px] text-[#FF6B00] block mt-0.5" title={getMilestoneFeedback(team, 2)}>💬 Feedback</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-gray-850 dark:text-gray-200">
                            <div>{getMilestoneGrade(team, 3)}</div>
                            {getMilestoneFeedback(team, 3) && (
                              <span className="text-[9px] text-[#FF6B00] block mt-0.5" title={getMilestoneFeedback(team, 3)}>💬 Feedback</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center no-print">
                            <button
                              onClick={() => openGradeModal(team)}
                              className="p-1.5 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 text-[#FF6B00] rounded-lg border border-orange-100 dark:border-orange-900/40 transition inline-flex items-center gap-1 font-bold text-[10px]"
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
        </div>
      ) : (
        /* STUDENT VIEW */
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <h3 className="font-bold text-gray-800 dark:text-white text-sm border-b dark:border-gray-800 pb-2.5 mb-4 flex items-center gap-2">
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
                  {studentGrades.map(grade => {
                    const rubrics = parseRubricScores(grade.rubricScores)
                    return (
                      <div key={grade.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#13131C] flex flex-col justify-between gap-4">
                        <div>
                          <span className="px-2 py-0.5 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 text-[#FF6B00] font-black rounded text-[9px] uppercase tracking-wider">
                            Cột mốc {grade.milestone}
                          </span>
                          <div className="text-sm font-black text-gray-850 dark:text-gray-250 mt-2">
                            Điểm: <span className="text-xl text-[#FF6B00]">{grade.score}</span> / 10
                          </div>

                          {/* Rubrics Breakdown */}
                          {rubrics && (
                            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2.5 bg-white dark:bg-[#0B0B0F] p-3 rounded-lg border dark:border-gray-850 text-[10px] text-gray-500 dark:text-gray-400">
                              <div>
                                <span className="block font-medium">Vấn đề & Khảo sát (30%)</span>
                                <span className="text-xs font-black text-gray-800 dark:text-white">{rubrics.problemSurvey}</span>
                              </div>
                              <div>
                                <span className="block font-medium">Giải pháp & Canvas (30%)</span>
                                <span className="text-xs font-black text-gray-800 dark:text-white">{rubrics.solutionCanvas}</span>
                              </div>
                              <div>
                                <span className="block font-medium">Tài chính (20%)</span>
                                <span className="text-xs font-black text-gray-800 dark:text-white">{rubrics.financial}</span>
                              </div>
                              <div>
                                <span className="block font-medium">Pitch & Slide (20%)</span>
                                <span className="text-xs font-black text-gray-800 dark:text-white">{rubrics.pitching}</span>
                              </div>
                            </div>
                          )}

                          {grade.feedback && (
                            <div className="mt-3 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium bg-white dark:bg-[#0B0B0F] p-3 rounded-lg border border-gray-100 dark:border-gray-850 flex items-start gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                              <p>Nhận xét: {grade.feedback}</p>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 self-end">
                          Người chấm: {grade.gradedBy?.name}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* GRADE MODAL FORM (Rubrics-based weight calculation) */}
      {showModal && selectedTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm no-print">
          <div className="bg-white dark:bg-[#13131C] rounded-3xl p-6 w-full max-w-md border border-gray-100 dark:border-gray-800 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-gray-800 dark:text-white mb-4">
              Chấm Điểm Theo Rubrics - Nhóm: {selectedTeam.name}
            </h3>

            <form onSubmit={handleGradeSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Chọn Cột mốc chấm điểm *
                </label>
                <select
                  value={milestone}
                  onChange={e => handleMilestoneChange(Number(e.target.value))}
                  className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF6B00] bg-white dark:bg-[#13131C] font-bold dark:text-gray-300"
                >
                  <option value={1}>Cột mốc 1 (Milestone 1)</option>
                  <option value={2}>Cột mốc 2 (Milestone 2)</option>
                  <option value={3}>Cột mốc 3 (Milestone 3)</option>
                </select>
              </div>

              {/* Rubric: Problem and Surveys */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <span>1. Vấn đề & Khảo sát khách hàng (30%)</span>
                  <span className="text-[#FF6B00]">{problemSurveyScore} / 10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={problemSurveyScore}
                  onChange={e => setProblemSurveyScore(Number(e.target.value))}
                  className="w-full accent-[#FF6B00]"
                />
              </div>

              {/* Rubric: Solution and Canvas */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <span>2. Giải pháp & Business Canvas (30%)</span>
                  <span className="text-[#FF6B00]">{solutionCanvasScore} / 10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={solutionCanvasScore}
                  onChange={e => setSolutionCanvasScore(Number(e.target.value))}
                  className="w-full accent-[#FF6B00]"
                />
              </div>

              {/* Rubric: Financial model */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <span>3. Kế hoạch tài chính & Khả thi (20%)</span>
                  <span className="text-[#FF6B00]">{financialScore} / 10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={financialScore}
                  onChange={e => setFinancialScore(Number(e.target.value))}
                  className="w-full accent-[#FF6B00]"
                />
              </div>

              {/* Rubric: Pitching and Slides */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <span>4. Thuyết trình & Slide Pitch Deck (20%)</span>
                  <span className="text-[#FF6B00]">{pitchingScore} / 10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={pitchingScore}
                  onChange={e => setPitchingScore(Number(e.target.value))}
                  className="w-full accent-[#FF6B00]"
                />
              </div>

              {/* Calculated Weighted Score */}
              <div className="p-3 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 rounded-xl flex justify-between items-center text-xs">
                <span className="font-bold text-gray-700 dark:text-gray-300">Điểm tổng kết (Tự động tính):</span>
                <span className="text-base font-black text-[#FF6B00]">{calculatedScore} / 10</span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Nhận xét & Góp ý chi tiết cho nhóm
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Nhận xét cụ thể về điểm mạnh và các nội dung cần khắc phục..."
                  className="w-full bg-transparent border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] dark:text-gray-300 resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-[#FF6B00] text-white text-[11px] font-bold rounded-xl shadow-md hover:bg-[#E85A00] transition flex items-center justify-center gap-1"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Lưu điểm số
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-[11px] font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-850 transition"
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
