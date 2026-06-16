import { useSearchParams } from 'react-router-dom'
import CanvasGenerator from '../member/CanvasGenerator'
import CustomerValidation from '../member/CustomerValidation'
import FinancialHub from '../member/FinancialHub'
import SlideOutline from '../member/SlideOutline'
import WeeklyCheckin from '../member/WeeklyCheckin'
import Analytics from '../member/Analytics'
import StartupCertificate from '../member/StartupCertificate'
import { LayoutGrid, ClipboardList, TrendingUp, FileText, CalendarDays, FilePieChart, Award } from 'lucide-react'

export default function StartupToolsHub() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'canvas'

  const tabs = [
    { id: 'canvas', label: 'Mô hình Canvas AI', icon: <LayoutGrid size={14} />, component: <CanvasGenerator /> },
    { id: 'validation', label: 'Khảo sát khách hàng', icon: <ClipboardList size={14} />, component: <CustomerValidation /> },
    { id: 'financial', label: 'Kế hoạch tài chính', icon: <TrendingUp size={14} />, component: <FinancialHub /> },
    { id: 'slide', label: 'Dàn ý Slide AI', icon: <FileText size={14} />, component: <SlideOutline /> },
    { id: 'weekly', label: 'Báo cáo tuần', icon: <CalendarDays size={14} />, component: <WeeklyCheckin /> },
    { id: 'analytics', label: 'Phân tích tiến độ', icon: <FilePieChart size={14} />, component: <Analytics /> },
    { id: 'certificate', label: 'Chứng nhận Khởi nghiệp', icon: <Award size={14} />, component: <StartupCertificate /> },
  ]

  const activeTabObj = tabs.find(t => t.id === activeTab) || tabs[0]

  return (
    <div className="space-y-6">
      {/* Tabs navigation bar */}
      <div className="flex border-b border-[#161622] bg-[#0B0B0F]/40 p-1 rounded-2xl overflow-x-auto scrollbar-none">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSearchParams({ tab: tab.id })}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-black transition-all rounded-xl whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-orange-600/20 to-orange-500/10 border-b-2 border-[#FF6B00] text-white shadow-[0_0_15px_rgba(255,107,0,0.08)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content panel */}
      <div className="p-1 animate-fadeIn">
        {activeTabObj.component}
      </div>
    </div>
  )
}
