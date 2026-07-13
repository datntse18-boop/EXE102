import { useState, useRef, useEffect } from 'react'
import { aiService } from '../../services/apiServices'
import Card from '../../components/cards/Card'
import {
  Sparkles,
  Loader2,
  Award,
  Lightbulb,
  TrendingUp,
  Compass,
  AlertCircle,
  Play,
  User,
  DollarSign,
  Cpu,
  Megaphone,
  ArrowRight,
  RefreshCw,
  CheckCircle,
  XCircle,
  MessageSquare
} from 'lucide-react'

type ScoreKey = 'marketSize' | 'problemSolution' | 'businessModel' | 'overall'

interface ChatMessage {
  role: 'user' | 'panel'
  content: string
  panelMember?: 'VC' | 'CTO' | 'CMO'
  isCritique?: boolean
}

export default function PitchDeckAdvisor() {
  const [activeTab, setActiveTab] = useState<'advisor' | 'demoday'>('advisor')

  // --- TAB 1: PITCH DECK ADVISOR STATE ---
  const [content, setContent] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) {
      alert('Vui lòng nhập đề cương hoặc dàn ý Pitch Deck của bạn.')
      return
    }

    setAnalyzing(true)
    try {
      const data = await aiService.analyzePitchDeck(content)
      setResults(data)
    } catch (err) {
      console.error(err)
      alert('Phân tích bằng AI thất bại. Vui lòng kiểm tra API Key.')
    } finally {
      setAnalyzing(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900/50'
    if (score >= 50) return 'text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50'
    return 'text-red-600 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50'
  }

  const scoreLabels: Record<ScoreKey, string> = {
    marketSize: 'Quy mô thị trường',
    problemSolution: 'Vấn đề & Giải pháp',
    businessModel: 'Mô hình kinh doanh',
    overall: 'Điểm tổng quát'
  }

  // --- TAB 2: AI VIRTUAL DEMO DAY STATE ---
  const [pitchIdea, setPitchIdea] = useState('')
  const [demoDayState, setDemoDayState] = useState<'idle' | 'pitching' | 'results'>('idle')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [currentJudge, setCurrentJudge] = useState<'VC' | 'CTO' | 'CMO'>('VC')
  const [lastQuestion, setLastQuestion] = useState('')
  const [userAnswer, setUserAnswer] = useState('')
  const [demoLoading, setDemoLoading] = useState(false)
  const [finalResults, setFinalResults] = useState<any>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, demoLoading])

  const handleStartDemoDay = async () => {
    if (!pitchIdea.trim()) {
      alert('Vui lòng nhập ý tưởng khởi nghiệp hoặc dự án của bạn.')
      return
    }
    setDemoLoading(true)
    try {
      const res = await aiService.virtualDemoDay({
        pitchIdea,
        action: 'start'
      })
      setChatHistory([
        { role: 'panel', content: res.introductions },
        { role: 'panel', content: res.nextQuestion, panelMember: res.nextJudge }
      ])
      setCurrentJudge(res.nextJudge)
      setLastQuestion(res.nextQuestion)
      setDemoDayState('pitching')
    } catch (err) {
      console.error(err)
      alert('Không thể bắt đầu buổi Demo Day. Vui lòng kiểm tra backend.')
    } finally {
      setDemoLoading(false)
    }
  }

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userAnswer.trim() || demoLoading) return

    setDemoLoading(true)
    const currentAnswer = userAnswer
    setUserAnswer('')

    const updatedHistory: ChatMessage[] = [
      ...chatHistory,
      { role: 'user', content: currentAnswer }
    ]
    setChatHistory(updatedHistory)

    try {
      const res = await aiService.virtualDemoDay({
        pitchIdea,
        chatHistory: updatedHistory,
        action: 'submit_answer',
        lastQuestion,
        userAnswer: currentAnswer,
        currentJudge
      })

      setChatHistory(prev => [
        ...prev,
        { role: 'panel', content: res.critique, panelMember: currentJudge, isCritique: true },
        { role: 'panel', content: res.nextQuestion, panelMember: res.nextJudge }
      ])
      setCurrentJudge(res.nextJudge)
      setLastQuestion(res.nextQuestion)
    } catch (err) {
      console.error(err)
      alert('Lỗi phản hồi từ hội đồng.')
    } finally {
      setDemoLoading(false)
    }
  }

  const handleFinalizeDemoDay = async () => {
    setDemoLoading(true)
    try {
      const res = await aiService.virtualDemoDay({
        pitchIdea,
        chatHistory,
        action: 'finalize'
      })
      setFinalResults(res)
      setDemoDayState('results')
    } catch (err) {
      console.error(err)
      alert('Lỗi tính điểm và xếp hạng từ hội đồng.')
    } finally {
      setDemoLoading(false)
    }
  }

  const resetDemoDay = () => {
    setPitchIdea('')
    setChatHistory([])
    setFinalResults(null)
    setDemoDayState('idle')
  }

  const getJudgeName = (role?: 'VC' | 'CTO' | 'CMO') => {
    if (role === 'VC') return 'Victor Chen (VC)'
    if (role === 'CTO') return 'Clara Tech (CTO)'
    if (role === 'CMO') return 'Marcus GTM (CMO)'
    return 'Ban Giám Khảo'
  }

  const getJudgeIcon = (role?: 'VC' | 'CTO' | 'CMO') => {
    if (role === 'VC') return <DollarSign className="w-4 h-4 text-emerald-500" />
    if (role === 'CTO') return <Cpu className="w-4 h-4 text-blue-500" />
    if (role === 'CMO') return <Megaphone className="w-4 h-4 text-purple-500" />
    return <User className="w-4 h-4 text-gray-500" />
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1B1B22] via-[#2F2F3B] to-[#1B1B22] text-white rounded-3xl p-8 shadow-xl border border-gray-800">
        <div className="relative z-10 max-w-xl">
          <span className="bg-[#FF6B00] px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm flex items-center gap-1.5 w-max">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            AI Startup Pitch Lab
          </span>
          <h1 className="text-3xl font-black mt-4 tracking-tight leading-none text-white">
            AI Cố vấn Pitch & Demo Day 🎤
          </h1>
          <p className="text-sm text-gray-300 mt-3 font-medium opacity-90 leading-relaxed">
            Nâng tầm dự án khởi nghiệp EXE với AI. Chẩn đoán barem điểm đề cương hoặc tham gia đấu trí thuyết trình thử trước hội đồng giám khảo ảo.
          </p>
        </div>
        <div className="absolute right-8 bottom-0 top-0 opacity-10 w-1/4 flex items-center justify-center pointer-events-none">
          <span className="text-9xl">🎤</span>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-6">
        <button
          onClick={() => setActiveTab('advisor')}
          className={`pb-3 text-sm font-bold transition-all ${
            activeTab === 'advisor'
              ? 'border-b-2 border-[#FF6B00] text-[#FF6B00]'
              : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          🤖 Đánh giá Đề cương Pitch Deck
        </button>
        <button
          onClick={() => setActiveTab('demoday')}
          className={`pb-3 text-sm font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'demoday'
              ? 'border-b-2 border-[#FF6B00] text-[#FF6B00]'
              : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          🎙️ AI Virtual Demo Day (Thuyết trình thử)
        </button>
      </div>

      {/* --- TAB 1: PITCH DECK ADVISOR --- */}
      {activeTab === 'advisor' && (
        <div className="grid md:grid-cols-5 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm border-b dark:border-gray-800 pb-2.5 mb-4 flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#FF6B00]" />
                Nhập đề cương ý tưởng dự án
              </h3>

              <form onSubmit={handleAnalyze} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                    Đề cương hoặc Dàn ý Slide thuyết trình *
                  </label>
                  <textarea
                    required
                    rows={15}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Ví dụ:
1. Tên dự án: AgriGreen - Nông nghiệp thông minh
2. Khách hàng: Nông dân khu vực miền Tây
3. Vấn đề: Thu hoạch kém hiệu quả, lạm dụng phân bón hóa học
4. Giải pháp: Thiết bị IoT giám sát đất đai
5. Doanh thu: Bán thiết bị và thuê bao phần mềm SaaS hàng tháng
6. Kênh: Tiếp cận trực tiếp hợp tác xã..."
                    className="w-full bg-white dark:bg-[#13131C] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#FF6B00] font-medium leading-relaxed dark:text-gray-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={analyzing}
                  className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-[#FF6B00] text-white text-[11px] font-bold rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      AI đang phân tích chi tiết...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Chẩn đoán & Góp ý bằng AI
                    </>
                  )}
                </button>
              </form>
            </Card>
          </div>

          <div className="md:col-span-3 space-y-6">
            {analyzing ? (
              <div className="bg-white dark:bg-[#13131C] rounded-2xl border border-gray-100 dark:border-gray-800 p-20 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
                <Loader2 className="w-12 h-12 animate-spin text-[#FF6B00]" />
                <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm">Trợ lý AI đang chẩn đoán...</h3>
                <p className="text-xs text-gray-400 max-w-xs leading-normal">
                  AI đang so sánh đề cương của bạn với các tiêu chí chấm điểm và nghiên cứu đối thủ cạnh tranh trên thị trường toàn cầu. Việc này có thể mất 10-15 giây.
                </p>
              </div>
            ) : !results ? (
              <div className="bg-white dark:bg-[#13131C] rounded-2xl border border-gray-100 dark:border-gray-800 p-20 flex flex-col items-center justify-center text-center text-gray-400 shadow-sm">
                <AlertCircle className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-3" />
                <h4 className="font-bold text-gray-700 dark:text-gray-300 text-xs">Chưa có dữ liệu chẩn đoán</h4>
                <p className="text-[10px] text-gray-400 mt-1">
                  Hãy dán dàn ý của bạn ở cột bên trái và bấm nút phân tích để bắt đầu chẩn đoán.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Scores Overview */}
                <Card>
                  <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm border-b dark:border-gray-800 pb-2.5 mb-5 flex items-center gap-2">
                    <Award className="w-4 h-4 text-orange-500" />
                    Bảng điểm đánh giá năng lực dự án
                  </h3>

                  <div className="grid grid-cols-4 gap-3">
                    {(Object.keys(results.scores) as ScoreKey[]).map(key => (
                      <div
                        key={key}
                        className={`p-4 rounded-xl border text-center flex flex-col justify-between items-center transition duration-300 ${getScoreColor(
                          results.scores[key]
                        )}`}
                      >
                        <span className="text-[9px] font-black uppercase tracking-wider opacity-85 leading-normal block h-8 flex items-center justify-center">
                          {scoreLabels[key]}
                        </span>
                        <span className="text-2xl font-black mt-2">{results.scores[key]}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Feedbacks */}
                <Card>
                  <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm border-b dark:border-gray-800 pb-2.5 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    Phân tích chi tiết từng khía cạnh
                  </h3>

                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="font-black text-orange-600 block mb-1">📈 Quy mô & Phân khúc thị trường:</span>
                      <p className="text-gray-600 dark:text-gray-300 leading-normal font-medium bg-gray-50 dark:bg-[#0B0B0F] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                        {results.feedback.marketSize}
                      </p>
                    </div>
                    <div>
                      <span className="font-black text-orange-600 block mb-1">🎯 Tính logic Vấn đề - Giải pháp:</span>
                      <p className="text-gray-600 dark:text-gray-300 leading-normal font-medium bg-gray-50 dark:bg-[#0B0B0F] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                        {results.feedback.problemSolution}
                      </p>
                    </div>
                    <div>
                      <span className="font-black text-orange-600 block mb-1">💰 Khả thi Mô hình kinh doanh:</span>
                      <p className="text-gray-600 dark:text-gray-300 leading-normal font-medium bg-gray-50 dark:bg-[#0B0B0F] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                        {results.feedback.businessModel}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Virtual Boardroom (Multi-Agent Feedback) */}
                {results.boardroom && (
                  <Card className="border border-orange-500/20 bg-orange-500/[0.02]">
                    <h3 className="font-bold text-gray-800 dark:text-gray-205 text-sm border-b dark:border-gray-800 pb-2.5 mb-4 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-[#FF6B00]" />
                      Hội đồng Cố vấn AI phản biện (Virtual Boardroom Agents)
                    </h3>
                    <div className="space-y-4 text-xs">
                      {/* CTO Agent */}
                      <div className="p-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-gray-150/40 dark:border-gray-800/40 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-lg shadow-sm text-white font-bold shrink-0">
                          🤖
                        </div>
                        <div className="space-y-1">
                          <span className="font-extrabold text-blue-600 dark:text-blue-400 block">CTO Agent (Giám đốc Công nghệ)</span>
                          <p className="text-gray-650 dark:text-gray-300 leading-normal font-medium italic">
                            "{results.boardroom.cto}"
                          </p>
                        </div>
                      </div>
                      
                      {/* CMO Agent */}
                      <div className="p-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-gray-150/40 dark:border-gray-800/40 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-lg shadow-sm text-white font-bold shrink-0">
                          📢
                        </div>
                        <div className="space-y-1">
                          <span className="font-extrabold text-pink-600 dark:text-pink-400 block">CMO Agent (Giám đốc Marketing)</span>
                          <p className="text-gray-650 dark:text-gray-300 leading-normal font-medium italic">
                            "{results.boardroom.cmo}"
                          </p>
                        </div>
                      </div>
                      
                      {/* CFO Agent */}
                      <div className="p-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-gray-150/40 dark:border-gray-800/40 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-lg shadow-sm text-white font-bold shrink-0">
                          💰
                        </div>
                        <div className="space-y-1">
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-450 block">CFO Agent (Giám đốc Tài chính)</span>
                          <p className="text-gray-650 dark:text-gray-300 leading-normal font-medium italic">
                            "{results.boardroom.cfo}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Recommendations */}
                <Card>
                  <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm border-b dark:border-gray-800 pb-2.5 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-orange-500" />
                    Khuyến nghị cải tiến trực tiếp từ AI
                  </h3>

                  <ul className="space-y-2.5 text-xs text-gray-600 dark:text-gray-300 font-medium">
                    {results.suggestions.map((s: string, idx: number) => (
                      <li
                        key={idx}
                        className="flex gap-2.5 items-start bg-amber-50/20 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/30 p-3.5 rounded-xl"
                      >
                        <span className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 border dark:border-amber-900">
                          {idx + 1}
                        </span>
                        <p className="leading-relaxed">{s}</p>
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Conclusion */}
                <Card>
                  <h4 className="font-bold text-gray-800 dark:text-gray-200 text-xs mb-2">🏁 Kết luận chung:</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-[#0B0B0F] p-4 rounded-xl border border-gray-100 dark:border-gray-800 font-medium">
                    {results.conclusion}
                  </p>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: AI VIRTUAL DEMO DAY --- */}
      {activeTab === 'demoday' && (
        <div className="space-y-6">
          {/* STATE 1: IDLE - Setup Idea */}
          {demoDayState === 'idle' && (
            <div className="max-w-2xl mx-auto">
              <Card>
                <div className="text-center py-4">
                  <span className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center mx-auto text-orange-600 text-xl font-bold mb-4 shadow-inner">
                    🎙️
                  </span>
                  <h2 className="text-lg font-black text-gray-800 dark:text-white">Bắt đầu mô phỏng Thuyết trình Demo Day</h2>
                  <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                    Bạn sẽ thuyết trình ý tưởng trước 3 giám khảo ảo: **Victor Chen (VC)**, **Clara Tech (CTO)**, và **Marcus GTM (CMO)**. Họ sẽ đặt câu hỏi hóc búa để thử thách độ trưởng thành của dự án.
                  </p>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Mô tả ý tưởng dự án của bạn (1-2 đoạn văn ngắn) *
                    </label>
                    <textarea
                      rows={5}
                      value={pitchIdea}
                      onChange={e => setPitchIdea(e.target.value)}
                      placeholder="Ví dụ: Chúng tôi xây dựng một nền tảng EdTech kết nối gia sư chất lượng cao với học sinh phổ thông thông qua phòng học VR 3D sinh động. Mô hình doanh thu là thu phí 15% trên mỗi giờ học của gia sư..."
                      className="w-full bg-white dark:bg-[#13131C] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#FF6B00] font-medium leading-relaxed dark:text-gray-200"
                    />
                  </div>

                  <button
                    onClick={handleStartDemoDay}
                    disabled={demoLoading || !pitchIdea.trim()}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-[#FF6B00] text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-xl transition disabled:opacity-50 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {demoLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang liên hệ Hội đồng Giám khảo AI...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        Bắt đầu Pitching & Nhận câu hỏi
                      </>
                    )}
                  </button>
                </div>
              </Card>
            </div>
          )}

          {/* STATE 2: PITCHING - Conversational Interface */}
          {demoDayState === 'pitching' && (
            <div className="grid md:grid-cols-4 gap-6">
              {/* Panel Status Column */}
              <div className="md:col-span-1 space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Hội đồng giám khảo ảo</h4>
                
                {/* VC Card */}
                <div
                  className={`p-4 rounded-2xl border transition-all duration-300 bg-white dark:bg-[#13131C] ${
                    currentJudge === 'VC'
                      ? 'border-[#FF6B00] shadow-[0_0_15px_rgba(255,107,0,0.15)] ring-1 ring-[#FF6B00]/30'
                      : 'border-gray-100 dark:border-gray-800 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                    </span>
                    <div>
                      <h5 className="text-xs font-bold text-gray-800 dark:text-white">Victor Chen</h5>
                      <span className="text-[9px] font-medium text-emerald-600 uppercase tracking-wider block">Venture Capitalist</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 leading-relaxed font-medium">
                    Tập trung vào doanh thu, thị trường, dòng tiền và ROI của dự án.
                  </p>
                  {currentJudge === 'VC' && (
                    <span className="mt-3 inline-block bg-orange-100 dark:bg-orange-950 text-[#FF6B00] px-2 py-0.5 rounded text-[8px] font-bold animate-pulse">
                      Đang Chất Vấn
                    </span>
                  )}
                </div>

                {/* CTO Card */}
                <div
                  className={`p-4 rounded-2xl border transition-all duration-300 bg-white dark:bg-[#13131C] ${
                    currentJudge === 'CTO'
                      ? 'border-[#FF6B00] shadow-[0_0_15px_rgba(255,107,0,0.15)] ring-1 ring-[#FF6B00]/30'
                      : 'border-gray-100 dark:border-gray-800 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                      <Cpu className="w-4 h-4 text-blue-600" />
                    </span>
                    <div>
                      <h5 className="text-xs font-bold text-gray-800 dark:text-white">Clara Tech</h5>
                      <span className="text-[9px] font-medium text-blue-600 uppercase tracking-wider block">Chief Tech Officer</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 leading-relaxed font-medium">
                    Tập trung vào tính khả thi, kiến trúc kỹ thuật và mở rộng công nghệ.
                  </p>
                  {currentJudge === 'CTO' && (
                    <span className="mt-3 inline-block bg-orange-100 dark:bg-orange-950 text-[#FF6B00] px-2 py-0.5 rounded text-[8px] font-bold animate-pulse">
                      Đang Chất Vấn
                    </span>
                  )}
                </div>

                {/* CMO Card */}
                <div
                  className={`p-4 rounded-2xl border transition-all duration-300 bg-white dark:bg-[#13131C] ${
                    currentJudge === 'CMO'
                      ? 'border-[#FF6B00] shadow-[0_0_15px_rgba(255,107,0,0.15)] ring-1 ring-[#FF6B00]/30'
                      : 'border-gray-100 dark:border-gray-800 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950 flex items-center justify-center">
                      <Megaphone className="w-4 h-4 text-purple-600" />
                    </span>
                    <div>
                      <h5 className="text-xs font-bold text-gray-800 dark:text-white">Marcus GTM</h5>
                      <span className="text-[9px] font-medium text-purple-600 uppercase tracking-wider block">Chief Marketing Officer</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 leading-relaxed font-medium">
                    Tập trung vào chiến lược GTM, phân khúc tiếp cận, CAC và LTV.
                  </p>
                  {currentJudge === 'CMO' && (
                    <span className="mt-3 inline-block bg-orange-100 dark:bg-orange-950 text-[#FF6B00] px-2 py-0.5 rounded text-[8px] font-bold animate-pulse">
                      Đang Chất Vấn
                    </span>
                  )}
                </div>

                {/* End pitch early */}
                <button
                  onClick={handleFinalizeDemoDay}
                  disabled={demoLoading}
                  className="w-full py-2 bg-gray-800 text-white hover:bg-gray-900 text-[10px] font-black tracking-wider uppercase rounded-xl transition duration-200 flex items-center justify-center gap-1 shadow-sm border border-gray-700"
                >
                  🏁 Nhận Điểm Số Chung Cuộc
                </button>
              </div>

              {/* Chat room Panel */}
              <div className="md:col-span-3 flex flex-col h-[550px] bg-white dark:bg-[#13131C] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0B0B0F]/50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Phiên thuyết trình trực tiếp</span>
                  </div>
                  <span className="text-[9px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    Dự án: {pitchIdea.slice(0, 30)}...
                  </span>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      {/* Speaker name */}
                      <span className="text-[9px] font-bold text-gray-400 mb-1 flex items-center gap-1">
                        {msg.role === 'panel' ? (
                          <>
                            {getJudgeIcon(msg.panelMember)}
                            {getJudgeName(msg.panelMember)}
                            {msg.isCritique && <span className="text-orange-500 font-bold ml-1">(Critique)</span>}
                          </>
                        ) : (
                          'Founder (Bạn)'
                        )}
                      </span>

                      {/* Speech bubble */}
                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed font-medium shadow-sm transition-all duration-300 ${
                          msg.role === 'user'
                            ? 'bg-[#FF6B00] text-white rounded-tr-none'
                            : msg.isCritique
                            ? 'bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100/50 dark:border-orange-900/30 text-gray-700 dark:text-gray-300 rounded-tl-none font-semibold'
                            : 'bg-gray-50 dark:bg-[#0B0B0F] border border-gray-100 dark:border-gray-850 text-gray-700 dark:text-gray-300 rounded-tl-none'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {demoLoading && (
                    <div className="flex items-start gap-1 flex-col">
                      <span className="text-[9px] font-bold text-gray-400 mb-1 flex items-center gap-1">
                        {getJudgeIcon(currentJudge)}
                        {getJudgeName(currentJudge)} đang nhập phản hồi...
                      </span>
                      <div className="bg-gray-50 dark:bg-[#0B0B0F] border border-gray-100 dark:border-gray-850 rounded-2xl rounded-tl-none p-3.5 text-xs flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF6B00]" />
                        <span className="text-gray-400">Đang phân tích và soạn câu hỏi...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input form */}
                <form
                  onSubmit={handleSubmitAnswer}
                  className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#0B0B0F] flex gap-3"
                >
                  <textarea
                    required
                    rows={2}
                    value={userAnswer}
                    onChange={e => setUserAnswer(e.target.value)}
                    disabled={demoLoading}
                    placeholder={`Trả lời chất vấn từ giám khảo ${getJudgeName(currentJudge)}...`}
                    className="flex-1 bg-white dark:bg-[#13131C] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] font-medium leading-relaxed resize-none dark:text-gray-200"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmitAnswer(e)
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={demoLoading || !userAnswer.trim()}
                    className="px-5 bg-gradient-to-r from-orange-500 to-[#FF6B00] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center shrink-0"
                  >
                    Gửi phản hồi
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STATE 3: RESULTS - Final Scoreboard */}
          {demoDayState === 'results' && finalResults && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <Card>
                <div className="text-center py-6 border-b dark:border-gray-800">
                  <div className="inline-flex items-center justify-center p-3 rounded-full bg-orange-100 dark:bg-orange-950/50 mb-3 shadow-inner">
                    <Award className="w-8 h-8 text-[#FF6B00]" />
                  </div>
                  <h2 className="text-xl font-black text-gray-800 dark:text-white">Bảng Xếp Hạng Kết Quả Demo Day</h2>
                  <p className="text-xs text-gray-400 mt-1">Hội đồng chấm điểm dựa trên phần pitching Q&A của bạn</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 py-6">
                  {/* Score circle */}
                  <div className="md:col-span-1 flex flex-col items-center justify-center border-r dark:border-gray-850 p-4 text-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Điểm trung bình</span>
                    <div className="relative w-28 h-28 flex items-center justify-center mt-3 bg-orange-50 dark:bg-orange-950/20 rounded-full border-4 border-orange-500 shadow-md">
                      <span className="text-3xl font-black text-gray-800 dark:text-white">{finalResults.overallScore}</span>
                      <span className="text-xs text-gray-400 font-bold absolute bottom-4">/ 100</span>
                    </div>

                    <div className="mt-5">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Quyết định đầu tư</span>
                      <div className="mt-2.5 flex items-center justify-center gap-1">
                        {finalResults.verdict === 'Invested' ? (
                          <span className="bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 fill-current" />
                            Được Đầu Tư
                          </span>
                        ) : finalResults.verdict === 'Seed-Funded' ? (
                          <span className="bg-blue-100 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            Vòng Thiên Thần
                          </span>
                        ) : (
                          <span className="bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            Từ Chối Đầu Tư
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-2 italic max-w-[200px] leading-relaxed">
                        &quot;{finalResults.verdictText}&quot;
                      </p>
                    </div>
                  </div>

                  {/* Individual judge scores */}
                  <div className="md:col-span-2 space-y-4 p-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Bảng điểm giám khảo</h4>
                    
                    {/* VC */}
                    <div className="bg-gray-50 dark:bg-[#0B0B0F] p-3 rounded-xl border border-gray-100 dark:border-gray-850 flex justify-between items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
                          <DollarSign className="w-3 h-3 text-emerald-600" />
                        </span>
                        <div>
                          <h6 className="text-xs font-bold text-gray-800 dark:text-white">Victor Chen (VC)</h6>
                          <span className="text-[9px] text-gray-400">Tài chính & Kinh doanh</span>
                        </div>
                      </div>
                      <span className="text-sm font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900">
                        {finalResults.vcScore} / 100
                      </span>
                    </div>

                    {/* CTO */}
                    <div className="bg-gray-50 dark:bg-[#0B0B0F] p-3 rounded-xl border border-gray-100 dark:border-gray-850 flex justify-between items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                          <Cpu className="w-3 h-3 text-blue-600" />
                        </span>
                        <div>
                          <h6 className="text-xs font-bold text-gray-800 dark:text-white">Clara Tech (CTO)</h6>
                          <span className="text-[9px] text-gray-400">Công nghệ & Khả thi</span>
                        </div>
                      </div>
                      <span className="text-sm font-black text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-900">
                        {finalResults.ctoScore} / 100
                      </span>
                    </div>

                    {/* CMO */}
                    <div className="bg-gray-50 dark:bg-[#0B0B0F] p-3 rounded-xl border border-gray-100 dark:border-gray-850 flex justify-between items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center">
                          <Megaphone className="w-3 h-3 text-purple-600" />
                        </span>
                        <div>
                          <h6 className="text-xs font-bold text-gray-800 dark:text-white">Marcus GTM (CMO)</h6>
                          <span className="text-[9px] text-gray-400">Marketing & GTM</span>
                        </div>
                      </div>
                      <span className="text-sm font-black text-purple-600 bg-purple-50 dark:bg-purple-950/30 px-3 py-1 rounded-lg border border-purple-100 dark:border-purple-900">
                        {finalResults.cmoScore} / 100
                      </span>
                    </div>
                  </div>
                </div>

                {/* Judge critique blocks */}
                <div className="space-y-4 pt-4 border-t dark:border-gray-800">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Nhận xét chi tiết từ hội đồng</h4>
                  
                  <div className="grid md:grid-cols-3 gap-4 text-[11px] leading-relaxed">
                    <div className="bg-gray-50 dark:bg-[#0B0B0F] p-4 rounded-xl border border-gray-100 dark:border-gray-850">
                      <span className="font-bold text-emerald-600 block mb-1">💰 Nhận xét của Victor Chen:</span>
                      <p className="text-gray-600 dark:text-gray-300 font-medium">{finalResults.vcCritique}</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-[#0B0B0F] p-4 rounded-xl border border-gray-100 dark:border-gray-850">
                      <span className="font-bold text-blue-600 block mb-1">💻 Nhận xét của Clara Tech:</span>
                      <p className="text-gray-600 dark:text-gray-300 font-medium">{finalResults.ctoCritique}</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-[#0B0B0F] p-4 rounded-xl border border-gray-100 dark:border-gray-850">
                      <span className="font-bold text-purple-600 block mb-1">📢 Nhận xét của Marcus GTM:</span>
                      <p className="text-gray-600 dark:text-gray-300 font-medium">{finalResults.cmoCritique}</p>
                    </div>
                  </div>
                </div>

                {/* Advice & Restart */}
                <div className="mt-6 pt-6 border-t dark:border-gray-800 space-y-4">
                  <div className="p-4 bg-orange-50/35 dark:bg-orange-950/10 border border-orange-100/50 dark:border-orange-900/30 rounded-2xl flex gap-3">
                    <Lightbulb className="w-5 h-5 text-[#FF6B00] shrink-0" />
                    <div>
                      <h5 className="text-xs font-bold text-gray-800 dark:text-white">Chiến lược phát triển tiếp theo gợi ý bởi AI:</h5>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 font-medium leading-relaxed">
                        {finalResults.generalAdvice}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={resetDemoDay}
                      className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-[#FF6B00] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Pitching dự án mới hoặc thử lại
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
