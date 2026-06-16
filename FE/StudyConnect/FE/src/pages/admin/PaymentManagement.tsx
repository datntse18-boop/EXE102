import { useEffect, useState } from 'react'
import {
  CheckCircle, XCircle, Clock, CreditCard,
  TrendingUp, Users, AlertCircle, RefreshCw, Search, Eye, X
} from 'lucide-react'
import { paymentService } from '../../services/apiServices'

interface Payment {
  id: string
  userId: string
  plan: 'premium' | 'enterprise'
  amount: number
  status: 'pending' | 'completed' | 'failed'
  createdAt: string
  txId?: string
  evidence?: string
  bankId?: string
  user: { id: string; name: string; email: string; role: string }
}

const STATUS_CONFIG = {
  pending:   { label: 'Chờ xác nhận', color: 'yellow', icon: Clock },
  completed: { label: 'Đã xác nhận',  color: 'green',  icon: CheckCircle },
  failed:    { label: 'Từ chối',       color: 'red',    icon: XCircle },
}

const PLAN_CONFIG = {
  premium:    { label: 'Pro Premium', color: 'orange' },
  enterprise: { label: 'Enterprise',  color: 'purple' },
}

export default function PaymentManagement() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)
  const [viewingEvidence, setViewingEvidence] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [p, s] = await Promise.all([paymentService.getPayments(), paymentService.getStats()])
      setPayments(p)
      setStats(s)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleConfirm = async (id: string) => {
    setActionLoading(id)
    try {
      await paymentService.confirmPayment(id)
      await load()
    } catch (e: any) {
      alert(e.response?.data?.message || 'Lỗi xác nhận')
    } finally { setActionLoading(null) }
  }

  const handleReject = async (id: string) => {
    setActionLoading(id)
    try {
      await paymentService.rejectPayment(id, rejectReason || 'Admin từ chối đơn thanh toán.')
      setShowRejectModal(null)
      setRejectReason('')
      await load()
    } catch (e: any) {
      alert(e.response?.data?.message || 'Lỗi từ chối')
    } finally { setActionLoading(null) }
  }

  const filtered = payments.filter(p => {
    const matchStatus = filter === 'all' || p.status === filter
    const matchSearch = !search ||
      p.user.name.toLowerCase().includes(search.toLowerCase()) ||
      p.user.email.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const pendingCount = payments.filter(p => p.status === 'pending').length

  return (
    <div className="space-y-6 animate-fadeIn p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#FF6B00]" />
            Quản lý Thanh toán
          </h2>
          <p className="text-xs text-gray-400 mt-1">Xác nhận hoặc từ chối đơn đăng ký của người dùng</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Tổng doanh thu', value: stats.totalRevenue?.toLocaleString('vi-VN') + ' VNĐ', icon: TrendingUp, color: 'orange' },
            { label: 'Đơn hoàn tất', value: stats.total, icon: CheckCircle, color: 'green' },
            { label: 'Chờ xác nhận', value: stats.pending, icon: Clock, color: 'yellow' },
            { label: 'Tổng đơn', value: stats.allPayments, icon: Users, color: 'blue' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-[#13131C] border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
              <div className={`inline-flex p-2 rounded-xl mb-3 ${
                s.color === 'orange' ? 'bg-orange-100 dark:bg-orange-950/40' :
                s.color === 'green'  ? 'bg-green-100 dark:bg-green-950/40' :
                s.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-950/40' :
                'bg-blue-100 dark:bg-blue-950/40'
              }`}>
                <s.icon className={`w-4 h-4 ${
                  s.color === 'orange' ? 'text-orange-500' :
                  s.color === 'green'  ? 'text-green-500' :
                  s.color === 'yellow' ? 'text-yellow-500' :
                  'text-blue-500'
                }`} />
              </div>
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="text-lg font-black text-gray-800 dark:text-white mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pending alert */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/50 rounded-2xl p-4">
          <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
          <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">
            Có <strong>{pendingCount}</strong> đơn thanh toán đang chờ xác nhận!
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-xs bg-white dark:bg-[#1C1C28] text-gray-800 dark:text-white focus:outline-none focus:border-[#FF6B00]"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'completed', 'failed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                filter === f
                  ? 'bg-[#FF6B00] text-white'
                  : 'border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {f === 'all' ? 'Tất cả' : STATUS_CONFIG[f].label}
              {f === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 bg-yellow-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Table */}
      <div className="bg-white dark:bg-[#13131C] border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-sm">Không có đơn thanh toán nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                  <th className="text-left px-5 py-3.5 text-gray-400 font-bold uppercase tracking-wider">Người dùng / Giao dịch</th>
                  <th className="text-left px-4 py-3.5 text-gray-400 font-bold uppercase tracking-wider">Gói</th>
                  <th className="text-left px-4 py-3.5 text-gray-400 font-bold uppercase tracking-wider">Số tiền</th>
                  <th className="text-left px-4 py-3.5 text-gray-400 font-bold uppercase tracking-wider">Bằng chứng</th>
                  <th className="text-left px-4 py-3.5 text-gray-400 font-bold uppercase tracking-wider">Ngày</th>
                  <th className="text-left px-4 py-3.5 text-gray-400 font-bold uppercase tracking-wider">Trạng thái</th>
                  <th className="text-right px-5 py-3.5 text-gray-400 font-bold uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-800">
                {filtered.map(p => {
                  const status = STATUS_CONFIG[p.status]
                  const plan = PLAN_CONFIG[p.plan]
                  const StatusIcon = status.icon
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                      <td className="px-5 py-4">
                        <p className="font-bold text-gray-800 dark:text-white">{p.user.name}</p>
                        <p className="text-gray-400 mt-0.5">{p.user.email}</p>
                        {p.txId && (
                          <p className="text-[10px] mt-1.5 text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded w-max">
                            Mã GD: <strong className="font-mono text-[#FF6B00]">{p.txId}</strong> | Ngân hàng: <strong className="text-blue-500 font-bold">{p.bankId || 'N/A'}</strong>
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                          p.plan === 'premium'
                            ? 'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                            : 'bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400'
                        }`}>
                          {plan.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-black text-gray-800 dark:text-white">
                        {p.amount.toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="px-4 py-4">
                        {p.evidence ? (
                          <button
                            onClick={() => setViewingEvidence(p.evidence!)}
                            className="text-[#FF6B00] hover:text-[#E85A00] font-black text-[10px] flex items-center gap-1 bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/10 px-2.5 py-1 rounded-lg transition"
                          >
                            <Eye className="w-3.5 h-3.5" /> Xem ảnh
                          </button>
                        ) : (
                          <span className="text-gray-400 text-[10px]">Không có</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-gray-400">
                        {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                          p.status === 'completed' ? 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400' :
                          p.status === 'pending'   ? 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-400' :
                          'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                        }`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {p.status === 'pending' && (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleConfirm(p.id)}
                              disabled={actionLoading === p.id}
                              className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-[10px] transition disabled:opacity-50 flex items-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" /> Xác nhận
                            </button>
                            <button
                              onClick={() => setShowRejectModal(p.id)}
                              disabled={actionLoading === p.id}
                              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-[10px] transition disabled:opacity-50 flex items-center gap-1"
                            >
                              <XCircle className="w-3 h-3" /> Từ chối
                            </button>
                          </div>
                        )}
                        {p.status !== 'pending' && (
                          <span className="text-gray-300 dark:text-gray-600 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#13131C] rounded-2xl p-6 w-full max-w-sm border border-gray-100 dark:border-gray-800 shadow-2xl space-y-4">
            <h4 className="font-black text-gray-800 dark:text-white">Từ chối đơn thanh toán</h4>
            <textarea
              rows={3}
              placeholder="Lý do từ chối (tùy chọn)..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-xs bg-white dark:bg-[#1C1C28] text-gray-800 dark:text-white focus:outline-none focus:border-red-500 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={!!actionLoading}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
              >
                Xác nhận từ chối
              </button>
              <button
                onClick={() => setShowRejectModal(null)}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Viewer Modal */}
      {viewingEvidence && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#13131C] rounded-3xl p-6 w-full max-w-lg border border-gray-100 dark:border-gray-800 shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center border-b dark:border-gray-800 pb-3">
              <h4 className="font-black text-gray-800 dark:text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#FF6B00]" />
                Bằng chứng chuyển khoản
              </h4>
              <button 
                onClick={() => setViewingEvidence(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-center bg-gray-50 dark:bg-[#0B0B0F] p-4 rounded-2xl border dark:border-gray-800">
              <img 
                src={viewingEvidence} 
                alt="Evidence" 
                className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-md" 
              />
            </div>
            <div className="text-center">
              <button 
                onClick={() => setViewingEvidence(null)}
                className="px-6 py-2 bg-[#FF6B00] text-white text-xs font-bold rounded-xl hover:bg-[#E85A00] transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
