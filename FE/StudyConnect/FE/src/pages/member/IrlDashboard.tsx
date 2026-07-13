import { useState } from 'react'
import Card from '../../components/cards/Card'
import { CheckCircle, Award, DollarSign, TrendingDown, Hourglass, TrendingUp, Info, HelpCircle } from 'lucide-react'

export default function IrlDashboard() {
  // 9 IRL Stages definition
  const [stages, setStages] = useState([
    { level: 1, label: 'IRL 1: Thiết lập Mô hình giá trị ban đầu', desc: 'Đã hoàn thành khung sơ khởi của Business Model Canvas (BMC) và giả định giá trị mang lại cho khách hàng.', checked: true },
    { level: 2, label: 'IRL 2: Xác định quy mô thị trường (TAM/SAM/SOM)', desc: 'Xác định rõ tổng quy mô thị trường, thị trường có thể tiếp cận và thị trường có thể chiếm lĩnh dựa trên số liệu thực tế.', checked: true },
    { level: 3, label: 'IRL 3: Phỏng vấn & Xác thực nỗi đau khách hàng', desc: 'Đã khảo sát và phỏng vấn trực tiếp tối thiểu 10-25 đối tượng thuộc nhóm khách hàng mục tiêu để xác định nhu cầu.', checked: false },
    { level: 4, label: 'IRL 4: Xây dựng bản mẫu thô sơ (Paper Prototype/MVP)', desc: 'Có wireframe phác thảo giao diện hoặc bản dựng thô sơ nhất để mô tả cách hoạt động của giải pháp.', checked: false },
    { level: 5, label: 'IRL 5: Khảo sát thực nghiệm giải pháp MVP', desc: 'Đã cho nhóm khách hàng mục tiêu dùng thử MVP và thu thập ý kiến phản hồi cải tiến.', checked: false },
    { level: 6, label: 'IRL 6: Xác định mô hình doanh thu & Kênh phân phối', desc: 'Thiết lập rõ ràng các nguồn thu phí, kênh tiếp thị (CAC) và chi phí vận hành cơ bản.', checked: false },
    { level: 7, label: 'IRL 7: Đo lường mức độ sẵn sàng thanh toán', desc: 'Có khách hàng cam kết mua trước hoặc tham gia trải nghiệm trả phí ban đầu.', checked: false },
    { level: 8, label: 'IRL 8: Tối ưu hóa đơn vị kinh tế (Unit Economics)', desc: 'Chỉ số LTV/CAC > 3 và biên lợi nhuận gộp của mỗi sản phẩm bán ra đạt mức dương bền vững.', checked: false },
    { level: 9, label: 'IRL 9: Sẵn sàng kêu gọi vốn đầu tư thiên thần', desc: 'Đầy đủ hồ sơ gọi vốn: Pitch Deck hoàn thiện, MVP chạy thử ổn định, dòng tài chính dự phóng 3 năm.', checked: false }
  ])

  // Financial inputs
  const [totalCapital, setTotalCapital] = useState(100000000) // 100M VND
  const [monthlyExpenses, setMonthlyExpenses] = useState(15000000) // 15M VND
  const [monthlyRevenue, setMonthlyRevenue] = useState(5000000) // 5M VND
  const [marketingCost, setMarketingCost] = useState(8000000)
  const [newCustomers, setNewCustomers] = useState(40)
  const [customerValue, setCustomerValue] = useState(600000) // LTV per customer

  const handleToggleStage = (index: number) => {
    setStages(prev => prev.map((s, idx) => idx === index ? { ...s, checked: !s.checked } : s))
  }

  // Financial calculations
  const burnRate = monthlyExpenses - monthlyRevenue
  const runway = burnRate > 0 ? (totalCapital / burnRate).toFixed(1) : 'Vô hạn (Dòng tiền dương)'
  const cac = newCustomers > 0 ? (marketingCost / newCustomers) : 0
  const ltvRatio = cac > 0 ? (customerValue / cac).toFixed(2) : '0'

  const currentLevel = stages.filter(s => s.checked).length > 0 
    ? Math.max(...stages.filter(s => s.checked).map(s => s.level))
    : 0

  const getRatioStatus = (ratio: number) => {
    if (ratio < 1) return { text: 'Nguy hiểm (LTV < CAC)', color: 'text-red-500 bg-red-500/10 border-red-500/20' }
    if (ratio >= 1 && ratio < 3) return { text: 'Tạm chấp nhận', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' }
    return { text: 'Tối ưu / Xuất sắc (LTV/CAC > 3)', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' }
  }

  const ratioStatus = getRatioStatus(Number(ltvRatio))

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Left Column: IRL Checklist (col-span-2) */}
        <div className="md:col-span-2 space-y-4">
          <Card className="bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-850 pb-3 mb-4">
              <h3 className="font-extrabold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                <Award className="w-4.5 h-4.5 text-[#FF6B00]" />
                Đo lường mức độ sẵn sàng đầu tư (Steve Blank IRL)
              </h3>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-[#FF6B00] border border-orange-500/20 shadow-sm">
                Cấp độ hiện tại: IRL {currentLevel}
              </span>
            </div>

            <div className="space-y-3">
              {stages.map((stage, idx) => (
                <div 
                  key={stage.level}
                  onClick={() => handleToggleStage(idx)}
                  className={`p-3.5 rounded-2xl border transition duration-200 cursor-pointer flex gap-3.5 items-start ${
                    stage.checked 
                      ? 'bg-orange-500/[0.02] border-[#FF6B00]/30 shadow-sm'
                      : 'bg-gray-50/50 dark:bg-gray-950/20 border-gray-150/30 dark:border-gray-800/30 hover:border-gray-250 dark:hover:border-gray-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    stage.checked ? 'border-[#FF6B00] bg-[#FF6B00] text-white' : 'border-gray-300 dark:border-gray-700'
                  }`}>
                    {stage.checked && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <div>
                    <h4 className={`text-xs font-black transition-colors ${stage.checked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-450'}`}>
                      {stage.label}
                    </h4>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-1 leading-relaxed">
                      {stage.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Financial health validator */}
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40">
            <h3 className="font-extrabold text-gray-900 dark:text-white text-xs uppercase tracking-wider border-b border-gray-100 dark:border-gray-850 pb-3 mb-4 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-[#FF6B00]" />
              Startup Financial Calculator
            </h3>

            <div className="space-y-4 text-xs font-bold">
              {/* Inputs */}
              <div className="space-y-3 bg-gray-50/50 dark:bg-[#1C1C28]/20 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-850/30">
                <div>
                  <label className="text-[9px] font-bold text-gray-500 block mb-1">Vốn tự có hiện tại</label>
                  <input
                    type="number"
                    value={totalCapital}
                    onChange={e => setTotalCapital(Number(e.target.value))}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#1C1C28] text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 block mb-1">Chi phí hoạt động/tháng</label>
                  <input
                    type="number"
                    value={monthlyExpenses}
                    onChange={e => setMonthlyExpenses(Number(e.target.value))}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#1C1C28] text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 block mb-1">Doanh thu/tháng</label>
                  <input
                    type="number"
                    value={monthlyRevenue}
                    onChange={e => setMonthlyRevenue(Number(e.target.value))}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#1C1C28] text-gray-900 dark:text-white"
                  />
                </div>
                <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-2 my-2"></div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 block mb-1">Chi phí Marketing (tháng)</label>
                  <input
                    type="number"
                    value={marketingCost}
                    onChange={e => setMarketingCost(Number(e.target.value))}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#1C1C28] text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 block mb-1">Khách hàng mới kiếm được</label>
                  <input
                    type="number"
                    value={newCustomers}
                    onChange={e => setNewCustomers(Number(e.target.value))}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#1C1C28] text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 block mb-1">Giá trị trọn đời KH (LTV)</label>
                  <input
                    type="number"
                    value={customerValue}
                    onChange={e => setCustomerValue(Number(e.target.value))}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#1C1C28] text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Calculations results */}
              <div className="space-y-3 bg-[#FF6B00]/5 border border-[#FF6B00]/10 p-4 rounded-2xl">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-bold flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-red-500" /> Burn Rate:
                  </span>
                  <span className={burnRate > 0 ? 'text-red-500 font-black' : 'text-green-500 font-black'}>
                    {formatVND(burnRate)}/tháng
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-bold flex items-center gap-1">
                    <Hourglass className="w-3.5 h-3.5 text-[#FF6B00]" /> Runway:
                  </span>
                  <span className="text-gray-800 dark:text-white font-black">
                    {runway} {burnRate > 0 ? 'tháng' : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-bold">CAC (Chi phí mua KH):</span>
                  <span className="text-gray-800 dark:text-white font-black">{formatVND(cac)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-bold">Tỷ lệ LTV/CAC:</span>
                  <span className="text-gray-800 dark:text-white font-black">{ltvRatio}x</span>
                </div>
                <div className={`p-2.5 rounded-xl border text-[10px] text-center font-extrabold ${ratioStatus.color}`}>
                  {ratioStatus.text}
                </div>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}
