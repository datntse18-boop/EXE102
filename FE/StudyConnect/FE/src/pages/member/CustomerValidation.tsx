import { useEffect, useState } from 'react'
import { teamService, projectService, surveyService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/cards/Card'
import {
  Plus,
  Loader2,
  Sparkles,
  Star,
  MessageSquare,
  Compass,
  FileText,
  BarChart2,
  Users,
  AlertCircle
} from 'lucide-react'

export default function CustomerValidation() {
  const { user } = useAuth()
  
  // Projects & Team States
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Surveys States
  const [surveys, setSurveys] = useState<any[]>([])
  const [respondentName, setRespondentName] = useState('')
  const [demographics, setDemographics] = useState('')
  const [feedbackText, setFeedbackText] = useState('')
  const [willPayRate, setWillPayRate] = useState(3)
  const [addingSurvey, setAddingSurvey] = useState(false)

  // AI Analysis State
  const [analyzing, setAnalyzing] = useState(false)
  const [aiReport, setAiReport] = useState<any>(null)

  // Load teams and select first
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

  // Load project & surveys for team
  useEffect(() => {
    if (!selectedTeamId) return
    const fetchProjectAndSurveys = async () => {
      setLoading(true)
      try {
        const projData = await projectService.getProjects({ teamId: selectedTeamId })
        if (projData.length > 0) {
          const activeProj = projData[0]
          setProject(activeProj)
          
          // Load surveys
          const surveyData = await surveyService.getSurveys(activeProj.id)
          setSurveys(surveyData)
          setAiReport(null) // Reset analysis report on team change
        } else {
          setProject(null)
          setSurveys([])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProjectAndSurveys()
  }, [selectedTeamId])

  const handleAddSurvey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return
    if (!feedbackText.trim()) {
      alert('Vui lòng nhập phản hồi của khách hàng.')
      return
    }

    setAddingSurvey(true)
    try {
      const data = await surveyService.addSurvey(project.id, {
        respondentName: respondentName || 'Khách hàng ẩn danh',
        demographics: demographics || 'Chưa xác định',
        feedbackText,
        willPayRate
      })
      setSurveys(prev => [data, ...prev])
      setRespondentName('')
      setDemographics('')
      setFeedbackText('')
      setWillPayRate(3)
      alert('Đã thêm khảo sát khách hàng thành công!')
    } catch (err) {
      console.error(err)
      alert('Không thể lưu phản hồi khảo sát.')
    } finally {
      setAddingSurvey(false)
    }
  }

  const handleRunAIAnalysis = async () => {
    if (!project || surveys.length === 0) return
    setAnalyzing(true)
    try {
      const data = await surveyService.analyzeSurveys(project.id)
      setAiReport(data)
    } catch (err) {
      console.error(err)
      alert('AI Phân tích thất bại. Vui lòng kiểm tra API Key hoặc dữ liệu khảo sát.')
    } finally {
      setAnalyzing(false)
    }
  }

  // Calculate local stats
  const totalSurveys = surveys.length
  const willingToPayCount = surveys.filter(s => s.willPayRate >= 4).length
  const localWillingRate = totalSurveys > 0 ? Math.round((willingToPayCount / totalSurveys) * 100) : 0

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1B1B22] via-[#2F2F3B] to-[#1B1B22] text-white rounded-3xl p-8 shadow-xl border border-gray-800">
        <div className="relative z-10 max-w-xl">
          <span className="bg-[#FF6B00] px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm flex items-center gap-1.5 w-max">
            <Users className="w-3.5 h-3.5" />
            Customer Validation Center
          </span>
          <h1 className="text-3xl font-black mt-4 tracking-tight leading-none text-white">
            Xác Thực & Khảo Sát Khách Hàng 👥
          </h1>
          <p className="text-sm text-gray-300 mt-3 font-medium opacity-90 leading-relaxed">
            Thu thập phản hồi phỏng vấn người dùng mục tiêu và chạy phân tích AI để xác định chỉ số Problem-Solution Fit trước ngày bảo vệ dự án.
          </p>
        </div>
        <div className="absolute right-8 bottom-0 top-0 opacity-10 w-1/4 flex items-center justify-center pointer-events-none">
          <span className="text-9xl">👥</span>
        </div>
      </div>

      {/* Select Team Panel */}
      <div className="flex items-center gap-3 bg-white dark:bg-[#13131C] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <span className="text-xs font-bold text-gray-500">Chọn nhóm dự án của bạn:</span>
        <select
          value={selectedTeamId}
          onChange={e => setSelectedTeamId(e.target.value)}
          className="border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#FF6B00] font-bold text-gray-700 dark:text-gray-300 bg-transparent"
        >
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center p-12 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00] mr-2" /> Đang tải thông tin dự án...
        </div>
      ) : !project ? (
        <div className="bg-white dark:bg-[#13131C] rounded-2xl border border-gray-100 dark:border-gray-800 p-20 flex flex-col items-center justify-center text-center text-gray-400 shadow-sm">
          <AlertCircle className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-3" />
          <h4 className="font-bold text-gray-700 dark:text-gray-300 text-xs">Chưa tạo dự án</h4>
          <p className="text-[10px] text-gray-400 mt-1">
            Nhóm của bạn chưa có dự án nào đang chạy. Vui lòng tạo dự án ở phần Workspace trước.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-5 gap-6">
          
          {/* LEFT COLUMN: Add Survey Log Form (2 cols) */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <h3 className="font-bold text-gray-850 dark:text-gray-200 text-sm border-b dark:border-gray-800 pb-2.5 mb-4 flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#FF6B00]" />
                Nhập phiếu khảo sát mới
              </h3>

              <form onSubmit={handleAddSurvey} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Tên người phỏng vấn/khách hàng
                  </label>
                  <input
                    type="text"
                    value={respondentName}
                    onChange={e => setRespondentName(e.target.value)}
                    placeholder="Ví dụ: Anh Hoàng Lâm (hoặc Ẩn danh)"
                    className="w-full bg-transparent border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#FF6B00] dark:text-gray-300 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Nhân khẩu học/Đối tượng
                  </label>
                  <input
                    type="text"
                    value={demographics}
                    onChange={e => setDemographics(e.target.value)}
                    placeholder="Ví dụ: Sinh viên, 20 tuổi, thích mua sắm online"
                    className="w-full bg-transparent border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#FF6B00] dark:text-gray-300 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Mức độ sẵn sàng trả tiền mua giải pháp (1-5) *
                  </label>
                  <div className="flex gap-2.5 pt-1.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setWillPayRate(star)}
                        className="transition hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= willPayRate ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-700'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Phản hồi/Ý kiến khách hàng chi tiết *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={feedbackText}
                    onChange={e => setFeedbackText(e.target.value)}
                    placeholder="Ví dụ: Phần mềm có ý tưởng hay, giao diện thân thiện, nhưng giá thuê bao tháng hơi cao đối với sinh viên. Tôi sẵn sàng chi khoảng 50k/tháng nếu có tính năng chia sẻ nhóm..."
                    className="w-full bg-transparent border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] dark:text-gray-300 resize-none font-medium leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={addingSurvey}
                  className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-[#FF6B00] text-white text-[11px] font-bold rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-60 flex items-center justify-center gap-1"
                >
                  {addingSurvey ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang ghi nhận...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Lưu phiếu khảo sát
                    </>
                  )}
                </button>
              </form>
            </Card>
          </div>

          {/* RIGHT COLUMN: Survey List and AI Diagnostics (3 cols) */}
          <div className="md:col-span-3 space-y-6">
            
            {/* Stats Dashboard */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="text-center p-4">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Tổng khảo sát</span>
                <p className="text-2xl font-black text-gray-800 dark:text-white mt-1">{totalSurveys}</p>
              </Card>
              <Card className="text-center p-4">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Tỉ lệ quan tâm</span>
                <p className="text-2xl font-black text-green-600 mt-1">{localWillingRate}%</p>
              </Card>
              <Card className="text-center p-4">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Trạng thái</span>
                <span className="inline-block mt-2 px-2.5 py-0.5 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/40 rounded text-[9px] font-black uppercase tracking-wider">
                  Đang thu thập
                </span>
              </Card>
            </div>

            {/* AI Report Panel */}
            {surveys.length > 0 && (
              <Card>
                <div className="flex justify-between items-center border-b dark:border-gray-800 pb-2.5 mb-4">
                  <h3 className="font-bold text-gray-850 dark:text-gray-200 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
                    AI Diagnostics Hub (Phân tích Khảo sát)
                  </h3>
                  <button
                    onClick={handleRunAIAnalysis}
                    disabled={analyzing}
                    className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-gray-950 transition flex items-center gap-1 disabled:opacity-50"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> AI đang đối soát...
                      </>
                    ) : (
                      <>Chạy Phân tích AI</>
                    )}
                  </button>
                </div>

                {analyzing ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" />
                    <span className="text-xs text-gray-400 font-medium">Gemini đang đối soát dữ liệu và phân tích chỉ số Problem-Solution Fit...</span>
                  </div>
                ) : !aiReport ? (
                  <div className="py-10 text-center text-gray-400 text-xs font-semibold flex flex-col items-center justify-center gap-1 bg-gray-50/50 dark:bg-[#0B0B0F]/30 rounded-xl border border-dashed dark:border-gray-850">
                    <BarChart2 className="w-8 h-8 text-gray-300 dark:text-gray-750 mb-1" />
                    Bấm &quot;Chạy Phân tích AI&quot; để tổng hợp insights từ các phiếu khảo sát.
                  </div>
                ) : (
                  <div className="space-y-4 text-xs font-medium">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-orange-50/40 dark:bg-orange-950/15 border dark:border-orange-900/20 rounded-xl text-center">
                        <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Điểm khớp Vấn đề - Giải pháp</span>
                        <span className="text-xl font-black text-[#FF6B00]">{aiReport.fitScore} / 100</span>
                      </div>
                      <div className="p-3 bg-green-50/40 dark:bg-green-950/15 border dark:border-green-900/20 rounded-xl text-center">
                        <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Tỉ lệ sẵn sàng trả tiền (AI đánh giá)</span>
                        <span className="text-xl font-black text-green-600">{aiReport.willingToPayRate}%</span>
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <span className="font-bold text-[#FF6B00] block mb-1">💡 Phát hiện cốt lõi (Insights):</span>
                        <ul className="space-y-1.5 pl-4 list-disc text-gray-600 dark:text-gray-300">
                          {aiReport.keyInsights.map((insight: string, idx: number) => (
                            <li key={idx}>{insight}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-bold text-[#FF6B00] block mb-1">⚠️ Điểm đau khách hàng (Customer Pains):</span>
                        <ul className="space-y-1.5 pl-4 list-disc text-gray-600 dark:text-gray-300">
                          {aiReport.customerPains.map((pain: string, idx: number) => (
                            <li key={idx}>{pain}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-bold text-green-600 block mb-1">📈 Khuyến nghị từ cố vấn AI:</span>
                        <ul className="space-y-1.5 pl-4 list-disc text-gray-650 dark:text-gray-300">
                          {aiReport.recommendations.map((rec: string, idx: number) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-gray-55/40 dark:bg-[#0B0B0F] p-3.5 rounded-xl border dark:border-gray-850">
                        <span className="font-bold text-gray-700 dark:text-gray-200 block mb-1">🏁 Kết luận chung:</span>
                        <p className="text-gray-600 dark:text-gray-450 leading-relaxed italic">&quot;{aiReport.conclusion}&quot;</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Surveys log list */}
            <Card>
              <h3 className="font-bold text-gray-850 dark:text-gray-200 text-sm border-b dark:border-gray-800 pb-2.5 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-500" />
                Nhật ký Phỏng vấn Khách hàng
              </h3>

              {surveys.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs font-semibold">
                  📭 Chưa có phiếu khảo sát nào được lưu. Hãy nhập thông tin khách hàng ở cột bên trái.
                </div>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {surveys.map(survey => (
                    <div
                      key={survey.id}
                      className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-850 bg-gray-50/50 dark:bg-[#0B0B0F]/30 space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-black text-gray-800 dark:text-white">{survey.respondentName}</span>
                          <span className="text-[10px] text-gray-450 dark:text-gray-500 block">
                            Đối tượng: {survey.demographics}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= survey.willPayRate ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-850'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-650 dark:text-gray-300 font-medium leading-relaxed bg-white dark:bg-[#13131C] p-2.5 rounded-lg border dark:border-gray-850 flex items-start gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" />
                        <span>{survey.feedbackText}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

        </div>
      )}
    </div>
  )
}
