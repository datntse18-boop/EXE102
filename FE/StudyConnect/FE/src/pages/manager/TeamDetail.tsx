import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Card from '../../components/cards/Card'
import { teamService, aiService } from '../../services/apiServices'

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>()
  const [team, setTeam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // AI Analysis states
  const [aiResult, setAiResult] = useState<any>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const loadTeam = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await teamService.getTeamById(id)
      setTeam(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeam()
  }, [id])

  const handleAiAnalysis = async () => {
    if (!id) return
    setAiLoading(true)
    setAiResult(null)
    try {
      const result = await aiService.analyzeProgress(id)
      setAiResult(result)
    } catch (err) {
      console.error(err)
      alert('Không thể thực hiện phân tích tiến độ')
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Đang tải chi tiết nhóm...</div>
  }

  if (!team) {
    return <div className="p-8 text-center text-red-500">Không tìm thấy thông tin nhóm</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/manager/teams" className="text-[#FF6B00] hover:underline text-sm font-medium">← Quay lại danh sách nhóm</Link>
          <h1 className="text-3xl font-bold mt-2">{team.name}</h1>
          <p className="text-sm text-gray-500">{team.description || 'Không có mô tả'}</p>
        </div>
        
        <button
          onClick={handleAiAnalysis}
          disabled={aiLoading}
          className="px-4 py-2 bg-[#FF6B00] text-white rounded font-medium hover:bg-[#E85A00] transition flex items-center gap-2 shadow"
        >
          {aiLoading ? (
            <><span className="animate-spin">⚙️</span> Đang phân tích...</>
          ) : (
            <><span>🤖</span> Phân tích tiến độ bằng AI</>
          )}
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left column: Members and projects info */}
        <div className="md:col-span-2 space-y-6">
          {/* Projects Section */}
          <Card>
            <h3 className="font-bold text-lg text-gray-800 mb-4 pb-2 border-b border-[#FF6B00]">Dự án của nhóm</h3>
            <div className="space-y-4">
              {team.projects?.length > 0 ? (
                team.projects.map((proj: any) => {
                  const completedTasks = proj.tasks?.filter((t: any) => t.status === 'completed').length || 0
                  const totalTasks = proj.tasks?.length || 0
                  return (
                    <div key={proj.id} className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-800">{proj.name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded capitalize font-medium ${proj.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                          {proj.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-3">{proj.description}</p>
                      
                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Tiến độ thực tế</span>
                          <span className="font-bold">{proj.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div className="bg-[#FF6B00] h-full" style={{ width: `${proj.progress}%` }} />
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs text-gray-500 mt-4 border-t pt-3">
                        <span>Công việc: <strong>{completedTasks}/{totalTasks}</strong> hoàn thành</span>
                        {proj.dueDate && <span>Hạn chót: <strong>{new Date(proj.dueDate).toLocaleDateString()}</strong></span>}
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-gray-400 text-sm text-center py-6">Nhóm chưa khởi tạo dự án nào</p>
              )}
            </div>
          </Card>

          {/* Members List */}
          <Card>
            <h3 className="font-bold text-lg text-gray-800 mb-4 pb-2 border-b border-[#FF6B00]">Thành viên nhóm ({team.members?.length || 0})</h3>
            <div className="divide-y">
              {team.members?.map((m: any) => (
                <div key={m.userId} className="flex justify-between items-center py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{m.user?.avatar || '👤'}</span>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{m.user?.name}</p>
                      <p className="text-xs text-gray-500">{m.user?.email}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-[#FFF4E8] text-[#FF6B00] capitalize">
                    {team.leaderId === m.userId ? 'Leader' : 'Member'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column: AI Analysis results */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-t-4 border-[#FF6B00]">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
              📊 Chỉ số sức khỏe nhóm
            </h3>
            <div className="text-center py-6">
              <span className="text-5xl font-extrabold text-[#FF6B00]">{team.healthScore}%</span>
              <p className="text-xs text-gray-500 mt-2">Điểm chất lượng & tiến độ tổng quát</p>
            </div>
            
            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Trạng thái nhóm:</span>
                <span className={`font-bold capitalize ${team.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>{team.status}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tổng số dự án:</span>
                <span className="font-bold text-gray-800">{team.projects?.length || 0}</span>
              </div>
            </div>
          </Card>

          {/* AI Result Card */}
          {aiLoading && (
            <Card className="text-center py-12 text-gray-500">
              <span className="text-2xl animate-spin inline-block mb-3">⚙️</span>
              <p className="text-sm font-semibold">Gemini đang phân tích tiến độ hoàn thành, kiểm tra các task quá hạn và sức khỏe của nhóm...</p>
            </Card>
          )}

          {aiResult && (
            <Card className="border-l-4 border-green-500 bg-green-50/50 animate-fadeIn space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-green-800">🤖 Báo cáo AI Trợ lý</h4>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${aiResult.riskLevel === 'Low' ? 'bg-green-100 text-green-700' : aiResult.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  Rủi ro: {aiResult.riskLevel}
                </span>
              </div>

              <div className="text-xs text-green-700 space-y-2">
                <p><strong>Đánh giá chung:</strong> <span className="font-bold">{aiResult.overallStatus}</span></p>
                <p className="italic">{aiResult.summary}</p>
              </div>

              <div className="border-t border-green-200 pt-3">
                <p className="text-xs font-bold text-green-800 mb-1">💪 Điểm mạnh:</p>
                <ul className="list-disc pl-4 text-xs text-green-700 space-y-0.5">
                  {aiResult.strengths?.map((s: string, idx: number) => <li key={idx}>{s}</li>)}
                </ul>
              </div>

              <div className="border-t border-green-200 pt-3">
                <p className="text-xs font-bold text-green-800 mb-1">⚠️ Điểm cần khắc phục:</p>
                <ul className="list-disc pl-4 text-xs text-green-700 space-y-0.5">
                  {aiResult.weaknesses?.map((w: string, idx: number) => <li key={idx}>{w}</li>)}
                </ul>
              </div>

              <div className="border-t border-green-200 pt-3">
                <p className="text-xs font-bold text-green-800 mb-1">🎯 Đề xuất hướng đi tiếp theo:</p>
                <ul className="list-decimal pl-4 text-xs text-green-700 space-y-1">
                  {aiResult.recommendations?.map((r: string, idx: number) => <li key={idx} className="font-medium">{r}</li>)}
                </ul>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
