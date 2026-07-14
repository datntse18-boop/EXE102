import { useState } from 'react'
import Card from '../../components/cards/Card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Award, DollarSign, Users, ShieldAlert, Sparkles, TrendingUp, Info, HelpCircle } from 'lucide-react'

interface Founder {
  name: string
  idea: number
  capital: number
  time: number
  skills: number
  network: number
}

export default function ValuationCalculator() {
  // --- Berkus Valuation States ---
  const [soundIdea, setSoundIdea] = useState(150000)
  const [prototype, setPrototype] = useState(100000)
  const [management, setManagement] = useState(150000)
  const [relationships, setRelationships] = useState(50000)
  const [rollout, setRollout] = useState(50000)

  const preMoneyValuation = soundIdea + prototype + management + relationships + rollout

  // --- Equity Split States ---
  const [founders, setFounders] = useState<Founder[]>([
    { name: 'Founder A (CEO)', idea: 8, capital: 5, time: 9, skills: 6, network: 7 },
    { name: 'Founder B (CTO)', idea: 4, capital: 2, time: 9, skills: 10, network: 3 },
    { name: 'Founder C (CMO)', idea: 3, capital: 8, time: 5, skills: 5, network: 9 }
  ])

  // Weight of metrics (%)
  const weights = {
    idea: 15,
    capital: 20,
    time: 30,
    skills: 20,
    network: 15
  }

  const handleUpdateFounderValue = <K extends keyof Founder>(idx: number,field: K,val: Founder[K]) => {
    setFounders(prev =>
      prev.map((f, i) =>
        i === idx
          ? { ...f, [field]: val }
          : f
      )
    )
  }

  const handleAddFounder = () => {
    if (founders.length >= 5) {
      alert('Tối đa 5 nhà sáng lập trong mô phỏng.')
      return
    }
    setFounders(prev => [
      ...prev,
      { name: `Founder ${String.fromCharCode(65 + prev.length)}`, idea: 5, capital: 5, time: 5, skills: 5, network: 5 }
    ])
  }

  const handleRemoveFounder = (idx: number) => {
    if (founders.length <= 2) {
      alert('Tối thiểu cần có 2 nhà sáng lập để thực hiện chia cổ phần.')
      return
    }
    setFounders(prev => prev.filter((_, i) => i !== idx))
  }

  // Calculate equity split based on weighted scores
  const getEquitySplitData = () => {
    const totalWeightedScores = founders.reduce((sum, f) => {
      const weighted = 
        (f.idea * weights.idea) +
        (f.capital * weights.capital) +
        (f.time * weights.time) +
        (f.skills * weights.skills) +
        (f.network * weights.network)
      return sum + weighted
    }, 0)

    if (totalWeightedScores === 0) return []

    return founders.map(f => {
      const weighted = 
        (f.idea * weights.idea) +
        (f.capital * weights.capital) +
        (f.time * weights.time) +
        (f.skills * weights.skills) +
        (f.network * weights.network)
      
      const share = totalWeightedScores > 0 ? Math.round((weighted / totalWeightedScores) * 100) : 0
      
      return {
        name: f.name,
        value: share,
        weightedScore: weighted
      }
    })
  }

  const chartData = getEquitySplitData()
  const COLORS = ['#FF6B00', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B']

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
  }

  return (
    <div className="space-y-6">
      
      {/* Upper Grid: Berkus Method Valuation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Sliders (col-span-2) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-850 pb-3 mb-4">
              <h3 className="font-extrabold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                <TrendingUp className="w-4.5 h-4.5 text-[#FF6B00]" />
                Định giá Startup theo Phương pháp Berkus (Seed Stage)
              </h3>
              <span className="text-[9px] bg-orange-500/10 text-[#FF6B00] border border-orange-500/20 px-2 py-0.5 rounded-full font-black uppercase">
                Pre-money Valuation
              </span>
            </div>

            <div className="space-y-5 text-xs">
              {/* Sound Idea */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span className="text-gray-800 dark:text-gray-200">1. Ý tưởng kinh doanh vượt trội (Sound Idea):</span>
                  <span className="text-[#FF6B00]">{formatVND(soundIdea)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500000"
                  step="10000"
                  value={soundIdea}
                  onChange={e => setSoundIdea(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#FF6B00]"
                />
                <p className="text-[9px] text-gray-500">Mức độ giải quyết nỗi đau lớn của thị trường (Tối đa 500,000 USD/VND tương ứng).</p>
              </div>

              {/* Prototype */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span className="text-gray-800 dark:text-gray-200">2. Bản mẫu sản phẩm khả thi (Prototype):</span>
                  <span className="text-[#FF6B00]">{formatVND(prototype)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500000"
                  step="10000"
                  value={prototype}
                  onChange={e => setPrototype(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#FF6B00]"
                />
                <p className="text-[9px] text-gray-500">MVP đã kiểm thử kỹ thuật và hạn chế tối đa rủi ro sản phẩm.</p>
              </div>

              {/* Management */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span className="text-gray-800 dark:text-gray-200">3. Đội ngũ quản lý cốt lõi (Quality Management):</span>
                  <span className="text-[#FF6B00]">{formatVND(management)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500000"
                  step="10000"
                  value={management}
                  onChange={e => setManagement(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#FF6B00]"
                />
                <p className="text-[9px] text-gray-500">Hội tụ đủ năng lực CEO, CTO, CMO có kinh nghiệm thực thi cao.</p>
              </div>

              {/* Relationships */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span className="text-gray-800 dark:text-gray-200">4. Mối quan hệ & Liên minh chiến lược (Strategic Relationships):</span>
                  <span className="text-[#FF6B00]">{formatVND(relationships)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500000"
                  step="10000"
                  value={relationships}
                  onChange={e => setRelationships(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#FF6B00]"
                />
                <p className="text-[9px] text-gray-500">Có đối tác kênh phân phối lớn hoặc bảo trợ từ vườn ươm.</p>
              </div>

              {/* Rollout */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span className="text-gray-800 dark:text-gray-200">5. Kế hoạch triển khai & Doanh thu sớm (Product Rollout):</span>
                  <span className="text-[#FF6B00]">{formatVND(rollout)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500000"
                  step="10000"
                  value={rollout}
                  onChange={e => setRollout(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#FF6B00]"
                />
                <p className="text-[9px] text-gray-500">Kế hoạch thương mại hóa rõ ràng, có đơn hàng hoặc người dùng trả phí ban đầu.</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Total pre-money valuation card (1 col) */}
        <div className="lg:col-span-1">
          <Card className="bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40 h-full flex flex-col justify-between">
            <h3 className="font-extrabold text-gray-900 dark:text-white text-xs uppercase tracking-wider border-b border-gray-100 dark:border-gray-850 pb-3">
              Tổng quan Giá trị Định giá
            </h3>

            <div className="space-y-6 py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#FF6B00] flex items-center justify-center mx-auto shadow-sm">
                <DollarSign className="w-8 h-8 animate-pulse" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Định giá Pre-money</span>
                <span className="text-2xl font-black text-gray-900 dark:text-white block">
                  {formatVND(preMoneyValuation)}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-gray-50/50 dark:bg-[#1C1C28]/35 border dark:border-gray-850/40 rounded-2xl text-[10px] text-gray-500 leading-relaxed font-medium">
              <span className="font-extrabold text-gray-700 dark:text-gray-400 block mb-1">💡 Phương pháp Berkus:</span>
              Được phát triển bởi nhà đầu tư thiên thần nổi tiếng Dave Berkus, phương pháp này định vị giá trị của một startup giai đoạn hạt giống dựa trên việc loại bỏ dần các rủi ro khởi nghiệp thay vì báo cáo doanh thu chưa kiểm chứng.
            </div>
          </Card>
        </div>

      </div>

      {/* Lower Grid: Equity Split Simulator */}
      <Card className="bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-gray-850 pb-3 mb-6">
          <div>
            <h3 className="font-extrabold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
              <Users className="w-4.5 h-4.5 text-[#FF6B00]" />
              Mô phỏng phân chia cổ phần sáng lập (Founder Equity Split)
            </h3>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
              Phân chia cổ phần dựa trên thuật toán tính điểm trọng số của 5 chỉ số đóng góp cốt lõi.
            </p>
          </div>
          <button
            onClick={handleAddFounder}
            className="px-4 py-2 bg-[#FF6B00] hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer"
          >
            + Thêm nhà sáng lập
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sliders Grid (col-span-2) */}
          <div className="lg:col-span-2 space-y-6 max-h-[400px] overflow-y-auto pr-2">
            {founders.map((f, idx) => (
              <div 
                key={f.name} 
                className="p-4 bg-gray-50/50 dark:bg-[#1C1C28]/45 border border-gray-150/30 dark:border-gray-850/30 rounded-3xl space-y-4"
              >
                <div className="flex justify-between items-center border-b dark:border-gray-800 pb-2">
                  <input
                    type="text"
                    value={f.name}
                    onChange={e => handleUpdateFounderValue(idx, 'name', e.target.value)}
                    className="bg-transparent border-0 text-xs font-black text-gray-900 dark:text-white focus:outline-none focus:ring-0 p-0"
                  />
                  <button
                    onClick={() => handleRemoveFounder(idx)}
                    className="text-red-500 hover:text-red-600 text-[10px] font-bold transition cursor-pointer"
                  >
                    Xóa
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-[10px]">
                  {/* Idea */}
                  <div className="space-y-1">
                    <label className="text-gray-550 dark:text-gray-400 font-bold block">Ý tưởng ({f.idea}):</label>
                    <input
                      type="range" min="1" max="10" value={f.idea}
                      onChange={e => handleUpdateFounderValue(idx, 'idea', Number(e.target.value))}
                      className="w-full h-1 bg-gray-250 dark:bg-gray-800 rounded appearance-none cursor-pointer accent-[#FF6B00]"
                    />
                  </div>
                  {/* Capital */}
                  <div className="space-y-1">
                    <label className="text-gray-550 dark:text-gray-400 font-bold block">Vốn góp ({f.capital}):</label>
                    <input
                      type="range" min="1" max="10" value={f.capital}
                      onChange={e => handleUpdateFounderValue(idx, 'capital', Number(e.target.value))}
                      className="w-full h-1 bg-gray-250 dark:bg-gray-800 rounded appearance-none cursor-pointer accent-[#FF6B00]"
                    />
                  </div>
                  {/* Time */}
                  <div className="space-y-1">
                    <label className="text-gray-550 dark:text-gray-400 font-bold block">Thời gian ({f.time}):</label>
                    <input
                      type="range" min="1" max="10" value={f.time}
                      onChange={e => handleUpdateFounderValue(idx, 'time', Number(e.target.value))}
                      className="w-full h-1 bg-gray-250 dark:bg-gray-800 rounded appearance-none cursor-pointer accent-[#FF6B00]"
                    />
                  </div>
                  {/* Skills */}
                  <div className="space-y-1">
                    <label className="text-gray-550 dark:text-gray-400 font-bold block">Kỹ thuật ({f.skills}):</label>
                    <input
                      type="range" min="1" max="10" value={f.skills}
                      onChange={e => handleUpdateFounderValue(idx, 'skills', Number(e.target.value))}
                      className="w-full h-1 bg-gray-250 dark:bg-gray-800 rounded appearance-none cursor-pointer accent-[#FF6B00]"
                    />
                  </div>
                  {/* Network */}
                  <div className="space-y-1">
                    <label className="text-gray-550 dark:text-gray-400 font-bold block">Mối quan hệ ({f.network}):</label>
                    <input
                      type="range" min="1" max="10" value={f.network}
                      onChange={e => handleUpdateFounderValue(idx, 'network', Number(e.target.value))}
                      className="w-full h-1 bg-gray-250 dark:bg-gray-800 rounded appearance-none cursor-pointer accent-[#FF6B00]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pie Chart display (1 col) */}
          <div className="lg:col-span-1 space-y-4">
            <h4 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-wider block text-center">
              Biểu đồ tỷ lệ cổ phần đề xuất
            </h4>
            
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#13131C', borderColor: '#2D2D3D', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '11px' }}
                    formatter={(value: any) => [`${value}%`, 'Tỷ lệ']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {chartData.map((data, index) => (
                <div key={data.name} className="flex items-center justify-between text-xs font-bold px-2 py-1 bg-gray-50/50 dark:bg-gray-900/25 border dark:border-gray-850/40 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full shrink-0" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></span>
                    <span className="text-gray-700 dark:text-gray-300 truncate max-w-[140px]">{data.name}</span>
                  </div>
                  <span className="text-gray-900 dark:text-white font-black">{data.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
      
    </div>
  )
}
