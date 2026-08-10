import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { authService } from '../../services/apiServices'

export default function Register() {
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneTouch, setPhoneTouch] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordTouch, setPasswordTouch] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isPhoneValid = /^0[0-9]{9}$/.test(phone)
  const isPhoneInvalid = phoneTouch && phone.length > 0 && !isPhoneValid

  const isPasswordValid = /^[1-9]{6}$/.test(password)
  const isPasswordInvalid = passwordTouch && password.length > 0 && !isPasswordValid

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '')
    if (val.length <= 10) {
      setPhone(val)
    }
    if (!phoneTouch) setPhoneTouch(true)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^1-9]/g, '')
    if (val.length <= 6) {
      setPassword(val)
    }
    if (!passwordTouch) setPasswordTouch(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (name.trim().length < 3) {
      setError('Họ tên phải chứa tối thiểu 3 ký tự.')
      return
    }
    if (!isPhoneValid) {
      setError('Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 chữ số bắt đầu bằng số 0.')
      return
    }
    if (!isPasswordValid) {
      setError('Mật khẩu chỉ bao gồm 6 chữ số trong khoảng từ 1 đến 9.')
      return
    }

    setLoading(true)
    try {
      // Gọi API đăng ký
      await authService.register(name, phone, password)
      
      // Đăng ký thành công -> Điều hướng về trang đăng nhập (/login)
      nav('/login')
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại kết nối server.')
    } finally {
      setLoading(false)
    }
  }

  const placeholderStyle = "placeholder:text-gray-400/80 dark:placeholder:text-gray-500/50"

  return (
    <div className="relative overflow-hidden bg-white/85 dark:bg-[#13131C]/95 backdrop-blur-xl p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-white/40 dark:border-gray-800/80 w-full max-w-md transition-all duration-300">
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

      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        {/* HỌ TÊN */}
        <div>
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-1.5 ml-1">
            Họ tên <span className="text-[#FF6B00] text-[11px] font-normal normal-case ml-1">(Tối thiểu 3 ký tự)</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ví dụ: Nguyễn Văn A"
            autoComplete="off"
            className={`w-full border border-gray-200/80 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white ${placeholderStyle} focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 bg-gray-50/50 dark:bg-[#1C1C28]`}
            required
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 ml-1 leading-relaxed">
            💡 Nhập đầy đủ họ và tên thật để hiển thị trên nhóm và chứng chỉ.
          </p>
        </div>

        {/* SỐ ĐIỆN THOẠI */}
        <div>
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-1.5 ml-1">
            Số điện thoại <span className="text-[#FF6B00] text-[11px] font-normal normal-case ml-1">(Đúng 10 số, bắt đầu bằng 0)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            onBlur={() => setPhoneTouch(true)}
            placeholder="Ví dụ: 0912345678"
            maxLength={10}
            autoComplete="none"
            className={`w-full border rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white ${placeholderStyle} focus:outline-none transition-all duration-200 bg-gray-50/50 dark:bg-[#1C1C28] ${
              isPhoneInvalid 
                ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                : 'border-gray-200/80 dark:border-gray-700 focus:border-[#FF6B00] focus:ring-4 focus:ring-orange-500/10'
            }`}
            required
          />
          {isPhoneInvalid ? (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1.5 ml-1 font-medium animate-fadeIn">
              ⚠️ Số điện thoại không hợp lệ (Phải gồm 10 chữ số và bắt đầu bằng số 0).
            </p>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 ml-1 leading-relaxed">
              💡 Dùng làm tài khoản chính để đăng nhập hệ thống.
            </p>
          )}
        </div>
        
        {/* MẬT KHẨU */}
        <div>
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-1.5 ml-1">
            Mật khẩu <span className="text-[#FF6B00] text-[11px] font-normal normal-case ml-1">(Đúng 6 chữ số từ 1-9)</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            onBlur={() => setPasswordTouch(true)}
            placeholder="Ví dụ: 123456"
            maxLength={6}
            autoComplete="new-password"
            className={`w-full border rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white ${placeholderStyle} focus:outline-none transition-all duration-200 bg-gray-50/50 dark:bg-[#1C1C28] ${
              isPasswordInvalid 
                ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                : 'border-gray-200/80 dark:border-gray-700 focus:border-[#FF6B00] focus:ring-4 focus:ring-orange-500/10'
            }`}
            required
          />
          {isPasswordInvalid ? (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1.5 ml-1 font-medium animate-fadeIn">
              ⚠️ Mật khẩu không hợp lệ (Phải đúng 6 chữ số từ 1 đến 9).
            </p>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 ml-1 leading-relaxed">
              💡 Mật khẩu chỉ bao gồm 6 chữ số (từ 1 đến 9).
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || isPhoneInvalid || isPasswordInvalid}
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
    </div>
  )
}