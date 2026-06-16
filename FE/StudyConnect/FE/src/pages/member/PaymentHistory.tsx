import { useEffect, useState } from 'react'
import {
  CreditCard, Clock, CheckCircle, XCircle,
  Eye, RefreshCw, AlertCircle, ArrowLeft, Calendar, Building2, X
} from 'lucide-react'
import { Link } from 'react-router-dom'
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
}

const STATUS_CONFIG = {
  pending:   { label: 'Chờ xác nhận', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20', icon: Clock },
  completed: { label: 'Đã hoàn thành',  color: 'text-green-500 bg-green-500/10 border-green-500/20', icon: CheckCircle },
  failed:    { label: 'Từ chối',       color: 'text-red-500 bg-red-500/10 border-red-500/20', icon: XCircle },
}

const PLAN_CONFIG = {
  premium:    { label: 'Pro Premium', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  enterprise: { label: 'Enterprise',  color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
}

export default function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingEvidence, setViewingEvidence] = useState<string | null>(null)

  const loadPayments = async () => {
    setLoading(true)
    try {
      const data = await paymentService.getPayments()
      setPayments(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [])

  return (
    <div className="py-6 space-y-8 animate-fadeIn max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Link to="/dashboard" className="hover:text-white transition flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Bàn làm việc
            </Link>
            <span>/</span>
            <span className="text-gray-400">Lịch sử thanh toán</span>
          </div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-[#FF6B00]" />
            Lịch sử giao dịch
          </h2>
          <p className="text-xs text-gray-400">Theo dõi trạng thái các hóa đơn thanh toán của bạn</p>
        </div>
        <button 
          onClick={loadPayments} 
          className="self-start sm:self-center p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-400"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Tải lại
        </button>
      </div>

      {/* Info card */}
      <div className="bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent border border-orange-500/10 rounded-2xl p-4 flex gap-3.5 text-xs text-gray-600 dark:text-gray-400">
        <AlertCircle className="w-5 h-5 text-[#FF6B00] shrink-0" />
        <div className="space-y-1">
          <p className="font-bold text-gray-800 dark:text-white">ℹ️ Quy trình phê duyệt giao dịch</p>
          <p className="leading-relaxed">
            Các giao dịch chuyển khoản VietQR được phê duyệt thủ công bởi Ban quản trị StudyConnect. 
            Thời gian xử lý trung bình từ <strong>10 phút đến tối đa 24 giờ</strong>. 
            Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ bộ phận hỗ trợ kỹ thuật tại tab Đội ngũ.
          </p>
        </div>
      </div>

      {/* Table list */}
      <div className="bg-white dark:bg-[#13131C] border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-8 h-8 text-[#FF6B00] animate-spin" />
            <span className="text-xs text-gray-400 font-bold">Đang tải lịch sử giao dịch...</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-20 text-gray-400 space-y-4">
            <CreditCard className="w-16 h-16 mx-auto opacity-20 text-gray-500" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-gray-700 dark:text-gray-300">Chưa có giao dịch nào</p>
              <p className="text-xs text-gray-500">Bạn chưa gửi yêu cầu nâng cấp gói dịch vụ nào.</p>
            </div>
            <Link 
              to="/pricing" 
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-[#FF6B00] text-white rounded-xl text-xs font-bold hover:shadow-lg transition hover:-translate-y-0.5"
            >
              Xem các gói dịch vụ
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                  <th className="text-left px-6 py-4 text-gray-400 font-bold uppercase tracking-wider">Thông tin gói</th>
                  <th className="text-left px-4 py-4 text-gray-400 font-bold uppercase tracking-wider">Mã GD / Ngân hàng</th>
                  <th className="text-left px-4 py-4 text-gray-400 font-bold uppercase tracking-wider">Số tiền</th>
                  <th className="text-left px-4 py-4 text-gray-400 font-bold uppercase tracking-wider">Bằng chứng</th>
                  <th className="text-left px-4 py-4 text-gray-400 font-bold uppercase tracking-wider">Ngày tạo</th>
                  <th className="text-left px-4 py-4 text-gray-400 font-bold uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-800">
                {payments.map((p) => {
                  const status = STATUS_CONFIG[p.status]
                  const plan = PLAN_CONFIG[p.plan]
                  const StatusIcon = status.icon
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg font-bold text-[10px] border ${plan.color}`}>
                          {p.plan === 'premium' ? 'Pro Premium' : 'Enterprise'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {p.txId ? (
                          <div className="space-y-1">
                            <p className="font-mono font-black text-gray-800 dark:text-white text-[11px]">{p.txId}</p>
                            <p className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-[#FF6B00]" /> {p.bankId || 'N/A'}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
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
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(p.createdAt).toLocaleDateString('vi-VN')}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[10px] border ${status.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Evidence Modal */}
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
