import { useEffect, useState } from 'react'
import Card from '../../components/cards/Card'
import { reportService, userService, teamService } from '../../services/apiServices'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line 
} from 'recharts'
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  Cpu, 
  Calendar, 
  Filter, 
  Loader2,
  Users,
  Activity,
  AlertOctagon,
  Eye,
  FileSpreadsheet
} from 'lucide-react'

export default function ReportManagement() {
  const [stats, setStats] = useState<any>(null)
  const [suspendedUsers, setSuspendedUsers] = useState<any[]>([])
  const [atRiskTeams, setAtRiskTeams] = useState<any[]>([])
  const [topAIUsers, setTopAIUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Revenue states
  const [revenueStats, setRevenueStats] = useState<any>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [revenuePeriod, setRevenuePeriod] = useState<'day' | 'month' | 'quarter' | 'year'>('month')
  const [filtering, setFiltering] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsData, usersData, teamsData, aiData, revData] = await Promise.all([
        reportService.getPlatformStats(),
        userService.getUsers({ status: 'suspended' }),
        teamService.getTeams({ status: 'at_risk' }),
        reportService.getAIUsage(),
        reportService.getRevenueStats()
      ])
      setStats(statsData)
      setSuspendedUsers(usersData)
      setAtRiskTeams(teamsData)
      setTopAIUsers(aiData.topUsers || [])
      setRevenueStats(revData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleFilterRevenue = async (e: React.FormEvent) => {
    e.preventDefault()
    setFiltering(true)
    try {
      const data = await reportService.getRevenueStats(startDate, endDate)
      setRevenueStats(data)
    } catch (err) {
      console.error(err)
      alert('Lỗi truy vấn doanh thu.')
    } finally {
      setFiltering(false)
    }
  }

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
  }

  // Prep chart data
  const getChartData = () => {
    if (!revenueStats || !revenueStats.breakdowns) return []
    
    let source: Record<string, number> = {}
    if (revenuePeriod === 'day') source = revenueStats.breakdowns.byDay || {}
    else if (revenuePeriod === 'month') source = revenueStats.breakdowns.byMonth || {}
    else if (revenuePeriod === 'quarter') source = revenueStats.breakdowns.byQuarter || {}
    else if (revenuePeriod === 'year') source = revenueStats.breakdowns.byYear || {}

    return Object.entries(source).map(([name, val]) => ({
      name,
      DoanhThu: val
    }))
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-500">
        <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin mb-2" />
        <span className="text-sm font-semibold">Đang tải dữ liệu phân tích hệ thống...</span>
      </div>
    )
  }

  const totalUsers = stats?.users?.total ?? 0
  const activeUsers = stats?.users?.active ?? 0
  const activeRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

  const chartData = getChartData()

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0F0F12] via-[#1C1C24] to-[#0A0A0D] text-white rounded-3xl p-6 shadow-xl border border-gray-800/80">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF6B00] via-[#FFA64D] to-[#FF6B00]"></div>
        <h1 className="text-2xl font-black">Báo Cáo & Phân Tích Doanh Thu Hệ Thống 📊</h1>
        <p className="text-xs text-gray-400 mt-2 font-medium opacity-90">
          Tổng hợp doanh thu tài chính thực tế và xếp hạng mức độ sử dụng dịch vụ Premium/AI để tối ưu hóa hiệu quả kinh doanh.
        </p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-wider block">Doanh Thu Thực Tế</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">
              {formatVND(revenueStats?.totalRevenue || 0)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-[#FF6B00] flex items-center justify-center shadow-sm">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="card bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-wider block">Giao Dịch Đã Hoàn Thành</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">
              {revenueStats?.totalPayments || 0} hóa đơn
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center shadow-sm">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="card bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-wider block">Người dùng hoạt động</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">
              {activeUsers} / {totalUsers} ({activeRate}%)
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-500 flex items-center justify-center shadow-sm">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="card bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-wider block">Yêu Cầu AI (Tích Lũy)</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">
              {stats?.ai?.totalRequests || 0} lượt
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-500 flex items-center justify-center shadow-sm">
            <Cpu className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Date Filters & Chart (col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-gray-100 dark:border-gray-850 pb-4 mb-4">
              <h3 className="font-extrabold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#FF6B00]" />
                Biểu đồ Doanh thu Tài chính
              </h3>

              {/* Chart Mode Selector */}
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                {(['day', 'month', 'quarter', 'year'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setRevenuePeriod(mode)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-extrabold capitalize transition ${
                      revenuePeriod === mode
                        ? 'bg-white dark:bg-[#1C1C28] text-gray-950 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
                    }`}
                  >
                    {mode === 'day' ? 'Ngày' : mode === 'month' ? 'Tháng' : mode === 'quarter' ? 'Quý' : 'Năm'}
                  </button>
                ))}
              </div>
            </div>

            {/* Date filter form */}
            <form onSubmit={handleFilterRevenue} className="flex flex-wrap items-end gap-3 mb-6 bg-gray-50/50 dark:bg-[#1C1C28]/20 p-3 rounded-2xl border border-gray-100 dark:border-gray-850/30">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Từ Ngày</label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-450" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-xl text-xs bg-white dark:bg-[#1C1C28] text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Đến Ngày</label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-450" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-xl text-xs bg-white dark:bg-[#1C1C28] text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={filtering}
                className="px-4 py-2 bg-[#FF6B00] hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {filtering ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Filter className="w-3.5 h-3.5" /> Lọc dữ liệu
                  </>
                )}
              </button>
            </form>

            {/* Recharts Chart */}
            <div className="h-64 w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-xs border border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                  Không có dữ liệu doanh thu trong khoảng thời gian này.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D2D3D" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#686888" fontSize={9} tickLine={false} />
                    <YAxis 
                      stroke="#686888" 
                      fontSize={9} 
                      tickLine={false} 
                      tickFormatter={val => `${val / 1000000}M`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#13131C', borderColor: '#2D2D3D', borderRadius: '12px' }}
                      labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#FF6B00', fontSize: '11px' }}
                      formatter={(value: any) => [formatVND(Number(value)), 'Doanh thu']}
                    />
                    <Bar dataKey="DoanhThu" fill="url(#colorRevenue)" radius={[8, 8, 0, 0]} />
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#FF801A" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Service & AI usage rankings (col-span-1) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Subscription Services bought ranking */}
          <Card className="bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40">
            <h3 className="font-extrabold text-gray-900 dark:text-white text-xs uppercase tracking-wider border-b border-gray-100 dark:border-gray-850 pb-3 mb-4 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#FF6B00]" />
              Xếp hạng gói dịch vụ (Mua nhiều)
            </h3>
            
            <div className="space-y-4">
              {revenueStats?.services?.map((svc: any, idx: number) => {
                const colors = ['bg-[#FF6B00]', 'bg-blue-500', 'bg-emerald-500']
                const maxRevenue = Math.max(...revenueStats.services.map((s: any) => s.revenue)) || 1
                const percent = Math.round((svc.revenue / maxRevenue) * 100)
                
                return (
                  <div key={svc.plan} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-gray-800 dark:text-gray-300">
                      <span className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400 font-extrabold">#{idx+1}</span>
                        {svc.plan}
                      </span>
                      <span>{svc.count} lượt ({formatVND(svc.revenue)})</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colors[idx % colors.length]}`} 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* AI Usage stats */}
          <Card className="bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40">
            <h3 className="font-extrabold text-gray-900 dark:text-white text-xs uppercase tracking-wider border-b border-gray-100 dark:border-gray-850 pb-3 mb-4 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[#FF6B00]" />
              Tính năng AI được dùng nhiều
            </h3>

            <div className="space-y-4">
              {revenueStats?.aiUsage?.map((ai: any, idx: number) => {
                const colors = ['bg-[#FF6B00]', 'bg-purple-500', 'bg-blue-500']
                const maxCount = Math.max(...revenueStats.aiUsage.map((a: any) => a.count)) || 1
                const percent = Math.round((ai.count / maxCount) * 100)
                const nameMap: Record<string, string> = {
                  idea_generator: 'Tạo ý tưởng AI',
                  team_matching: 'Ghép nhóm Co-founder',
                  analytics: 'Phân tích & Thống kê OKR'
                }

                return (
                  <div key={ai.feature} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-gray-800 dark:text-gray-300">
                      <span>{nameMap[ai.feature] || ai.feature}</span>
                      <span>{ai.count} lượt dùng</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colors[idx % colors.length]}`} 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Flagged items & AI usage table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* At risk / Suspended warnings */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-gray-950 dark:text-white text-sm">
            Cảnh báo giám sát vận hành
          </h3>
          
          <div className="space-y-3">
            {suspendedUsers.length > 0 ? (
              <Card className="border-l-4 border-red-500 bg-red-50/50 dark:bg-red-950/10">
                <h4 className="font-bold text-red-700 dark:text-red-400 text-xs flex items-center gap-1.5 mb-2">
                  <AlertOctagon className="w-4 h-4" /> Tài khoản bị đình chỉ ({suspendedUsers.length})
                </h4>
                <div className="space-y-1">
                  {suspendedUsers.map(u => (
                    <div key={u.id} className="text-[11px] text-gray-600 dark:text-gray-400 font-semibold">
                      • {u.name} ({u.email}) - SĐT: {u.phone || 'N/A'}
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="border-l-4 border-green-500 bg-green-50/30 dark:bg-green-950/5 text-xs text-green-700 dark:text-green-400 font-bold">
                ✓ Không có tài khoản nào đang bị khóa.
              </Card>
            )}

            {atRiskTeams.length > 0 ? (
              <Card className="border-l-4 border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/10">
                <h4 className="font-bold text-yellow-700 dark:text-yellow-400 text-xs flex items-center gap-1.5 mb-2">
                  <AlertOctagon className="w-4 h-4" /> Nhóm có mức độ rủi ro cao ({atRiskTeams.length})
                </h4>
                <div className="space-y-1">
                  {atRiskTeams.map(t => (
                    <div key={t.id} className="text-[11px] text-gray-650 dark:text-gray-400 font-semibold">
                      • Nhóm {t.name} (Điểm sức khỏe: <span className="text-red-500 font-black">{t.healthScore}%</span>)
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="border-l-4 border-green-500 bg-green-50/30 dark:bg-green-950/5 text-xs text-green-700 dark:text-green-400 font-bold">
                ✓ Sức khỏe hoạt động của các nhóm đều tốt.
              </Card>
            )}
          </div>
        </div>

        {/* AI Leaderboard */}
        <Card className="bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40">
          <h3 className="font-extrabold text-gray-900 dark:text-white text-xs uppercase tracking-wider border-b border-gray-100 dark:border-gray-850 pb-3 mb-4 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-[#FF6B00]" />
            Thống kê lượt dùng AI của người dùng
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-gray-100 dark:border-gray-800 text-gray-400">
                <tr>
                  <th className="text-left p-2 font-bold uppercase tracking-wider">Họ tên</th>
                  <th className="text-left p-2 font-bold uppercase tracking-wider">Email</th>
                  <th className="text-right p-2 font-bold uppercase tracking-wider">Số lần yêu cầu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40 text-gray-700 dark:text-gray-300">
                {topAIUsers.map((item: any) => (
                  <tr key={item.userId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                    <td className="p-2 font-bold">{item.name}</td>
                    <td className="p-2 text-gray-500">{item.email}</td>
                    <td className="p-2 text-right font-black text-[#FF6B00]">{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

    </div>
  )
}
