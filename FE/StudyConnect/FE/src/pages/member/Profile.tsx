import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { userService } from '../../services/apiServices'
import Card from '../../components/cards/Card'
import { Mail, Sparkles, Clock, BookOpen, Code, Award, Loader2 } from 'lucide-react'

export default function Profile() {
  const { user, role, updateUserData } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [avatar, setAvatar] = useState(user?.avatar || '👤')
  const [skills, setSkills] = useState(user?.skills || '')
  const [desiredRole, setDesiredRole] = useState(user?.desiredRole || '')
  const [commitmentHours, setCommitmentHours] = useState<number>(user?.commitmentHours || 10)
  const [pastProjects, setPastProjects] = useState(user?.pastProjects || '')
  
  const [updating, setUpdating] = useState(false)

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
        pastProjects
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
                    Mã Lớp Học (Giảng viên cung cấp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-gray-400">
                      <BookOpen className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      disabled
                      value={user?.classCode || 'Chưa tham gia lớp nào'}
                      className="w-full border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-xs bg-gray-50 text-gray-400 cursor-not-allowed"
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
      
    </div>
  )
}
