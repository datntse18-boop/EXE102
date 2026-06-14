import { useEffect, useState } from 'react'
import { jobService, teamService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/cards/Card'
import { Briefcase, Loader2, Search, Plus, UserPlus, Eye, Check, X, FileText, Clock, Sparkles } from 'lucide-react'

export default function JobBoard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'browse' | 'leader'>('browse')
  const [jobPosts, setJobPosts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  // Leader/Team state
  const [ledTeams, setLedTeams] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [myTeamPosts, setMyTeamPosts] = useState<any[]>([])
  const [selectedPost, setSelectedPost] = useState<any>(null)
  const [applicants, setApplicants] = useState<any[]>([])
  const [loadingApplicants, setLoadingApplicants] = useState(false)

  // Modals / Forms
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyingPost, setApplyingPost] = useState<any>(null)
  const [introduction, setIntroduction] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [submittingApply, setSubmittingApply] = useState(false)

  // Create Post Form States
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newHours, setNewHours] = useState(5)
  const [submittingPost, setSubmittingPost] = useState(false)

  const loadBrowseJobs = async () => {
    setLoading(true)
    try {
      const data = await jobService.getJobPosts({ search })
      setJobPosts(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadLeaderDashboard = async () => {
    try {
      const data = await teamService.getTeams()
      const led = data.filter((t: any) => t.leaderId === user?.id)
      setLedTeams(led)
      if (led.length > 0) {
        setSelectedTeamId(led[0].id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const loadMyTeamPosts = async () => {
    if (!selectedTeamId) return
    setLoading(true)
    try {
      // Get all posts, then filter by teamId
      const allPosts = await jobService.getJobPosts()
      const teamPosts = allPosts.filter((p: any) => p.teamId === selectedTeamId)
      setMyTeamPosts(teamPosts)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'browse') {
      loadBrowseJobs()
    } else {
      loadLeaderDashboard()
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'leader' && selectedTeamId) {
      loadMyTeamPosts()
    }
  }, [selectedTeamId])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadBrowseJobs()
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeamId || !newTitle || !newDesc) {
      alert('Vui lòng điền đủ thông tin.')
      return
    }

    setSubmittingPost(true)
    try {
      await jobService.createJobPost({
        teamId: selectedTeamId,
        title: newTitle,
        description: newDesc,
        commitmentHours: newHours
      })
      alert('Đăng tin tuyển dụng thành công!')
      setNewTitle('')
      setNewDesc('')
      setNewHours(5)
      setShowCreateModal(false)
      loadMyTeamPosts()
    } catch (err) {
      console.error(err)
      alert('Không thể đăng tin.')
    } finally {
      setSubmittingPost(false)
    }
  }

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!applyingPost || !introduction) return
    setSubmittingApply(true)
    try {
      await jobService.applyJob({
        jobPostId: applyingPost.id,
        introduction
      })
      alert('Gửi hồ sơ ứng tuyển thành công! Trưởng nhóm sẽ sớm liên hệ với bạn.')
      setIntroduction('')
      setShowApplyModal(false)
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || 'Nộp đơn ứng tuyển thất bại.')
    } finally {
      setSubmittingApply(false)
    }
  }

  const handleViewApplicants = async (post: any) => {
    setSelectedPost(post)
    setLoadingApplicants(true)
    try {
      const data = await jobService.getApplications(post.id)
      setApplicants(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingApplicants(false)
    }
  }

  const handleReviewApplication = async (appId: string, status: 'accepted' | 'rejected') => {
    const confirmation = window.confirm(`Bạn có chắc muốn ${status === 'accepted' ? 'Duyệt nhận' : 'Từ chối'} ứng viên này?`)
    if (!confirmation) return

    try {
      await jobService.reviewApplication(appId, status)
      alert(`Đã ${status === 'accepted' ? 'duyệt nhận' : 'từ chối'} ứng viên thành công.`)
      // Refresh applicants list
      if (selectedPost) {
        handleViewApplicants(selectedPost)
      }
      loadMyTeamPosts()
    } catch (err) {
      console.error(err)
      alert('Không thể thực hiện tác vụ.')
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1B1B22] via-[#2D2D38] to-[#1B1B22] text-white rounded-3xl p-8 shadow-xl border border-gray-800">
        <div className="relative z-10 max-w-xl">
          <span className="bg-[#FF6B00] px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm flex items-center gap-1.5 w-max">
            <Briefcase className="w-3.5 h-3.5" />
            Startup Talent Recruitment Board
          </span>
          <h1 className="text-3xl font-black mt-4 tracking-tight leading-none text-white">
            Bảng tin tuyển dụng thành viên 💼
          </h1>
          <p className="text-sm text-gray-300 mt-3 font-medium opacity-90 leading-relaxed">
            Nơi kết nối cơ hội. Tìm kiếm các vị trí còn khuyết trong các nhóm dự án hoặc đăng tin tuyển dụng nhân tài bổ sung chuyên môn cho Startup của bạn.
          </p>
        </div>
        <div className="absolute right-8 bottom-0 top-0 opacity-10 w-1/4 flex items-center justify-center pointer-events-none">
          <span className="text-9xl">💼</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => { setActiveTab('browse'); setSelectedPost(null); }}
          className={`pb-3.5 px-6 font-black text-xs transition duration-300 border-b-2 ${activeTab === 'browse' ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          🔍 Tìm việc / Tìm nhóm
        </button>
        <button
          onClick={() => setActiveTab('leader')}
          className={`pb-3.5 px-6 font-black text-xs transition duration-300 border-b-2 ${activeTab === 'leader' ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          👑 Quản lý tuyển dụng của bạn
        </button>
      </div>

      {activeTab === 'browse' ? (
        /* BROWSE POSTS TAB */
        <div className="space-y-6">
          <form onSubmit={handleSearchSubmit} className="flex gap-2.5 bg-white p-2.5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex-1 flex items-center gap-2 px-3 border border-gray-200 rounded-xl focus-within:border-[#FF6B00] transition">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm vai trò (Frontend, Designer, Marketer) hoặc tên dự án..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full py-2.5 text-xs focus:outline-none bg-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#FF6B00] text-white text-[11px] font-bold rounded-xl shadow-md hover:bg-[#E85A00] transition"
            >
              Tìm kiếm
            </button>
          </form>

          {loading ? (
            <div className="flex justify-center p-12 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00] mr-2" /> Đang tìm kiếm tin tuyển dụng...
            </div>
          ) : jobPosts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400 text-xs font-semibold shadow-sm">
              📭 Chưa tìm thấy tin tuyển dụng nào phù hợp.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobPosts.map(post => (
                <Card key={post.id} className="flex flex-col justify-between hover:shadow-md transition">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start border-b pb-2">
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block">Nhóm: {post.team?.name}</span>
                        <h4 className="font-black text-gray-800 text-sm mt-0.5">{post.title}</h4>
                      </div>
                      <span className="px-2 py-0.5 bg-orange-50 text-[#FF6B00] text-[9px] font-black rounded-lg border border-orange-100 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {post.commitmentHours}h/tuần
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 font-medium leading-relaxed min-h-[60px] line-clamp-3">
                      {post.description}
                    </p>
                  </div>

                  <div className="border-t pt-3.5 mt-4 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-medium">Đăng bởi: {post.team?.leader?.name}</span>
                    <button
                      onClick={() => { setApplyingPost(post); setShowApplyModal(true); }}
                      className="px-3.5 py-1.5 bg-[#FF6B00] text-white text-[10px] font-black rounded-lg shadow-sm hover:bg-[#E85A00] transition flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Ứng tuyển ngay
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* LEADER recruitment dashboard */
        <div className="grid md:grid-cols-5 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <div className="flex items-center justify-between border-b pb-2.5 mb-4">
                <h3 className="font-bold text-gray-800 text-sm">Tin tuyển dụng của Nhóm</h3>
                {ledTeams.length > 0 && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="p-1.5 bg-[#FF6B00] text-white rounded-lg hover:bg-[#E85A00] transition flex items-center justify-center shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {ledTeams.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-xs font-semibold leading-normal">
                  ⚠ Bạn không làm trưởng nhóm của dự án nào để tạo tin tuyển dụng.
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Chọn nhóm bạn quản lý
                    </label>
                    <select
                      value={selectedTeamId}
                      onChange={e => setSelectedTeamId(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF6B00] bg-white font-bold"
                    >
                      {ledTeams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3.5">
                    {myTeamPosts.length === 0 ? (
                      <p className="text-[10px] text-gray-400 italic">Nhóm chưa đăng tuyển vị trí nào.</p>
                    ) : (
                      myTeamPosts.map(p => (
                        <div key={p.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="font-black text-gray-800 block">{p.title}</span>
                            <span className={`text-[9px] font-bold ${p.status === 'open' ? 'text-green-600' : 'text-gray-400'}`}>
                              Trạng thái: {p.status === 'open' ? 'Đang tuyển' : 'Đã đóng'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleViewApplicants(p)}
                            className="px-2.5 py-1 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition text-[9px] font-bold flex items-center gap-1 shadow-sm"
                          >
                            <Eye className="w-3 h-3" /> Xem ứng viên
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="md:col-span-3 space-y-6">
            <Card>
              <h3 className="font-bold text-gray-800 text-sm border-b pb-2.5 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-500" />
                Danh sách ứng viên ứng tuyển {selectedPost && `vào vị trí "${selectedPost.title}"`}
              </h3>

              {!selectedPost ? (
                <div className="text-center py-16 text-gray-400 text-xs font-semibold">
                  👈 Chọn một vị trí tuyển dụng để duyệt danh sách ứng viên nộp đơn.
                </div>
              ) : loadingApplicants ? (
                <div className="flex justify-center py-16 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00]" />
                </div>
              ) : applicants.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-xs font-semibold">
                  📭 Chưa có sinh viên nào nộp hồ sơ vào vị trí này.
                </div>
              ) : (
                <div className="space-y-4">
                  {applicants.map(app => (
                    <div key={app.id} className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100 hover:border-orange-100 transition space-y-4 text-xs font-medium">
                      <div className="flex justify-between items-start border-b pb-2">
                        <div>
                          <span className="font-black text-sm text-gray-800 block">{app.user?.name}</span>
                          <span className="text-[10px] text-gray-400 font-bold block">{app.user?.email}</span>
                        </div>
                        {app.status === 'pending' ? (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleReviewApplication(app.id, 'accepted')}
                              className="px-2.5 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-1 font-bold text-[9px] shadow-sm"
                            >
                              <Check className="w-3 h-3" /> Nhận
                            </button>
                            <button
                              onClick={() => handleReviewApplication(app.id, 'rejected')}
                              className="px-2.5 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-1 font-bold text-[9px] shadow-sm"
                            >
                              <X className="w-3 h-3" /> Từ chối
                            </button>
                          </div>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${app.status === 'accepted' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
                            {app.status === 'accepted' ? 'Đã nhận' : 'Đã loại'}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-gray-100 text-[10px]">
                        <div>
                          <span className="font-bold text-gray-400 block mb-0.5">Kỹ năng:</span>
                          <p className="text-gray-700 font-bold">{app.user?.skills || 'Chưa cập nhật'}</p>
                        </div>
                        <div>
                          <span className="font-bold text-gray-400 block mb-0.5">Vai trò mong muốn:</span>
                          <p className="text-gray-700 font-bold">{app.user?.desiredRole || 'Chưa cập nhật'}</p>
                        </div>
                        <div>
                          <span className="font-bold text-gray-400 block mb-0.5">Giờ cam kết/tuần:</span>
                          <p className="text-gray-700 font-bold">{app.user?.commitmentHours ? `${app.user.commitmentHours}h` : 'Chưa cập nhật'}</p>
                        </div>
                        <div>
                          <span className="font-bold text-gray-400 block mb-0.5">Kinh nghiệm dự án cũ:</span>
                          <p className="text-gray-700 font-bold">{app.user?.pastProjects || 'Chưa cập nhật'}</p>
                        </div>
                      </div>

                      <div>
                        <span className="font-bold text-gray-400 block mb-1 text-[10px]">Thư giới thiệu ứng viên:</span>
                        <p className="bg-white p-3 rounded-xl border border-gray-100 text-gray-600 leading-relaxed text-[11px]">
                          "{app.introduction}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* CREATE JOB POST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-gray-100 shadow-2xl animate-scaleUp">
            <h3 className="text-lg font-black text-gray-800 mb-4">
              Đăng tin tuyển dụng mới
            </h3>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Vị trí tuyển dụng *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lập trình viên React, Chuyên viên Marketing..."
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Thời gian cam kết (Số giờ/tuần) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  required
                  value={newHours}
                  onChange={e => setNewHours(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Mô tả công việc & Yêu cầu kỹ năng *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Ví dụ: Thiết kế giao diện UI/UX cho ứng dụng di động, có kinh nghiệm sử dụng Figma, cam kết thời gian hoàn thành task đúng hạn..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#FF6B00] resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={submittingPost}
                  className="flex-1 py-2.5 bg-[#FF6B00] text-white text-[11px] font-bold rounded-xl shadow-md hover:bg-[#E85A00] transition flex items-center justify-center"
                >
                  {submittingPost ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Đăng tuyển'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-500 text-[11px] font-bold rounded-xl hover:bg-gray-50 transition"
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPLY JOB MODAL */}
      {showApplyModal && applyingPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-gray-100 shadow-2xl animate-scaleUp">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-black text-gray-800">
                Ứng tuyển vị trí: {applyingPost.title}
              </h3>
            </div>
            <p className="text-[10px] text-gray-400 leading-normal mb-4">
              * Dự án: {applyingPost.team?.name}. Nhóm sẽ xem thông tin Hồ sơ Năng lực cá nhân của bạn (Kỹ năng, Kinh nghiệm, Vai trò mong muốn) đính kèm cùng thư giới thiệu này.
            </p>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Thư giới thiệu bản thân & Lý do ứng tuyển *
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Hãy viết một bức thư ngắn (ví dụ: Mình đã có kinh nghiệm làm Figma 1 năm, rất có hứng thú với ý tưởng của nhóm và cam kết hoạt động năng nổ...)"
                  value={introduction}
                  onChange={e => setIntroduction(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={submittingApply}
                  className="flex-1 py-2.5 bg-[#FF6B00] text-white text-[11px] font-bold rounded-xl shadow-md hover:bg-[#E85A00] transition flex items-center justify-center"
                >
                  {submittingApply ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gửi hồ sơ ứng tuyển'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowApplyModal(false); setIntroduction(''); }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-500 text-[11px] font-bold rounded-xl hover:bg-gray-50 transition"
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
