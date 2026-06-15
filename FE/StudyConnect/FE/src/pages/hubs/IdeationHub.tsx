import { useSearchParams } from 'react-router-dom'
import IdeaGenerator from '../member/IdeaGenerator'
import TeamMatching from '../member/TeamMatching'
import Opportunities from '../member/Opportunities'
import Syllabus from '../member/Syllabus'
import { Lightbulb, Users, Search, BookOpen } from 'lucide-react'

export default function IdeationHub() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'idea'

  const tabs = [
    { id: 'idea', label: 'Ý tưởng AI', icon: <Lightbulb size={14} />, component: <IdeaGenerator /> },
    { id: 'matching', label: 'Ghép nhóm AI', icon: <Users size={14} />, component: <TeamMatching /> },
    { id: 'opportunities', label: 'Cơ hội dự án', icon: <Search size={14} />, component: <Opportunities /> },
    { id: 'syllabus', label: 'Đề cương môn học', icon: <BookOpen size={14} />, component: <Syllabus /> },
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
