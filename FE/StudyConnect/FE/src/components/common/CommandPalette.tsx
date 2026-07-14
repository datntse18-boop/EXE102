import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Compass, Shield, CreditCard, Award, MessageSquare, ClipboardList, TrendingUp, CalendarDays, Key } from 'lucide-react'
import { DollarSign } from "lucide-react"

interface CommandItem {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  path: string
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const commands: CommandItem[] = [
    { id: 'dashboard', title: 'Bàn làm việc (Dashboard)', subtitle: 'Quản lý dự án, tasks và OKRs của nhóm', icon: <Compass size={14} />, path: '/dashboard' },
    { id: 'profile', title: 'Trang cá nhân (Profile)', subtitle: 'Xem huy hiệu năng lực, gửi góp ý phản hồi', icon: <Award size={14} />, path: '/profile' },
    { id: 'irl', title: 'Đo lường IRL & Chỉ số Tài chính', subtitle: ' Steve Blank IRL checklist và tính toán CAC, LTV, Runway', icon: <TrendingUp size={14} />, path: '/startup-tools?tab=irl' },
    { id: 'valuation', title: 'Định giá Startup & Chia Cổ phần', subtitle: 'Phương pháp Berkus định giá và phân chia cổ phần đồng sáng lập', icon: <DollarSign size={14} />, path: '/startup-tools?tab=valuation' },
    { id: 'canvas', title: 'Mô hình Canvas AI', subtitle: 'Khởi tạo mô hình kinh doanh tinh gọn bằng AI', icon: <Compass size={14} />, path: '/startup-tools?tab=canvas' },
    { id: 'pitching', title: 'AI Pitch Speech Coach (Luyện nói)', subtitle: 'Ghi âm phân tích từ đệm và vận tốc WPM', icon: <MessageSquare size={14} />, path: '/pitch-deck-advisor?tab=speech' },
    { id: 'demoday', title: 'AI Virtual Demo Day', subtitle: 'Thuyết trình gọi vốn thử trước ban giám khảo ảo', icon: <MessageSquare size={14} />, path: '/pitch-deck-advisor?tab=demoday' },
    { id: 'verify', title: 'Xác thực Chứng nhận Số', subtitle: 'Cổng công khai kiểm tra chữ ký mật mã chứng nhận tốt nghiệp', icon: <Key size={14} />, path: '/verify-certificate' },
    { id: 'weekly', title: 'Báo cáo tuần', subtitle: 'Xem và cập nhật tiến độ tuần của nhóm', icon: <CalendarDays size={14} />, path: '/startup-tools?tab=weekly' },
    { id: 'kanban', title: 'Bảng Kanban Workspace', subtitle: 'Kéo thả quản lý thẻ công việc thành viên', icon: <ClipboardList size={14} />, path: '/workspace' },
    { id: 'admin_users', title: 'Quản lý người dùng (Admin)', subtitle: 'Cấp quyền, kích hoạt hoặc đình chỉ tài khoản', icon: <Shield size={14} />, path: '/admin/users' },
    { id: 'admin_feedbacks', title: 'Quản lý Góp ý & Ý kiến (Admin)', subtitle: 'Xem danh sách và trả lời ý kiến học viên', icon: <MessageSquare size={14} />, path: '/admin/feedbacks' },
    { id: 'admin_revenue', title: 'Báo cáo Doanh thu hệ thống (Admin)', subtitle: 'Xem biểu đồ tài chính thực tế và tần suất dịch vụ', icon: <TrendingUp size={14} />, path: '/admin/reports' },
    { id: 'zen', title: 'Bật/Tắt Chế độ tập trung (Zen Mode)', subtitle: 'Ẩn thanh Sidebar và Topbar để phóng to màn hình làm việc (Shift + Z)', icon: <Compass size={14} />, path: '' }
  ]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      } else if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    const handleOpenEvent = () => setIsOpen(true)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-command-palette', handleOpenEvent)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-command-palette', handleOpenEvent)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const filtered = commands.filter(cmd =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.subtitle.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = (item: CommandItem) => {
    if (item.id === 'zen') {
      window.dispatchEvent(new CustomEvent('toggle-zen-mode'))
    } else {
      navigate(item.path)
    }
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex])
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-start justify-center p-4 pt-20 animate-fadeIn" onClick={() => setIsOpen(false)}>
      <div 
        className="w-full max-w-lg bg-gradient-to-br from-[#13131C] to-[#0A0A0D] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Search header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-850">
          <Search className="w-4 h-4 text-[#FF6B00]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm tính năng hoặc hành động..."
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-0 text-xs text-white focus:outline-none focus:ring-0 placeholder-gray-600"
          />
          <span className="text-[9px] bg-gray-800 text-gray-500 px-2 py-0.5 rounded border border-gray-700 uppercase font-bold shrink-0">
            Esc
          </span>
        </div>

        {/* Commands list */}
        <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-550 text-xs font-semibold">
              Không tìm thấy lệnh nào phù hợp.
            </div>
          ) : (
            filtered.map((cmd, idx) => (
              <div
                key={cmd.id}
                onClick={() => handleSelect(cmd)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl cursor-pointer transition duration-150 ${
                  selectedIndex === idx
                    ? 'bg-orange-500/10 border border-orange-500/20 text-[#FF6B00]'
                    : 'border border-transparent text-gray-400 hover:text-gray-250'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${selectedIndex === idx ? 'bg-[#FF6B00] text-white' : 'bg-gray-800 text-gray-400'}`}>
                  {cmd.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className={`text-xs font-bold ${selectedIndex === idx ? 'text-[#FF6B00]' : 'text-white'}`}>
                    {cmd.title}
                  </h4>
                  <p className="text-[9px] text-gray-500 font-medium truncate mt-0.5">{cmd.subtitle}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
