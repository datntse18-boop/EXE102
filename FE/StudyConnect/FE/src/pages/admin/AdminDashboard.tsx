import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/cards/Card'
import { reportService, userService, teamService } from '../../services/apiServices'
import { 
  Shield, 
  Users, 
  Activity, 
  Cpu, 
  AlertOctagon, 
  Loader2, 
  UserMinus, 
  UserCheck,
  Brain,
  Zap
} from 'lucide-react'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Quick user actions states
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const [statsData, usersData, teamsData] = await Promise.all([
        reportService.getPlatformStats(),
        userService.getUsers(),
        teamService.getTeams(),
      ])
      setStats(statsData)
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
            Admin IT Command Center
          </span>
          <h1 className="text-3xl font-black mt-4 tracking-tight leading-none">Trung tâm Quản trị Vận hành ⚙️</h1>
          <p className="text-sm text-gray-400 mt-3 font-medium opacity-90 leading-relaxed">
            Giám sát hạ tầng kỹ thuật, chẩn đoán hoạt động người dùng và phân tích tần suất sử dụng tính năng AI toàn hệ thống.
          </p>
        </div>
        <div className="absolute right-8 bottom-0 top-0 opacity-5 w-1/4 flex items-center justify-center pointer-events-none">
          <span className="text-9xl">🖥️</span>
        </div>
      </div>

      {/* Main Stats (Đã loại bỏ doanh thu, gom thành 3 cột vận hành cốt lõi) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="card bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40 flex items-center justify-between p-5 shadow-sm rounded-2xl">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tổng Thành viên</span>
            <span className="text-2xl font-black text-gray-900 dark:text-white">{stats?.users?.total ?? '...'}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-500 shadow-sm">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="card bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40 flex items-center justify-between p-5 shadow-sm rounded-2xl">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Nhóm hoạt động</span>
            <span className="text-2xl font-black text-gray-900 dark:text-white">{stats?.teams?.total ?? '...'} <span className="text-xs font-normal text-gray-400">({stats?.teams?.withClass ?? '0'} trong lớp)</span></span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/20 flex items-center justify-center text-green-500 shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="card bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40 flex items-center justify-between p-5 shadow-sm rounded-2xl">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Premium Rate</span>
            <span className="text-2xl font-black text-gray-900 dark:text-white">{stats ? `${Math.round((stats.users.premium / stats.users.total) * 100)}%` : '...'}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center text-purple-500 shadow-sm">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* AI Token diagnostics & User Structure */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* AI Overview (Col-span-1) */}
        <Card className="bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40">
          <h3 className="font-extrabold text-gray-900 dark:text-white text-xs uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 pb-3 mb-4 flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-purple-500 animate-pulse" />
            AI Diagnostics Center
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-bold">Tổng yêu cầu AI:</span>
              <span className="font-black text-[#FF6B00]">{totalAICount} lần</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-bold">Lượt tạo ý tưởng:</span>
              <span className="font-semibold text-gray-800 dark:text-gray-300">{aiIdeaCount}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-bold">Lượt ghép co-founder:</span>
              <span className="font-semibold text-gray-800 dark:text-gray-300">{aiMatchingCount}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-bold">Lượt phân tích tiến độ:</span>
              <span className="font-semibold text-gray-800 dark:text-gray-300">{aiAnalyticsCount}</span>
            </div>
          </div>
        </Card>

        {/* User breakdown detail (Col-span-2) */}
        <Card className="bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40 md:col-span-2">
          <h3 className="font-extrabold text-gray-900 dark:text-white text-xs uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 pb-3 mb-4 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            Phân bổ cơ cấu người dùng
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-gray-50/50 dark:bg-[#1C1C28]/40 border border-gray-150/40 dark:border-gray-850/40 rounded-2xl">
              <span className="text-gray-550 dark:text-gray-400 text-[10px] block font-bold">Free Accounts</span>
              <span className="text-lg font-black text-gray-850 dark:text-white mt-1 block">{stats?.users?.free ?? 0}</span>
            </div>
            <div className="p-3 bg-orange-500/[0.03] border border-[#FF6B00]/20 rounded-2xl">
              <span className="text-orange-500 text-[10px] block font-bold">Premium Users</span>
              <span className="text-lg font-black text-orange-500 mt-1 block">{stats?.users?.premium ?? 0}</span>
            </div>
            <div className="p-3 bg-gray-50/50 dark:bg-[#1C1C28]/40 border border-gray-150/40 dark:border-gray-850/40 rounded-2xl">
              <span className="text-gray-550 dark:text-gray-400 text-[10px] block font-bold">Giảng viên</span>
              <span className="text-lg font-black text-gray-850 dark:text-white mt-1 block">{stats?.users?.manager ?? 0}</span>
            </div>
            <div className="p-3 bg-gray-50/50 dark:bg-[#1C1C28]/40 border border-gray-150/40 dark:border-gray-850/40 rounded-2xl">
              <span className="text-gray-550 dark:text-gray-400 text-[10px] block font-bold">Deans / Leaders</span>
              <span className="text-lg font-black text-gray-850 dark:text-white mt-1 block">{stats?.users?.leader ?? 0}</span>
            </div>
          </div>
        </Card>

      </div>

      {/* Admin Actionable Grid Layout (User Suspend & Quick actions) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Quick User Suspend Widget */}
        <Card className="bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
            <AlertOctagon className="w-4 h-4 text-red-500" />
            <h3 className="font-bold text-gray-850 dark:text-white text-xs">Quản trị người dùng nhanh</h3>
          </div>
          
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full border border-gray-250 dark:border-gray-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF6B00] bg-white dark:bg-[#1C1C28] text-gray-900 dark:text-white mb-3"
          />

          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {filteredUsers.map(u => (
              <div key={u.id} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-850/45 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-850 dark:text-white truncate">{u.name}</p>
                  <p className="text-[9px] text-gray-400 truncate">{u.email}</p>
                </div>
                <button
                  onClick={() => handleToggleSuspend(u.id, u.status)}
                  disabled={updatingUserId === u.id || u.role === 'admin'}
                  className={`p-1.5 rounded-lg border text-[10px] font-bold transition flex items-center gap-1 shrink-0 ${
                    u.status === 'active' 
                      ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/20' 
                      : 'border-green-200 text-green-600 hover:bg-green-50 dark:border-green-950 dark:text-green-400 dark:hover:bg-green-950/20'
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
        <Card className="bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-xl">⚡</span>
              <h3 className="font-bold text-gray-850 dark:text-white text-xs">Phím tắt Điều hướng Hệ thống</h3>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/admin/users')} 
                className="w-full px-4 py-3 rounded-xl bg-[#FF6B00] hover:bg-orange-600 text-white font-bold text-xs text-center transition cursor-pointer shadow-sm"
              >
                👥 Quản lý người dùng hệ thống
              </button>
              <button 
                onClick={() => navigate('/admin/revenue')} 
                className="w-full px-4 py-3 rounded-xl border border-emerald-500/30 text-emerald-400 bg-emerald-500/[0.05] hover:bg-emerald-500/[0.1] font-bold text-xs text-center transition cursor-pointer"
              >
                📈 Truy cập Báo cáo Doanh thu & Tài chính
              </button>
              <button 
                onClick={() => navigate('/admin/subscriptions')} 
                className="w-full px-4 py-3 rounded-xl border border-orange-200/50 text-[#FF6B00] bg-orange-500/[0.03] hover:bg-orange-500/[0.08] font-bold text-xs text-center transition cursor-pointer"
              >
                💳 Cấu hình gói Subscription
              </button>
              <button 
                onClick={() => navigate('/admin/reports')} 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-650 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/40 font-bold text-xs text-center transition cursor-pointer"
              >
                📊 Xem báo cáo hệ thống chi tiết
              </button>
            </div>
          </div>
        </Card>

      </div>
    </div>
  )
}