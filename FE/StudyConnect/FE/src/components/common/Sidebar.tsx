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
  GraduationCap,
  MessagesSquare,
  Lightbulb,
  ClipboardList,
  CalendarDays,
  Clock3,
  Award,
  FileSpreadsheet,
  Search,
  Eye,
  FilePieChart,
  BookOpen,
  Settings,
  Briefcase,
  Layers,
  CreditCard,
  TrendingUp,
  Inbox,
  FileText
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
    ideation: true,
    workspace: true,
    mentorship: true,
    community: true,
    grading: true,
    admin_tools: true
  })

  // Dynamically check if the student is a team leader
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

  // Categories definition depending on role
  const getSidebarData = (): SidebarCategory[] => {
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
          id: 'ideation',
          label: 'Ý tưởng & Kết nối',
          icon: <Lightbulb size={14} />,
          items: [
            { to: '/idea-generator', label: 'Ý tưởng AI', icon: <Lightbulb size={14} /> },
            { to: '/team-matching', label: 'Ghép nhóm AI', icon: <Users size={14} /> },
            { to: '/opportunities', label: 'Cơ hội dự án', icon: <Search size={14} /> },
            { to: '/syllabus', label: 'Đề cương môn học', icon: <BookOpen size={14} /> }
          ]
        },
        {
          id: 'workspace',
          label: 'Không gian làm việc',
          icon: <FolderKanban size={14} />,
          items: [
            { to: '/workspace', label: 'Bảng Kanban', icon: <ClipboardList size={14} /> },
            { to: '/canvas-generator', label: 'Mô hình Canvas AI', icon: <FolderKanban size={14} /> },
            { to: '/customer-validation', label: 'Khảo sát khách hàng', icon: <Users size={14} /> },
            { to: '/financial-hub', label: 'Kế hoạch tài chính', icon: <TrendingUp size={14} /> },
            { to: '/slide-outline', label: 'Dàn ý Slide AI', icon: <FileText size={14} /> },
            { to: '/weekly-checkin', label: 'Báo cáo tuần', icon: <CalendarDays size={14} /> },
            { to: '/analytics', label: 'Phân tích dự án', icon: <FilePieChart size={14} /> },
            ...(isTeamLeader ? [{ to: '/team-management', label: 'Quản lý thành viên', icon: <Settings size={14} /> }] : [])
          ]
        },
        {
          id: 'mentorship',
          label: 'Cố vấn & Đánh giá',
          icon: <GraduationCap size={14} />,
          items: [
            { to: '/mentorship-booking', label: 'Đặt lịch cố vấn', icon: <Clock3 size={14} /> },
            { to: '/peer-evaluation', label: 'Đánh giá đồng đội', icon: <Award size={14} /> },
            { to: '/pitch-deck-advisor', label: 'Cố vấn Pitch Deck AI', icon: <Sparkles size={14} /> },
            { to: '/gradebook', label: 'Sổ điểm của nhóm', icon: <FileSpreadsheet size={14} /> }
          ]
        },
        {
          id: 'community',
          label: 'Cộng đồng',
          icon: <MessagesSquare size={14} />,
          items: [
            { to: '/job-board', label: 'Bảng tuyển dụng', icon: <Briefcase size={14} /> },
            { to: '/project-showcase', label: 'Trưng bày dự án', icon: <Eye size={14} /> }
          ]
        }
      ]
    }

    if (role === 'manager') {
      return [
        {
          id: 'overview',
          label: 'Mentor Hub',
          icon: <LayoutDashboard size={14} />,
          items: [
            { to: '/manager', label: 'Bàn làm việc', icon: <Layers size={14} />, end: true },
            { to: '/profile', label: 'Trang cá nhân', icon: <User size={14} /> }
          ]
        },
        {
          id: 'grading',
          label: 'Giám sát & Đánh giá',
          icon: <GraduationCap size={14} />,
          items: [
            { to: '/manager/teams', label: 'Giám sát nhóm', icon: <Eye size={14} /> },
            { to: '/weekly-checkin', label: 'Báo cáo tuần của nhóm', icon: <CalendarDays size={14} /> },
            { to: '/mentorship-booking', label: 'Mở lịch hẹn cố vấn', icon: <Clock3 size={14} /> },
            { to: '/gradebook', label: 'Sổ điểm Lớp học', icon: <FileSpreadsheet size={14} /> },
            { to: '/manager/invitations', label: 'Quản lý yêu cầu', icon: <Inbox size={14} /> }
          ]
        },
        {
          id: 'workspace',
          label: 'Tài nguyên chung',
          icon: <FolderKanban size={14} />,
          items: [
            { to: '/project-showcase', label: 'Trưng bày dự án', icon: <Eye size={14} /> },
            { to: '/syllabus', label: 'Đề cương môn học', icon: <BookOpen size={14} /> }
          ]
        }
      ]
    }

    if (role === 'leader') {
      return [
        {
          id: 'overview',
          label: 'Overview',
          icon: <LayoutDashboard size={14} />,
          items: [
            { to: '/dashboard', label: 'Bàn chỉ huy Quản lý', icon: <Layers size={14} />, end: true },
            { to: '/profile', label: 'Trang cá nhân', icon: <User size={14} /> }
          ]
        },
        {
          id: 'grading',
          label: 'Giám sát toàn khoa',
          icon: <GraduationCap size={14} />,
          items: [
            { to: '/gradebook', label: 'Sổ điểm toàn khoa', icon: <FileSpreadsheet size={14} /> },
            { to: '/weekly-checkin', label: 'Báo cáo tuần toàn khoa', icon: <CalendarDays size={14} /> },
            { to: '/project-showcase', label: 'Trưng bày dự án', icon: <Eye size={14} /> },
            { to: '/syllabus', label: 'Đề cương môn học', icon: <BookOpen size={14} /> }
          ]
        }
      ]
    }

    if (role === 'admin') {
      return [
        {
          id: 'overview',
          label: 'Overview',
          icon: <LayoutDashboard size={14} />,
          items: [
            { to: '/admin', label: 'Tổng đài Admin', icon: <Layers size={14} />, end: true },
            { to: '/profile', label: 'Trang cá nhân', icon: <User size={14} /> }
          ]
        },
        {
          id: 'admin_tools',
          label: 'Quản trị hệ thống',
          icon: <Shield size={14} />,
          items: [
            { to: '/admin/users', label: 'Quản lý người dùng', icon: <Users size={14} /> },
            { to: '/admin/subscriptions', label: 'Gói dịch vụ', icon: <CreditCard size={14} /> },
            { to: '/admin/payments', label: 'Dòng tiền giao dịch', icon: <TrendingUp size={14} /> },
            { to: '/admin/reports', label: 'Báo cáo hệ thống', icon: <FilePieChart size={14} /> }
          ]
        },
        {
          id: 'workspace',
          label: 'Quản lý chung',
          icon: <FolderKanban size={14} />,
          items: [
            { to: '/gradebook', label: 'Sổ điểm Hệ thống', icon: <FileSpreadsheet size={14} /> },
            { to: '/job-board', label: 'Quản lý tuyển dụng', icon: <Briefcase size={14} /> },
            { to: '/project-showcase', label: 'Trưng bày dự án', icon: <Eye size={14} /> }
          ]
        }
      ]
    }

    return []
  }

  const roleBadge = () => {
    switch (role) {
      case 'admin':
        return { label: 'Admin (IT)', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: <Shield className="w-3 h-3" /> }
      case 'manager':
        return { label: 'Giảng viên', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <Users className="w-3 h-3" /> }
      case 'leader':
        return { label: 'Quản lý (Dean)', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <Sparkles className="w-3 h-3" /> }
      default:
        return { label: isTeamLeader ? 'Trưởng nhóm' : 'Sinh viên', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: <User className="w-3 h-3" /> }
    }
  }

  const badge = roleBadge()
  const sidebarData = getSidebarData()

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="md:hidden fixed bottom-4 right-4 z-50 p-3.5 bg-[#FF6B00] text-white rounded-full shadow-xl transition hover:bg-[#E85A00]"
      >
        <Menu size={20} />
      </button>
      
      {/* Sidebar Main */}
      <aside className={`fixed md:relative w-64 border-r border-[#161622] bg-[#0B0B0F] text-gray-300 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 h-screen flex flex-col z-20 shadow-[4px_0_20px_rgba(0,0,0,0.3)]`}>
        
        {/* Logo Section */}
        <div className="p-6 border-b border-[#161622] flex flex-col gap-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF801A] text-white shadow-md shadow-orange-500/10">
              <span className="text-sm">🚀</span>
            </div>
            <span className="text-lg font-black text-white tracking-tight">
              Study<span className="text-[#FF6B00]">Connect</span>
            </span>
          </div>
          {user && (
            <div className="flex items-center gap-3 bg-white/5 p-2.5 rounded-2xl border border-white/5 shadow-inner">
              <div className="text-3xl bg-white/10 w-11 h-11 rounded-xl flex items-center justify-center border border-white/10">
                {user.avatar || '👤'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-black text-white truncate">{user.name}</div>
                <div className={`flex items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded-full border ${badge.color} mt-1 w-max uppercase tracking-wider`}>
                  {badge.icon}
                  {badge.label}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Accordion */}
        <nav className="p-4 space-y-4 flex-1 overflow-y-auto pr-2 scrollbar-thin">
          {sidebarData.map(category => {
            const isCatOpen = !!openCategories[category.id]
            return (
              <div key={category.id} className="space-y-1">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between text-gray-500 text-[10px] font-bold uppercase tracking-widest py-1.5 px-3 rounded-lg hover:text-[#FF6B00] hover:bg-white/5 transition duration-200"
                >
                  <span className="flex items-center gap-2">
                    {category.icon}
                    {category.label}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`transform transition-transform duration-300 ${isCatOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Sub items collapsible container */}
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isCatOpen ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="overflow-hidden space-y-1 pl-2 border-l border-[#161622] ml-4">
                    {category.items.map(item => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-200 ${
                            isActive
                              ? 'bg-gradient-to-r from-orange-600/20 to-orange-500/10 border-l-2 border-[#FF6B00] text-white shadow-[0_0_15px_rgba(255,107,0,0.08)]'
                              : 'text-gray-400 hover:bg-white/5 hover:text-white'
                          }`
                        }
                      >
                        <span className="shrink-0">{item.icon}</span>
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-[#161622]">
          <button 
            onClick={() => setIsAiModalOpen(true)} 
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl text-[11px] font-bold bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 hover:text-orange-300 border border-orange-500/15 transition duration-300 shadow-sm mb-2.5"
          >
            <Sparkles size={14} />
            Cấu hình Gemini AI
          </button>
          <button 
            onClick={logout} 
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl text-[11px] font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/15 transition duration-300 shadow-sm"
          >
            <LogOut size={14} />
            Đăng xuất tài khoản
          </button>
        </div>
        <AiConfigModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
      </aside>
    </>
  )
}
