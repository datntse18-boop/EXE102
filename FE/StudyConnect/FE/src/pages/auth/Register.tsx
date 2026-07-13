import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { authService } from '../../services/apiServices'

export default function Register() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // OTP flow states
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [mockOtpMsg, setMockOtpMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Client-side validations
    if (name.trim().length < 3) {
      setError('Họ tên phải chứa tối thiểu 3 ký tự.')
      return
    }
    const phoneRegex = /^[0-9]{10,11}$/
    if (!phoneRegex.test(phone)) {
      setError('Số điện thoại không hợp lệ. Phải chứa 10-11 chữ số.')
      return
    }
    if (password.length < 6) {
      setError('Mật khẩu bảo mật phải có độ dài từ 6 ký tự trở lên.')
      return
    }

    setLoading(true)
    try {
      const data = await authService.register(name, email, password, phone)
      if (data.data?.mockOtp) {
        setMockOtpMsg(`[SMS MOCK] Mã OTP đã được gửi đến số ${phone}: ${data.data.mockOtp}`)
      }
      setShowOtpModal(true)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại kết nối server.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtpError('')
    if (otpCode.length !== 6) {
      setOtpError('Mã OTP phải chứa 6 chữ số.')
      return
    }

    setOtpLoading(true)
    try {
      const res = await authService.verifyOtp(email, otpCode)
      // Save tokens
      sessionStorage.setItem('accessToken', res.data.accessToken)
      sessionStorage.setItem('refreshToken', res.data.refreshToken)
      
      // Complete login in context
      await login(email, password)
      nav('/dashboard')
    } catch (err: any) {
      setOtpError(err.response?.data?.message || err.message || 'Xác thực OTP thất bại.')
    } finally {
      setOtpLoading(false)
    }
  }

  return (
    <div className="relative overflow-hidden bg-white/85 dark:bg-[#13131C]/95 backdrop-blur-xl p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-white/40 dark:border-gray-800/80 w-full max-w-md transition-all duration-300">
      {/* Decorative top gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF6B00] via-[#FFA64D] to-[#FF6B00]"></div>
      
      <div className="text-center mb-6 mt-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FFF4E8] dark:bg-orange-950/20 text-[#FF6B00] mb-3 shadow-[0_8px_20px_rgba(255,107,0,0.1)]">
          <Sparkles className="w-5 h-5 text-[#FF6B00]" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Tạo tài khoản</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1.5">Tham gia mạng lưới StudyConnect ngay hôm nay!</p>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs border border-red-100 dark:border-red-900/30 flex items-center gap-2 animate-shake">
          <span className="text-sm">⚠️</span>
          <span>{error === 'Failed to fetch' ? 'Kết nối đến Server thất bại. Vui lòng thử lại sau!' : error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-1.5 ml-1">
            Họ tên <span className="text-[#FF6B00] text-[11px] font-normal normal-case ml-1">(Tối thiểu 3 ký tự)</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ví dụ: Nguyễn Văn A"
            className="w-full border border-gray-200/80 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 bg-gray-50/50 dark:bg-[#1C1C28]"
            required
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 ml-1 leading-relaxed">
            💡 Nhập đầy đủ họ và tên thật để hiển thị trên nhóm và chứng chỉ.
          </p>
        </div>
        
        <div>
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-1.5 ml-1">
            Email <span className="text-[#FF6B00] text-[11px] font-normal normal-case ml-1">(Định dạng email chuẩn)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full border border-gray-200/80 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 bg-gray-50/50 dark:bg-[#1C1C28]"
            required
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 ml-1 leading-relaxed">
            💡 Dùng để đăng nhập, nhận thông báo và lời mời gia nhập nhóm.
          </p>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-1.5 ml-1">
            Số điện thoại <span className="text-[#FF6B00] text-[11px] font-normal normal-case ml-1">(Nhập 10-11 số)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="Ví dụ: 0912345678"
            className="w-full border border-gray-200/80 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 bg-gray-50/50 dark:bg-[#1C1C28]"
            required
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 ml-1 leading-relaxed">
            💡 Bắt buộc để xác thực đăng ký tài khoản qua OTP SMS.
          </p>
        </div>
        
        <div>
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-1.5 ml-1">
            Mật khẩu <span className="text-[#FF6B00] text-[11px] font-normal normal-case ml-1">(Tối thiểu 6 ký tự)</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            minLength={6}
            className="w-full border border-gray-200/80 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 bg-gray-50/50 dark:bg-[#1C1C28]"
            required
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 ml-1 leading-relaxed">
            💡 Chọn mật khẩu dễ nhớ nhưng đủ an toàn để bảo vệ tài khoản.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF801A] text-white font-bold text-sm shadow-[0_6px_20px_rgba(255,107,0,0.2)] hover:shadow-[0_8px_25px_rgba(255,107,0,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản mới'}
          <Sparkles className="w-4 h-4 text-white/80" />
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-gray-500">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-[#FF6B00] hover:underline font-bold">Đăng nhập ngay</Link>
      </div>

      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-[#13131C] border border-gray-800 rounded-3xl p-6 w-full max-w-sm relative shadow-2xl animate-scaleUp">
            <h3 className="text-xl font-bold text-white text-center mb-2">Xác thực số điện thoại 📱</h3>
            <p className="text-gray-400 text-xs text-center mb-4 leading-relaxed">
              Mã xác thực OTP đã được gửi đến số điện thoại của bạn. Vui lòng kiểm tra và nhập vào ô dưới đây.
            </p>

            {mockOtpMsg && (
              <div className="mb-4 p-3 bg-orange-950/20 border border-orange-500/30 rounded-xl text-[#FF6B00] text-center text-xs font-semibold select-all">
                {mockOtpMsg}
              </div>
            )}

            {otpError && (
              <div className="mb-4 p-3 bg-red-950/25 border border-red-900/30 rounded-xl text-red-400 text-center text-xs">
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <input
                type="text"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)}
                placeholder="Nhập 6 số OTP"
                maxLength={6}
                className="w-full text-center tracking-[0.5em] text-lg font-bold border border-gray-700 rounded-xl px-4 py-3 bg-[#1C1C28] text-white focus:outline-none focus:border-[#FF6B00] placeholder:tracking-normal placeholder:font-normal placeholder:text-sm"
                required
              />

              <button
                type="submit"
                disabled={otpLoading}
                className="w-full py-3 rounded-xl bg-[#FF6B00] hover:bg-orange-600 text-white font-bold text-sm shadow-[0_6px_20px_rgba(255,107,0,0.2)] transition-all duration-200 disabled:opacity-50"
              >
                {otpLoading ? 'Đang xác thực...' : 'Xác nhận OTP'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
