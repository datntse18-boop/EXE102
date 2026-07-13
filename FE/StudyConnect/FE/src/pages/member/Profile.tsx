import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { userService, feedbackService } from '../../services/apiServices'
import Card from '../../components/cards/Card'
import { Mail, Sparkles, Clock, BookOpen, Code, Award, Loader2, MessageSquare, Send, Check } from 'lucide-react'

export default function Profile() {
  const { user, role, updateUserData } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [avatar, setAvatar] = useState(user?.avatar || '👤')
  const [skills, setSkills] = useState(user?.skills || '')
  const [desiredRole, setDesiredRole] = useState(user?.desiredRole || '')
  const [commitmentHours, setCommitmentHours] = useState<number>(user?.commitmentHours || 10)
  const [pastProjects, setPastProjects] = useState(user?.pastProjects || '')
  const [classCode, setClassCode] = useState(user?.classCode || '')
  
  const [updating, setUpdating] = useState(false)

  // Feedback states
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [feedbackContent, setFeedbackContent] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false)

  const loadFeedbacks = async () => {
    setLoadingFeedbacks(true)
    try {
      const data = await feedbackService.getMyFeedbacks()
      setFeedbacks(data)
    } catch (err) {
      console.error('Failed to load feedbacks:', err)
    } finally {
      setLoadingFeedbacks(false)
    }
  }

  useEffect(() => {
    loadFeedbacks()
  }, [])

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedbackContent.trim()) return

    setSubmittingFeedback(true)
    try {
      await feedbackService.submitFeedback(feedbackContent)
      setFeedbackContent('')
      alert('Gửi góp ý thành công! Cảm ơn ý kiến của bạn. 🙌')
      loadFeedbacks()
    } catch (err) {
      console.error(err)
      alert('Gửi góp ý thất bại. Vui lòng thử lại.')
    } finally {
      setSubmittingFeedback(false)
    }
  }

  // Dynamic Badges calculation
  const badgesList = [
    {
      id: 'startup_pioneer',
      name: 'Startup Pioneer',
      description: 'Đã điền kinh nghiệm làm dự án khởi nghiệp.',
      unlocked: !!user?.pastProjects && user.pastProjects.trim().length > 10,
      icon: '🚀',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'commitment_master',
      name: 'Commitment Master',
      description: 'Cam kết thời gian hoạt động từ 15h/tuần trở lên.',
      unlocked: (user?.commitmentHours || 0) >= 15,
      icon: '⏱️',
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'finance_expert',
      name: 'Finance Expert',
      description: 'Kỹ năng chuyên môn hoặc vai trò thiên về tài chính/PM.',
      unlocked: !!user?.desiredRole && ['Biz', 'Leader'].includes(user.desiredRole),
      icon: '💰',
      color: 'from-amber-500 to-orange-600'
    },
    {
      id: 'tech_ninja',
      name: 'Tech Ninja',
      description: 'Có kỹ năng lập trình hoặc UI/UX designer.',
      unlocked: !!user?.desiredRole && ['Developer', 'Designer'].includes(user.desiredRole),
      icon: '🥷',
      color: 'from-red-500 to-pink-600'
    },
    {
      id: 'class_connected',
      name: 'Class Connecter',
      description: 'Đã gia nhập mã lớp học chính thức.',
      unlocked: !!user?.classCode && user.classCode.trim().length > 0,
      icon: '🏫',
      color: 'from-purple-500 to-fuchsia-600'
    }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    try {
      const updatedUser = await userService.updateProfile({
        name,
        avatar,
        skills,
        desiredRole,
        commitmentHours: Number(commitmentHours),
        pastProjects,
        classCode
      })
      
      // Update local AuthContext user state
      if (updateUserData) {
        updateUserData(updatedUser)
      }
      alert('Cập nhật thông tin cá nhân thành công! ✨')
    } catch (err) {
      console.error(err)
      alert('Cập nhật thất bại. Vui lòng thử lại.')
    } finally {
      setUpdating(false)
    }
  }

  const avatars = ['👤', '👨‍💻', '👩‍💻', '🚀', '🎨', '💼', '🎓', '🧠', '🌟']

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-10">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#FF6B00] via-[#FF801A] to-[#FFA64D] text-white rounded-3xl p-8 shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-5xl shadow-md border border-white/20">
            {avatar}
          </div>
          <div className="text-center sm:text-left space-y-1.5">
            <h1 className="text-2xl font-black">{user?.name}</h1>
            <p className="text-sm opacity-90 flex items-center gap-1 justify-center sm:justify-start">
              <Mail className="w-4 h-4" /> {user?.email}
            </p>
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {role === 'member' ? 'Sinh viên' : role === 'manager' ? 'Giảng viên' : role === 'leader' ? 'Quản lý (Dean)' : 'Admin'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left column: Quick Stats & Avatar Picker */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider border-b pb-2 mb-4">
              Chọn Avatar biểu tượng
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {avatars.map(av => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setAvatar(av)}
                  className={`text-3xl p-2 rounded-2xl border-2 transition duration-200 hover:scale-105 ${
                    avatar === av ? 'border-[#FF6B00] bg-orange-50/50' : 'border-gray-100 hover:border-orange-100'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </Card>

          <Card className="bg-orange-50/20 border border-orange-100/50">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#FF6B00]" />
              <h4 className="font-bold text-gray-800 text-xs">Mẹo ghép nhóm thông minh</h4>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Điền đầy đủ **Kỹ năng chuyên môn** và **Vai trò mong muốn** giúp thuật toán AI của StudyConnect định hình nhóm chính xác và giới thiệu bạn đến các dự án phù hợp nhất!
            </p>
          </Card>

          <Card>
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider border-b pb-2 mb-4">
              Huy hiệu thành tích (Badges Shelf)
            </h3>
            <div className="space-y-3">
              {badgesList.map(badge => (
                <div 
                  key={badge.id} 
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition ${
                    badge.unlocked 
                      ? 'bg-white dark:bg-[#181824] border-orange-500/20 shadow-sm' 
                      : 'bg-gray-50/50 dark:bg-gray-950/20 border-gray-100 dark:border-gray-800/40 opacity-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${badge.unlocked ? badge.color : 'from-gray-300 to-gray-400 dark:from-gray-800 dark:to-gray-900'} flex items-center justify-center text-lg shadow-md text-white font-bold flex-shrink-0`}>
                    {badge.icon}
                  </div>
                  <div>
                    <h4 className={`text-xs font-black flex items-center gap-1.5 ${badge.unlocked ? 'text-gray-800 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                      {badge.name} 
                      {badge.unlocked && <span className="text-[8px] bg-orange-500/10 text-[#FF6B00] px-1 rounded font-black uppercase">Đạt</span>}
                    </h4>
                    <p className="text-[9px] text-gray-450 font-semibold mt-0.5">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column: Edit Profile Form */}
        <div className="md:col-span-2">
          <Card>
            <h3 className="font-bold text-gray-800 text-sm border-b pb-3 mb-6">
              Cập nhật hồ sơ năng lực & Thông tin chi tiết
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Họ và Tên
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Vai trò mong muốn trong nhóm
                  </label>
                  <select
                    value={desiredRole}
                    onChange={e => setDesiredRole(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] bg-white font-medium"
                  >
                    <option value="">Chọn vai trò...</option>
                    <option value="Developer">Lập trình viên (Developer)</option>
                    <option value="Designer">Thiết kế UI/UX (Designer)</option>
                    <option value="Biz">Quản trị kinh doanh (Business Developer)</option>
                    <option value="Marketer">Tiếp thị & Quảng cáo (Marketer)</option>
                    <option value="Leader">Trưởng nhóm điều phối (Project Manager)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Kỹ năng chuyên môn
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-gray-400">
                    <Code className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Ví dụ: React, Photoshop, Pitching, Marketing..."
                    value={skills}
                    onChange={e => setSkills(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Thời gian cam kết (Giờ/tuần)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-gray-400">
                      <Clock className="w-4 h-4" />
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={commitmentHours}
                      onChange={e => setCommitmentHours(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    {role === 'manager' ? 'Mã Lớp Học Của Bạn (Để sinh viên kết nối)' : 'Mã Lớp Học (Giảng viên cung cấp)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-gray-400">
                      <BookOpen className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      disabled={role !== 'manager'}
                      value={classCode}
                      onChange={e => setClassCode(e.target.value.toUpperCase())}
                      placeholder={role === 'manager' ? "Ví dụ: EXE101_CLASS_A" : "Chưa tham gia lớp nào"}
                      className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs ${
                        role === 'manager' 
                          ? 'border-gray-200 focus:outline-none focus:border-[#FF6B00] bg-white dark:bg-[#13131C] text-gray-700 dark:text-gray-300' 
                          : 'border-gray-150 bg-gray-50 dark:bg-gray-950/40 text-gray-400 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Kinh nghiệm / Dự án cũ từng làm
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-gray-400">
                    <Award className="w-4 h-4" />
                  </span>
                  <textarea
                    rows={4}
                    placeholder="Mô tả ngắn gọn các dự án bạn đã từng tham gia hoặc kết quả học tập cũ..."
                    value={pastProjects}
                    onChange={e => setPastProjects(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] bg-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-3 bg-[#FF6B00] hover:bg-[#E85A00] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition duration-200 flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : (
                    'Lưu Thay Đổi Hồ Sơ'
                  )}
                </button>
              </div>

            </form>
          </Card>
        </div>
      </div>

      {/* Feedback Section */}
      <Card className="mt-8 bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-800/80">
        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-850 pb-3 mb-6">
          <MessageSquare className="w-5 h-5 text-[#FF6B00]" />
          <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">
            Góp ý & Phản hồi cho Hệ thống StudyConnect
          </h3>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Submit form */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Gửi góp ý mới
            </h4>
            <form onSubmit={handleFeedbackSubmit} className="space-y-3">
              <textarea
                value={feedbackContent}
                onChange={e => setFeedbackContent(e.target.value)}
                placeholder="Nhập ý kiến đóng góp, báo lỗi hoặc đề xuất tính năng của bạn tại đây..."
                rows={4}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#FF6B00] bg-gray-50/50 dark:bg-[#1C1C28] text-gray-900 dark:text-white"
                required
              />
              <button
                type="submit"
                disabled={submittingFeedback}
                className="px-5 py-2.5 bg-[#FF6B00] hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingFeedback ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Gửi góp ý
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Feedback list */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Lịch sử góp ý & Phản hồi
            </h4>
            
            {loadingFeedbacks ? (
              <div className="flex items-center justify-center py-6 text-gray-500 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-[#FF6B00] mr-2" /> Đang tải lịch sử...
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="text-center py-8 text-gray-400 dark:text-gray-600 text-xs border-2 border-dashed border-gray-100 dark:border-gray-800/40 rounded-2xl">
                Bạn chưa gửi góp ý nào cho hệ thống.
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {feedbacks.map((f: any) => (
                  <div key={f.id} className="p-3 bg-gray-50/75 dark:bg-[#1C1C28]/60 border border-gray-150/40 dark:border-gray-850/40 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-[10px] text-gray-400 dark:text-gray-500">
                      <span>Gửi lúc: {new Date(f.createdAt).toLocaleString('vi-VN')}</span>
                      {f.reply ? (
                        <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">Đã phản hồi</span>
                      ) : (
                        <span className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-bold">Đang chờ</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-750 dark:text-gray-300 font-medium leading-relaxed">
                      {f.content}
                    </p>
                    {f.reply && (
                      <div className="p-2.5 bg-emerald-500/5 dark:bg-emerald-950/10 border-l-2 border-emerald-500 rounded-r-xl space-y-1 mt-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-450">
                          <Check className="w-3.5 h-3.5" />
                          Phản hồi từ Admin:
                        </div>
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed italic">
                          {f.reply}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
      
    </div>
  )
}
