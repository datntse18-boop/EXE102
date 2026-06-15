import { useSearchParams } from 'react-router-dom'
import ProjectShowcase from '../member/ProjectShowcase'
import JobBoard from '../member/JobBoard'
import { Eye, Briefcase } from 'lucide-react'

export default function CommunityHub() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'showcase'

  const tabs = [
    { id: 'showcase', label: 'Trưng bày & Đầu tư', icon: <Eye size={14} />, component: <ProjectShowcase /> },
    { id: 'jobs', label: 'Bảng tuyển dụng', icon: <Briefcase size={14} />, component: <JobBoard /> },
  ]

  const activeTabObj = tabs.find(t => t.id === activeTab) || tabs[0]

  return (
    <div className="space-y-6">
      {/* Tabs navigation bar */}
      <div className="flex border-b border-[#161622] bg-[#0B0B0F]/40 p-1 rounded-2xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSearchParams({ tab: tab.id })}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-black transition-all rounded-xl ${
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
