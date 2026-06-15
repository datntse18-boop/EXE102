import { useState } from 'react'
import { aiService } from '../../services/apiServices'

export default function IdeaGenerator() {
  const [targetUsers, setTargetUsers] = useState('')
  const [problemArea, setProblemArea] = useState('')
  const [technology, setTechnology] = useState('')
  const [idea, setIdea] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await aiService.generateIdea({ targetUsers, problemArea, technology })
      setIdea(result)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, thử lại nhé!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">🤖 AI Idea Generator</h1>
      <p className="text-gray-500 text-sm mb-6">Mô tả ý tưởng của bạn và để AI tổng hợp thành một dự án hoàn chỉnh!</p>

      <form onSubmit={handleGenerate} className="card mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Đối tượng người dùng *</label>
            <input
              placeholder="Ví dụ: Sinh viên đại học"
              value={targetUsers}
              onChange={e => setTargetUsers(e.target.value)}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:border-[#FF6B00]"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Vấn đề cần giải quyết *</label>
            <input
              placeholder="Ví dụ: Khó tìm nhóm làm đồ án"
              value={problemArea}
              onChange={e => setProblemArea(e.target.value)}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:border-[#FF6B00]"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Công nghệ muốn dùng</label>
            <input
              placeholder="Ví dụ: React, Node.js, AI"
              value={technology}
              onChange={e => setTechnology(e.target.value)}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:border-[#FF6B00]"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded bg-[#FF6B00] text-white font-semibold hover:bg-[#E85A00] transition disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? (
              <><span className="animate-spin">⚙️</span> Đang tạo ý tưởng...</>
            ) : (
              <><span>✨</span> Generate Idea</>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 text-red-600 text-sm border border-red-200">{error}</div>
      )}

      {idea && (
        <div className="card border-l-4 border-[#FF6B00] animate-fadeIn">
          {idea.isFallback && (
            <div className="mb-4 p-4 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-2xl text-xs leading-normal">
              ⚠️ <strong>Cảnh báo:</strong> Hệ thống AI của máy chủ chính hiện đang <strong>hết hạn mức (Quota 429)</strong>. Kết quả dưới đây là kết quả giả lập (mock data).
              Để sử dụng <strong>AI thật 100%</strong> ngay lập tức, vui lòng bấm vào nút <strong>"Cấu hình Gemini AI"</strong> ở góc dưới menu bên trái (hoặc trong tab Cố vấn AI 24/7) và dán API Key cá nhân của bạn vào.
            </div>
          )}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800">{idea.name}</h3>
              <span className={`text-xs px-2 py-1 rounded font-medium mt-1 inline-block ${idea.potential === 'High' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                🎯 Tiềm năng: {idea.potential}
              </span>
            </div>
            <span className="text-3xl">💡</span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">🔍 Vấn đề</p>
              <p className="text-gray-700">{idea.problem}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">💡 Giải pháp</p>
              <p className="text-gray-700">{idea.solution}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">🌍 Thị trường</p>
              <p className="text-gray-700">{idea.market}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">⏱️ Timeline</p>
              <p className="text-gray-700">{idea.timeline}</p>
            </div>
          </div>

          {idea.techStack && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-600 mb-2">🛠️ Tech Stack</p>
              <div className="flex flex-wrap gap-2">
                {idea.techStack.map((tech: string, i: number) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-[#FFF4E8] text-[#FF6B00] text-sm font-medium">{tech}</span>
                ))}
              </div>
            </div>
          )}

          {idea.features && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-600 mb-2">✅ Tính năng chính</p>
              <ul className="space-y-1">
                {idea.features.map((f: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                    <span className="text-[#FF6B00]">•</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
