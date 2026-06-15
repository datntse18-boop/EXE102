import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/cards/Card'
import { projectService } from '../../services/apiServices'
import { Sparkles, Star, Folder, Users, ClipboardList, TrendingUp } from 'lucide-react'

const categories = ['All', 'Education', 'Healthcare', 'Environment', 'Technology', 'Smart Cities', 'Sustainability']

export default function Opportunities() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [bookmarks, setBookmarks] = useState<string[]>([])

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await projectService.getProjects()
        setProjects(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    // Load bookmarks from localStorage
    const savedBookmarks = localStorage.getItem('bookmarkedProjects')
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks))
    }

    loadProjects()
  }, [])

  const toggleBookmark = (id: string) => {
    let updated: string[]
    if (bookmarks.includes(id)) {
      updated = bookmarks.filter(b => b !== id)
    } else {
      updated = [...bookmarks, id]
    }
    setBookmarks(updated)
    localStorage.setItem('bookmarkedProjects', JSON.stringify(updated))
  }

  // Filter projects by category name match in title/description (simulated category)
  const filteredProjects = projects.filter(p => {
    if (selectedCategory === 'All') return true
    const text = `${p.name} ${p.description}`.toLowerCase()
    return text.includes(selectedCategory.toLowerCase())
  })

  if (loading) {
    return (
      <div className="flex justify-center p-20 text-gray-500">
        <span className="animate-spin inline-block w-6 h-6 border-2 border-[#FF6B00] border-t-transparent rounded-full mr-2"></span>
        Đang tải danh sách cơ hội dự án...
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1B1B22] via-[#2F2F3B] to-[#1B1B22] text-white rounded-3xl p-8 shadow-xl border border-gray-800">
        <div className="relative z-10 max-w-xl">
          <span className="bg-[#FF6B00] px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm flex items-center gap-1.5 w-max">
            <Sparkles className="w-3.5 h-3.5" />
            Co-founder & Project Finder
          </span>
          <h1 className="text-3xl font-black mt-4 tracking-tight leading-none text-white">
            Cơ Hội Dự Án Khởi Nghiệp 🚀
          </h1>
          <p className="text-sm text-gray-300 mt-3 font-medium opacity-90 leading-relaxed">
            Khám phá các dự án khởi nghiệp tiềm năng đang tuyển thành viên hoặc đối tác trong học kỳ. Lưu lại các dự án bạn quan tâm để kết nối.
          </p>
        </div>
        <div className="absolute right-8 bottom-0 top-0 opacity-10 w-1/4 flex items-center justify-center pointer-events-none">
          <span className="text-9xl">🚀</span>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            className={`px-4 py-2 rounded-full border text-xs font-black transition ${
              selectedCategory === c 
                ? 'bg-[#FF6B00] border-[#FF6B00] text-white shadow-md' 
                : 'bg-white dark:bg-[#13131C] hover:bg-gray-50 dark:hover:bg-gray-800/40 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filteredProjects.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-6">
          {filteredProjects.map((p) => {
            const isBookmarked = bookmarks.includes(p.id)
            return (
              <Card key={p.id} className="border-t-4 border-[#FF6B00] flex flex-col justify-between h-full bg-white dark:bg-[#13131C] border-gray-100 dark:border-gray-850">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#FF6B00] bg-[#FFF4E8] dark:bg-orange-950/20 px-2.5 py-1 rounded">
                      {p.status}
                    </span>
                    <span className="text-[10px] font-bold text-gray-450 dark:text-gray-500">Milestone {p.milestone}</span>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-base text-gray-800 dark:text-gray-200 mb-1.5">{p.name}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed line-clamp-3">
                      {p.description || 'Không có mô tả chi tiết'}
                    </p>
                  </div>
                  
                  <div className="space-y-2.5 border-t dark:border-gray-800 pt-3">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-550 dark:text-gray-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-gray-400" /> Nhóm:
                      </span>
                      <strong className="text-gray-700 dark:text-gray-300">{p.team?.name || 'N/A'}</strong>
                    </div>
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-550 dark:text-gray-400 flex items-center gap-1">
                        <ClipboardList className="w-3.5 h-3.5 text-gray-400" /> Nhiệm vụ:
                      </span>
                      <strong className="text-gray-700 dark:text-gray-300">{p._count?.tasks || 0} tasks</strong>
                    </div>
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-550 dark:text-gray-400 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-[#FF6B00]" /> Tiến độ:
                      </span>
                      <strong className="text-gray-700 dark:text-gray-300">{p.progress}%</strong>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 border-t dark:border-gray-800 pt-3 justify-end mt-4">
                  <button 
                    onClick={() => navigate('/project-showcase')}
                    className="px-3.5 py-1.5 rounded-xl bg-[#FF6B00] text-white hover:bg-[#E85A00] text-xs font-black uppercase tracking-wider shadow-sm transition"
                  >
                    Xem dự án
                  </button>
                  <button
                    onClick={() => toggleBookmark(p.id)}
                    className={`px-3.5 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition flex items-center gap-1 ${
                      isBookmarked 
                        ? 'bg-orange-50 dark:bg-orange-950/20 text-[#FF6B00] border-[#FF6B00]' 
                        : 'bg-white dark:bg-transparent text-gray-600 dark:text-gray-450 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/20'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-orange-500 text-orange-500' : ''}`} />
                    {isBookmarked ? 'Đã lưu' : 'Lưu'}
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="text-center text-gray-500 dark:text-gray-450 py-12 text-xs font-bold bg-white dark:bg-[#13131C] border-gray-100 dark:border-gray-800">
          Không tìm thấy dự án nào thuộc chủ đề &quot;{selectedCategory}&quot;.
        </Card>
      )}
    </div>
  )
}
