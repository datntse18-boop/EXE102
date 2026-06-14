import { useEffect, useState } from 'react'
import { teamService, mentoringService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/cards/Card'
import { Calendar, Clock, Sparkles, Loader2, Video, CheckCircle, Plus } from 'lucide-react'

export default function MentorshipBooking() {
  const { user, role } = useAuth()
  const [slots, setSlots] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Booking form states (for student)
  const [selectedSlotId, setSelectedSlotId] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [topic, setTopic] = useState('')
  const [booking, setBooking] = useState(false)

  // Creation form states (for lecturer)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [meetingLink, setMeetingLink] = useState('')
  const [creatingSlot, setCreatingSlot] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      // Fetch slots
      const slotsData = await mentoringService.getSlots()
      setSlots(slotsData)

      // Fetch student teams if member
      if (role === 'member') {
        const teamsData = await teamService.getTeams()
        setTeams(teamsData)
        if (teamsData.length > 0) {
          setSelectedTeamId(teamsData[0].id)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [role])

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlotId || !selectedTeamId || !topic) {
      alert('Vui lòng chọn lịch hẹn, nhóm và điền chủ đề trao đổi')
      return
    }

    setBooking(true)
    try {
      await mentoringService.bookSlot(selectedSlotId, selectedTeamId, topic)
      alert('Đặt lịch hẹn cố vấn thành công! Lịch hẹn đã được xác nhận.')
      setTopic('')
      setSelectedSlotId('')
      loadData()
    } catch (err) {
      console.error(err)
      alert('Đặt lịch hẹn thất bại.')
    } finally {
      setBooking(false)
    }
  }

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startTime || !endTime) {
      alert('Vui lòng chọn thời gian bắt đầu và kết thúc')
      return
    }

    setCreatingSlot(true)
    try {
      await mentoringService.createSlot({
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        meetingLink: meetingLink || undefined
      })
      alert('Tạo lịch cố vấn trống thành công!')
      setStartTime('')
      setEndTime('')
      setMeetingLink('')
      loadData()
    } catch (err) {
      console.error(err)
      alert('Không thể tạo lịch rảnh. Vui lòng kiểm tra lại.')
    } finally {
      setCreatingSlot(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-20 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00] mr-2" /> Đang tải lịch đặt hẹn...
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#FF6B00] via-[#FF801A] to-[#FFA64D] text-white rounded-3xl p-8 shadow-xl">
        <div className="relative z-10 max-w-xl">
          <span className="bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-max">
            <Clock className="w-3.5 h-3.5" />
            1-on-1 Office Hours Booking
          </span>
          <h1 className="text-3xl font-black mt-4 tracking-tight leading-none text-white">
            Đặt Lịch Cố Vấn 1-on-1 📅
          </h1>
          <p className="text-sm text-orange-50 mt-3 font-medium opacity-95 leading-relaxed">
            {role === 'manager' 
              ? 'Tạo các khung giờ rảnh và cung cấp link họp Zoom/Meet để hỗ trợ tư vấn trực tuyến cho các nhóm dự án sinh viên.' 
              : 'Đăng ký các slot rảnh của giảng viên hướng dẫn để được định hướng trực tiếp về Canvas, thị trường hoặc MVP.'}
          </p>
        </div>
        <div className="absolute right-8 bottom-0 top-0 opacity-15 w-1/4 flex items-center justify-center pointer-events-none">
          <span className="text-9xl">📅</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* LEFT PANEL: Action form based on role */}
        <div className="md:col-span-1 space-y-6">
          {role === 'manager' ? (
            /* Lecturer Creates Slot Form */
            <Card>
              <h3 className="font-bold text-gray-800 text-sm border-b pb-2 mb-4 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-[#FF6B00]" />
                Tạo khung giờ rảnh mới
              </h3>

              <form onSubmit={handleCreateSlot} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Bắt đầu *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Kết thúc *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Link họp trực tuyến (Google Meet/Zoom)
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={meetingLink}
                    onChange={e => setMeetingLink(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingSlot}
                  className="w-full py-2.5 bg-[#FF6B00] hover:bg-[#E85A00] text-white text-[11px] font-bold rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {creatingSlot ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang tạo slot...
                    </>
                  ) : (
                    'Mở khung giờ rảnh'
                  )}
                </button>
              </form>
            </Card>
          ) : (
            /* Student Books Slot Form */
            <Card>
              <h3 className="font-bold text-gray-800 text-sm border-b pb-2 mb-4 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#FF6B00]" />
                Đăng ký lịch hẹn với Mentor
              </h3>

              <form onSubmit={handleBook} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Chọn nhóm dự án đăng ký *
                  </label>
                  <select
                    value={selectedTeamId}
                    onChange={e => setSelectedTeamId(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] bg-white font-bold"
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Chọn giờ hẹn trống *
                  </label>
                  <select
                    value={selectedSlotId}
                    onChange={e => setSelectedSlotId(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] bg-white font-semibold text-gray-700"
                  >
                    <option value="">Chọn giờ hẹn trống...</option>
                    {slots.filter(s => s.status === 'available').map(s => (
                      <option key={s.id} value={s.id}>
                        {new Date(s.startTime).toLocaleString('vi-VN')} ({s.lecturer?.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Nội dung/Chủ đề cần tư vấn *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Ví dụ: Góp ý thiết kế mô hình Canvas doanh thu hoặc cách thức tiếp cận người dùng đầu tiên..."
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={booking}
                  className="w-full py-2.5 bg-gradient-to-r from-[#FF6B00] to-[#FF801A] text-white text-[11px] font-bold rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {booking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang đăng ký đặt lịch...
                    </>
                  ) : (
                    'Xác nhận Đặt lịch hẹn'
                  )}
                </button>
              </form>
            </Card>
          )}
        </div>

        {/* RIGHT PANEL: Slot logs list */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <h3 className="font-bold text-gray-800 text-sm border-b pb-2 mb-4">
              Danh sách Khung giờ cố vấn
            </h3>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {slots.length > 0 ? (
                slots.map(slot => (
                  <div 
                    key={slot.id} 
                    className={`p-4 rounded-2xl border transition duration-300 flex justify-between items-center ${
                      slot.status === 'booked' 
                        ? 'bg-orange-50/10 border-orange-100' 
                        : 'bg-green-50/5 border-green-100/50'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                          slot.status === 'booked' ? 'bg-orange-50 text-[#FF6B00]' : 'bg-green-50 text-green-700'
                        }`}>
                          {slot.status === 'booked' ? 'ĐÃ ĐẶT LỊCH' : 'TRỐNG'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold">
                          Mentor: {slot.lecturer?.name}
                        </span>
                      </div>
                      
                      <div className="text-xs font-bold text-gray-800 flex items-center gap-1">
                        <span>🕒</span>
                        {new Date(slot.startTime).toLocaleString('vi-VN')} - {new Date(slot.endTime).toLocaleTimeString('vi-VN')}
                      </div>

                      {slot.meetingLink && (
                        <a 
                          href={slot.meetingLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-500 font-bold hover:underline flex items-center gap-1"
                        >
                          <Video className="w-3.5 h-3.5" />
                          Link phòng trực tuyến
                        </a>
                      )}

                      {slot.status === 'booked' && (
                        <div className="text-[10px] text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-100 mt-2">
                          <strong className="text-gray-700 block">Nhóm: {slot.bookedByTeam?.name}</strong>
                          <span className="italic block mt-0.5">Chủ đề: {slot.topic}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400 text-xs font-semibold">
                  📭 Chưa có khung giờ hẹn rảnh nào được tạo.
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>

    </div>
  )
}
