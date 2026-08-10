import { useEffect, useState } from 'react'
import Card from '../../components/cards/Card'
import { reportService, userService, teamService } from '../../services/apiServices'
import { 
  Cpu, 
  Loader2,
  Users,
  Activity,
  AlertOctagon,
  FileSpreadsheet
} from 'lucide-react'

export default function ReportManagement() {
  const [stats, setStats] = useState<any>(null)
  const [suspendedUsers, setSuspendedUsers] = useState<any[]>([])
  const [atRiskTeams, setAtRiskTeams] = useState<any[]>([])
  const [topAIUsers, setTopAIUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsData, usersData, teamsData, aiData] = await Promise.all([
        reportService.getPlatformStats(),
        userService.getUsers({ status: 'suspended' }),
        teamService.getTeams({ status: 'at_risk' }),
        reportService.getAIUsage()
      ])
      setStats(statsData)
      setSuspendedUsers(usersData)
      setAtRiskTeams(teamsData)
      setTopAIUsers(aiData.topUsers || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-500">
        <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin mb-2" />
        <span className="text-sm font-semibold">Đang tải dữ liệu báo cáo hệ thống...</span>
      </div>
    )
  }

  const totalUsers = stats?.users?.total ?? 0
  const activeUsers = stats?.users?.active ?? 0
  const activeRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0F0F12] via-[#1C1C24] to-[#0A0A0D] text-white rounded-3xl p-6 shadow-xl border border-gray-800/80">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF6B00] via-[#FFA64D] to-[#FF6B00]"></div>
        <h1 className="text-2xl font-black">Báo Cáo Hoạt Động & Sức Khỏe Hệ Thống 📊</h1>
        <p className="text-xs text-gray-400 mt-2 font-medium opacity-90">
          Giám sát tỷ lệ người dùng, mức độ rủi ro nhóm dự án và thống kê sử dụng tài nguyên AI toàn nền tảng.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-wider block">Người Dùng Hoạt Động</span>
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
            <span className="text-[10px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-wider block">Tổng Nhóm Dự Án</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">
              {stats?.teams?.total || 0} Nhóm
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center shadow-sm">
            <Activity className="w-5 h-5" />
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

      {/* Flagged items & AI usage table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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