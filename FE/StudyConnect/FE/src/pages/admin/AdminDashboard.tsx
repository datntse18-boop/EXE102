import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/cards/Card'
import { reportService, paymentService, userService, teamService } from '../../services/apiServices'
import { 
  Shield, 
  Users, 
  DollarSign, 
  Activity, 
  Cpu, 
  CreditCard, 
  TrendingUp, 
  AlertOctagon, 
  Loader2, 
  UserMinus, 
  UserCheck,
  Brain,
  Zap,
  Lock,
  BookOpen,
  Folder
} from 'lucide-react'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Quick user actions states
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const [statsData, paymentsData, usersData, teamsData] = await Promise.all([
        reportService.getPlatformStats(),
        paymentService.getPayments(),
        userService.getUsers(),
        teamService.getTeams(),
      ])
      setStats(statsData)
      setPayments(paymentsData)
      setUsers(usersData)
      setTeams(teamsData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Toggle user suspension directly from dashboard
  const handleToggleSuspend = async (userId: string, currentStatus: string) => {
    setUpdatingUserId(userId)
    try {
      await userService.toggleStatus(userId)
      // Update local state
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: currentStatus === 'active' ? 'suspended' : 'active' } : u))
      // Refresh stats
      const updatedStats = await reportService.getPlatformStats()
      setStats(updatedStats)
    } catch (err) {
      console.error(err)
      alert('Không thể cập nhật trạng thái người dùng')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5)

  const lecturers = users.filter(u => u.role === 'manager')

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-500">
        <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin mb-2" />
        <span className="text-sm font-semibold">Đang tải trung tâm quản trị tối cao...</span>
      </div>
    )
  }

  // Get AI stats
  const aiIdeaCount = stats?.ai?.breakdown?.idea_generator || 0
  const aiMatchingCount = stats?.ai?.breakdown?.team_matching || 0
  const aiAnalyticsCount = stats?.ai?.breakdown?.analytics || 0
  const totalAICount = stats?.ai?.totalRequests || 0

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* High-tech Obsidian Admin Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0F0F12] via-[#1C1C24] to-[#0A0A0D] text-white rounded-3xl p-8 shadow-2xl border border-gray-800/80">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF6B00] via-[#FFA64D] to-[#FF6B00] shadow-[0_0_10px_rgba(255,107,0,0.5)]"></div>
        <div className="relative z-10 max-w-xl">
          <span className="bg-[#FF6B00]/25 text-[#FF6B00] border border-[#FF6B00]/40 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,107,0,0.1)] flex items-center gap-1.5 w-max">
            <Shield className="w-3.5 h-3.5" />
            Admin IT Command & Revenue Center
          </span>
          <h1 className="text-3xl font-black mt-4 tracking-tight leading-none">Trung tâm Quản trị Vận hành & Doanh thu ⚙️</h1>
          <p className="text-sm text-gray-400 mt-3 font-medium opacity-90 leading-relaxed">
            Giám sát tài chính, chẩn đoán hoạt động người dùng và phân tích tần suất sử dụng tính năng để hoạch định kế hoạch thu phí nâng cấp Premium.
          </p>
        </div>
        <div className="absolute right-8 bottom-0 top-0 opacity-5 w-1/4 flex items-center justify-center pointer-events-none">
          <span className="text-9xl">🖥️</span>
        </div>
      </div>

      {/* Main Stats (Financial & Scale) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="card bg-white border border-gray-100 flex items-center justify-between p-5 shadow-sm rounded-2xl">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tổng Doanh thu</span>
            <span className="text-2xl font-black text-gray-900">{stats ? `$${stats.revenue.total.toFixed(2)}` : '...'}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF6B00] shadow-sm">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="card bg-white border border-gray-100 flex items-center justify-between p-5 shadow-sm rounded-2xl">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tổng Thành viên</span>
            <span className="text-2xl font-black text-gray-900">{stats?.users?.total ?? '...'}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-sm">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="card bg-white border border-gray-100 flex items-center justify-between p-5 shadow-sm rounded-2xl">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Nhóm hoạt động</span>
            <span className="text-2xl font-black text-gray-900">{stats?.teams?.total ?? '...'} ({stats?.teams?.withClass ?? '0'} đã vào lớp)</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500 shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="card bg-white border border-gray-100 flex items-center justify-between p-5 shadow-sm rounded-2xl">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Lưu lượng AI API</span>
            <span className="text-2xl font-black text-gray-900">{totalAICount} reqs</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* FEATURE USAGE ANALYTICS & MONETIZATION ADVISORY */}
      <Card className="border-t-4 border-amber-500">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-gray-800 text-sm">
              Phân tích Tần suất Sử dụng Tính năng & Khuyến nghị Thu phí (Paywall Strategy)
            </h3>
          </div>
          <span className="bg-amber-50 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider">
            Chiến lược doanh thu
          </span>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed mb-6">
          Dưới đây là thống kê lượt kích hoạt thực tế các tính năng từ người dùng. Hệ thống tự động phân tích và đưa ra khuyến nghị khoá bớt chức năng miễn phí để đẩy mạnh gói **Premium** hoặc **Enterprise**.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-4 rounded-2xl bg-gray-50/50 border border-gray-100 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-orange-500" />
                  Đề xuất Ý tưởng AI
                </span>
                <span className="text-xs font-black text-[#FF6B00] bg-orange-50 px-2 py-0.5 rounded-md">
                  {aiIdeaCount} lượt dùng
                </span>
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#FF6B00] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (aiIdeaCount / (totalAICount || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-orange-50/40 border border-orange-100/50 text-[10px] text-gray-600 leading-relaxed">
              {aiIdeaCount >= 5 ? (
                <>
                  <span className="font-bold text-orange-700 flex items-center gap-1 mb-1">
                    <Zap className="w-3.5 h-3.5 shrink-0" /> Khuyến nghị thương mại hóa cao:
                  </span>
                  Tính năng **Ý tưởng AI** đang được sử dụng nhiều nhất ({aiIdeaCount} lượt). Nên giới hạn tối đa 3 lần chạy thử miễn phí cho mỗi dự án. Bắt buộc nâng cấp Premium để sử dụng không giới hạn.
                </>
              ) : (
                "Lượt sử dụng còn thấp. Giữ miễn phí để tăng độ tương tác của sinh viên với hệ thống."
              )}
            </div>
          </div>

          {/* Feature 2 */}
          <div className="p-4 rounded-2xl bg-gray-50/50 border border-gray-100 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-500" />
                  Ghép nhóm thông minh AI
                </span>
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  {aiMatchingCount} lượt dùng
                </span>
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (aiMatchingCount / (totalAICount || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-blue-50/40 border border-blue-100/50 text-[10px] text-gray-600 leading-relaxed">
              {aiMatchingCount >= 5 ? (
                <>
                  <span className="font-bold text-blue-700 flex items-center gap-1 mb-1">
                    <Lock className="w-3.5 h-3.5 shrink-0" /> Đề xuất khóa nâng cao:
                  </span>
                  Tính năng **Ghép nhóm AI** ({aiMatchingCount} lượt) giúp tiết kiệm 80% thời gian cho môn học. Nên khóa tính năng này cho các tài khoản miễn phí, chỉ mở cho sinh viên đăng ký gói Premium để tự động kết nối đội ngũ.
                </>
              ) : (
                "Lượt dùng vừa phải. Nên khuyến khích sinh viên sử dụng khi bắt đầu học phần EXE101."
              )}
            </div>
          </div>

          {/* Feature 3 */}
          <div className="p-4 rounded-2xl bg-gray-50/50 border border-gray-100 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  AI Advisor Phân tích dự án
                </span>
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {aiAnalyticsCount} lượt dùng
                </span>
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (aiAnalyticsCount / (totalAICount || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50/40 border border-indigo-100/50 text-[10px] text-gray-600 leading-relaxed">
              {aiAnalyticsCount >= 5 ? (
                <>
                  <span className="font-bold text-indigo-700 flex items-center gap-1 mb-1">
                    <Lock className="w-3.5 h-3.5 shrink-0" /> Sản phẩm giá trị cao:
                  </span>
                  Cố vấn Gemini AI cho điểm sức khỏe và tiến độ dự án có giá trị thương mại lớn ({aiAnalyticsCount} lượt). Chỉ mở báo cáo chi tiết cho Trưởng nhóm đã nâng cấp gói Premium. Sinh viên thường chỉ được xem báo cáo cơ bản.
                </>
              ) : (
                "Trợ lý tiến độ AI giúp giữ chân người dùng. Hãy tiếp tục theo dõi hiệu năng trước khi cấu hình thu phí."
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* LECTURERS & TEAMS DIRECTORY (IT System Audit Views) */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Lecturers Directory */}
        <Card>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#FF6B00]" />
              <h3 className="font-bold text-gray-800 text-sm">Danh sách Giảng viên hệ thống</h3>
            </div>
            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {lecturers.length} Giảng viên
            </span>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {lecturers.map(lec => (
              <div key={lec.id} className="p-3 rounded-2xl bg-gray-50/50 border border-gray-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl">{lec.avatar || '👨‍🏫'}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{lec.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{lec.email}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-[#FF6B00] bg-[#FFF4E8] px-2 py-0.5 rounded-full border border-orange-100">
                    Mã lớp: {lec.classCode || 'Chưa tạo'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Project Teams Directory */}
        <Card>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-green-500" />
              <h3 className="font-bold text-gray-800 text-sm">Giám sát các Nhóm dự án</h3>
            </div>
            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {teams.length} nhóm
            </span>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {teams.map(t => (
              <div key={t.id} className="p-3 rounded-2xl bg-gray-50/50 border border-gray-100 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">{t.name}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">
                    Lớp liên kết: <strong className="text-gray-600">{t.classCode || 'Chưa liên kết'}</strong>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-[#FF6B00]">{t.healthScore}%</div>
                  <div className="text-[8px] uppercase tracking-wider text-gray-400 font-bold">Health Score</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* Admin Actionable Grid Layout (User Suspend & Quick actions) */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Quick User Suspend Widget (Width: 1/3) */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-t-4 border-red-500">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50">
              <AlertOctagon className="w-4 h-4 text-red-500" />
              <h3 className="font-bold text-gray-800 text-xs">Quản trị người dùng nhanh</h3>
            </div>
            
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full border border-gray-200/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF6B00] bg-white mb-3"
            />

            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {filteredUsers.map(u => (
                <div key={u.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-800 truncate">{u.name}</p>
                    <p className="text-[9px] text-gray-400 truncate">{u.email}</p>
                  </div>
                  <button
                    onClick={() => handleToggleSuspend(u.id, u.status)}
                    disabled={updatingUserId === u.id}
                    className={`p-1.5 rounded-lg border text-[10px] font-bold transition flex items-center gap-1 shrink-0 ${
                      u.status === 'active' 
                        ? 'border-red-200 text-red-600 hover:bg-red-50' 
                        : 'border-green-200 text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {updatingUserId === u.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : u.status === 'active' ? (
                      <>
                        <UserMinus className="w-3.5 h-3.5" /> Khóa
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" /> Mở
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Action Navigation */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50">
              <span className="text-xl">⚡</span>
              <h3 className="font-bold text-gray-800 text-xs">Phím tắt Admin</h3>
            </div>
            <div className="space-y-2">
              <button 
                onClick={() => navigate('/admin/users')} 
                className="w-full px-4 py-2.5 rounded-xl bg-[#FF6B00] text-white hover:bg-[#E85A00] font-bold text-xs text-center transition cursor-pointer"
              >
                👥 Quản lý người dùng hệ thống
              </button>
              <button 
                onClick={() => navigate('/admin/subscriptions')} 
                className="w-full px-4 py-2.5 rounded-xl border border-orange-100 text-[#FF6B00] bg-[#FFF4E8]/20 hover:bg-[#FFF4E8] font-bold text-xs text-center transition cursor-pointer"
              >
                💳 Cấu hình gói Subscription
              </button>
              <button 
                onClick={() => navigate('/admin/reports')} 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs text-center transition cursor-pointer"
              >
                📊 Xem báo cáo hệ thống chi tiết
              </button>
            </div>
          </Card>
        </div>

        {/* Financial payments log (Width: 2/3) */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50">
              <CreditCard className="w-4 h-4 text-[#FF6B00]" />
              <h3 className="font-bold text-gray-800 text-sm">Nhật ký giao dịch gần đây</h3>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-50">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50/75 border-b border-gray-100">
                  <tr>
                    <th className="p-3 font-bold text-gray-500">Khách hàng</th>
                    <th className="p-3 font-bold text-gray-500">Gói nạp</th>
                    <th className="p-3 font-bold text-gray-500">Số tiền</th>
                    <th className="p-3 font-bold text-gray-500">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.slice(0, 5).map(p => (
                    <tr key={p.id} className="hover:bg-[#FFF4E8]/20 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-gray-800">{p.user?.name}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{p.user?.email}</div>
                      </td>
                      <td className="p-3 capitalize font-semibold text-gray-600">{p.plan}</td>
                      <td className="p-3 font-black text-[#FF6B00]">${p.amount.toFixed(2)}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-[9px] font-bold">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}
