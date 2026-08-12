import { useEffect, useState } from 'react'
import {
  CreditCard,
  Users,
  Sparkles,
  CheckCircle2,
  Crown,
  Search,
  ShieldAlert,
  Zap,
  Building2,
  Clock,
  Edit,
  Save,
  X
} from 'lucide-react'
import { userService, paymentService } from '../../services/apiServices'

interface PlanConfig {
  id: string
  name: string
  price: number
  priceLabel: string
  period: string
  badge?: string
  color: 'gray' | 'amber' | 'orange' | 'purple' | 'blue'
  features: string[]
}

const INITIAL_PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Gói Standard (Free)',
    price: 0,
    priceLabel: '0 VNĐ',
    period: '/ mãi mãi',
    color: 'gray',
    features: [
      'Tham gia / Tạo tối đa 3 nhóm',
      'Workspace & Bảng Kanban cơ bản',
      'AI phân tích ý tưởng (3 lần/ngày)',
      'Hồ sơ cá nhân cơ bản'
    ]
  },
  {
    id: 'trial',
    name: 'Gói Dùng Thử 3 Ngày ⚡',
    price: 69000,
    priceLabel: '69.000 VNĐ',
    period: '/ 3 ngày / cá nhân',
    badge: 'HOT TEST',
    color: 'amber',
    features: [
      '3 ngày trải nghiệm toàn bộ Pro',
      'AI phân tích ý tưởng KHÔNG giới hạn',
      'Virtual Demo Day AI & Audit',
      'OKR nâng cao & Analytics'
    ]
  },
  {
    id: 'premium',
    name: 'Gói Pro Premium',
    price: 699000,
    priceLabel: '699.000 VNĐ',
    period: '/ tháng / cá nhân',
    badge: 'POPULAR',
    color: 'orange',
    features: [
      'Mở khóa toàn bộ AI cá nhân',
      'AI Startup Mentor Chatbot 24/7',
      'Virtual Demo Day AI & Pitch Deck',
      'Ưu tiên đăng ký Mentor'
    ]
  },
  {
    id: 'team_premium',
    name: 'Gói Team Premium 💎',
    price: 3149000,
    priceLabel: '3.149.000 VNĐ',
    period: '/ tháng / nhóm (6 người)',
    badge: 'NHÓM DỰ ÁN',
    color: 'blue',
    features: [
      'Bản quyền Pro cho cả nhóm 6 người',
      'Tiết kiệm 25% so với mua lẻ',
      'Mở khóa Startup Certificate nhóm',
      'Quản lý quyền thành viên nhóm'
    ]
  },
  {
    id: 'enterprise',
    name: 'Gói Enterprise',
    price: 899000,
    priceLabel: '899.000 VNĐ',
    period: '/ tháng / người',
    color: 'purple',
    features: [
      'Dedicated Account Manager',
      'Tùy chỉnh tính năng theo yêu cầu',
      'API Access & Analytics Dashboard',
      'Hỗ trợ kỹ thuật 24/7'
    ]
  }
]

export default function SubscriptionManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [plans, setPlans] = useState<PlanConfig[]>(INITIAL_PLANS)
  const [editingPlan, setEditingPlan] = useState<PlanConfig | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [userData, paymentData] = await Promise.all([
        userService.getUsers().catch(() => []),
        paymentService.getPayments().catch(() => []),
      ])
      setUsers(Array.isArray(userData) ? userData : [])
      setPayments(Array.isArray(paymentData) ? paymentData : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const getUserSubCount = (planId: string) => {
    if (planId === 'free') {
      return users.filter(u => !u.subscription || u.subscription === 'free').length
    }
    return users.filter(u => u.subscription === planId).length
  }

  const filteredUsers = users.filter(u => {
    const name = (u?.name || u?.phone || 'Người dùng').toLowerCase()
    const email = (u?.email || '').toLowerCase()
    const sub = (u?.subscription || 'free').toLowerCase()
    const q = search.toLowerCase()
    return name.includes(q) || email.includes(q) || sub.includes(q)
  })

  const handleSavePlanEdit = () => {
    if (!editingPlan) return
    setPlans(prev => prev.map(p => (p.id === editingPlan.id ? editingPlan : p)))
    setEditingPlan(null)
  }

  const getSubBadgeClass = (sub: string) => {
    switch (sub) {
      case 'premium':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      case 'team_premium':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'trial':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'enterprise':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  const getSubLabel = (sub: string) => {
    switch (sub) {
      case 'premium':
        return 'Pro Premium'
      case 'team_premium':
        return 'Team Premium'
      case 'trial':
        return 'Dùng thử 3 ngày'
      case 'enterprise':
        return 'Enterprise'
      default:
        return 'Standard (Free)'
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-400">
        <CreditCard className="w-8 h-8 text-[#FF6B00] animate-spin mb-2" />
        <span className="text-sm font-semibold">Đang tải danh mục gói dịch vụ & đăng ký...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Crown className="w-5 h-5 text-[#FF6B00]" />
            Quản lý Gói Dịch vụ & Đăng ký (Subscription Management)
          </h2>
          <p className="text-xs text-gray-400 mt-1">Cấu hình các gói cước chuẩn VNĐ thực tế và theo dõi tài khoản người dùng</p>
        </div>
      </div>

      {/* Grid of Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {plans.map(plan => {
          const userCount = getUserSubCount(plan.id)
          return (
            <div
              key={plan.id}
              className={`bg-[#13131C] border rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden transition hover:border-[#FF6B00]/40 ${
                plan.color === 'orange' ? 'border-orange-500/40 shadow-lg shadow-orange-500/5' :
                plan.color === 'blue'   ? 'border-blue-500/30' :
                plan.color === 'amber'  ? 'border-amber-500/30' :
                plan.color === 'purple' ? 'border-purple-500/30' :
                'border-gray-800'
              }`}
            >
              {plan.badge && (
                <span className="absolute top-3 right-3 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#FF6B00] text-white">
                  {plan.badge}
                </span>
              )}

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-extrabold text-white">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-lg font-black text-[#FF6B00]">{plan.priceLabel}</span>
                    <span className="text-[10px] text-gray-400">{plan.period}</span>
                  </div>
                </div>

                <div className="bg-[#1C1C28] p-2.5 rounded-xl border border-gray-800 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Đang đăng ký</span>
                  <span className="text-xs font-black text-white flex items-center gap-1">
                    <Users className="w-3 h-3 text-[#FF6B00]" /> {userCount} người
                  </span>
                </div>

                <button
                  onClick={() => setEditingPlan({ ...plan })}
                  className="w-full py-1.5 bg-gray-800 hover:bg-[#FF6B00] text-gray-300 hover:text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit className="w-3 h-3" /> Chỉnh sửa gói
                </button>

                <div className="space-y-1.5 pt-2 border-t border-gray-850">
                  {plan.features.map((f, i) => (
                    <div key={i} className="text-[10px] text-gray-300 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* User Subscriptions Table */}
      <div className="bg-[#13131C] border border-gray-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#FF6B00]" />
              Danh sách Đăng ký Thành viên ({users.length} người dùng)
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Theo dõi trạng thái gói cước thực tế của từng tài khoản sinh viên và giảng viên</p>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, email, gói..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-800 rounded-xl text-xs bg-[#1C1C28] text-white focus:outline-none focus:border-[#FF6B00]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-850 bg-gray-900/40 text-gray-400 font-bold uppercase text-[10px]">
                <th className="text-left p-3">Thành viên</th>
                <th className="text-left p-3">Gói hiện tại</th>
                <th className="text-left p-3">Vai trò</th>
                <th className="text-left p-3">Ngày tham gia</th>
                <th className="text-left p-3">Hạn gói cước</th>
                <th className="text-right p-3">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-850">
              {filteredUsers.map(u => {
                const sub = u.subscription || 'free'
                const isPaid = sub !== 'free'
                const joinedDate = new Date(u.createdAt || Date.now()).toLocaleDateString('vi-VN')
                const expiryDate = isPaid
                  ? new Date(new Date(u.createdAt || Date.now()).setMonth(new Date(u.createdAt || Date.now()).getMonth() + 1)).toLocaleDateString('vi-VN')
                  : 'Vĩnh viễn'

                return (
                  <tr key={u.id} className="hover:bg-gray-800/20 transition">
                    <td className="p-3">
                      <p className="font-bold text-white">{u.name || u.phone || 'Người dùng'}</p>
                      <p className="text-[10px] text-gray-400">{u.email || 'N/A'}</p>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-lg border font-extrabold text-[10px] ${getSubBadgeClass(sub)}`}>
                        {getSubLabel(sub)}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400 font-mono text-[10px] uppercase">{u.role}</td>
                    <td className="p-3 text-gray-400">{joinedDate}</td>
                    <td className="p-3 text-gray-400 font-medium">{expiryDate}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={async () => {
                          const newSub = prompt(`Đổi gói dịch vụ cho ${u.name || u.email} (free, trial, premium, team_premium, enterprise):`, sub)
                          if (newSub && ['free', 'trial', 'premium', 'team_premium', 'enterprise'].includes(newSub.trim())) {
                            try {
                              await userService.updateUser(u.id, { subscription: newSub.trim() })
                              loadData()
                            } catch {
                              alert('Không cập nhật được gói dịch vụ!')
                            }
                          }
                        }}
                        className="text-[#FF6B00] hover:text-orange-400 font-bold text-[10px] bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-lg transition"
                      >
                        Đổi gói
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#13131C] border border-gray-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-[#FF6B00]" />
                Cấu hình gói {editingPlan.name}
              </h3>
              <button onClick={() => setEditingPlan(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Tên gói hiển thị</label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full bg-[#1C1C28] border border-gray-800 rounded-xl p-2.5 text-xs text-white mt-1 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Giá hiển thị (VNĐ)</label>
                <input
                  type="text"
                  value={editingPlan.priceLabel}
                  onChange={e => setEditingPlan({ ...editingPlan, priceLabel: e.target.value })}
                  className="w-full bg-[#1C1C28] border border-gray-800 rounded-xl p-2.5 text-xs text-white mt-1 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Chu kỳ thanh toán</label>
                <input
                  type="text"
                  value={editingPlan.period}
                  onChange={e => setEditingPlan({ ...editingPlan, period: e.target.value })}
                  className="w-full bg-[#1C1C28] border border-gray-800 rounded-xl p-2.5 text-xs text-white mt-1 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSavePlanEdit}
                className="flex-1 py-2.5 bg-[#FF6B00] hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Lưu cấu hình
              </button>
              <button
                onClick={() => setEditingPlan(null)}
                className="px-4 py-2.5 border border-gray-800 text-gray-400 hover:text-white text-xs font-bold rounded-xl"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
