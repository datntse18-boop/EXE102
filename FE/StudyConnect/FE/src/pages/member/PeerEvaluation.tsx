import { useEffect, useState } from 'react'
import { teamService, evaluationService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/cards/Card'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { Star, Award, ShieldAlert, CheckCircle, Users, Clipboard, Loader2 } from 'lucide-react'

export default function PeerEvaluation() {
  const { user } = useAuth()
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [milestone, setMilestone] = useState(1)
  
  // Rating states
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [contribution, setContribution] = useState(25)
  const [professionalism, setProfessionalism] = useState(5)
  const [communication, setCommunication] = useState(5)
  const [punctuality, setPunctuality] = useState(5)
  const [qualityOfWork, setQualityOfWork] = useState(5)
  const [feedback, setFeedback] = useState('')

  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Fetch teams of user
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

  // Fetch team members when team changes
  useEffect(() => {
    if (!selectedTeamId) return
    const fetchMembers = async () => {
      setLoading(true)
      try {
        const membersData = await teamService.getTeamMembers(selectedTeamId)
        // Filter out current user
        const others = membersData.filter((m: any) => m.userId !== user?.id)
        setTeamMembers(others)
        if (others.length > 0) {
          setSelectedMemberId(others[0].userId)
        } else {
          setSelectedMemberId('')
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchMembers()
    loadSelfStats()
  }, [selectedTeamId])

  const loadSelfStats = async () => {
    if (!selectedTeamId) return
    setStatsLoading(true)
    try {
      const selfStats = await evaluationService.getEvaluationStats({
        teamId: selectedTeamId,
        userId: user?.id
      })
      setStats(selfStats)
    } catch (err) {
      console.error(err)
    } finally {
      setStatsLoading(false)
    }
  }

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeamId || !selectedMemberId) {
      alert('Vui lòng chọn thành viên để đánh giá.')
      return
    }

    setSubmitting(true)
    try {
      await evaluationService.submitEvaluation({
        evaluateeId: selectedMemberId,
        teamId: selectedTeamId,
        milestone,
        contribution,
        professionalism,
        communication,
        punctuality,
        qualityOfWork,
        feedback
      })

      alert('Gửi đánh giá đồng đội thành công! Cảm ơn bạn đã đóng góp ý kiến.')
      setFeedback('')
      // Select next member if available
      const currentIndex = teamMembers.findIndex(m => m.userId === selectedMemberId)
      if (currentIndex !== -1 && currentIndex < teamMembers.length - 1) {
        setSelectedMemberId(teamMembers[currentIndex + 1].userId)
      }
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || 'Gửi đánh giá thất bại. Bạn có thể đã đánh giá thành viên này rồi.')
    } finally {
      setSubmitting(false)
    }
  }

  // Radar chart data conversion
  const chartData = stats?.averages ? [
    { subject: 'Chuyên nghiệp', value: stats.averages.professionalism },
    { subject: 'Giao tiếp', value: stats.averages.communication },
    { subject: 'Đúng hạn', value: stats.averages.punctuality },
    { subject: 'Chất lượng', value: stats.averages.qualityOfWork }
  ] : []

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1B1B22] via-[#242430] to-[#1B1B22] text-white rounded-3xl p-8 shadow-xl border border-gray-800">
        <div className="relative z-10 max-w-xl">
          <span className="bg-[#FF6B00] px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm flex items-center gap-1.5 w-max">
            <Clipboard className="w-3.5 h-3.5" />
            360-Degree Peer Assessment
          </span>
          <h1 className="text-3xl font-black mt-4 tracking-tight leading-none text-white">
            Đánh giá đồng đội 360° 📊
          </h1>
          <p className="text-sm text-gray-300 mt-3 font-medium opacity-90 leading-relaxed">
            Đánh giá chéo đóng góp của các thành viên trong dự án nhóm và xem kết quả năng lực phản hồi ẩn danh từ đồng đội của bạn.
          </p>
        </div>
        <div className="absolute right-8 bottom-0 top-0 opacity-10 w-1/4 flex items-center justify-center pointer-events-none">
          <span className="text-9xl">📊</span>
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        
        {/* LEFT COLUMN: Evaluation Form (3 cols) */}
        <div className="md:col-span-3 space-y-6">
          <Card>
            <h3 className="font-bold text-gray-800 text-sm border-b pb-2.5 mb-5 flex items-center gap-2">
              <Star className="w-4 h-4 text-[#FF6B00]" />
              Biểu mẫu đánh giá chéo
            </h3>

            {teams.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs font-semibold">
                📭 Bạn chưa tham gia bất kỳ nhóm dự án nào để thực hiện đánh giá.
              </div>
            ) : (
              <form onSubmit={handleRatingSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
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
                      Cột mốc đánh giá *
                    </label>
                    <select
                      value={milestone}
                      onChange={e => setMilestone(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] bg-white font-bold"
                    >
                      <option value={1}>Cột mốc 1 (Milestone 1)</option>
                      <option value={2}>Cột mốc 2 (Milestone 2)</option>
                      <option value={3}>Cột mốc 3 (Milestone 3)</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-6 text-gray-400 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin text-[#FF6B00] mr-2" /> Đang tải danh sách thành viên...
                  </div>
                ) : teamMembers.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-xs font-semibold">
                    👥 Nhóm của bạn chưa có thành viên khác để đánh giá.
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        Chọn thành viên muốn đánh giá *
                      </label>
                      <select
                        value={selectedMemberId}
                        onChange={e => setSelectedMemberId(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] bg-white font-bold text-[#FF6B00]"
                      >
                        {teamMembers.map(m => (
                          <option key={m.user.id} value={m.user.id}>{m.user.name} ({m.user.email})</option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-gray-700">Mức đóng góp công việc (%) *</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={contribution}
                          onChange={e => setContribution(Number(e.target.value))}
                          className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center font-bold text-gray-800"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 leading-normal">
                        * Tỷ lệ % đóng góp thực tế của thành viên này trong nhóm dự án (Ví dụ: nhóm 4 người làm đều thì mỗi người 25%).
                      </p>

                      <div className="space-y-3 pt-2">
                        {/* Professionalism */}
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 font-medium">Thái độ chuyên nghiệp (1-5 ⭐):</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(v => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => setProfessionalism(v)}
                                className={`w-7 h-7 rounded-lg text-xs font-bold transition ${professionalism >= v ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Communication */}
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 font-medium">Khả năng giao tiếp nhóm (1-5 ⭐):</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(v => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => setCommunication(v)}
                                className={`w-7 h-7 rounded-lg text-xs font-bold transition ${communication >= v ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Punctuality */}
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 font-medium">Làm việc đúng hạn (1-5 ⭐):</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(v => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => setPunctuality(v)}
                                className={`w-7 h-7 rounded-lg text-xs font-bold transition ${punctuality >= v ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Quality */}
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 font-medium">Chất lượng công việc (1-5 ⭐):</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(v => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => setQualityOfWork(v)}
                                className={`w-7 h-7 rounded-lg text-xs font-bold transition ${qualityOfWork >= v ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        Nhận xét đóng góp (Phản hồi mang tính xây dựng)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Hãy góp ý chân thành về những điểm bạn ấy đã làm tốt và điểm cần cải thiện trong cột mốc này..."
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
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
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          Đang gửi đánh giá...
                        </>
                      ) : (
                        'Gửi đánh giá ẩn danh'
                      )}
                    </button>
                  </>
                )}
              </form>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: Peer feedback statistics & Radar chart (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <h3 className="font-bold text-gray-800 text-sm border-b pb-2.5 mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#FF6B00]" />
              Kết quả đánh giá của bạn
            </h3>

            {statsLoading ? (
              <div className="flex flex-col items-center py-16 text-gray-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00] mb-2" /> Đang tổng hợp biểu đồ...
              </div>
            ) : !stats || stats.count === 0 ? (
              <div className="text-center py-16 text-gray-400 text-xs font-semibold leading-relaxed">
                📭 Chưa nhận được đánh giá chéo nào từ đồng đội cho dự án này.
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Aggregate average metrics */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-100 dark:border-orange-900/30">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                      Số người đánh giá
                    </span>
                    <span className="text-xl font-black text-[#FF6B00]">{stats.count}</span>
                  </div>

                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-100 dark:border-green-900/30">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                      Đóng góp TB (%)
                    </span>
                    <span className="text-xl font-black text-green-600 dark:text-green-400">{stats.averages.contribution}%</span>
                  </div>
                </div>

                {/* Free-Rider / Low Contribution Alert */}
                {stats.count > 0 && (stats.averages.contribution < 15 || stats.averages.qualityOfWork < 3.0) && (
                  <div className="p-4 bg-red-50/50 dark:bg-red-950/15 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-start gap-3 text-left animate-pulse">
                    <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-red-750 dark:text-red-400 text-xs block">
                        Cảnh báo hoạt động nhóm (Free-Rider Warning)
                      </span>
                      <p className="text-[10.5px] text-red-650 dark:text-red-400/90 leading-relaxed mt-1 font-medium">
                        Đóng góp thực tế ({stats.averages.contribution}%) hoặc chất lượng công việc ({stats.averages.qualityOfWork}/5⭐) của bạn hiện đang được đồng đội đánh giá dưới mức trung bình của nhóm. Vui lòng liên hệ với Trưởng nhóm và chủ động nhận thêm công việc để cải thiện điểm số học phần của bạn!
                      </p>
                    </div>
                  </div>
                )}

                {/* Radar chart */}
                <div className="h-64 flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" radius="75%" data={chartData}>
                      <PolarGrid stroke="#E5E7EB" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#4B5563', fontSize: 10, fontWeight: 'bold' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#9CA3AF', fontSize: 8 }} />
                      <Radar name="Bạn" dataKey="value" stroke="#FF6B00" fill="#FF6B00" fillOpacity={0.25} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Qualitative feedbacks list (Anonymized) */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-gray-700 flex items-center gap-1">
                    💬 Phản hồi góp ý ẩn danh:
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {stats.feedbacks.length > 0 ? (
                      stats.feedbacks.map((f: string, i: number) => (
                        <div key={i} className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-[11px] text-gray-600 leading-relaxed font-medium">
                          "{f}"
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-gray-400 italic">Đồng đội chưa gửi kèm lời nhận xét.</p>
                    )}
                  </div>
                </div>

              </div>
            )}
          </Card>
        </div>

      </div>

    </div>
  )
}
