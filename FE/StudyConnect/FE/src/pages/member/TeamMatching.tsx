import { useEffect, useState } from 'react'
import Card from '../../components/cards/Card'
import { teamService, aiService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'

export default function TeamMatching() {
  const { user } = useAuth()
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'browse' | 'ai'>('browse')

  // Create team state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamDesc, setTeamDesc] = useState('')

  // AI Matching state
  const [skills, setSkills] = useState(user?.skills || '')
  const [interests, setInterests] = useState('')
  const [availability, setAvailability] = useState(user?.commitmentHours ? `${user.commitmentHours} giờ/tuần` : '')
  const [aiResult, setAiResult] = useState<any>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const loadTeams = async () => {
    setLoading(true)
    try {
      const data = await teamService.getTeams()
      setTeams(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeams()
  }, [])

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teamName) return
    try {
      await teamService.createTeam({ name: teamName, description: teamDesc })
      setShowCreateModal(false)
      setTeamName('')
      setTeamDesc('')
      loadTeams()
    } catch (err) {
      console.error(err)
      alert('Không thể tạo nhóm')
    }
  }

  const handleJoinTeam = async (teamId: string) => {
    if (!user) return
    try {
      await teamService.addMember(teamId, user.id)
      alert('Tham gia nhóm thành công!')
      loadTeams()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể tham gia nhóm')
    }
  }

  const handleAiMatching = async (e: React.FormEvent) => {
    e.preventDefault()
    setAiLoading(true)
    setAiResult(null)
    try {
      const result = await aiService.teamMatching({ skills, interests, availability })
      setAiResult(result)
    } catch (err) {
      console.error(err)
      alert('Không thể gợi ý nhóm')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Team Matching</h1>
          <p className="text-sm text-gray-500">Tìm kiếm đồng đội và gia nhập các dự án tiềm năng</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-[#FF6B00] text-white rounded font-medium hover:bg-[#E85A00] transition"
        >
          + Tạo nhóm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('browse')}
          className={`px-4 py-2 font-medium text-sm transition border-b-2 ${activeTab === 'browse' ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          🌐 Khám phá tất cả các nhóm
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 font-medium text-sm transition border-b-2 ${activeTab === 'ai' ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          🤖 Gợi ý ghép nhóm bằng AI
        </button>
      </div>

      {activeTab === 'browse' ? (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Đang tải danh sách nhóm...</div>
          ) : teams.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {teams.map(team => {
                const isMember = team.members?.some((m: any) => m.userId === user?.id)
                return (
                  <Card key={team.id} className="border-l-4 border-[#FF6B00] flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-gray-800">{team.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${team.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {team.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{team.description || 'Không có mô tả'}</p>
                      
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4 border-t pt-3">
                        <span>👑 Trưởng nhóm: <strong>{team.leader?.name}</strong></span>
                        <span>👥 Thành viên: <strong>{team.members?.length || 0}</strong></span>
                        <span>📊 Health Score: <strong>{team.healthScore}%</strong></span>
                      </div>
                    </div>

                    <div className="mt-2 pt-3 border-t flex justify-end">
                      {isMember ? (
                        <button disabled className="px-4 py-1.5 rounded text-sm bg-green-50 text-green-600 font-medium border border-green-200">
                          ✓ Đã gia nhập
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinTeam(team.id)}
                          className="px-4 py-1.5 rounded text-sm bg-[#FF6B00] text-white font-medium hover:bg-[#E85A00] transition"
                        >
                          Gia nhập nhóm
                        </button>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="text-center text-gray-500 py-8">Chưa có nhóm nào trên hệ thống</Card>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {/* AI Request Form */}
          <div className="md:col-span-1">
            <Card className="bg-[#FFF4E8] border border-[#FFE0C2]">
              <h3 className="font-bold text-lg text-gray-800 mb-4">Nhập thông tin của bạn</h3>
              <form onSubmit={handleAiMatching} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Kỹ năng của bạn *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: React, UI/UX, Python"
                    value={skills}
                    onChange={e => setSkills(e.target.value)}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:border-[#FF6B00] bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Sở thích dự án *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Giáo dục, Y tế, Blockchain"
                    value={interests}
                    onChange={e => setInterests(e.target.value)}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:border-[#FF6B00] bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Thời gian rảnh</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Cuối tuần, 10 tiếng/tuần"
                    value={availability}
                    onChange={e => setAvailability(e.target.value)}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:border-[#FF6B00] bg-white text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={aiLoading}
                  className="w-full py-2 bg-[#FF6B00] text-white rounded font-bold hover:bg-[#E85A00] transition disabled:opacity-60 flex justify-center items-center gap-2"
                >
                  {aiLoading ? (
                    <><span className="animate-spin">⚙️</span> Đang phân tích...</>
                  ) : (
                    <><span>✨</span> Đề xuất nhóm</>
                  )}
                </button>
              </form>
            </Card>
          </div>

          {/* AI Result View */}
          <div className="md:col-span-2 space-y-4">
            {aiLoading && (
              <Card className="text-center py-12 text-gray-500">
                <span className="text-3xl animate-bounce inline-block mb-3">🤖</span>
                <p className="font-semibold">AI đang duyệt cơ sở dữ liệu các nhóm và tính toán độ tương thích của bạn...</p>
              </Card>
            )}

            {!aiLoading && !aiResult && (
              <Card className="text-center py-12 text-gray-400 border-dashed border-2 border-gray-200">
                Hãy điền thông tin và bấm nút "Đề xuất nhóm" để xem kết quả phân tích từ trợ lý AI của StudyConnect!
              </Card>
            )}

            {aiResult && (
              <div className="space-y-4 animate-fadeIn">
                <Card className="border-l-4 border-green-500 bg-green-50">
                  <h4 className="font-bold text-green-800 flex items-center gap-2">
                    💡 Lời khuyên từ AI Trợ lý
                  </h4>
                  <p className="text-sm text-green-700 mt-2">{aiResult.tips}</p>
                </Card>

                <h3 className="font-bold text-lg text-gray-800">3 Nhóm phù hợp nhất được đề xuất:</h3>

                <div className="space-y-3">
                  {aiResult.recommendations?.map((rec: any, idx: number) => (
                    <Card key={idx} className="border-l-4 border-[#FF6B00]">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-gray-800">{rec.teamName}</h4>
                        <span className="text-sm font-bold text-[#FF6B00] bg-[#FFF4E8] px-2 py-0.5 rounded">
                          Độ phù hợp: {rec.matchScore}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-2"><strong>Lý do chọn:</strong> {rec.reason}</p>
                      {rec.skills_needed && (
                        <div className="mt-3 flex flex-wrap gap-2 items-center">
                          <span className="text-xs text-gray-500">Kỹ năng cần:</span>
                          {rec.skills_needed.map((s: string, sIdx: number) => (
                            <span key={sIdx} className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600 capitalize">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Tạo nhóm mới</h3>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Tên nhóm *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: GreenTech Team"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Mô tả nhóm</label>
                <textarea
                  placeholder="Mô tả mục tiêu, định hướng phát triển của nhóm..."
                  value={teamDesc}
                  onChange={e => setTeamDesc(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:border-[#FF6B00]"
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF6B00] text-white rounded hover:bg-[#E85A00] font-medium"
                >
                  Tạo nhóm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
