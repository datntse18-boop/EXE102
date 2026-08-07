import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LogOut,
  Menu,
  Sparkles,
  Shield,
  User,
  Users,
  ChevronDown,
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  Clock3,
  FileSpreadsheet,
  Settings,
  Layers,
  CreditCard,
  TrendingUp,
  Inbox,
  CalendarDays,
  DollarSign
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { teamService } from '../../services/apiServices'
import AiConfigModal from './AiConfigModal'

interface SidebarItem {
  to: string
  label: string
  icon: React.ReactNode
  end?: boolean
}

interface SidebarCategory {
  id: string
  label: string
  icon: React.ReactNode
  items: SidebarItem[]
}

export default function Sidebar() {
  const { role, logout, user } = useAuth()
  const [isOpen, setIsOpen] = useState(true)
  const [isTeamLeader, setIsTeamLeader] = useState(false)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    overview: true,
    finance: true,
    billing: true,
    ideation: true,
    workspace: true,
    mentorship: true,
    community: true,
    grading: true,
    admin_tools: true
  })

  useEffect(() => {
    const checkLeader = async () => {
      if (user && role === 'member') {
        try {
          const teamsData = await teamService.getTeams()
          const led = teamsData.some((t: any) => t.leaderId === user.id)
          setIsTeamLeader(led)
        } catch (err) {
          console.error(err)
        }
      }
    }
    checkLeader()
  }, [user, role])

  const toggleCategory = (catId: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }))
  }

  const getSidebarData = (): SidebarCategory[] => {
    if (role === 'supervisor') {
      return [
        {
          id: 'finance',
          label: 'Tài chính',
          icon: <DollarSign size={14} />,
          items: [
            { to: '/admin/revenue', label: 'Báo cáo doanh thu', icon: <TrendingUp size={14} /> },
            { to: '/admin/payments', label: 'Lịch sử giao dịch', icon: <Clock3 size={14} /> }
          ]
        }
      ]
    }

    if (role === 'member') {
      return [
        {
          id: 'overview',
          label: 'Bảng điều khiển',
          icon: <LayoutDashboard size={14} />,
          items: [
            { to: '/dashboard', label: 'Bàn làm việc', icon: <Layers size={14} />, end: true },
            { to: '/profile', label: 'Trang cá nhân', icon: <User size={14} /> }
          ]
        },
        {
          id: 'billing',
          label: 'Tài khoản & Thanh toán',
          icon: <CreditCard size={14} />,
          items: [
            { to: '/pricing', label: 'Nâng cấp gói Premium', icon: <Sparkles size={14} /> },
            { to: '/payment-history', label: 'Lịch sử giao dịch', icon: <Clock3 size={14} /> }
          ]
        },
        {
          id: 'workspace',
          label: 'Không gian làm việc',
          icon: <FolderKanban size={14} />,
          items: [
            { to: '/workspace', label: 'Bảng Kanban', icon: <ClipboardList size={14} /> },
            ...(isTeamLeader ? [{ to: '/team-management', label: 'Quản lý thành viên', icon: <Settings size={14} /> }] : [])
          ]
        }
      ]
    }

    return [] 
  }

  const roleBadge = () => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: <Shield className="w-3 h-3" /> }
      case 'supervisor':
        return { label: 'Supervisor', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <Users className="w-3 h-3" /> }
      default:
        return { label: 'User', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: <User className="w-3 h-3" /> }
    }
  }

  const badge = roleBadge()
  const sidebarData = getSidebarData()

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="md:hidden fixed bottom-4 right-4 z-50 p-3.5 bg-[#FF6B00] text-white rounded-full shadow-xl hover:bg-[#E85A00]">
        <Menu size={20} />
      </button>
      
      <aside className={`fixed md:sticky md:top-0 w-64 border-r border-[#161622] bg-[#0B0B0F] text-gray-300 h-screen flex flex-col z-20 transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-[#161622] flex flex-col gap-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF6B00] flex items-center justify-center"><Sparkles className="text-white w-4 h-4" /></div>
            <span className="text-lg font-black text-white">Study<span className="text-[#FF6B00]">Connect</span></span>
          </div>
          {user && (
            <div className="flex items-center gap-3 bg-white/5 p-2.5 rounded-2xl border border-white/5">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">{user.avatar}</div>
              <div>
                <div className="text-[11px] font-black text-white">{user.name}</div>
                <div className={`flex items-center gap-1 text-[8px] px-2 py-0.5 rounded-full border ${badge.color} mt-1 w-max`}>{badge.icon}{badge.label}</div>
              </div>
            </div>
          )}
        </div>

        <nav className="p-4 space-y-4 flex-1 overflow-y-auto">
          {sidebarData.map(category => (
            <div key={category.id} className="space-y-1">
              <button onClick={() => toggleCategory(category.id)} className="w-full flex items-center justify-between text-[10px] font-bold uppercase py-1.5 px-3 rounded-lg hover:text-white">
                <span className="flex items-center gap-2">{category.icon}{category.label}</span>
                <ChevronDown size={12} className={`transform ${openCategories[category.id] ? 'rotate-180' : ''}`} />
              </button>
              {openCategories[category.id] && (
                <div className="pl-2 border-l border-[#161622] ml-4 space-y-1">
                  {category.items.map(item => (
                    <NavLink key={item.to} to={item.to} end={item.end} className={({isActive}) => `flex items-center gap-3 px-4 py-2.5 rounded-xl text-[11px] font-bold ${isActive ? 'bg-orange-500/10 text-white border-l-2 border-[#FF6B00]' : 'text-gray-400 hover:text-white'}`}>
                      {item.icon}<span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-[#161622]">
          <button onClick={() => setIsAiModalOpen(true)} className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl text-[11px] font-bold bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 mb-2.5">
            <Sparkles size={14} /> Cấu hình Gemini AI
          </button>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl text-[11px] font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20">
            <LogOut size={14} /> Đăng xuất
          </button>
        </div>
        <AiConfigModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
      </aside>
    </>
  )
}