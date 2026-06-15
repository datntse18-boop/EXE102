import { useEffect, useState } from 'react'
import { teamService, projectService, financialService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/cards/Card'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import {
  Loader2,
  Sparkles,
  TrendingUp,
  DollarSign,
  Briefcase,
  AlertTriangle,
  Lightbulb,
  ShieldCheck
} from 'lucide-react'

export default function FinancialHub() {
  const { user } = useAuth()
  
  // Project / Team State
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Financial inputs state
  const [fixedCosts, setFixedCosts] = useState(0)
  const [variableCosts, setVariableCosts] = useState(0)
  const [sellingPrice, setSellingPrice] = useState(0)
  const [projectedSales, setProjectedSales] = useState(0)
  const [cac, setCac] = useState(0)
  const [ltv, setLtv] = useState(0)
  const [aiReview, setAiReview] = useState('')

  const [saving, setSaving] = useState(false)

  // Fetch teams led by user or member of
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

  // Load project & financial data
  useEffect(() => {
    if (!selectedTeamId) return
    const fetchProjectAndFinancial = async () => {
      setLoading(true)
      try {
        const projData = await projectService.getProjects({ teamId: selectedTeamId })
        if (projData.length > 0) {
          const activeProj = projData[0]
          setProject(activeProj)
          
          // Get financial model
          const finData = await financialService.getFinancialModel(activeProj.id)
          if (finData) {
            setFixedCosts(finData.fixedCosts)
            setVariableCosts(finData.variableCosts)
            setSellingPrice(finData.sellingPrice)
            setProjectedSales(finData.projectedSales)
            setCac(finData.cac)
            setLtv(finData.ltv)
            setAiReview(finData.aiReview || '')
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
    fetchProjectAndFinancial()
  }, [selectedTeamId])

  const handleSave = async (triggerAI = false) => {
    if (!project) return

    if (sellingPrice <= variableCosts && sellingPrice > 0) {
      alert('Cảnh báo: Giá bán phải lớn hơn chi phí biến đổi trên mỗi sản phẩm để có biên lợi nhuận dương.')
      return
    }

    setSaving(true)
    try {
      const res = await financialService.saveFinancialModel(project.id, {
        fixedCosts,
        variableCosts,
        sellingPrice,
        projectedSales,
        cac,
        ltv,
        triggerAI
      })
      
      setFixedCosts(res.fixedCosts)
      setVariableCosts(res.variableCosts)
      setSellingPrice(res.sellingPrice)
      setProjectedSales(res.projectedSales)
      setCac(res.cac)
      setLtv(res.ltv)
      if (res.aiReview) {
        setAiReview(res.aiReview)
      }
      alert(triggerAI ? 'Đã chạy cố vấn tài chính AI thành công!' : 'Đã lưu thông số tài chính thành công!')
    } catch (err) {
      console.error(err)
      alert('Không thể lưu kế hoạch tài chính.')
    } finally {
      setSaving(false)
    }
  }

  // Calculate local metrics
  const unitContribution = sellingPrice - variableCosts // Margin per unit
  const breakevenQty = unitContribution > 0 ? Math.ceil(fixedCosts / unitContribution) : 0
  const monthlyProfit = unitContribution * projectedSales - fixedCosts
  const ltvCacRatio = cac > 0 ? Number((ltv / cac).toFixed(2)) : 0

  // Chart data generation
  const generateChartData = () => {
    const dataPoints = []
    const maxSales = projectedSales > 0 ? projectedSales * 1.5 : 2000
    const step = Math.ceil(maxSales / 10) || 100

    for (let s = 0; s <= maxSales; s += step) {
      dataPoints.push({
        sales: s,
        'Doanh thu': s * sellingPrice,
        'Tổng chi phí': fixedCosts + s * variableCosts
      })
    }
    return dataPoints
  }

  const chartData = generateChartData()

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1B1B22] via-[#2F2F3B] to-[#1B1B22] text-white rounded-3xl p-8 shadow-xl border border-gray-800">
        <div className="relative z-10 max-w-xl">
          <span className="bg-[#FF6B00] px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm flex items-center gap-1.5 w-max">
            <DollarSign className="w-3.5 h-3.5" />
            Financial Feasibility Hub
          </span>
          <h1 className="text-3xl font-black mt-4 tracking-tight leading-none text-white">
            Kế Hoạch Tài Chính & Điểm Hòa Vốn 💰
          </h1>
          <p className="text-sm text-gray-300 mt-3 font-medium opacity-90 leading-relaxed">
            Nhập các dữ liệu tài chính của startup để tự động vẽ biểu đồ chi phí/doanh thu và nhận đánh giá từ AI về khả năng thương mại hóa.
          </p>
        </div>
        <div className="absolute right-8 bottom-0 top-0 opacity-10 w-1/4 flex items-center justify-center pointer-events-none">
          <span className="text-9xl">💰</span>
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
          <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00] mr-2" /> Đang tải dữ liệu tài chính...
        </div>
      ) : !project ? (
        <div className="bg-white dark:bg-[#13131C] rounded-2xl border border-gray-100 dark:border-gray-800 p-20 flex flex-col items-center justify-center text-center text-gray-400 shadow-sm">
          <AlertTriangle className="w-12 h-12 text-gray-250 mb-3" />
          <h4 className="font-bold text-gray-700 dark:text-gray-300 text-xs">Chưa tạo dự án</h4>
          <p className="text-[10px] text-gray-400 mt-1">
            Nhóm chưa khởi tạo dự án để bắt đầu lập kế hoạch tài chính.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-5 gap-6">
          
          {/* LEFT: Financial Inputs (2 cols) */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <h3 className="font-bold text-gray-850 dark:text-gray-200 text-sm border-b dark:border-gray-800 pb-2.5 mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#FF6B00]" />
                Thông số tài chính dự án
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                    Chi phí cố định hàng tháng (Fixed Costs) - VNĐ
                  </label>
                  <input
                    type="number"
                    value={fixedCosts}
                    onChange={e => setFixedCosts(Number(e.target.value))}
                    className="w-full bg-transparent border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 focus:outline-none focus:border-[#FF6B00] dark:text-gray-200 font-bold"
                  />
                  <span className="text-[9px] text-gray-400">Tiền thuê mặt bằng, văn phòng, server, lương cứng...</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                    Chi phí biến đổi trên 1 sản phẩm (Variable Costs) - VNĐ
                  </label>
                  <input
                    type="number"
                    value={variableCosts}
                    onChange={e => setVariableCosts(Number(e.target.value))}
                    className="w-full bg-transparent border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 focus:outline-none focus:border-[#FF6B00] dark:text-gray-200 font-bold"
                  />
                  <span className="text-[9px] text-gray-400">Nguyên vật liệu, bao bì, hoa hồng, ship...</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                    Giá bán 1 đơn vị sản phẩm (Selling Price) - VNĐ
                  </label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={e => setSellingPrice(Number(e.target.value))}
                    className="w-full bg-transparent border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 focus:outline-none focus:border-[#FF6B00] dark:text-gray-200 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                    Sản lượng dự kiến bán / tháng - Sản phẩm
                  </label>
                  <input
                    type="number"
                    value={projectedSales}
                    onChange={e => setProjectedSales(Number(e.target.value))}
                    className="w-full bg-transparent border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 focus:outline-none focus:border-[#FF6B00] dark:text-gray-200 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                      Chi phí CAC - VNĐ
                    </label>
                    <input
                      type="number"
                      value={cac}
                      onChange={e => setCac(Number(e.target.value))}
                      className="w-full bg-transparent border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 focus:outline-none focus:border-[#FF6B00] dark:text-gray-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                      Giá trị LTV - VNĐ
                    </label>
                    <input
                      type="number"
                      value={ltv}
                      onChange={e => setLtv(Number(e.target.value))}
                      className="w-full bg-transparent border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 focus:outline-none focus:border-[#FF6B00] dark:text-gray-200 font-bold"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => handleSave(false)}
                    disabled={saving}
                    className="flex-1 py-2.5 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-850 transition text-xs"
                  >
                    Lưu thông số
                  </button>
                  <button
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-[#FF6B00] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition text-xs flex items-center justify-center gap-1.5"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tính...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" /> Chạy Cố Vấn AI
                      </>
                    )}
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT: Charts, Metrics and AI Evaluation (3 cols) */}
          <div className="md:col-span-3 space-y-6">
            
            {/* Key Performance Indicators */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="text-center p-4">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Hòa vốn sản lượng</span>
                <p className="text-xl font-black text-[#FF6B00] mt-1">
                  {breakevenQty > 0 ? `${breakevenQty.toLocaleString()} SP` : 'N/A'}
                </p>
              </Card>
              <Card className="text-center p-4">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Lợi nhuận dự kiến</span>
                <p className={`text-xl font-black mt-1 ${monthlyProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {monthlyProfit.toLocaleString('vi-VN')} đ
                </p>
              </Card>
              <Card className="text-center p-4">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Tỉ lệ LTV / CAC</span>
                <p className={`text-xl font-black mt-1 ${ltvCacRatio >= 3 ? 'text-green-600' : ltvCacRatio > 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                  {ltvCacRatio > 0 ? `${ltvCacRatio}x` : 'N/A'}
                </p>
              </Card>
            </div>

            {/* Break-even Chart */}
            {sellingPrice > variableCosts && projectedSales > 0 ? (
              <Card>
                <h3 className="font-bold text-gray-850 dark:text-gray-200 text-sm border-b dark:border-gray-800 pb-2.5 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  Đồ thị phân tích Điểm hòa vốn
                </h3>
                <div className="h-64 w-full text-[10px] font-medium pr-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="sales" label={{ value: 'Sản lượng (Cái)', position: 'insideBottomRight', offset: -5 }} />
                      <YAxis label={{ value: 'Số tiền (VNĐ)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(val: number) => val.toLocaleString('vi-VN') + ' đ'} />
                      <Legend />
                      <Line type="monotone" dataKey="Doanh thu" stroke="#FF6B00" strokeWidth={2.5} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Tổng chi phí" stroke="#3b82f6" strokeWidth={2.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            ) : (
              <Card className="py-16 text-center text-gray-400 text-xs font-semibold flex flex-col items-center justify-center gap-2 border border-dashed dark:border-gray-850 bg-gray-50/50 dark:bg-[#0B0B0F]/30 rounded-2xl">
                <AlertTriangle className="w-8 h-8 text-gray-300 dark:text-gray-750" />
                Vui lòng nhập Giá bán & Chi phí phù hợp để hiển thị đồ thị điểm hòa vốn.
              </Card>
            )}

            {/* AI Review Report */}
            {aiReview && (
              <Card>
                <h3 className="font-bold text-gray-850 dark:text-gray-200 text-sm border-b dark:border-gray-800 pb-2.5 mb-3.5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
                  Đánh giá Tính khả thi Tài chính của AI
                </h3>
                <div className="p-4 bg-orange-50/20 dark:bg-orange-950/10 border border-orange-100/50 dark:border-orange-900/30 rounded-2xl flex gap-3 text-xs leading-relaxed">
                  <Lightbulb className="w-5 h-5 text-[#FF6B00] shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-black text-gray-850 dark:text-gray-200 mb-1.5 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-green-600" />
                      Kết luận của Cố vấn Tài chính AI:
                    </h5>
                    <p className="text-gray-650 dark:text-gray-300 font-medium whitespace-pre-line leading-relaxed">
                      {aiReview}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
