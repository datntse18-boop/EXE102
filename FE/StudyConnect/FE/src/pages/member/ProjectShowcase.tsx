import { useEffect, useState } from 'react'
import { projectService, crowdfundingService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/cards/Card'
import { Search, Loader2, Sparkles, Video, Globe, Heart, MessageSquare, Send, Award, User, Coins, Wallet, Flame } from 'lucide-react'

export default function ProjectShowcase() {
  const { user, updateUserData } = useAuth()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState<any>(null)

  // Crowdfunding Simulation States
  const [investmentAmount, setInvestmentAmount] = useState<string>('5000')
  const [investing, setInvesting] = useState(false)
  const [crowdLeaderboard, setCrowdLeaderboard] = useState<any[]>([])
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)

  // Comments & Interaction States
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)

  const fetchPublicProjects = async () => {
    try {
      const data = await projectService.getPublicProjects()
      setProjects(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true)
    try {
      const data = await crowdfundingService.getProjectLeaderboard()
      setCrowdLeaderboard(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingLeaderboard(false)
    }
  }

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject || !investmentAmount) return
    const amountNum = Number(investmentAmount)
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Số tiền đầu tư phải lớn hơn 0')
      return
    }

    if (user?.balance !== undefined && user.balance < amountNum) {
      alert('Số dư StudyCoins của bạn không đủ!')
      return
    }

    setInvesting(true)
    try {
      const res = await crowdfundingService.investInProject(selectedProject.id, amountNum)
      alert(res.message || 'Đầu tư thành công!')
      
      if (res.balance !== undefined) {
        updateUserData({ balance: res.balance })
      }

      await fetchPublicProjects()
      await fetchLeaderboard()

      setSelectedProject((prev: any) => {
        if (!prev) return null
        const updatedInvestments = [...(prev.investments || [])]
        updatedInvestments.push({ amount: amountNum })
        return {
          ...prev,
          investments: updatedInvestments
        }
      })

      setInvestmentAmount('5000')
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || 'Đầu tư thất bại. Vui lòng thử lại.')
    } finally {
      setInvesting(false)
    }
  }

  useEffect(() => {
    fetchPublicProjects()
    fetchLeaderboard()
  }, [])

  const fetchComments = async (projectId: string) => {
    setLoadingComments(true)
    try {
      const data = await projectService.getComments(projectId)
      setComments(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingComments(false)
    }
  }

  useEffect(() => {
    if (selectedProject) {
      fetchComments(selectedProject.id)
    }
  }, [selectedProject])

  const handleVote = async () => {
    if (!selectedProject) return
    try {
      const res = await projectService.voteProject(selectedProject.id)
      
      // Update local projects list
      setProjects(prev => prev.map(p => {
        if (p.id === selectedProject.id) {
          const isVoted = p.votes.some((v: any) => v.userId === user?.id)
          let updatedVotes = [...p.votes]
          if (isVoted) {
            updatedVotes = updatedVotes.filter((v: any) => v.userId !== user?.id)
          } else {
            updatedVotes.push({ userId: user?.id })
          }
          return {
            ...p,
            votes: updatedVotes,
            _count: {
              ...p._count,
              votes: updatedVotes.length
            }
          }
        }
        return p
      }))

      // Update selected project view
      setSelectedProject(prev => {
        const isVoted = prev.votes.some((v: any) => v.userId === user?.id)
        let updatedVotes = [...prev.votes]
        if (isVoted) {
          updatedVotes = updatedVotes.filter((v: any) => v.userId !== user?.id)
        } else {
          updatedVotes.push({ userId: user?.id })
        }
        return {
          ...prev,
          votes: updatedVotes,
          _count: {
            ...prev._count,
            votes: updatedVotes.length
          }
        }
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !selectedProject) return

    try {
      const commentObj = await projectService.addComment(selectedProject.id, newComment)
      setComments(prev => [...prev, commentObj])
      setNewComment('')

      // Increment comments count on projects list
      setProjects(prev => prev.map(p => {
        if (p.id === selectedProject.id) {
          return {
            ...p,
            _count: {
              ...p._count,
              comments: (p._count.comments || 0) + 1
            }
          }
        }
        return p
      }))
    } catch (err) {
      console.error(err)
    }
  }

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Top 3 voted projects for Leaderboard
  const leaderboard = [...projects]
    .sort((a, b) => (b._count?.votes || 0) - (a._count?.votes || 0))
    .slice(0, 3)

  const parseCanvas = (canvasStr: string | null) => {
    if (!canvasStr) return null
    try {
      return JSON.parse(canvasStr)
    } catch {
      return null
    }
  }

  const hasUserVoted = (project: any) => {
    if (!project || !project.votes) return false
    return project.votes.some((v: any) => v.userId === user?.id)
  }

  if (loading) {
    return (
      <div className="flex justify-center p-20 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00] mr-2" /> Đang tải trang trưng bày...
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0F0F12] via-[#1C1C24] to-[#0A0A0D] text-white rounded-3xl p-8 shadow-2xl border border-gray-800/80">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF6B00] via-[#FFA64D] to-[#FF6B00] shadow-[0_0_10px_rgba(255,107,0,0.5)]"></div>
        <div className="relative z-10 max-w-xl">
          <span className="bg-[#FF6B00]/25 text-[#FF6B00] border border-[#FF6B00]/40 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,107,0,0.1)] flex items-center gap-1.5 w-max">
            <Globe className="w-3.5 h-3.5" />
            Public Startup Gallery
          </span>
          <h1 className="text-3xl font-black mt-4 tracking-tight leading-none">Phòng Trưng Bày Dự Án Khởi Nghiệp 🚀</h1>
          <p className="text-sm text-gray-400 mt-3 font-medium opacity-90 leading-relaxed">
            Xem và học hỏi mô hình kinh doanh Canvas thực tế cùng video chào hàng (Pitch Deck) từ các nhóm dự án khởi nghiệp xuất sắc nhất.
          </p>
        </div>
        <div className="absolute right-8 bottom-0 top-0 opacity-5 w-1/4 flex items-center justify-center pointer-events-none">
          <span className="text-9xl">🌟</span>
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        
        {/* LEFT COLUMN: Projects List & Leaderboard (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          {/* Ví StudyCoins Card */}
          <Card className="bg-[#181824] border-gray-800 text-white p-5 rounded-2xl">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[9px] text-gray-400 uppercase font-black tracking-wider block">Ví Tiền Giả Lập</span>
                <span className="text-lg font-black text-[#FF6B00] flex items-center gap-1 mt-1">
                  <Coins className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />
                  {(user?.balance !== undefined ? user.balance : 100000).toLocaleString()} <span className="text-[10px] text-gray-400">StudyCoins</span>
                </span>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                <Wallet className="w-5 h-5 text-gray-300" />
              </div>
            </div>
            <p className="text-[9px] text-gray-400 mt-3 italic leading-normal">Dùng số coins này để đầu tư cho các dự án khởi nghiệp tiềm năng trong lớp học!</p>
          </Card>

          {/* Projects list card */}
          <Card>
            <div className="relative mb-4">
              <span className="absolute left-3.5 top-3 text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Tìm ý tưởng dự án..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredProjects.length > 0 ? (
                filteredProjects.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProject(p)}
                    className={`p-3.5 rounded-2xl border transition duration-200 cursor-pointer flex gap-3.5 items-center ${
                      selectedProject?.id === p.id 
                        ? 'border-[#FF6B00] bg-orange-50/20' 
                        : 'border-gray-50 bg-gray-50/10 hover:border-orange-100 hover:bg-white'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-xl shrink-0">
                      {p.logoUrl || '💡'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-gray-800 truncate">{p.name}</h4>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{p.description}</p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[8px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
                          Nhóm: {p.team?.name}
                        </span>
                        <span className="text-[9px] text-[#FF6B00] font-black flex items-center gap-0.5">
                          ❤️ {p._count?.votes || 0}
                        </span>
                        <span className="text-[9px] text-blue-500 font-black flex items-center gap-0.5">
                          💬 {p._count?.comments || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs font-semibold">
                  📭 Không tìm thấy dự án công khai nào.
                </div>
              )}
            </div>
          </Card>

          {/* Leaderboard card */}
          <Card className="bg-gradient-to-b from-white to-orange-50/10 border-orange-100">
            <h3 className="font-bold text-gray-800 text-xs border-b pb-2 mb-3 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-orange-500" />
              Bảng vàng dự án yêu thích nhất 🏆
            </h3>
            
            <div className="space-y-2.5">
              {leaderboard.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-3 p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                    idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-150 text-gray-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-black text-xs text-gray-800 truncate block">{p.name}</span>
                    <span className="text-[9px] text-gray-400 block font-bold truncate">Đồng sáng lập: {p.team?.name}</span>
                  </div>
                  <span className="text-xs font-black text-red-500 flex items-center gap-0.5">
                    ❤️ {p._count?.votes || 0}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Crowdfunding Leaderboard Card */}
          <Card className="bg-gradient-to-b from-white to-orange-50/10 border-orange-100 dark:from-[#13131C] dark:to-orange-950/5 dark:border-gray-800/40">
            <h3 className="font-bold text-gray-800 dark:text-gray-150 text-xs border-b dark:border-gray-800 pb-2 mb-3 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-[#FF6B00]" />
              Xếp hạng Gọi vốn Startup 🪙
            </h3>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {loadingLeaderboard ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-[#FF6B00]" />
                </div>
              ) : crowdLeaderboard.length === 0 ? (
                <p className="text-[10px] text-gray-400 italic text-center">Chưa có dự án nào nhận được vốn đầu tư.</p>
              ) : (
                crowdLeaderboard.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 bg-white dark:bg-[#181824] border border-gray-100 dark:border-gray-800/40 rounded-xl shadow-sm">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                      idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-150 text-gray-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="font-black text-xs text-gray-800 dark:text-white truncate block">{p.name}</span>
                      <span className="text-[9px] text-gray-400 block font-bold truncate">Nhóm: {p.teamName}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-black text-[#FF6B00] block">
                        {(p.totalFunded || 0).toLocaleString()} 🪙
                      </span>
                      <span className="text-[8px] text-gray-400 block">
                        {p.investorCount || 0} lượt
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Detailed View, Canvas, & Comments (3 cols) */}
        <div className="md:col-span-3 space-y-6">
          {selectedProject ? (
            <div className="space-y-6">
              
              {/* Project main details */}
              <Card>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b pb-4 mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#FFF4E8] border border-orange-100 flex items-center justify-center text-3xl shadow-sm">
                      {selectedProject.logoUrl || '💡'}
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-gray-800 leading-tight">{selectedProject.name}</h2>
                      <p className="text-xs text-gray-400 font-bold mt-1 uppercase">
                        Đội ngũ sáng lập: <span className="text-[#FF6B00]">{selectedProject.team?.name}</span>
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/30 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Coins className="w-3 h-3 text-yellow-500 fill-yellow-500/20" />
                          Đã gọi vốn: {((selectedProject.investments || []).reduce((sum: number, inv: any) => sum + inv.amount, 0)).toLocaleString()} StudyCoins
                        </span>
                        <span className="bg-blue-500/15 text-blue-500 border border-blue-500/30 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                          {selectedProject.investments?.length || 0} Nhà đầu tư
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleVote}
                      className={`px-3.5 py-2 rounded-xl text-[10px] font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5 shrink-0 border ${
                        hasUserVoted(selectedProject)
                          ? 'bg-red-500 border-red-500 text-white'
                          : 'bg-white border-gray-200 text-gray-650 hover:bg-gray-50'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${hasUserVoted(selectedProject) ? 'fill-current' : ''}`} />
                      Yêu thích ({selectedProject._count?.votes || 0})
                    </button>

                    {selectedProject.pitchVideoUrl && (
                      <a
                        href={selectedProject.pitchVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl text-[10px] font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5 shrink-0"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Xem Video Pitching
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                      Tóm tắt ý tưởng & Mô tả giải pháp
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">
                      {selectedProject.description}
                    </p>
                  </div>

                  {/* Canvas Showcase Grid */}
                  {parseCanvas(selectedProject.canvasModel) ? (
                    <div className="mt-6 border border-gray-150 rounded-2xl overflow-hidden bg-gray-50/50">
                      <div className="bg-gradient-to-r from-[#FF6B00] to-[#FF801A] text-white p-3.5 flex items-center justify-between border-b">
                        <span className="text-xs font-black flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4" /> Mô Hình Kinh Doanh Canvas (Business Model Canvas)
                        </span>
                        <span className="text-[8px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Trưng bày công khai
                        </span>
                      </div>

                      <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px] text-gray-600 leading-relaxed font-medium">
                        
                        <div className="p-3.5 rounded-xl bg-white border border-gray-100 space-y-1">
                          <strong className="text-gray-800 text-[10px] uppercase block mb-1">🏆 Tuyên bố giá trị:</strong>
                          <p>{parseCanvas(selectedProject.canvasModel).valuePropositions}</p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white border border-gray-100 space-y-1">
                          <strong className="text-gray-800 text-[10px] uppercase block mb-1">👥 Phân khúc KH:</strong>
                          <p>{parseCanvas(selectedProject.canvasModel).customerSegments}</p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white border border-gray-100 space-y-1">
                          <strong className="text-gray-800 text-[10px] uppercase block mb-1">🤝 Đối tác chính:</strong>
                          <p>{parseCanvas(selectedProject.canvasModel).keyPartners}</p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white border border-gray-100 space-y-1">
                          <strong className="text-gray-800 text-[10px] uppercase block mb-1">⚡ Hoạt động chính:</strong>
                          <p>{parseCanvas(selectedProject.canvasModel).keyActivities}</p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white border border-gray-100 space-y-1">
                          <strong className="text-gray-800 text-[10px] uppercase block mb-1">📣 Kênh tiếp cận:</strong>
                          <p>{parseCanvas(selectedProject.canvasModel).channels}</p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white border border-gray-100 space-y-1">
                          <strong className="text-gray-800 text-[10px] uppercase block mb-1">💰 Dòng doanh thu:</strong>
                          <p>{parseCanvas(selectedProject.canvasModel).revenueStreams}</p>
                        </div>

                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed rounded-2xl text-gray-400 text-xs font-semibold">
                      💡 Nhóm chưa cập nhật Mô hình kinh doanh Canvas cho dự án này.
                    </div>
                  )}
                </div>
              </Card>

              {/* Crowdfunding Simulator Form Card */}
              <Card className="bg-[#181824] border-gray-800 text-white p-5 rounded-3xl">
                <h3 className="font-black text-xs text-[#FF6B00] flex items-center gap-1.5 mb-3 uppercase tracking-wider">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  Đầu Tư Gọi Vốn Giập Lập (Crowdfunding)
                </h3>
                <p className="text-[10px] text-gray-405 mb-4 leading-relaxed font-medium">
                  Đánh giá dự án khởi nghiệp này bằng cách rót vốn StudyCoins của bạn. Dự án gọi vốn thành công nhất lớp học sẽ nhận được điểm cộng chuyên môn từ Giảng viên.
                </p>

                <form onSubmit={handleInvest} className="space-y-4">
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">
                      Nhập số StudyCoins muốn đầu tư (Số dư ví: {(user?.balance !== undefined ? user.balance : 100000).toLocaleString()} 🪙)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        step="1000"
                        value={investmentAmount}
                        onChange={e => setInvestmentAmount(e.target.value)}
                        disabled={investing}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] font-black text-white"
                        placeholder="Ví dụ: 10000"
                      />
                      <button
                        type="submit"
                        disabled={investing || !investmentAmount}
                        className="px-5 bg-[#FF6B00] hover:bg-[#E85A00] text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1 disabled:opacity-50 shrink-0"
                      >
                        {investing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Rót vốn đầu tư 🪙'}
                      </button>
                    </div>
                  </div>

                  {/* Quick select buttons */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['1000', '5000', '10000', '25000', '50000'].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        disabled={investing}
                        onClick={() => setInvestmentAmount(preset)}
                        className={`px-3 py-1.5 border rounded-lg text-[10px] font-bold transition ${
                          investmentAmount === preset
                            ? 'bg-[#FF6B00]/25 border-[#FF6B00] text-[#FF6B00]'
                            : 'border-white/10 hover:border-white/20 text-gray-300'
                        }`}
                      >
                        +{Number(preset).toLocaleString()} 🪙
                      </button>
                    ))}
                  </div>
                </form>
              </Card>

              {/* Comments / Discussion board */}
              <Card>
                <h3 className="font-bold text-gray-800 text-xs border-b pb-2 mb-4 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-orange-500" />
                  Bảng thảo luận & Phản biện dự án ({comments.length})
                </h3>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {loadingComments ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-[#FF6B00]" />
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic text-center py-4">Chưa có bình luận thảo luận nào. Hãy gửi câu hỏi đầu tiên!</p>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="flex gap-2.5 text-xs font-medium leading-relaxed bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                        <div className="w-7 h-7 rounded-full bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center font-black text-[10px] shrink-0">
                          {c.user?.avatar ? (
                            <img src={c.user.avatar} alt={c.user.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            c.user?.name.charAt(0) || <User className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-gray-800">{c.user?.name}</span>
                            <span className={`px-1.5 py-0.2 bg-gray-100 text-[8px] font-bold rounded text-gray-400 uppercase`}>
                              {c.user?.role === 'manager' ? 'Giảng viên' : c.user?.role === 'admin' ? 'Admin' : 'Sinh viên'}
                            </span>
                            <span className="text-[9px] text-gray-400 font-bold">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-600 mt-1">{c.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleCommentSubmit} className="mt-4 flex gap-2 border border-gray-250 p-1.5 rounded-xl bg-gray-50 focus-within:border-[#FF6B00] transition">
                  <input
                    type="text"
                    placeholder="Nhập câu hỏi phản biện hoặc góp ý của bạn..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    className="w-full text-xs focus:outline-none bg-transparent px-2 font-medium"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-[#FF6B00] text-white rounded-lg hover:bg-[#E85A00] transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </Card>

            </div>
          ) : (
            <div className="bg-white p-16 text-center rounded-2xl border border-gray-100 text-gray-400 text-xs font-semibold shadow-sm">
              👈 Vui lòng chọn một dự án ở danh sách bên trái để xem thông tin chi tiết, mô hình kinh doanh và thảo luận phản biện.
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
