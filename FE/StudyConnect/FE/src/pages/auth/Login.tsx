import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export default function Login() {
  const { user, login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      nav('/app')
    }
  }, [user, nav])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      nav('/app')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative overflow-hidden bg-white/85 backdrop-blur-xl p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-white/40 w-full max-w-md transition-all duration-300">
      {/* Decorative top gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF6B00] via-[#FFA64D] to-[#FF6B00]"></div>
      
      <div className="text-center mb-8 mt-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FFF4E8] text-[#FF6B00] mb-3 shadow-[0_8px_20px_rgba(255,107,0,0.1)]">
          <Sparkles className="w-5 h-5 text-[#FF6B00]" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">StudyConnect</h2>
        <p className="text-gray-500 text-sm mt-1.5">Kết nối và phát triển dự án EXE đỉnh cao</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-700 text-xs border border-red-100 flex items-center gap-2 animate-shake">
          <span className="text-sm">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5 ml-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full border border-gray-200/80 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 bg-gray-50/50 dark:bg-[#1C1C28]"
            required
          />
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1.5 ml-1">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Mật khẩu</label>
          </div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full border border-gray-200/80 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 bg-gray-50/50 dark:bg-[#1C1C28]"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF801A] text-white font-bold text-sm shadow-[0_6px_20px_rgba(255,107,0,0.2)] hover:shadow-[0_8px_25px_rgba(255,107,0,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}
          <Sparkles className="w-4 h-4 text-white/80" />
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-gray-500">
        Chưa có tài khoản học viên?{' '}
        <Link to="/register" className="text-[#FF6B00] hover:underline font-bold">Đăng ký ngay</Link>
      </div>
    </div>
  )
}
