import { useEffect, useState } from 'react'
import Card from '../../components/cards/Card'
import { projectService } from '../../services/apiServices'

const categories = ['All', 'Education', 'Healthcare', 'Environment', 'Technology', 'Smart Cities', 'Sustainability']

export default function Opportunities() {
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
    return <div className="p-8 text-center text-gray-500">Đang tải danh sách cơ hội dự án...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Opportunities</h1>
      <p className="text-sm text-gray-500 mb-6">Khám phá các dự án khởi nghiệp tiềm năng đang tuyển thành viên hoặc đối tác</p>

      {/* Category filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition ${selectedCategory === c ? 'bg-[#FF6B00] border-[#FF6B00] text-white' : 'bg-white hover:bg-gray-50 text-gray-600'}`}
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
              <Card key={p.id} className="border-t-4 border-[#FF6B00] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-[#FF6B00] bg-[#FFF4E8] px-2 py-0.5 rounded capitalize">
                      {p.status}
                    </span>
                    <span className="text-[10px] text-gray-400">Milestone {p.milestone}</span>
                  </div>
                  
                  <h3 className="font-bold text-lg text-gray-800 mb-2">{p.name}</h3>
                  <p className="text-xs text-gray-600 mb-4">{p.description || 'Không có mô tả chi tiết'}</p>
                  
                  <div className="space-y-2 border-t pt-3 mb-4">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Thuộc nhóm:</span>
                      <strong className="text-gray-700">{p.team?.name || 'N/A'}</strong>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Số lượng công việc:</span>
                      <strong className="text-gray-700">{p._count?.tasks || 0} tasks</strong>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Tiến độ hiện tại:</span>
                      <strong className="text-gray-700">{p.progress}%</strong>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 border-t pt-3 justify-end mt-2">
                  <button className="px-3 py-1.5 rounded bg-[#FF6B00] text-white hover:bg-[#E85A00] text-xs font-semibold transition">
                    Xem dự án
                  </button>
                  <button
                    onClick={() => toggleBookmark(p.id)}
                    className={`px-3 py-1.5 rounded border text-xs font-semibold transition ${isBookmarked ? 'bg-orange-50 text-[#FF6B00] border-[#FF6B00]' : 'hover:bg-gray-50 text-gray-600'}`}
                  >
                    {isBookmarked ? '★ Đã lưu' : '☆ Lưu'}
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="text-center text-gray-500 py-12">
          Không tìm thấy dự án nào thuộc chủ đề "{selectedCategory}".
        </Card>
      )}
    </div>
  )
}
