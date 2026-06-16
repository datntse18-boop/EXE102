import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

export default function Register() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Register then auto-login
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.message)
      localStorage.setItem('accessToken', data.data.accessToken)
      localStorage.setItem('refreshToken', data.data.refreshToken)
      await login(email, password)
      nav('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">Tạo tài khoản</h2>
      <p className="text-gray-500 text-sm mb-6">Tham gia StudyConnect ngay hôm nay!</p>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 text-red-600 text-sm border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Họ tên</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nguyễn Văn A"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#FF6B00] transition"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#FF6B00] transition"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Tối thiểu 6 ký tự"
            minLength={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#FF6B00] transition"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 rounded-lg bg-[#FF6B00] text-white font-semibold hover:bg-[#E85A00] transition disabled:opacity-60"
        >
          {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-gray-500">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-[#FF6B00] hover:underline font-medium">Đăng nhập</Link>
      </div>
    </div>
  )
}
