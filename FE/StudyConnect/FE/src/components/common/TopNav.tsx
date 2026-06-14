import { useAuth } from '../../contexts/AuthContext'
import { LogOut, Zap, Shield, Sparkles, Bell, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationService } from '../../services/apiServices'

export default function TopNav() {
  const { user, logout, login } = useAuth()
  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const navigate = useNavigate()

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  })

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDarkMode])

  // Notification States
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  const roles = [
    { name: 'member', label: 'Sinh viên 👩‍💼', email: 'alice@example.com' },
    { name: 'manager', label: 'Giảng viên 👩‍🔬', email: 'carol@example.com' },
    { name: 'leader', label: 'Quản lý (Dean) 👩‍🎓', email: 'emma@example.com' },
    { name: 'admin', label: 'Admin (IT) 👨‍💻', email: 'david@example.com' },
  ]

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications()
      setNotifications(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (user) {
      loadNotifications()
      const interval = setInterval(loadNotifications, 15000)
      return () => clearInterval(interval)
    }
  }, [user])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleNotificationClick = async (n: any) => {
    try {
      if (!n.isRead) {
        await notificationService.markAsRead(n.id)
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item))
      }
      setShowNotifications(false)
      if (n.link) {
        navigate(n.link)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      const unreads = notifications.filter(n => !n.isRead)
      await Promise.all(unreads.map(n => notificationService.markAsRead(n.id)))
      setNotifications(prev => prev.map(item => ({ ...item, isRead: true })))
    } catch (err) {
      console.error(err)
    }
  }

  const handleDemoLogin = async (roleName: string, email: string) => {
    try {
      await login(email, 'password123')
      setShowRoleMenu(false)
      if (roleName === 'admin') {
        navigate('/admin')
      } else if (roleName === 'manager') {
        navigate('/manager')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Demo login error', err)
      alert('Đăng nhập demo thất bại')
    }
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-[0_2px_15px_rgba(0,0,0,0.015)]">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-[#FF6B00] to-[#FF801A] text-white shadow-md">
          <span className="text-sm">🚀</span>
        </div>
        <h1 className="text-lg font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent hidden sm:block">
          Study<span className="text-[#FF6B00]">Connect</span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {!user ? (
          <div className="flex gap-2">
            <button 
              onClick={() => handleDemoLogin('member', 'alice@example.com')} 
              className="px-3.5 py-1.5 rounded-xl bg-[#FF6B00] text-white text-xs font-bold hover:bg-[#E85A00] transition shadow-sm"
            >
              Demo Member
            </button>
            <button 
              onClick={() => handleDemoLogin('admin', 'david@example.com')} 
              className="px-3.5 py-1.5 rounded-xl bg-gray-100 text-gray-800 text-xs font-bold hover:bg-gray-200 transition"
            >
              Demo Admin
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-gray-800 flex items-center gap-1">
                {user.name}
                {user.subscription === 'premium' && <Sparkles className="w-3 h-3 text-[#FF6B00]" />}
                {user.subscription === 'enterprise' && <Shield className="w-3 h-3 text-[#FF6B00]" />}
              </div>
              <div className="text-[10px] font-bold text-gray-400 capitalize bg-gray-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                {user.role}
              </div>
            </div>

            {/* Role Switcher - Demo Only */}
            <div className="relative">
              <button 
                onClick={() => setShowRoleMenu(!showRoleMenu)} 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-100 text-[#FF6B00] bg-[#FFF4E8]/50 hover:bg-[#FFF4E8] hover:border-orange-200 transition text-xs font-bold"
              >
                <Zap size={12} className="fill-[#FF6B00]" />
                Role Switcher
              </button>
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 p-1.5 animate-fadeIn">
                  <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400">Chọn vai trò demo</div>
                  {roles.map(r => (
                    <button 
                      key={r.name} 
                      onClick={() => handleDemoLogin(r.name, r.email)} 
                      className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-[#FFF4E8] hover:text-[#FF6B00] transition font-bold text-gray-700 flex justify-between items-center"
                    >
                      <span>{r.label}</span>
                      {user.role === r.name && <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]"></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
              className="p-2 rounded-xl text-gray-400 hover:text-[#FF6B00] hover:bg-[#FFF4E8]/50 transition cursor-pointer"
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications)
                  if (!showNotifications) loadNotifications()
                }}
                title="Thông báo"
                className="p-2 rounded-xl text-gray-400 hover:text-[#FF6B00] hover:bg-[#FFF4E8]/50 transition relative"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] font-black flex items-center justify-center border border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 p-2 animate-fadeIn">
                  <div className="flex items-center justify-between border-b pb-2 px-2.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Thông báo</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[9px] font-black text-[#FF6B00] hover:underline cursor-pointer"
                      >
                        Đọc tất cả
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-gray-50 mt-1">
                    {notifications.length === 0 ? (
                      <p className="text-[10px] text-gray-400 italic text-center py-6">Chưa có thông báo mới.</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-2.5 rounded-xl cursor-pointer text-xs transition font-medium ${
                            n.isRead ? 'text-gray-500 hover:bg-gray-50' : 'bg-orange-50/20 text-gray-800 hover:bg-orange-50/40 border-l-2 border-[#FF6B00]'
                          }`}
                        >
                          <div className="font-bold">{n.title}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5 leading-normal">{n.content}</div>
                          <div className="text-[8px] text-gray-400 mt-1 font-bold">
                            {new Date(n.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={logout} 
              title="Đăng xuất" 
              className="p-2 rounded-xl text-gray-400 hover:text-[#FF6B00] hover:bg-[#FFF4E8]/50 transition"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
