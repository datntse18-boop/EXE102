import { useState, useEffect, useRef, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check, CheckCircle, CreditCard, ArrowRight, Loader2,
  Download, Printer, Sparkles, Percent, ShieldCheck,
  Building2, Copy, AlertCircle, Clock, X, Crown, Zap, Upload, Image, Sliders
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { paymentService, authService, teamService } from '../../services/apiServices'

// ─── Bank Config ───
const SUPPORTED_BANKS = [
  { id: 'MB', name: 'MB Bank', no: '0949989214', accountName: 'NGUYEN TIEN DAT', bankName: 'MB Bank' },
]

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
      { label: 'Tham gia / Tạo tối đa 3 nhóm', ok: true },
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
    price: 699000,
    priceLabel: '699.000 VNĐ',
    period: '/ tháng / cá nhân',
    desc: 'Dành cho cá nhân muốn bứt phá',
    color: 'orange',
    features: [
      { label: 'Mở khóa toàn bộ AI cá nhân', ok: true },
      { label: 'AI phân tích ý tưởng không giới hạn', ok: true },
      { label: 'AI Startup Mentor chatbot', ok: true },
      { label: 'Virtual Demo Day AI', ok: true },
      { label: 'OKR nâng cao & Analytics', ok: true },
      { label: 'Ưu tiên đăng ký Mentor 24/7', ok: true },
    ],
    cta: 'Nâng Cấp Cá Nhân',
    ctaDisabled: false,
  },
  {
    id: 'team_premium',
    name: 'Gói Team Premium 💎',
    price: 3149000,
    priceLabel: '3.149.000 VNĐ',
    originalPriceLabel: '4.194.000 VNĐ',
    period: '/ tháng / nhóm (tối đa 6 người)',
    desc: 'Bản quyền Premium cho cả nhóm dự án',
    color: 'orange',
    popular: true,
    features: [
      { label: 'Tất cả quyền lợi Pro Premium', ok: true },
      { label: 'Áp dụng cho cả nhóm (Tối đa 6 người)', ok: true },
      { label: 'Trưởng nhóm thanh toán & Quản lý', ok: true },
      { label: 'Tiết kiệm 25% so với mua tài khoản lẻ', ok: true },
      { label: 'Mở khóa Startup Certificate cho cả nhóm', ok: true },
    ],
    cta: 'Nâng Cấp Cho Nhóm',
    ctaDisabled: false,
  },
  {
    id: 'enterprise',
    name: 'Gói Enterprise',
    price: 899000,
    priceLabel: '899.000 VNĐ',
    period: '/ tháng / người',
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
  {
    id: 'corporate',
    name: 'Gói Corporate 🏢',
    price: 0,
    priceLabel: 'Liên hệ',
    period: '/ doanh nghiệp lớn',
    desc: 'Giải pháp riêng cho doanh nghiệp',
    color: 'purple',
    features: [
      { label: 'Tất cả tính năng Enterprise', ok: true },
      { label: 'Không giới hạn số tài khoản thành viên', ok: true },
      { label: 'Tùy chỉnh AI Model theo yêu cầu', ok: true },
      { label: 'Hỗ trợ kỹ thuật SLA 24/7 trực tiếp', ok: true },
      { label: 'Triển khai Private Cloud / On-Premise', ok: true },
      { label: 'Hợp đồng thương mại & VAT đầy đủ', ok: true },
    ],
    cta: 'Liên Hệ Ngay',
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

// ─── Comparison Data ───
const COMPARISON_CATEGORIES = [
  {
    name: "AI & Công cụ Ý tưởng (Ideation AI)",
    features: [
      {
        name: "Phân tích & gợi ý ý tưởng AI",
        desc: "Hỗ trợ lên ý tưởng dự án khởi nghiệp bằng AI dựa trên lĩnh vực và từ khóa",
        free: "3 lần/ngày",
        premium: "Không giới hạn",
        team: "Không giới hạn (Cả nhóm)",
        enterprise: "Không giới hạn",
        corporate: "Model AI tùy chỉnh"
      },
      {
        name: "AI ghép nhóm & tìm đồng đội",
        desc: "Đề xuất ghép nhóm tự động theo kỹ năng và định hướng dự án",
        free: "3 lần/ngày",
        premium: "Không giới hạn",
        team: "Không giới hạn (Cả nhóm)",
        enterprise: "Không giới hạn",
        corporate: "Không giới hạn"
      }
    ]
  },
  {
    name: "Công cụ Khởi nghiệp nâng cao (Advanced Startup Tools)",
    features: [
      {
        name: "Mô hình Canvas AI (Lean Canvas)",
        desc: "Phân tích và tự động điền các ô trong mô hình Canvas kinh doanh",
        free: "Không hỗ trợ",
        premium: "Đầy đủ tính năng",
        team: "Đầy đủ tính năng (Cả nhóm)",
        enterprise: "Đầy đủ tính năng",
        corporate: "Thiết kế tùy chỉnh"
      },
      {
        name: "Dự toán tài chính & Điểm hòa vốn",
        desc: "Công cụ dự báo tài chính, doanh thu chi phí và vẽ biểu đồ hòa vốn tự động",
        free: "Không hỗ trợ",
        premium: "Đầy đủ tính năng",
        team: "Đầy đủ tính năng (Cả nhóm)",
        enterprise: "Đầy đủ tính năng",
        corporate: "Tùy biến báo cáo riêng"
      },
      {
        name: "Tạo dàn ý Slide (Slide Outline) bằng AI",
        desc: "Tự động thiết lập cấu trúc slide thuyết trình dự án chuẩn hóa",
        free: "Không hỗ trợ",
        premium: "Đầy đủ tính năng",
        team: "Đầy đủ tính năng (Cả nhóm)",
        enterprise: "Đầy đủ tính năng",
        corporate: "Mẫu slide thương hiệu"
      },
      {
        name: "AI Cố vấn Pitching & Virtual Demo Day",
        desc: "Giả lập hỏi đáp phản biện với ban giám khảo ảo cho buổi Demo Day",
        free: "Không hỗ trợ",
        premium: "Đầy đủ tính năng",
        team: "Đầy đủ tính năng (Cả nhóm)",
        enterprise: "Đầy đủ tính năng",
        corporate: "Cố vấn AI riêng biệt"
      }
    ]
  },
  {
    name: "Lớp học & Hướng nghiệp (Learning & Mentorship)",
    features: [
      {
        name: "Tài liệu & Syllabus khóa học",
        desc: "Xem khung chương trình giảng dạy, tài liệu hướng dẫn và video học tập",
        free: "Có",
        premium: "Có",
        team: "Có",
        enterprise: "Có",
        corporate: "Cấu hình Syllabus riêng"
      },
      {
        name: "Đăng ký lịch hẹn Mentor chuyên gia",
        desc: "Đặt lịch hẹn cố vấn 1-1 trực tiếp với các Mentor trên hệ thống",
        free: "Hàng chờ thường",
        premium: "Ưu tiên 24/7",
        team: "Ưu tiên 24/7 (Cả nhóm)",
        enterprise: "Mentor riêng của trường",
        corporate: "SLA Mentor VIP riêng"
      },
      {
        name: "Workspace & Kanban Task quản lý",
        desc: "Không gian làm việc chung của nhóm, phân công và kéo thả công việc",
        free: "Cơ bản",
        premium: "Nâng cao (Đầy đủ)",
        team: "Nâng cao (Đầy đủ)",
        enterprise: "Nâng cao (Đầy đủ)",
        corporate: "Tùy biến quy trình"
      },
      {
        name: "Đánh giá đồng đội (Peer Evaluation)",
        desc: "Bảng khảo sát, đánh giá chéo năng lực làm việc nhóm định kỳ",
        free: "Có",
        premium: "Có",
        team: "Có",
        enterprise: "Có",
        corporate: "Có"
      },
      {
        name: "Chứng chỉ Khởi nghiệp độc quyền",
        desc: "Cấp chứng nhận hoàn thành chương trình ươm tạo dự án StudyConnect",
        free: "Không hỗ trợ",
        premium: "Có (Cá nhân)",
        team: "Có (Cả nhóm)",
        enterprise: "Có (Trường cấp phát)",
        corporate: "Chứng nhận liên kết"
      }
    ]
  },
  {
    name: "Giới hạn & Quản trị (Limits & Admin Tools)",
    features: [
      {
        name: "Số nhóm tối đa được tạo làm Leader",
        desc: "Hạn chế số nhóm dự án do một người làm Leader để tránh tạo tràn lan",
        free: "Tối đa 3 nhóm",
        premium: "Tối đa 3 nhóm",
        team: "Tối đa 3 nhóm",
        enterprise: "Không giới hạn",
        corporate: "Không giới hạn"
      },
      {
        name: "Số thành viên tối đa mỗi nhóm",
        desc: "Số lượng thành viên tối đa được phép tham gia một nhóm dự án",
        free: "Tối đa 6 thành viên",
        premium: "Tối đa 6 thành viên",
        team: "Tối đa 6 thành viên",
        enterprise: "Tối đa 6 thành viên",
        corporate: "Không giới hạn"
      },
      {
        name: "Thống kê tiến độ & OKR nhóm",
        desc: "Xem biểu đồ đóng góp của thành viên, theo dõi mục tiêu OKR nhóm",
        free: "Không hỗ trợ",
        premium: "Nâng cao",
        team: "Nâng cao (Cả nhóm)",
        enterprise: "Bản đồ nhiệt & Báo cáo",
        corporate: "Dashboard riêng biệt"
      },
      {
        name: "Quản lý lớp học & Báo cáo hội đồng",
        desc: "Công cụ dành cho Giảng viên / Quản lý theo dõi điểm số, đánh giá và xuất báo cáo",
        free: "Không hỗ trợ",
        premium: "Không hỗ trợ",
        team: "Không hỗ trợ",
        enterprise: "Có (GV/Manager)",
        corporate: "Có (Phân quyền sâu)"
      }
    ]
  }
]

const renderComparisonCell = (value: string) => {
  if (value === "Có" || value === "Có (Cá nhân)" || value === "Có (Cả nhóm)" || value === "Có (Trường cấp phát)" || value === "Chứng nhận liên kết" || value === "Đầy đủ tính năng" || value === "Đầy đủ tính năng (Cả nhóm)") {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-extrabold bg-green-50 dark:bg-green-950/20 px-2 py-1 rounded-full text-[10px]">
        <Check className="w-3.5 h-3.5 shrink-0" /> {value}
      </span>
    )
  }
  if (value === "Không hỗ trợ" || value === "Chỉ xem mẫu") {
    return (
      <span className="inline-flex items-center gap-1 text-gray-400 dark:text-gray-650 line-through bg-gray-50 dark:bg-gray-950/10 px-2 py-1 rounded-full text-[10px]">
        <X className="w-3 h-3 shrink-0" /> {value}
      </span>
    )
  }
  if (value.includes("Vô hạn") || value.includes("Không giới hạn")) {
    return (
      <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 font-black bg-orange-50 dark:bg-orange-950/20 px-2 py-1 rounded-full text-[10px]">
        <Sparkles className="w-3 h-3 shrink-0 text-orange-500 animate-pulse" /> {value}
      </span>
    )
  }
  return <span className="font-bold text-gray-700 dark:text-gray-300">{value}</span>
}

export default function Pricing() {
  const { user, updateUserData } = useAuth()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null)
  const [step, setStep] = useState<'checkout' | 'pending' | 'success'>('checkout')
  const [promoCode, setPromoCode] = useState('')
  const [discountApplied, setDiscountApplied] = useState(false)
  const [countdown, setCountdown] = useState(900) // 15 minutes
  const [txId] = useState(generateTxId)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [paymentId, setPaymentId] = useState('')
  const [selectedBank, setSelectedBank] = useState(SUPPORTED_BANKS[0])
  const [myTeams, setMyTeams] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const promoRef = useRef<HTMLInputElement>(null)
  const [showComparisonModal, setShowComparisonModal] = useState(false)

  const [billingPeriod, setBillingPeriod] = useState<1 | 3 | 12>(1)

  const getPlanPricing = (planId: string) => {
    let base = 0
    if (planId === 'premium') base = 699000
    else if (planId === 'team_premium') base = 3149000
    else if (planId === 'enterprise') base = 899000
    else return { price: 0, label: '0 VNĐ', originalLabel: '', period: '/ mãi mãi' }

    if (billingPeriod === 1) {
      return {
        price: base,
        label: base.toLocaleString('vi-VN') + ' VNĐ',
        originalLabel: '',
        period: planId === 'team_premium' ? '/ tháng / nhóm' : '/ tháng'
      }
    } else if (billingPeriod === 3) {
      const discounted = Math.round(base * 3 * 0.8) // 20% discount
      return {
        price: discounted,
        label: discounted.toLocaleString('vi-VN') + ' VNĐ',
        originalLabel: (base * 3).toLocaleString('vi-VN') + ' VNĐ',
        period: planId === 'team_premium' ? '/ 3 tháng / nhóm' : '/ 3 tháng'
      }
    } else {
      const discounted = Math.round(base * 12 * 0.7) // 30% discount
      return {
        price: discounted,
        label: discounted.toLocaleString('vi-VN') + ' VNĐ',
        originalLabel: (base * 12).toLocaleString('vi-VN') + ' VNĐ',
        period: planId === 'team_premium' ? '/ năm / nhóm' : '/ năm'
      }
    }
  }

  const currentPlanPricing = selectedPlan ? getPlanPricing(selectedPlan.id) : { price: 0 }
  const finalPrice = selectedPlan
    ? discountApplied
      ? Math.round(currentPlanPricing.price * 0.7)
      : currentPlanPricing.price
    : 0

  // VietQR URL (real QR code, dynamically generated according to selectedBank)
  const qrUrl = selectedPlan
    ? `https://img.vietqr.io/image/${selectedBank.id}-${selectedBank.no}-compact2.png` +
      `?amount=${finalPrice}&addInfo=${txId}&accountName=${encodeURIComponent(selectedBank.accountName)}`
    : ''

  useEffect(() => {
    if (!showModal || step !== 'checkout' || countdown <= 0) return
    const t = setInterval(() => setCountdown(p => p - 1), 1000)
    return () => clearInterval(t)
  }, [showModal, step, countdown])

  // Automatic Polling: Check if payment is confirmed by checking user profile or team status
  useEffect(() => {
    if (!showModal || step !== 'pending' || !selectedPlan) return

    const interval = setInterval(async () => {
      try {
        if (selectedPlan.id === 'team_premium') {
          const teamsRes = await teamService.getTeams()
          const upgradedTeam = teamsRes?.find((t: any) => t.id === selectedTeamId)
          if (upgradedTeam && upgradedTeam.subscription === 'premium') {
            clearInterval(interval)
            setStep('success')
          }
        } else {
          const profile = await authService.me()
          if (profile && profile.subscription === selectedPlan.id) {
            clearInterval(interval)
            // Update global auth user context
            updateUserData({ ...user, subscription: profile.subscription })
            setStep('success')
          }
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [showModal, step, selectedPlan, selectedTeamId, user])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    return `${m}:${(s % 60).toString().padStart(2, '0')}`
  }

  const handleOpen = async (plan: any) => {
    if (!user) {
      setShowAuthModal(true)
      return
    }
    if (plan.id === 'corporate') {
      window.open('mailto:partner@studyconnect.vn?subject=Corporate Partnership Inquiry', '_blank')
      return
    }
    if (plan.id === 'enterprise') {
      window.open('mailto:support@studyconnect.vn?subject=Enterprise Plan Inquiry', '_blank')
      return
    }
    setSelectedPlan(plan)
    setStep('checkout')
    setPromoCode('')
    setDiscountApplied(false)
    setCountdown(900)
    setSelectedBank(SUPPORTED_BANKS[0])
    setSelectedTeamId('')
    setMyTeams([])
    setShowModal(true)

    if (plan.id === 'team_premium') {
      try {
        const teamsRes = await teamService.getTeams()
        const ledTeams = teamsRes?.filter((t: any) => t.leaderId === user?.id) || []
        setMyTeams(ledTeams)
        if (ledTeams.length > 0) {
          setSelectedTeamId(ledTeams[0].id)
        }
      } catch (err) {
        console.error('Failed to load teams:', err)
      }
    }
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
      const planToSubmit = selectedPlan!.id === 'team_premium' ? 'premium' : selectedPlan!.id
      const teamIdToSubmit = selectedPlan!.id === 'team_premium' ? selectedTeamId : undefined

      const res = await paymentService.createPayment(
        planToSubmit as any,
        txId,
        discountApplied ? 'STUDYCONNECT30' : undefined,
        finalPrice,
        undefined, // no evidence file needed
        selectedBank.id,
        teamIdToSubmit,
        billingPeriod
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
Ngân hàng    : ${selectedBank.bankName}
Số TK        : ${selectedBank.no}
Chủ TK       : ${selectedBank.accountName}
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

      </div>

      {/* Billing Duration Selector with Savings Banner */}
      <div className="max-w-md mx-auto space-y-4">
        <div className="bg-gray-100 dark:bg-gray-950 p-1.5 rounded-2xl flex border dark:border-gray-850 justify-between items-center gap-1.5 shadow-sm">
          <button
            onClick={() => setBillingPeriod(1)}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition cursor-pointer ${
              billingPeriod === 1
                ? 'bg-gradient-to-r from-orange-500 to-[#FF6B00] text-white shadow-md'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            1 Tháng
          </button>
          <button
            onClick={() => setBillingPeriod(3)}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              billingPeriod === 3
                ? 'bg-gradient-to-r from-orange-500 to-[#FF6B00] text-white shadow-md'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            3 Tháng
            <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase">
              -20%
            </span>
          </button>
          <button
            onClick={() => setBillingPeriod(12)}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              billingPeriod === 12
                ? 'bg-gradient-to-r from-orange-500 to-[#FF6B00] text-white shadow-md'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            1 Năm
            <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase">
              -30%
            </span>
          </button>
        </div>

        {billingPeriod !== 1 && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-center rounded-2xl text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            Đăng ký gói {billingPeriod} tháng giúp bạn tiết kiệm đến {billingPeriod === 3 ? '20%' : '30%'} chi phí!
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
        {PLANS.map(plan => {
          const pricing = getPlanPricing(plan.id)
          const isCurrentPlan = plan.id === 'team_premium' ? false : (plan.id === currentPlan || (plan.id === 'free' && currentPlan === 'free'))
          const isUpgraded = plan.id === 'team_premium' ? false : (plan.id !== 'free' && currentPlan !== 'free' &&
            (currentPlan === plan.id || (currentPlan === 'enterprise' && plan.id === 'premium')))

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
                <div className="my-5 flex flex-col gap-0.5">
                  {pricing.originalLabel && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold line-through ml-0.5">
                      {pricing.originalLabel}
                    </span>
                  )}
                  <div>
                    <span className={`text-3xl font-black ${plan.popular ? 'text-[#FF6B00]' : 'text-gray-800 dark:text-white'}`}>
                      {pricing.label}
                    </span>
                    <span className="text-xs text-gray-400 font-bold ml-1">{pricing.period}</span>
                  </div>
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

                {/* Team selection (if team plan) */}
                {selectedPlan.id === 'team_premium' && (
                  <div className="space-y-2 text-left bg-gray-50 dark:bg-[#1C1C28]/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-wider">
                      Chọn nhóm dự án muốn nâng cấp
                    </label>
                    {myTeams.length > 0 ? (
                      <select
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-xs bg-white dark:bg-[#1C1C28] text-gray-800 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                      >
                        {myTeams.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.members?.length || 0}/6 thành viên)</option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-red-500 dark:text-red-400 text-xs font-bold leading-relaxed space-y-1">
                        <p className="flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Bạn không phải là Trưởng nhóm của nhóm dự án nào.</p>
                        <p className="text-[10px] text-gray-500 font-normal">Chỉ Trưởng nhóm mới có quyền nâng cấp gói cho nhóm. Bạn hãy liên hệ Trưởng nhóm của mình thực hiện thanh toán này!</p>
                      </div>
                    )}
                  </div>
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

                  {/* Bank info direct */}
                  <div className="w-full space-y-2 text-xs">
                    <div className="bg-white dark:bg-[#1C1C28] border border-gray-100 dark:border-gray-700 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex justify-between items-center text-[10px] uppercase font-black text-gray-400">
                        <span>Thông tin chuyển khoản</span>
                        <span className="text-[#FF6B00] font-bold">MB Bank</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-gray-500 dark:text-gray-400">Chủ tài khoản:</span>
                        <span className="font-bold text-gray-800 dark:text-white">{selectedBank.accountName}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-0.5 border-t border-dashed border-gray-100 dark:border-gray-800">
                        <span className="text-gray-500 dark:text-gray-400">Số tài khoản:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-gray-800 dark:text-white">{selectedBank.no}</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(selectedBank.no);
                              alert('Đã sao chép số tài khoản!');
                            }}
                            className="text-gray-400 hover:text-[#FF6B00] transition"
                            title="Sao chép số tài khoản"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center py-0.5 border-t border-dashed border-gray-100 dark:border-gray-800">
                        <span className="text-gray-500 dark:text-gray-400">Nội dung CK:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-[#FF6B00]">{txId}</span>
                          <button onClick={copyTxId} className="text-gray-400 hover:text-[#FF6B00] transition" title="Sao chép nội dung">
                            {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
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
                  <p>2. Nhập đúng nội dung chuyển khoản: <strong className="text-[#FF6B00]">{txId}</strong> (rất quan trọng)</p>
                  <p>3. Hệ thống sẽ tự động phát hiện giao dịch và kích hoạt gói ngay lập tức</p>
                  <p>4. Sau khi chuyển, nhấn nút <strong>"Xác nhận đã chuyển khoản"</strong> bên dưới</p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitPayment}
                    disabled={submitting || countdown <= 0 || (selectedPlan.id === 'team_premium' && myTeams.length === 0)}
                    className="flex-1 py-3.5 bg-gradient-to-r from-orange-500 to-[#FF6B00] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                    ) : (
                      <><ShieldCheck className="w-4 h-4" /> Xác nhận đã chuyển khoản & Đợi kích hoạt</>
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
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-50 dark:bg-orange-950/20 mb-2">
                  <Loader2 className="w-10 h-10 text-[#FF6B00] animate-spin" />
                  <Clock className="w-5 h-5 text-orange-500 absolute bottom-1 right-1 bg-white dark:bg-[#13131C] rounded-full p-0.5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-800 dark:text-white">Đang Kiểm Tra Giao Dịch... ⏳</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2.5 leading-relaxed max-w-xs mx-auto">
                    Hệ thống đang tự động đối soát giao dịch chuyển khoản của bạn. Vui lòng <strong>không đóng trình duyệt</strong>.
                    Tài khoản sẽ tự động nâng cấp ngay khi nhận được tiền từ ngân hàng (thông thường từ 1 - 2 phút).
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-[#0B0B0F]/60 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 text-xs space-y-2.5 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mã nội dung CK:</span>
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
                    <span className="font-bold text-[#FF6B00] flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Chờ ngân hàng xác thực...
                    </span>
                  </div>
                </div>

                {/* Sandbox simulation */}
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-blue-400">Chế độ Thử nghiệm (Sandbox Demo)</span>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await paymentService.simulateWebhook(txId, finalPrice)
                      } catch (err) {
                        alert('Giả lập webhook thất bại.')
                      }
                    }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase rounded-lg transition shadow-md cursor-pointer"
                  >
                    ⚡ Giả lập Webhook ngân hàng báo nhận tiền
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={downloadInvoice} className="flex-1 py-3.5 bg-gray-100 dark:bg-[#1C1C28] text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition flex items-center justify-center gap-1.5">
                    <Download className="w-4 h-4" /> Tải Phiếu
                  </button>
                  <button 
                    onClick={() => setShowModal(false)} 
                    className="flex-1 py-3.5 bg-[#FF6B00] text-white text-xs font-bold rounded-xl hover:bg-[#E85A00] transition shadow-md"
                  >
                    Đóng (Kích hoạt ngầm)
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 – SUCCESS */}
            {step === 'success' && (
              <div className="p-8 text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 dark:bg-green-950/20 mb-2 border border-green-500/30">
                  <CheckCircle className="w-12 h-12 text-green-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-800 dark:text-white flex items-center justify-center gap-2">
                    <Crown className="w-6 h-6 text-yellow-500 animate-bounce" />
                    Nâng Cấp Thành Công! 🎉
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 leading-relaxed max-w-xs mx-auto">
                    Cảm ơn bạn đã đồng hành cùng StudyConnect! Gói <strong>{selectedPlan.name}</strong> của bạn đã được kích hoạt thành công.
                  </p>
                </div>

                <div className="bg-green-50/50 dark:bg-green-950/10 border border-green-100 dark:border-green-900/20 rounded-2xl p-4 text-xs space-y-2.5 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mã giao dịch:</span>
                    <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{txId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gói dịch vụ:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Trạng thái:</span>
                    <span className="font-bold text-green-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Đang hoạt động
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => setShowModal(false)} 
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-xl hover:shadow-lg transition shadow-md flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> Bắt đầu trải nghiệm ngay!
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AUTH REQUIRED MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#13131C] rounded-3xl w-full max-w-sm border border-gray-100 dark:border-gray-800 shadow-2xl p-6 text-center space-y-6 animate-scaleUp">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-50 dark:bg-orange-950/20 text-[#FF6B00]">
              <AlertCircle className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-gray-800 dark:text-white">Yêu Cầu Đăng Nhập</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Vui lòng đăng nhập tài khoản StudyConnect để tiến hành nâng cấp và mở khóa các tính năng Premium.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAuthModal(false)}
                className="flex-1 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Đã hiểu
              </button>
              <button
                onClick={() => {
                  setShowAuthModal(false)
                  navigate('/login')
                }}
                className="flex-1 py-3 bg-[#FF6B00] text-white text-xs font-bold rounded-xl hover:bg-[#E85A00] transition shadow-md"
              >
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── COMPARISON MODAL ─── */}
      {showComparisonModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#13131C] rounded-3xl w-full max-w-5xl border border-gray-150 dark:border-gray-800 shadow-2xl max-h-[90vh] flex flex-col animate-scaleUp">
            
            {/* Modal Header */}
            <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#FF6B00]" />
                  So Sánh Chi Tiết Quyền Lợi & Tính Năng Các Gói
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Mọi chức năng dưới đây đều được tích hợp thực tế trên hệ thống và tương thích theo phân quyền gói của bạn.
                </p>
              </div>
              <button 
                onClick={() => setShowComparisonModal(false)} 
                className="text-gray-400 hover:text-gray-650 dark:hover:text-white p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="overflow-x-auto rounded-2xl border border-gray-155 dark:border-gray-800/80 shadow-sm">
                <table className="w-full text-left border-collapse min-w-[800px] text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 dark:bg-[#0B0B0F]/70 border-b dark:border-gray-800 sticky top-0 backdrop-blur-md z-10">
                      <th className="p-4 font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[26%]">Tính năng & Quyền lợi</th>
                      <th className="p-4 font-black text-gray-750 dark:text-gray-200 w-[14%]">Standard</th>
                      <th className="p-4 font-black text-[#FF6B00] dark:text-orange-400 w-[15%]">Pro Premium</th>
                      <th className="p-4 font-black text-[#FF6B00] dark:text-orange-400 w-[15%]">Team Premium</th>
                      <th className="p-4 font-black text-purple-650 dark:text-purple-400 w-[15%]">Enterprise</th>
                      <th className="p-4 font-black text-purple-650 dark:text-purple-400 w-[15%]">Corporate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                    {COMPARISON_CATEGORIES.map((category, catIdx) => (
                      <Fragment key={catIdx}>
                        {/* Section Header */}
                        <tr className="bg-gray-50/50 dark:bg-gray-900/10">
                          <td colSpan={6} className="p-3 bg-gray-100/50 dark:bg-[#1A1A26]/80 font-black text-[#FF6B00] dark:text-orange-400 border-y border-gray-200 dark:border-gray-800/80 uppercase tracking-wider text-[10px] pl-4">
                            {category.name}
                          </td>
                        </tr>
                        {/* Features */}
                        {category.features.map((feat, featIdx) => (
                          <tr key={featIdx} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/10 transition-colors">
                            <td className="p-4 border-b border-gray-100 dark:border-gray-800/30 pr-3">
                              <p className="font-extrabold text-gray-800 dark:text-white text-xs">{feat.name}</p>
                              <p className="text-[10px] text-gray-400 mt-1 font-medium leading-relaxed">{feat.desc}</p>
                            </td>
                            <td className="p-4 border-b border-gray-100 dark:border-gray-800/30">
                              {renderComparisonCell(feat.free)}
                            </td>
                            <td className="p-4 border-b border-gray-100 dark:border-gray-800/30">
                              {renderComparisonCell(feat.premium)}
                            </td>
                            <td className="p-4 border-b border-gray-100 dark:border-gray-800/30">
                              {renderComparisonCell(feat.team)}
                            </td>
                            <td className="p-4 border-b border-gray-100 dark:border-gray-800/30">
                              {renderComparisonCell(feat.enterprise)}
                            </td>
                            <td className="p-4 border-b border-gray-100 dark:border-gray-800/30">
                              {renderComparisonCell(feat.corporate)}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t dark:border-gray-800 bg-gray-50/50 dark:bg-[#0B0B0F]/20 flex justify-end shrink-0">
              <button
                onClick={() => setShowComparisonModal(false)}
                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-650 text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                Đóng bảng so sánh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
