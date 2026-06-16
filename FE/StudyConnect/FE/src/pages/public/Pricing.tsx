import { useState, useEffect, useRef } from 'react'
import {
  Check, CheckCircle, CreditCard, ArrowRight, Loader2,
  Download, Printer, Sparkles, Percent, ShieldCheck,
  Building2, Copy, AlertCircle, Clock, X, Crown, Zap
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { paymentService, authService } from '../../services/apiServices'

// ─── Bank Config (thay bằng thông tin thật của bạn) ───
const MERCHANT = {
  bankId: 'MB',           // MB Bank
  accountNo: '0987654321',
  accountName: 'STUDYCONNECT',
  bankName: 'MB Bank',
}

const PLANS = [
  {
    id: 'free',
    name: 'Gói Standard',
    price: 0,
    priceLabel: '0 VNĐ',
    period: '/ mãi mãi',
    desc: 'Dành cho sinh viên học tập cơ bản',
    color: 'gray',
    features: [
      { label: 'Tham gia / Tạo 1 nhóm dự án', ok: true },
      { label: 'Workspace & Kanban Task cơ bản', ok: true },
      { label: 'AI phân tích ý tưởng (3 lần/ngày)', ok: true },
      { label: 'AI Startup Mentor chatbot', ok: false },
      { label: 'Virtual Demo Day AI', ok: false },
      { label: 'OKR nâng cao & Analytics', ok: false },
    ],
    cta: 'Đang sử dụng',
    ctaDisabled: true,
  },
  {
    id: 'premium',
    name: 'Gói Pro Premium',
    price: 199000,
    priceLabel: '199.000 VNĐ',
    period: '/ tháng',
    desc: 'Dành cho nhóm startup EXE triển vọng',
    color: 'orange',
    popular: true,
    features: [
      { label: 'Tất cả tính năng Standard', ok: true },
      { label: 'AI phân tích ý tưởng không giới hạn', ok: true },
      { label: 'AI Startup Mentor chatbot', ok: true },
      { label: 'Virtual Demo Day AI', ok: true },
      { label: 'OKR nâng cao & Analytics', ok: true },
      { label: 'Ưu tiên đăng ký Mentor 24/7', ok: true },
    ],
    cta: 'Nâng Cấp Ngay',
    ctaDisabled: false,
  },
  {
    id: 'enterprise',
    name: 'Gói Enterprise',
    price: 499000,
    priceLabel: '499.000 VNĐ',
    period: '/ tháng',
    desc: 'Dành cho Nhà trường / Ban quản lý',
    color: 'purple',
    features: [
      { label: 'Tất cả tính năng Premium', ok: true },
      { label: 'Quản lý số lượng lớn lớp học', ok: true },
      { label: 'Bản đồ nhiệt hoạt động nâng cao', ok: true },
      { label: 'Xuất báo cáo cho hội đồng', ok: true },
      { label: 'Máy chủ riêng & Tùy chỉnh', ok: true },
      { label: 'SLA hỗ trợ ưu tiên', ok: true },
    ],
    cta: 'Liên hệ hỗ trợ',
    ctaDisabled: false,
  },
]

function generateTxId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'SC'
  for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length))
  return result
}

function formatVnd(amount: number) {
  return amount.toLocaleString('vi-VN') + ' VNĐ'
}

export default function Pricing() {
  const { user, updateUserData } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[1] | null>(null)
  const [step, setStep] = useState<'checkout' | 'pending' | 'success'>('checkout')
  const [promoCode, setPromoCode] = useState('')
  const [discountApplied, setDiscountApplied] = useState(false)
  const [countdown, setCountdown] = useState(900) // 15 minutes
  const [txId] = useState(generateTxId)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [paymentId, setPaymentId] = useState('')
  const promoRef = useRef<HTMLInputElement>(null)

  const finalPrice = selectedPlan
    ? discountApplied
      ? Math.round(selectedPlan.price * 0.7)
      : selectedPlan.price
    : 0

  // VietQR URL (real QR code, no API key needed)
  const qrUrl = selectedPlan
    ? `https://img.vietqr.io/image/${MERCHANT.bankId}-${MERCHANT.accountNo}-compact2.png` +
      `?amount=${finalPrice}&addInfo=${txId}&accountName=${encodeURIComponent(MERCHANT.accountName)}`
    : ''

  useEffect(() => {
    if (!showModal || step !== 'checkout' || countdown <= 0) return
    const t = setInterval(() => setCountdown(p => p - 1), 1000)
    return () => clearInterval(t)
  }, [showModal, step, countdown])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    return `${m}:${(s % 60).toString().padStart(2, '0')}`
  }

  const handleOpen = (plan: typeof PLANS[1]) => {
    if (plan.id === 'enterprise') {
      window.open('mailto:support@studyconnect.vn?subject=Enterprise Plan', '_blank')
      return
    }
    setSelectedPlan(plan)
    setStep('checkout')
    setPromoCode('')
    setDiscountApplied(false)
    setCountdown(900)
    setShowModal(true)
  }

  const applyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'STUDYCONNECT30') {
      setDiscountApplied(true)
    } else {
      alert('Mã không hợp lệ. Thử: STUDYCONNECT30')
    }
  }

  const copyTxId = () => {
    navigator.clipboard.writeText(txId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmitPayment = async () => {
    setSubmitting(true)
    try {
      const res = await paymentService.createPayment(
        selectedPlan!.id,
        txId,
        discountApplied ? 'STUDYCONNECT30' : undefined,
        finalPrice
      )
      setPaymentId(res.id || '')
      setStep('pending')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  const downloadInvoice = () => {
    const content = `================================================
         STUDYCONNECT – PHIẾU YÊU CẦU THANH TOÁN
================================================
Mã giao dịch : ${txId}
Ngày tạo     : ${new Date().toLocaleString('vi-VN')}
Khách hàng   : ${user?.name || 'N/A'}
Email        : ${user?.email || 'N/A'}
------------------------------------------------
Dịch vụ      : StudyConnect ${selectedPlan?.name}
Số tiền      : ${formatVnd(finalPrice)}
Ngân hàng    : ${MERCHANT.bankName}
Số TK        : ${MERCHANT.accountNo}
Chủ TK       : ${MERCHANT.accountName}
Nội dung CK  : ${txId}
------------------------------------------------
Trạng thái   : CHỜ XÁC NHẬN
================================================
Vui lòng chuyển khoản đúng nội dung để được xử lý nhanh!
`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `STUDYCONNECT-${txId}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const currentPlan = user?.subscription || 'free'

  return (
    <div className="py-6 space-y-8 animate-fadeIn pb-16">

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0B0B0F] via-[#1B1016] to-[#0B0B0F] text-white rounded-3xl p-10 shadow-2xl border border-orange-900/20 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,107,0,0.12),transparent_60%)]" />
        <div className="relative z-10">
          <span className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            StudyConnect Premium
          </span>
          <h1 className="text-4xl font-black mt-5 tracking-tight text-white leading-tight">
            Đầu tư vào tương lai của bạn ⚡
          </h1>
          <p className="text-sm text-gray-300 mt-3 max-w-lg mx-auto leading-relaxed">
            Mở khóa toàn bộ sức mạnh AI, mentor chuyên gia, và công cụ khởi nghiệp đỉnh cao.
          </p>
          {currentPlan !== 'free' && (
            <div className="mt-4 inline-flex items-center gap-2 bg-green-900/40 border border-green-700/50 text-green-400 px-4 py-1.5 rounded-full text-xs font-bold">
              <Crown className="w-3.5 h-3.5" />
              Bạn đang dùng gói {currentPlan === 'premium' ? 'Premium Pro' : 'Enterprise'}
            </div>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PLANS.map(plan => {
          const isCurrentPlan = plan.id === currentPlan || (plan.id === 'free' && currentPlan === 'free')
          const isUpgraded = plan.id !== 'free' && currentPlan !== 'free' &&
            (currentPlan === plan.id || (currentPlan === 'enterprise' && plan.id === 'premium'))

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between p-6 rounded-3xl h-full transition-all duration-300 ${
                plan.popular
                  ? 'border-2 border-[#FF6B00] shadow-[0_12px_50px_rgba(255,107,0,0.15)] bg-white dark:bg-[#13131C]'
                  : plan.id === 'enterprise'
                  ? 'border border-purple-500/30 bg-gradient-to-br from-purple-950/20 to-[#13131C] dark:bg-[#13131C]'
                  : 'border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#13131C]'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-[#FF6B00] text-white text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Phổ biến nhất
                </span>
              )}
              {plan.id === 'enterprise' && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg">
                  Dành cho Tổ chức
                </span>
              )}

              <div>
                <h3 className="text-base font-black text-gray-800 dark:text-white">{plan.name}</h3>
                <p className="text-[11px] text-gray-400 mt-1">{plan.desc}</p>
                <div className="my-5">
                  <span className={`text-3xl font-black ${plan.popular ? 'text-[#FF6B00]' : 'text-gray-800 dark:text-white'}`}>
                    {plan.priceLabel}
                  </span>
                  <span className="text-xs text-gray-400 font-bold ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-3 border-t dark:border-gray-800 pt-4">
                  {plan.features.map((f, i) => (
                    <li key={i} className={`flex items-start gap-2.5 text-xs font-medium ${!f.ok ? 'text-gray-400 dark:text-gray-600 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${f.ok ? 'text-green-500' : 'text-gray-300 dark:text-gray-700'}`} />
                      {f.label}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => !isUpgraded && !isCurrentPlan && handleOpen(plan as any)}
                disabled={plan.ctaDisabled || isCurrentPlan || isUpgraded}
                className={`mt-6 w-full py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isCurrentPlan || isUpgraded
                    ? 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 cursor-default'
                    : plan.popular
                    ? 'bg-gradient-to-r from-orange-500 to-[#FF6B00] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                    : plan.id === 'enterprise'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {isCurrentPlan || isUpgraded ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Đang kích hoạt
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    {plan.ctaDisabled ? plan.cta : (
                      <>{plan.cta} <ArrowRight className="w-3.5 h-3.5" /></>
                    )}
                  </span>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Payment guarantee strip */}
      <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-500 dark:text-gray-500 pt-2">
        {['🔒 Thanh toán bảo mật VietQR', '🏦 Chuyển khoản ngân hàng nội địa', '✅ Admin xác nhận trong 24h', '📄 Hóa đơn điện tử'].map(t => (
          <span key={t} className="font-medium">{t}</span>
        ))}
      </div>

      {/* ─── PAYMENT MODAL ─── */}
      {showModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#13131C] rounded-3xl w-full max-w-md border border-gray-100 dark:border-gray-800 shadow-2xl max-h-[92vh] overflow-y-auto">

            {/* STEP 1 – CHECKOUT */}
            {step === 'checkout' && (
              <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex justify-between items-center pb-3 border-b dark:border-gray-800">
                  <h3 className="font-black text-gray-800 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#FF6B00]" />
                    Thanh Toán Đăng Ký
                  </h3>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Order summary */}
                <div className="bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/20 rounded-2xl p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between font-medium text-gray-600 dark:text-gray-400">
                    <span>Gói đăng ký</span>
                    <span className="font-bold text-gray-800 dark:text-white">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between font-medium text-gray-600 dark:text-gray-400">
                    <span>Giá gốc</span>
                    <span className="text-gray-700 dark:text-gray-300">{selectedPlan.priceLabel}</span>
                  </div>
                  {discountApplied && (
                    <div className="flex justify-between font-bold text-green-600">
                      <span>Giảm giá (STUDYCONNECT30)</span>
                      <span>-30%</span>
                    </div>
                  )}
                  <div className="border-t dark:border-gray-700 pt-2.5 flex justify-between font-black text-sm">
                    <span className="text-gray-800 dark:text-white">Tổng thanh toán</span>
                    <span className="text-[#FF6B00] text-base">{formatVnd(finalPrice)}</span>
                  </div>
                </div>

                {/* Promo code */}
                <div className="flex gap-2">
                  <input
                    ref={promoRef}
                    type="text"
                    placeholder="Mã giảm giá (STUDYCONNECT30)"
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value)}
                    disabled={discountApplied}
                    className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-xs bg-white dark:bg-[#1C1C28] text-gray-800 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                  />
                  <button
                    onClick={applyPromo}
                    disabled={discountApplied || !promoCode.trim()}
                    className="px-4 py-2.5 bg-gray-800 dark:bg-gray-700 text-white rounded-xl text-xs font-bold hover:bg-gray-900 transition disabled:opacity-50 flex items-center gap-1"
                  >
                    <Percent className="w-3.5 h-3.5" /> Áp dụng
                  </button>
                </div>
                {discountApplied && (
                  <p className="text-xs text-green-600 font-bold flex items-center gap-1.5 -mt-1">
                    <CheckCircle className="w-4 h-4" /> Đã áp dụng giảm 30%!
                  </p>
                )}

                {/* Real VietQR */}
                <div className="bg-gray-50 dark:bg-[#0B0B0F] border border-gray-100 dark:border-gray-800 rounded-2xl p-5 flex flex-col items-center gap-4">
                  <span className="text-[10px] font-black text-[#FF6B00] bg-orange-100 dark:bg-orange-950/50 px-3 py-1 rounded-full uppercase tracking-wider">
                    Quét mã QR để chuyển khoản
                  </span>

                  {/* Real QR from VietQR API */}
                  <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-100">
                    <img
                      src={qrUrl}
                      alt="VietQR Payment"
                      className="w-44 h-44 object-contain"
                      onError={e => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/176x176/fff/FF6B00?text=QR+Loading'
                      }}
                    />
                  </div>

                  {/* Bank info */}
                  <div className="w-full space-y-2 text-xs">
                    <div className="flex items-center justify-between bg-white dark:bg-[#1C1C28] border border-gray-100 dark:border-gray-700 rounded-xl px-3.5 py-2.5">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Building2 className="w-3.5 h-3.5 text-[#FF6B00]" />
                        <span>{MERCHANT.bankName} – {MERCHANT.accountNo}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-white dark:bg-[#1C1C28] border border-gray-100 dark:border-gray-700 rounded-xl px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">Nội dung CK:</span>
                        <span className="font-mono font-black text-[#FF6B00]">{txId}</span>
                      </div>
                      <button onClick={copyTxId} className="text-gray-400 hover:text-[#FF6B00] transition">
                        {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Countdown */}
                  {countdown > 0 ? (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium animate-pulse">
                      <Clock className="w-3.5 h-3.5" />
                      Phiên thanh toán hết hạn sau: <span className="font-mono font-bold text-[#FF6B00]">{formatTime(countdown)}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-red-500 font-bold flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> Phiên đã hết hạn – Vui lòng đóng và thử lại
                    </p>
                  )}
                </div>

                {/* Instructions */}
                <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/20 rounded-xl p-4 text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
                  <p className="font-bold text-blue-700 dark:text-blue-400 mb-2">📋 Hướng dẫn thanh toán:</p>
                  <p>1. Mở app ngân hàng → Quét QR hoặc chuyển khoản thủ công</p>
                  <p>2. Nhập đúng nội dung chuyển khoản: <strong className="text-[#FF6B00]">{txId}</strong></p>
                  <p>3. Sau khi chuyển, nhấn <strong>"Đã chuyển khoản"</strong> bên dưới</p>
                  <p>4. Admin xác nhận trong vòng <strong>24 giờ</strong> và tài khoản tự động nâng cấp</p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitPayment}
                    disabled={submitting || countdown <= 0}
                    className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-[#FF6B00] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Đang ghi nhận...</>
                    ) : (
                      <><ShieldCheck className="w-4 h-4" /> Đã chuyển khoản xong</>
                    )}
                  </button>
                  <button
                    onClick={downloadInvoice}
                    className="px-4 py-3 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    title="Tải phiếu"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 – PENDING */}
            {step === 'pending' && (
              <div className="p-8 text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-950/40 mb-2">
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-800 dark:text-white">Đã Ghi Nhận! ✅</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed max-w-xs mx-auto">
                    Đơn thanh toán của bạn đã được ghi nhận. Admin sẽ xác nhận trong vòng <strong>24 giờ</strong>.
                    Bạn sẽ nhận thông báo ngay khi tài khoản được nâng cấp.
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-[#0B0B0F] border dark:border-gray-800 rounded-2xl p-4 text-xs space-y-2.5 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mã giao dịch:</span>
                    <span className="font-mono font-black text-[#FF6B00]">{txId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gói đăng ký:</span>
                    <span className="font-bold text-gray-800 dark:text-white">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Số tiền:</span>
                    <span className="font-bold text-[#FF6B00]">{formatVnd(finalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trạng thái:</span>
                    <span className="font-bold text-yellow-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Chờ xác nhận</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={downloadInvoice} className="flex-1 py-3 bg-gray-800 text-white text-xs font-bold rounded-xl hover:bg-gray-900 transition flex items-center justify-center gap-1.5">
                    <Download className="w-4 h-4" /> Tải Phiếu
                  </button>
                  <button onClick={() => window.print()} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center justify-center gap-1.5">
                    <Printer className="w-4 h-4" /> In Biên Nhận
                  </button>
                </div>

                <button onClick={() => setShowModal(false)} className="w-full py-3 bg-[#FF6B00] text-white text-xs font-bold rounded-xl hover:bg-[#E85A00] transition">
                  Đóng & Chờ Xác Nhận
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
