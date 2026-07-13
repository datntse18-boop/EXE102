import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, X, Sparkles, Loader2, Bot } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function FloatingAiCopilot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Get contextual greeting based on current path
  const getContextualGreeting = (): string => {
    const path = window.location.pathname
    if (path.includes('workspace')) {
      return 'Chào đồng sáng lập! 🚀 Tôi có thể hỗ trợ bạn thiết kế các Task công việc trên bảng Kanban hoặc quản lý tiến trình OKR tuần này.'
    }
    if (path.includes('pitch-deck-advisor')) {
      return 'Xin chào! Hãy dán dàn ý Slide hoặc bật Mic lên để luyện nói Pitching. Tôi sẽ chẩn đoán ngay lỗi phát âm và từ đệm thừa!'
    }
    if (path.includes('startup-tools')) {
      return 'Cố vấn tài chính AI đã sẵn sàng! Bạn cần hỗ trợ điền mẫu Business Model Canvas hay phân tích tỷ số LTV/CAC, Burn Rate?'
    }
    if (path.includes('profile')) {
      return 'Chào bạn! Tại đây bạn có thể xem các Huy hiệu danh giá đã mở khóa và gửi ý kiến đóng góp/phản hồi trực tiếp tới Admin.'
    }
    if (path.includes('reports')) {
      return 'Chào Admin! Bạn cần tôi phân tích xu hướng biến động doanh thu hay xem thống kê mức độ sử dụng các tính năng AI?'
    }
    return 'Xin chào! StudyConnect AI Copilot luôn sẵn sàng hỗ trợ dự án khởi nghiệp của bạn. Bạn muốn bắt đầu từ công cụ nào hôm nay?'
  }

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { role: 'assistant', content: getContextualGreeting() }
      ])
    }
  }, [isOpen])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    // Simulate smart AI response based on keyword matching for high professional quality
    setTimeout(() => {
      let reply = 'Tôi đã nhận được câu hỏi. Đối với dự án khởi nghiệp, bạn nên tập trung tối ưu hóa Sản phẩm khả dụng tối thiểu (MVP) và xác thực khách hàng (Customer Validation) theo khung Steve Blank trước khi gọi vốn.'
      
      const lower = userMsg.toLowerCase()
      if (lower.includes('canvas') || lower.includes('mô hình')) {
        reply = 'Mô hình Canvas gồm 9 khối. Để bắt đầu, bạn hãy xác định rõ 2 khối quan trọng nhất trước: Phân khúc khách hàng (Customer Segments) và Tuyên bố giá trị (Value Propositions). AI của chúng tôi ở tab Canvas sẽ tự động điền mẫu cho bạn!'
      } else if (lower.includes('runway') || lower.includes('tài chính') || lower.includes('tiền')) {
        reply = 'Chỉ số Runway = (Vốn tự có / Burn Rate). Để kéo dài Runway sống sót, bạn cần cắt giảm tối đa Chi phí cố định (Fixed Costs) hoặc thử nghiệm tính phí sớm (Early Revenue) để có dòng tiền dương.'
      } else if (lower.includes('cac') || lower.includes('ltv')) {
        reply = 'Tỷ lệ LTV/CAC đo lường hiệu quả kinh doanh. Tiêu chuẩn quốc tế cho các SaaS startup thành công là LTV/CAC phải lớn hơn 3x. Nếu dưới 1x, bạn đang đốt tiền không hiệu quả!'
      } else if (lower.includes('pitch') || lower.includes('thuyết trình') || lower.includes('nói')) {
        reply = 'Khi pitching, hãy thu hút hội đồng trong 30 giây đầu bằng một câu Hook ấn tượng (Ví dụ: Số liệu thực tế về vấn đề). Kiểm soát nhịp độ nói ở mức 120-140 từ/phút (WPM) và hạn chế dùng từ đệm ừ, à.'
      }

      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9998] font-sans no-print">
      
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-[#FF6B00] hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-xl hover:shadow-orange-500/20 transition-all duration-300 relative group cursor-pointer border-4 border-orange-100 dark:border-orange-950"
        >
          {/* Pulsing ring */}
          <span className="absolute inset-0 rounded-full border-2 border-orange-500 animate-ping opacity-25"></span>
          <Bot className="w-6 h-6 animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[320px] h-[430px] bg-gradient-to-br from-[#13131C] to-[#0A0A0D] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-fadeIn">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600/10 to-[#FF6B00]/5 px-4 py-3 border-b border-gray-850 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center border border-[#FF6B00]/30">
                <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">StudyConnect Copilot</h4>
                <span className="text-[8px] text-emerald-400 font-extrabold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-450 rounded-full"></span> Online
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-none select-text">
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                className={`flex gap-2.5 items-start ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#FF6B00] flex items-center justify-center shrink-0 text-xs">
                    🤖
                  </div>
                )}
                <div 
                  className={`p-3 rounded-2xl text-[11px] leading-relaxed max-w-[80%] font-medium ${
                    m.role === 'user'
                      ? 'bg-[#FF6B00] text-white rounded-tr-none'
                      : 'bg-gray-50/5 dark:bg-[#1C1C28]/60 border border-gray-150/40 dark:border-gray-850/20 text-gray-800 dark:text-gray-300 rounded-tl-none'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5 items-start">
                <div className="w-7 h-7 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#FF6B00] flex items-center justify-center shrink-0 text-xs">
                  🤖
                </div>
                <div className="p-3 bg-[#1C1C28]/60 border border-gray-850/20 rounded-2xl rounded-tl-none text-[11px] text-gray-500 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF6B00]" /> Copilot đang suy nghĩ...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input form */}
          <form onSubmit={handleSend} className="p-3 border-t border-gray-850 bg-black/20 flex gap-2 shrink-0">
            <input
              type="text"
              placeholder="Hỏi về Canvas, Runway, CAC/LTV..."
              value={input}
              onChange={e => setInput(e.target.value)}
              className="w-full bg-[#1C1C28]/80 border border-gray-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF6B00] text-white font-medium placeholder-gray-600"
            />
            <button
              type="submit"
              className="p-2 bg-[#FF6B00] hover:bg-orange-600 text-white rounded-xl transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

    </div>
  )
}
