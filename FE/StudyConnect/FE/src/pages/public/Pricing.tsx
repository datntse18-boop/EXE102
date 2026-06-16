import { useState, useEffect } from 'react'
import {
  Check,
  CheckCircle,
  CreditCard,
  ArrowRight,
  Loader2,
  Download,
  Printer,
  QrCode,
  Sparkles,
  Percent,
  ShieldCheck,
  AlertCircle
} from 'lucide-react'
import Card from '../../components/cards/Card'
import { useAuth } from '../../contexts/AuthContext'
import { paymentService, authService } from '../../services/apiServices'

export default function Pricing() {
  const { user, updateUserData } = useAuth()
  
  // Checkout Modal State
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState<'checkout' | 'success'>('checkout')
  const [promoCode, setPromoCode] = useState('')
  const [discountApplied, setDiscountApplied] = useState(false)
  const [countdown, setCountdown] = useState(300) // 5 minutes
  const [txId, setTxId] = useState('')
  const [simulating, setSimulating] = useState(false)

  // Generate a random transaction ID
  const generateTxId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = 'SC-PREM-'
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Handle open billing modal
  const handleUpgradeClick = () => {
    setTxId(generateTxId())
    setCountdown(300)
    setPromoCode('')
    setDiscountApplied(false)
    setStep('checkout')
    setShowModal(true)
  }

  // Countdown timer effect
  useEffect(() => {
    if (!showModal || step !== 'checkout' || countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown(prev => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [showModal, step, countdown])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const applyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'STUDYCONNECT30') {
      setDiscountApplied(true)
      alert('Đã áp dụng mã giảm giá 30% thành công!')
    } else {
      alert('Mã giảm giá không hợp lệ. Gợi ý: nhập STUDYCONNECT30')
    }
  }

  // Simulate payment confirmation
  const handleConfirmPayment = async () => {
    setSimulating(true)
    try {
      await paymentService.createPayment('premium')
      const me = await authService.me()
      updateUserData(me)
      setStep('success')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi nâng cấp tài khoản.')
    } finally {
      setSimulating(false)
    }
  }

  // Download Invoice as TXT
  const downloadInvoice = () => {
    const price = discountApplied ? '139.300 VNĐ' : '199.000 VNĐ'
    const discountText = discountApplied ? '30% (STUDYCONNECT30)' : '0%'
    const invoiceContent = `================================================
           STUDYCONNECT PREMIUM RECEIPT
================================================
Mã giao dịch:   ${txId}
Ngày thanh toán: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}
Khách hàng:      ${user?.name || 'Thành viên StudyConnect'}
Email:           ${user?.email || 'N/A'}
------------------------------------------------
Nội dung:        Gói Premium Membership (1 Tháng)
Giá gốc:         199.000 VNĐ
Giảm giá:        ${discountText}
------------------------------------------------
Tổng tiền:       ${price}
Trạng thái:      ĐÃ THANH TOÁN (PAID)
================================================
Cảm ơn bạn đã đồng hành cùng StudyConnect!
`
    const blob = new Blob([invoiceContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `STUDYCONNECT-RECEIPT-${txId}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="py-8 space-y-8 animate-fadeIn pb-12">
      
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1B1B22] via-[#2F2F3B] to-[#1B1B22] text-white rounded-3xl p-8 shadow-xl border border-gray-800 text-center">
        <span className="bg-[#FF6B00] px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm inline-flex items-center gap-1.5 mx-auto">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          StudyConnect Premium Tiers
        </span>
        <h1 className="text-3xl font-black mt-4 tracking-tight leading-none text-white">
          Nâng Cấp Tài Khoản & Mở Khóa Đầy Đủ Tính Năng ⚡
        </h1>
        <p className="text-sm text-gray-300 mt-3 font-medium opacity-90 max-w-xl mx-auto leading-relaxed">
          Tối ưu hóa hành trình khởi nghiệp, kết nối giảng viên chuyên môn và khai thác tối đa tài nguyên từ công nghệ AI của StudyConnect.
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        
        {/* Tier 1: Free */}
        <Card className="flex flex-col justify-between border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#13131C] p-6 rounded-3xl h-full">
          <div>
            <h3 className="text-lg font-black text-gray-800 dark:text-white">Gói Standard</h3>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Dành cho sinh viên học tập cơ bản</p>
            <div className="my-6">
              <span className="text-3xl font-black text-gray-800 dark:text-white">0 VNĐ</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-bold"> / mãi mãi</span>
            </div>
            <ul className="space-y-3.5 border-t dark:border-gray-850 pt-5 text-xs text-gray-650 dark:text-gray-400 font-medium">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                Tham gia/Tạo 1 nhóm dự án
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                Truy cập Workspace & Kanban Task
              </li>
              <li className="flex items-center gap-2 text-gray-400 dark:text-gray-600 line-through">
                Phân tích ý tưởng bằng AI
              </li>
              <li className="flex items-center gap-2 text-gray-400 dark:text-gray-600 line-through">
                Mô phỏng Virtual Demo Day AI
              </li>
            </ul>
          </div>
          <button className="mt-8 w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 text-gray-500 dark:text-gray-400 text-xs font-bold bg-gray-50/50 dark:bg-transparent cursor-not-allowed">
            Đang Sử Dụng
          </button>
        </Card>

        {/* Tier 2: Premium (Orange Highlit) */}
        <div className="relative flex flex-col justify-between border-2 border-[#FF6B00] shadow-[0_12px_40px_rgba(255,107,0,0.12)] bg-white dark:bg-[#13131C] p-6 rounded-3xl h-full">
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-[#FF6B00] text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
            Phổ biến nhất ✨
          </span>
          <div>
            <h3 className="text-lg font-black text-gray-800 dark:text-white">Gói Pro Premium</h3>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Dành cho các nhóm startup EXE triển vọng</p>
            <div className="my-6">
              <span className="text-3xl font-black text-gray-800 dark:text-white">199.000 VNĐ</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-bold"> / tháng</span>
            </div>
            <ul className="space-y-3.5 border-t dark:border-gray-850 pt-5 text-xs text-gray-650 dark:text-gray-400 font-medium">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                Không giới hạn Phân tích dự án bằng AI
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                Tham gia chất vấn Virtual Demo Day AI
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                Công cụ Quản trị OKR, tiến độ nâng cao
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                Hỗ trợ 24/7 & Ưu tiên đăng ký Mentor
              </li>
            </ul>
          </div>
          <button
            onClick={handleUpgradeClick}
            className="mt-8 w-full py-2.5 bg-gradient-to-r from-orange-500 to-[#FF6B00] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition duration-200"
          >
            Nâng Cấp Ngay
          </button>
        </div>

        {/* Tier 3: Enterprise */}
        <Card className="flex flex-col justify-between border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#13131C] p-6 rounded-3xl h-full">
          <div>
            <h3 className="text-lg font-black text-gray-800 dark:text-white">Gói Enterprise</h3>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Dành cho Nhà trường / Ban quản lý lớp</p>
            <div className="my-6">
              <span className="text-3xl font-black text-gray-800 dark:text-white">Liên hệ</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-bold"> / thương lượng</span>
            </div>
            <ul className="space-y-3.5 border-t dark:border-gray-850 pt-5 text-xs text-gray-650 dark:text-gray-400 font-medium">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                Quản lý số lượng lớn sinh viên & lớp học
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                Xem Bản đồ nhiệt hoạt động nâng cao
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                Xuất báo cáo chi tiết cho hội đồng nhà trường
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                Máy chủ riêng & Tùy chỉnh Barems điểm
              </li>
            </ul>
          </div>
          <button className="mt-8 w-full py-2.5 rounded-xl border border-gray-800 dark:border-gray-750 text-gray-800 dark:text-gray-300 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-850 transition">
            Liên Hệ Hỗ Trợ
          </button>
        </Card>
      </div>

      {/* BILLING CHECKOUT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#13131C] rounded-3xl p-6 w-full max-w-md border border-gray-100 dark:border-gray-800 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            
            {/* STEP 1: CHECKOUT & QR CODE */}
            {step === 'checkout' && (
              <div className="space-y-5">
                <div className="flex justify-between items-center pb-2.5 border-b dark:border-gray-850">
                  <h3 className="text-sm font-black text-gray-800 dark:text-white flex items-center gap-1.5">
                    <CreditCard className="w-4.5 h-4.5 text-[#FF6B00]" />
                    Thanh Toán Đăng Ký Premium
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-bold"
                  >
                    Đóng
                  </button>
                </div>

                {/* Price Summary */}
                <div className="bg-gray-50 dark:bg-[#0B0B0F] p-4 rounded-2xl border border-gray-100 dark:border-gray-850 text-xs space-y-2.5">
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-500">Gói đăng ký:</span>
                    <span className="text-gray-800 dark:text-white font-bold">Premium Pro (1 Tháng)</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-500">Mã giao dịch:</span>
                    <span className="font-mono text-gray-700 dark:text-gray-350">{txId}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-500">Giá gốc:</span>
                    <span className="text-gray-700 dark:text-gray-350 font-bold">199.000 VNĐ</span>
                  </div>

                  {discountApplied && (
                    <div className="flex justify-between text-green-600 font-bold">
                      <span>Giảm giá (STUDYCONNECT30):</span>
                      <span>-59.700 VNĐ</span>
                    </div>
                  )}

                  <div className="border-t dark:border-gray-850 pt-2.5 flex justify-between font-black text-sm text-gray-800 dark:text-white">
                    <span>Tổng số tiền:</span>
                    <span className="text-[#FF6B00]">
                      {discountApplied ? '139.300 VNĐ' : '199.000 VNĐ'}
                    </span>
                  </div>
                </div>

                {/* Promo Code Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập mã giảm giá (STUDYCONNECT30)"
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value)}
                    disabled={discountApplied}
                    className="flex-1 bg-white dark:bg-[#0B0B0F] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF6B00] dark:text-gray-200"
                  />
                  <button
                    onClick={applyPromo}
                    disabled={discountApplied || !promoCode.trim()}
                    className="px-4 py-2 bg-gray-800 dark:bg-gray-750 text-white rounded-xl text-xs font-bold hover:bg-gray-950 transition flex items-center gap-1 shrink-0"
                  >
                    <Percent className="w-3.5 h-3.5" /> Áp dụng
                  </button>
                </div>

                {/* VietQR simulated scan */}
                <div className="flex flex-col items-center justify-center bg-orange-50/15 dark:bg-orange-950/5 border border-orange-100/50 dark:border-orange-900/10 p-5 rounded-2xl text-center space-y-4">
                  <span className="text-[10px] font-black text-[#FF6B00] bg-orange-100 dark:bg-orange-950/50 px-3 py-1 rounded-full uppercase tracking-wider">
                    VietQR / Quét Mã Chuyển Khoản
                  </span>
                  
                  {/* Styled Mock QR Code */}
                  <div className="relative w-40 h-40 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                    <QrCode className="w-full h-full text-gray-800" />
                    {/* Bank logo mock badge */}
                    <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FF6B00] border-2 border-white rounded-lg px-1 text-[7px] font-black text-white shadow-md">
                      MBBank
                    </div>
                  </div>

                  <div className="text-[10px] text-gray-500 font-medium space-y-1">
                    <p className="font-bold text-gray-850 dark:text-gray-300">Tài khoản thụ hưởng: MB Bank - 0987654321</p>
                    <p className="font-mono text-[9px]">Nội dung CK: <span className="text-[#FF6B00] font-black">{txId}</span></p>
                  </div>

                  {/* Countdown */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium justify-center animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Đang chờ giao dịch... ({formatTime(countdown)})
                  </div>
                </div>

                {/* Confirm Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleConfirmPayment}
                    disabled={simulating}
                    className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-[#FF6B00] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5"
                  >
                    {simulating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang đối soát...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Xác nhận đã chuyển khoản
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="py-3 px-4 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-xs font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-850 transition"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: PAYMENT SUCCESS & INVOICE */}
            {step === 'success' && (
              <div className="space-y-6 text-center py-4">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-green-100 dark:bg-green-950/40 mb-2 shadow-inner">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-black text-gray-800 dark:text-white">Nâng Cấp Thành Công! 🎉</h3>
                <p className="text-xs text-gray-550 dark:text-gray-400 max-w-xs mx-auto leading-relaxed font-medium">
                  Tài khoản của bạn đã được chuyển thành tài khoản **Premium Pro**. Bạn có thể sử dụng đầy đủ các tính năng thông minh của StudyConnect.
                </p>

                {/* Interactive Receipt Card */}
                <div className="text-left border dark:border-gray-850 rounded-2xl overflow-hidden bg-gray-50/50 dark:bg-[#0B0B0F]/50 shadow-sm border-gray-100">
                  <div className="bg-[#FF6B00] px-4 py-2 text-[10px] font-black text-white uppercase tracking-wider flex justify-between">
                    <span>Hóa đơn giao dịch</span>
                    <span>PAID</span>
                  </div>
                  <div className="p-4 text-[10px] space-y-2.5 leading-relaxed text-gray-600 dark:text-gray-400 font-medium">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Mã giao dịch:</span>
                      <span className="font-mono font-bold text-gray-800 dark:text-gray-250">{txId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ngày thanh toán:</span>
                      <span className="text-gray-800 dark:text-gray-250">
                        {new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Dịch vụ:</span>
                      <span className="text-gray-800 dark:text-gray-250">StudyConnect Premium Pro</span>
                    </div>
                    <div className="flex justify-between border-t dark:border-gray-850 pt-2 font-bold text-gray-800 dark:text-white text-xs">
                      <span>Tổng tiền:</span>
                      <span className="text-[#FF6B00]">
                        {discountApplied ? '139.300 VNĐ' : '199.000 VNĐ'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Print/Download actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={downloadInvoice}
                    className="py-2.5 bg-gray-800 hover:bg-gray-950 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm border border-gray-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Tải Hóa Đơn (.txt)
                  </button>
                  <button
                    onClick={handlePrint}
                    className="py-2.5 border border-gray-200 dark:border-gray-850 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-850 transition flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    In Biên Nhận
                  </button>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-3 bg-[#FF6B00] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#E85A00] transition"
                >
                  Bắt Đầu Trải Nghiệm Premium
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
