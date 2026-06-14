import { useEffect, useState } from 'react'
import { teamService, projectService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/cards/Card'
import { Sparkles, Loader2, Save, Printer, HelpCircle } from 'lucide-react'

type CanvasData = {
  customerSegments: string
  valuePropositions: string
  channels: string
  customerRelationships: string
  revenueStreams: string
  keyResources: string
  keyActivities: string
  keyPartners: string
  costStructure: string
}

export default function CanvasGenerator() {
  const { user } = useAuth()
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [project, setProject] = useState<any>(null)
  
  const [canvas, setCanvas] = useState<CanvasData>({
    customerSegments: '',
    valuePropositions: '',
    channels: '',
    customerRelationships: '',
    revenueStreams: '',
    keyResources: '',
    keyActivities: '',
    keyPartners: '',
    costStructure: '',
  })

  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  // Fetch teams led by user
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await teamService.getTeams()
        // Filter teams where user is leader (creator)
        const led = data.filter((t: any) => t.leaderId === user?.id)
        setTeams(led)
        if (led.length > 0) {
          setSelectedTeamId(led[0].id)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchTeams()
  }, [user])

  // Fetch project for selected team
  useEffect(() => {
    if (!selectedTeamId) return
    const fetchProject = async () => {
      setLoading(true)
      try {
        const projData = await projectService.getProjects({ teamId: selectedTeamId })
        if (projData.length > 0) {
          const activeProj = projData[0]
          setProject(activeProj)
          if (activeProj.canvasModel) {
            try {
              setCanvas(JSON.parse(activeProj.canvasModel))
            } catch {
              console.error('Failed to parse existing canvas JSON')
            }
          } else {
            // Reset
            setCanvas({
              customerSegments: '',
              valuePropositions: '',
              channels: '',
              customerRelationships: '',
              revenueStreams: '',
              keyResources: '',
              keyActivities: '',
              keyPartners: '',
              costStructure: '',
            })
          }
        } else {
          setProject(null)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
  }, [selectedTeamId])

  const handleGenerateAI = async () => {
    if (!project) return
    setGenerating(true)
    try {
      const generated = await projectService.generateCanvasAI(project.id)
      setCanvas(generated)
      alert('AI đã phác thảo thành công Mô hình kinh doanh Canvas! ✨')
    } catch (err) {
      console.error(err)
      alert('Tạo mô hình bằng AI thất bại. Vui lòng kiểm tra API Key.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!project) return
    setSaving(true)
    try {
      await projectService.updateProject(project.id, {
        canvasModel: JSON.stringify(canvas)
      })
      alert('Đã lưu mô hình Canvas thành công!')
    } catch (err) {
      console.error(err)
      alert('Không thể lưu mô hình.')
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-10 print:p-0">
      
      {/* Header Banner - hidden when printing */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#FF6B00] via-[#FF801A] to-[#FFA64D] text-white rounded-3xl p-8 shadow-xl print:hidden">
        <div className="relative z-10 max-w-xl">
          <span className="bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-max">
            <Sparkles className="w-3.5 h-3.5" />
            EXE101 Startup Toolkit
          </span>
          <h1 className="text-3xl font-black mt-4 tracking-tight leading-none text-white">
            Mô hình Kinh doanh Canvas AI 🎨
          </h1>
          <p className="text-sm text-orange-50 mt-3 font-medium opacity-95 leading-relaxed">
            Phác thảo nhanh ý tưởng khởi nghiệp của nhóm thành 9 ô giá trị kinh doanh cốt lõi (Business Model Canvas) nhờ Gemini AI.
          </p>
        </div>
        <div className="absolute right-8 bottom-0 top-0 opacity-15 w-1/4 flex items-center justify-center pointer-events-none">
          <span className="text-9xl">📊</span>
        </div>
      </div>

      {/* Control row - hidden when printing */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 print:hidden">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-500">Chọn nhóm của bạn:</span>
          <select
            value={selectedTeamId}
            onChange={e => setSelectedTeamId(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF6B00] font-bold text-gray-700 bg-white"
          >
            {teams.length > 0 ? (
              teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))
            ) : (
              <option value="">(Bạn chưa làm trưởng nhóm nào)</option>
            )}
          </select>
        </div>

        {project && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateAI}
              disabled={generating}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-[#FF6B00] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gemini đang phác thảo...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI Tự động Sinh Canvas
                </>
              )}
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-[#FF6B00] hover:bg-[#E85A00] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Lưu Canvas
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              In / Xuất PDF
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-12 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00] mr-2" /> Đang tải mô hình Canvas...
        </div>
      ) : !project ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 text-gray-400 text-xs font-semibold print:hidden">
          ⚠ Vui lòng lập nhóm và tạo dự án để bắt đầu phác thảo mô hình Canvas kinh doanh.
        </div>
      ) : (
        /* The Canvas Grid */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-gray-100 p-3 rounded-2xl border border-gray-200 print:bg-white print:border-0 print:p-0">
          
          {/* Column 1: Key Partners */}
          <div className="md:col-span-1 bg-white p-4 rounded-xl shadow-sm border border-gray-200/80 flex flex-col justify-between print:border print:shadow-none">
            <div>
              <h4 className="font-bold text-gray-800 text-[10px] uppercase tracking-wider flex items-center gap-1 border-b pb-1.5 mb-3">
                🤝 Đối tác chính (Key Partners)
              </h4>
              <textarea
                value={canvas.keyPartners}
                onChange={e => setCanvas({ ...canvas, keyPartners: e.target.value })}
                placeholder="Ai là đối tác chiến lược, nhà cung cấp chính..."
                className="w-full text-xs text-gray-600 placeholder-gray-300 resize-none min-h-[300px] focus:outline-none print:min-h-[200px]"
              />
            </div>
            <HelpCircle className="w-4 h-4 text-gray-300 self-end print:hidden" />
          </div>

          {/* Column 2: Key Activities & Resources */}
          <div className="md:col-span-1 flex flex-col gap-3">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/80 flex-1 flex flex-col justify-between print:border print:shadow-none">
              <div>
                <h4 className="font-bold text-gray-800 text-[10px] uppercase tracking-wider flex items-center gap-1 border-b pb-1.5 mb-3">
                  ⚡ Hoạt động chính (Key Activities)
                </h4>
                <textarea
                  value={canvas.keyActivities}
                  onChange={e => setCanvas({ ...canvas, keyActivities: e.target.value })}
                  placeholder="Nhóm cần làm những gì để vận hành mô hình..."
                  className="w-full text-xs text-gray-600 placeholder-gray-300 resize-none min-h-[120px] focus:outline-none"
                />
              </div>
              <HelpCircle className="w-4 h-4 text-gray-300 self-end print:hidden" />
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/80 flex-1 flex flex-col justify-between print:border print:shadow-none">
              <div>
                <h4 className="font-bold text-gray-800 text-[10px] uppercase tracking-wider flex items-center gap-1 border-b pb-1.5 mb-3">
                  💎 Nguồn lực chính (Key Resources)
                </h4>
                <textarea
                  value={canvas.keyResources}
                  onChange={e => setCanvas({ ...canvas, keyResources: e.target.value })}
                  placeholder="Nhân lực, trí tuệ, tài chính cần thiết..."
                  className="w-full text-xs text-gray-600 placeholder-gray-300 resize-none min-h-[120px] focus:outline-none"
                />
              </div>
              <HelpCircle className="w-4 h-4 text-gray-300 self-end print:hidden" />
            </div>
          </div>

          {/* Column 3: Value Propositions */}
          <div className="md:col-span-1 bg-white p-4 rounded-xl shadow-sm border border-[#FF6B00]/40 flex flex-col justify-between print:border print:shadow-none">
            <div>
              <h4 className="font-bold text-orange-600 text-[10px] uppercase tracking-wider flex items-center gap-1 border-b border-orange-100 pb-1.5 mb-3">
                🏆 Tuyên bố giá trị (Value Propositions)
              </h4>
              <textarea
                value={canvas.valuePropositions}
                onChange={e => setCanvas({ ...canvas, valuePropositions: e.target.value })}
                placeholder="Giải pháp độc đáo, lý do khách hàng chọn bạn..."
                className="w-full text-xs text-gray-700 placeholder-gray-300 resize-none min-h-[300px] focus:outline-none print:min-h-[200px]"
              />
            </div>
            <HelpCircle className="w-4 h-4 text-orange-200 self-end print:hidden" />
          </div>

          {/* Column 4: Customer Relationships & Channels */}
          <div className="md:col-span-1 flex flex-col gap-3">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/80 flex-1 flex flex-col justify-between print:border print:shadow-none">
              <div>
                <h4 className="font-bold text-gray-800 text-[10px] uppercase tracking-wider flex items-center gap-1 border-b pb-1.5 mb-3">
                  ❤️ Quan hệ khách hàng (Relationships)
                </h4>
                <textarea
                  value={canvas.customerRelationships}
                  onChange={e => setCanvas({ ...canvas, customerRelationships: e.target.value })}
                  placeholder="Cách thu hút và giữ chân khách hàng..."
                  className="w-full text-xs text-gray-600 placeholder-gray-300 resize-none min-h-[120px] focus:outline-none"
                />
              </div>
              <HelpCircle className="w-4 h-4 text-gray-300 self-end print:hidden" />
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/80 flex-1 flex flex-col justify-between print:border print:shadow-none">
              <div>
                <h4 className="font-bold text-gray-800 text-[10px] uppercase tracking-wider flex items-center gap-1 border-b pb-1.5 mb-3">
                  📣 Kênh phân phối (Channels)
                </h4>
                <textarea
                  value={canvas.channels}
                  onChange={e => setCanvas({ ...canvas, channels: e.target.value })}
                  placeholder="Cách sản phẩm tiếp cận đến tay khách hàng..."
                  className="w-full text-xs text-gray-600 placeholder-gray-300 resize-none min-h-[120px] focus:outline-none"
                />
              </div>
              <HelpCircle className="w-4 h-4 text-gray-300 self-end print:hidden" />
            </div>
          </div>

          {/* Column 5: Customer Segments */}
          <div className="md:col-span-1 bg-white p-4 rounded-xl shadow-sm border border-gray-200/80 flex flex-col justify-between print:border print:shadow-none">
            <div>
              <h4 className="font-bold text-gray-800 text-[10px] uppercase tracking-wider flex items-center gap-1 border-b pb-1.5 mb-3">
                👥 Phân khúc khách hàng (Segments)
              </h4>
              <textarea
                value={canvas.customerSegments}
                onChange={e => setCanvas({ ...canvas, customerSegments: e.target.value })}
                placeholder="Ai là nhóm khách hàng mục tiêu lớn nhất..."
                className="w-full text-xs text-gray-600 placeholder-gray-300 resize-none min-h-[300px] focus:outline-none print:min-h-[200px]"
              />
            </div>
            <HelpCircle className="w-4 h-4 text-gray-300 self-end print:hidden" />
          </div>

          {/* Bottom Row: Cost Structure & Revenue Streams */}
          <div className="md:col-span-5 grid grid-cols-1 md:grid-cols-2 gap-3 mt-1.5">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/80 flex flex-col justify-between print:border print:shadow-none">
              <div>
                <h4 className="font-bold text-gray-800 text-[10px] uppercase tracking-wider flex items-center gap-1 border-b pb-1.5 mb-3">
                  💸 Cơ cấu chi phí (Cost Structure)
                </h4>
                <textarea
                  value={canvas.costStructure}
                  onChange={e => setCanvas({ ...canvas, costStructure: e.target.value })}
                  placeholder="Các khoản chi lớn nhất (Phát triển, máy chủ, marketing)..."
                  className="w-full text-xs text-gray-600 placeholder-gray-300 resize-none min-h-[120px] focus:outline-none"
                />
              </div>
              <HelpCircle className="w-4 h-4 text-gray-300 self-end print:hidden" />
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/80 flex flex-col justify-between print:border print:shadow-none">
              <div>
                <h4 className="font-bold text-gray-800 text-[10px] uppercase tracking-wider flex items-center gap-1 border-b pb-1.5 mb-3">
                  💰 Dòng doanh thu (Revenue Streams)
                </h4>
                <textarea
                  value={canvas.revenueStreams}
                  onChange={e => setCanvas({ ...canvas, revenueStreams: e.target.value })}
                  placeholder="Tiền đến từ đâu (Bán gói dịch vụ, quảng cáo, hoa hồng)..."
                  className="w-full text-xs text-gray-600 placeholder-gray-300 resize-none min-h-[120px] focus:outline-none"
                />
              </div>
              <HelpCircle className="w-4 h-4 text-gray-300 self-end print:hidden" />
            </div>
          </div>

        </div>
      )}

    </div>
  )
}
