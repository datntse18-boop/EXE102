import { useState, useEffect } from 'react'
import { aiService } from '../../services/apiServices'
import {
  X,
  Key,
  Database,
  Chrome,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Loader2,
  Lock
} from 'lucide-react'

interface AiConfigModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AiConfigModal({ isOpen, onClose }: AiConfigModalProps) {
  const [apiKey, setApiKey] = useState('')
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [savingLocal, setSavingLocal] = useState(false)
  const [savingServer, setSavingServer] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('gemini_api_key') || ''
      setApiKey(stored)
      setStatus('idle')
      setErrorMessage('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setStatus('error')
      setErrorMessage('Vui lòng nhập API Key trước khi kiểm tra.')
      return
    }

    setStatus('testing')
    setErrorMessage('')

    // Set temporarily in localStorage so the axios interceptor picks it up for the test call
    const originalKey = localStorage.getItem('gemini_api_key')
    localStorage.setItem('gemini_api_key', apiKey.trim())

    try {
      const isOk = await aiService.testKeyOnServer()
      if (isOk) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMessage('Yêu cầu gửi đi thành công nhưng AI trả về dữ liệu trống. Kiểm tra lại hạn mức.')
      }
    } catch (err: any) {
      console.error(err)
      setStatus('error')
      setErrorMessage(err.response?.data?.message || 'Lỗi kết nối. Khóa API không hợp lệ hoặc hết hạn mức Quota.')
      // Restore original key if test fails
      if (originalKey) {
        localStorage.setItem('gemini_api_key', originalKey)
      } else {
        localStorage.removeItem('gemini_api_key')
      }
    }
  }

  const handleSaveLocal = () => {
    setSavingLocal(true)
    setTimeout(() => {
      localStorage.setItem('gemini_api_key', apiKey.trim())
      setSavingLocal(false)
      alert('Đã lưu khóa API thành công trên trình duyệt này!')
      onClose()
    }, 500)
  }

  const handleSaveServer = async () => {
    if (!apiKey.trim()) {
      alert('Vui lòng nhập API Key trước khi đồng bộ lên máy chủ.')
      return
    }
    setSavingServer(true)
    try {
      // Sync on server
      await aiService.saveKeyOnServer(apiKey.trim())
      // Also save locally
      localStorage.setItem('gemini_api_key', apiKey.trim())
      alert('Đã đồng bộ và lưu khóa API thành công lên Hệ thống máy chủ!')
      onClose()
    } catch (err: any) {
      console.error(err)
      alert('Lỗi khi đồng bộ lên Server: ' + (err.response?.data?.message || err.message))
    } finally {
      setSavingServer(false)
    }
  }

  const handleClearKey = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khóa API đã lưu?')) {
      localStorage.removeItem('gemini_api_key')
      setApiKey('')
      setStatus('idle')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-[#0B0B0F] border border-[#161622] text-gray-300 rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-scaleUp relative">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 border-b border-[#161622] pb-4">
          <div className="p-2.5 bg-orange-500/10 text-[#FF6B00] rounded-2xl border border-orange-500/20">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Cấu hình Google Gemini AI</h3>
            <p className="text-[10px] text-gray-450 mt-1 font-medium">
              Nhập API Key để sử dụng các tính năng AI thông minh ngay lập tức
            </p>
          </div>
        </div>

        {/* Instruction Link */}
        <div className="p-3.5 bg-orange-500/5 border border-orange-500/10 rounded-2xl mb-5 text-[11px] leading-relaxed">
          <div className="flex items-start gap-2.5">
            <HelpCircle className="w-4.5 h-4.5 text-[#FF6B00] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">Bạn chưa có khóa API?</span> Khóa Gemini API được cung cấp hoàn toàn miễn phí bởi Google dành cho nhà phát triển.
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[#FF6B00] hover:underline font-bold block mt-1.5 cursor-pointer"
              >
                👉 Nhấp vào đây để lấy khóa API miễn phí từ Google AI Studio
              </a>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
              Gemini API Key (Google AI Studio)
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full text-xs bg-[#12121A] border border-[#1E1E2F] text-white rounded-2xl px-4 py-3.5 pl-10 focus:outline-none focus:border-[#FF6B00] font-mono tracking-wider"
              />
              <Lock className="w-4 h-4 text-gray-550 absolute left-3.5 top-4" />
            </div>
          </div>

          {/* Test Status Banner */}
          {status === 'testing' && (
            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-[#FF6B00]" />
              <span className="text-gray-400 font-medium">Đang gửi yêu cầu kiểm tra thử kết nối AI...</span>
            </div>
          )}

          {status === 'success' && (
            <div className="p-3 bg-green-500/10 border border-green-500/25 rounded-2xl flex items-center gap-2.5 text-xs text-green-400 font-semibold">
              <CheckCircle className="w-4.5 h-4.5 shrink-0" />
              <span>Kết nối thành công! Khóa API đang hoạt động tốt trên hệ thống.</span>
            </div>
          )}

          {status === 'error' && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-red-400 leading-normal">
              <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">Kết nối thất bại</span>
                <span className="text-red-300/80">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            {/* Test Connection Button */}
            <button
              type="button"
              onClick={handleTestKey}
              disabled={status === 'testing'}
              className="px-4 py-3 border border-[#1E1E2F] hover:border-orange-500/30 hover:bg-orange-500/5 text-gray-300 hover:text-white rounded-2xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              Kiểm tra Key (Test)
            </button>

            <div className="flex-1" />

            {/* Clear key if saved */}
            {localStorage.getItem('gemini_api_key') && (
              <button
                type="button"
                onClick={handleClearKey}
                className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-350 border border-red-500/20 rounded-2xl text-[11px] font-bold transition"
              >
                Xóa Key
              </button>
            )}

            {/* Save Client-only */}
            <button
              type="button"
              onClick={handleSaveLocal}
              disabled={savingLocal || savingServer}
              className="px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl text-[11px] font-bold transition flex items-center justify-center gap-1.5"
            >
              {savingLocal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Chrome className="w-3.5 h-3.5" />}
              Lưu trình duyệt này
            </button>

            {/* Save Server-wide */}
            <button
              type="button"
              onClick={handleSaveServer}
              disabled={savingLocal || savingServer}
              className="px-5 py-3 bg-[#FF6B00] hover:bg-[#E85A00] text-white rounded-2xl text-[11px] font-bold transition shadow-lg shadow-orange-500/10 flex items-center justify-center gap-1.5"
            >
              {savingServer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
              Đồng bộ lên Server
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
