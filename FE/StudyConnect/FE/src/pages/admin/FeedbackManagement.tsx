import { useEffect, useState } from 'react'
import Card from '../../components/cards/Card'
import { feedbackService } from '../../services/apiServices'
import { MessageSquare, Send, CheckCircle, Clock, Search, Filter, Loader2, ArrowLeft } from 'lucide-react'

export default function FeedbackManagement() {
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'replied'>('all')

  // Reply states
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)

  const loadFeedbacks = async () => {
    setLoading(true)
    try {
      const data = await feedbackService.getAllFeedbacks()
      setFeedbacks(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeedbacks()
  }, [])

  const handleSendReply = async (feedbackId: string) => {
    if (!replyText.trim()) return

    setSubmittingReply(true)
    try {
      await feedbackService.replyFeedback(feedbackId, replyText)
      setReplyText('')
      setReplyingId(null)
      alert('Gửi phản hồi cho người dùng thành công! 💬')
      loadFeedbacks()
    } catch (err) {
      console.error(err)
      alert('Không thể gửi phản hồi. Vui lòng thử lại.')
    } finally {
      setSubmittingReply(false)
    }
  }

  const filteredFeedbacks = feedbacks.filter((f: any) => {
    const matchesSearch = 
      f.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.user?.phone && f.user.phone.includes(searchTerm))

    if (filterStatus === 'pending') {
      return matchesSearch && !f.reply
    }
    if (filterStatus === 'replied') {
      return matchesSearch && !!f.reply
    }
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-500">
        <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin mb-2" />
        <span className="text-sm font-semibold">Đang tải danh sách góp ý...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0F0F12] via-[#1C1C24] to-[#0A0A0D] text-white rounded-3xl p-6 shadow-xl border border-gray-800/80">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF6B00] via-[#FFA64D] to-[#FF6B00]"></div>
        <h1 className="text-2xl font-black">Hộp Góp Ý & Ý Kiến Người Dùng 💬</h1>
        <p className="text-xs text-gray-400 mt-2 font-medium opacity-90">
          Xem và phản hồi trực tiếp các ý kiến đóng góp, báo cáo lỗi từ học viên và giáo viên trong hệ thống.
        </p>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-[#13131C] p-4 rounded-2xl border border-gray-150/40 dark:border-gray-850/40">
        <div className="relative w-full sm:w-72">
          <span className="absolute left-3 top-3 text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo nội dung, tên, email, sđt..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:border-[#FF6B00] bg-gray-50/50 dark:bg-[#1C1C28] text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              filterStatus === 'all'
                ? 'bg-[#FF6B00] text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
            }`}
          >
            Tất cả ({feedbacks.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              filterStatus === 'pending'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-650 dark:text-gray-405 hover:bg-gray-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Chờ phản hồi ({feedbacks.filter(f => !f.reply).length})
          </button>
          <button
            onClick={() => setFilterStatus('replied')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              filterStatus === 'replied'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-650 dark:text-gray-405 hover:bg-gray-200'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Đã phản hồi ({feedbacks.filter(f => !!f.reply).length})
          </button>
        </div>
      </div>

      {/* Feedbacks Grid */}
      {filteredFeedbacks.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40 rounded-3xl text-gray-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#FF6B00]" />
          <p className="text-sm font-semibold">Không tìm thấy góp ý nào phù hợp.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedbacks.map((f: any) => (
            <Card key={f.id} className="bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40 hover:shadow-md transition">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center border-b pb-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/20 text-lg flex items-center justify-center border border-orange-500/20">
                    {f.user?.avatar || '👤'}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-2">
                      {f.user?.name}
                      <span className="text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded font-black uppercase">
                        {f.user?.role === 'member' ? 'Học viên' : f.user?.role === 'manager' ? 'Giảng viên' : f.user?.role}
                      </span>
                    </h3>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                      Email: {f.user?.email} {f.user?.phone && `| SĐT: ${f.user.phone}`}
                    </p>
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                  Gửi lúc: {new Date(f.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-xs text-gray-850 dark:text-gray-200 leading-relaxed font-semibold bg-gray-50/50 dark:bg-[#1C1C28]/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-850/40">
                  {f.content}
                </div>

                {f.reply ? (
                  <div className="p-4 bg-emerald-500/5 dark:bg-emerald-950/10 border-l-2 border-emerald-500 rounded-r-2xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      Phản hồi từ Admin ({f.repliedBy?.name}):
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed italic">
                      {f.reply}
                    </p>
                  </div>
                ) : replyingId === f.id ? (
                  <div className="space-y-3 bg-gray-50 dark:bg-[#1C1C28]/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-850/30">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                      Viết câu trả lời của bạn:
                    </label>
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Nhập câu trả lời phản hồi cho người dùng..."
                      rows={3}
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#FF6B00] bg-white dark:bg-[#1C1C28] text-gray-900 dark:text-white"
                      required
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSendReply(f.id)}
                        disabled={submittingReply}
                        className="px-4 py-2 bg-[#FF6B00] hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {submittingReply ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang gửi...
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" /> Gửi phản hồi
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setReplyText('')
                          setReplyingId(null)
                        }}
                        className="px-4 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 rounded-xl text-xs font-bold transition"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setReplyText('')
                      setReplyingId(f.id)
                    }}
                    className="px-4 py-2 border border-[#FF6B00]/40 text-[#FF6B00] hover:bg-[#FF6B00]/10 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Viết phản hồi
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
