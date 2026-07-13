import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from '../components/common/Sidebar'
import TopNav from '../components/common/TopNav'
import CommandPalette from '../components/common/CommandPalette'
import FloatingAiCopilot from '../components/common/FloatingAiCopilot'
import { useState, useEffect } from 'react'
import { Sparkles, Crown, Zap, X, AlertCircle, ArrowLeft } from 'lucide-react'

export default function MainLayout() {
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('')
  const [zenMode, setZenMode] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleLimitReached = (e: Event) => {
      const customEvent = e as CustomEvent
      setModalMessage(customEvent.detail || 'Bạn đã dùng hết lượt sử dụng AI miễn phí trong ngày (3 lần/ngày).')
      setShowLimitModal(true)
    }

    const handleToggleZen = () => {
      setZenMode(prev => !prev)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 'z') {
        const activeEl = document.activeElement
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.getAttribute('contenteditable') === 'true')) {
          return
        }
        setZenMode(prev => !prev)
      }
    }

    window.addEventListener('ai-limit-reached', handleLimitReached)
    window.addEventListener('toggle-zen-mode', handleToggleZen)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('ai-limit-reached', handleLimitReached)
      window.removeEventListener('toggle-zen-mode', handleToggleZen)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const isMainPage = ['/dashboard', '/admin', '/manager'].includes(location.pathname)

  return (
    <div className="h-screen flex overflow-hidden bg-[var(--color-bg)]">
      {!zenMode && <Sidebar />}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {!zenMode && <TopNav />}
        <main className="flex-1 overflow-y-auto p-6 relative">
          {zenMode && (
            <button
              onClick={() => setZenMode(false)}
              className="absolute top-4 right-4 z-50 px-3 py-1.5 bg-[#FF6B00] hover:bg-orange-600 text-white text-[10px] font-black uppercase rounded-lg shadow-md transition no-print cursor-pointer"
            >
              Thoát Chế độ Zen (Shift + Z)
            </button>
          )}
          <div className="container mx-auto">
            {!isMainPage && (
              <button
                onClick={() => navigate(-1)}
                className="mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-gray-500 hover:text-white hover:bg-gray-800/60 transition text-xs font-bold border border-gray-150 dark:border-gray-800 hover:shadow-sm no-print"
              >
                <ArrowLeft className="w-4 h-4" /> Quay lại
              </button>
            )}
            <Outlet />
          </div>
        </main>
      </div>

      {/* AI Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4 backdrop-blur-md">
          <div className="bg-gradient-to-br from-[#13131C] to-[#0B0B0F] border border-orange-500/30 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative space-y-6 text-center animate-fadeIn">
            
            {/* Close */}
            <button 
              onClick={() => setShowLimitModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#FF6B00]">
              <Crown className="w-8 h-8 animate-pulse" />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white flex items-center justify-center gap-1.5">
                <Sparkles className="w-5 h-5 text-[#FF6B00]" />
                Mở khóa Premium
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed px-2">
                {modalMessage}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5">
              <button 
                onClick={() => {
                  setShowLimitModal(false)
                  navigate('/pricing')
                }}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-[#FF6B00] text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-orange-500/20 hover:scale-[1.02] active:scale-[1] transition flex items-center justify-center gap-1.5"
              >
                <Zap className="w-4 h-4 text-white" />
                Nâng cấp Premium
              </button>
              <button 
                onClick={() => setShowLimitModal(false)}
                className="w-full py-3 border border-gray-800 text-gray-400 hover:text-white text-xs font-bold rounded-xl hover:bg-white/5 transition"
              >
                Để sau
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Global Utilities */}
      <CommandPalette />
      <FloatingAiCopilot />
    </div>
  )
}
