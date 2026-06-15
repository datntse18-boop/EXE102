import { useEffect, useState } from 'react'
import { teamService, mentoringService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/cards/Card'
import {
  Calendar,
  Clock,
  Sparkles,
  Loader2,
  Video,
  CheckCircle,
  Plus,
  PenTool,
  FileText,
  Save,
  QrCode,
  ShieldCheck
} from 'lucide-react'

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

  // Meeting Minutes States
  const [showMinutesModal, setShowMinutesModal] = useState(false)
  const [activeSlot, setActiveSlot] = useState<any>(null)
  const [meetingMinutesText, setMeetingMinutesText] = useState('')
  const [minutesSaving, setMinutesSaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      // Fetch slots
      const slotsData = await mentoringService.getSlots()
      setSlots(slotsData)

      // Fetch student teams if member
      if (role === 'member' || role === 'leader') {
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
      await mentoringService.bookSlot(selectedSlotId, { teamId: selectedTeamId, topic })
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

  const handleOpenMinutesModal = (slot: any) => {
    setActiveSlot(slot)
    setMeetingMinutesText(slot.meetingMinutes || '')
    setShowMinutesModal(true)
  }

  const handleSaveMinutes = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeSlot) return
    setMinutesSaving(true)
    try {
      await mentoringService.updateMeetingMinutes(activeSlot.id, meetingMinutesText)
      alert('Đã cập nhật biên bản làm việc cố vấn thành công!')
      setShowMinutesModal(false)
      loadData()
    } catch (err) {
      console.error(err)
      alert('Lỗi cập nhật biên bản.')
    } finally {
      setMinutesSaving(false)
    }
  }

  const handleCoSign = async (slotId: string) => {
    if (!window.confirm('Bạn xác nhận ký duyệt biên bản làm việc cố vấn này chứ?')) return
    try {
      await mentoringService.coSignMeetingMinutes(slotId)
      alert('Ký duyệt biên bản họp cố vấn thành công! 📝')
      loadData()
    } catch (err) {
      console.error(err)
      alert('Lỗi xác nhận ký duyệt.')
    }
  }

  const getGoogleCalendarLink = (slot: any) => {
    const title = encodeURIComponent(`Lịch hẹn cố vấn 1-on-1: ${slot.bookedByTeam?.name || 'StudyConnect'}`)
    const startTimeStr = new Date(slot.startTime).toISOString().replace(/-|:|\.\d\d\d/g, "")
    const endTimeStr = new Date(slot.endTime).toISOString().replace(/-|:|\.\d\d\d/g, "")
    const dates = `${startTimeStr}/${endTimeStr}`
    const details = encodeURIComponent(
      `Cố vấn dự án khởi nghiệp StudyConnect.\n\n` +
      `Giảng viên: ${slot.lecturer?.name || 'N/A'}\n` +
      `Nhóm: ${slot.bookedByTeam?.name || 'N/A'}\n` +
      `Chủ đề: ${slot.topic || 'N/A'}\n` +
      `Link phòng họp: ${slot.meetingLink || 'N/A'}\n\n` +
      `Được đồng bộ từ StudyConnect Enterprise.`
    )
    const location = encodeURIComponent(slot.meetingLink || 'Zoom Meeting')
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`
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
            {role === 'manager' || role === 'admin'
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
          {role === 'manager' || role === 'admin' ? (
            /* Lecturer Creates Slot Form */
            <Card>
              <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm border-b dark:border-gray-800 pb-2 mb-4 flex items-center gap-1.5">
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
                    className="w-full bg-transparent border border-gray-200 dark:border-gray-850 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#FF6B00] dark:text-gray-350"
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
                    className="w-full bg-transparent border border-gray-200 dark:border-gray-850 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#FF6B00] dark:text-gray-350"
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
                    className="w-full bg-transparent border border-gray-200 dark:border-gray-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] dark:text-gray-350"
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
              <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm border-b dark:border-gray-800 pb-2 mb-4 flex items-center gap-1.5">
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
                    className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] bg-white dark:bg-[#13131C] font-bold dark:text-gray-300"
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
                    className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] bg-white dark:bg-[#13131C] font-semibold text-gray-700 dark:text-gray-300"
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
                    className="w-full bg-transparent border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] dark:text-gray-350 resize-none font-medium leading-relaxed"
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
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm border-b dark:border-gray-800 pb-2 mb-4">
              Danh sách Khung giờ cố vấn
            </h3>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {slots.length > 0 ? (
                slots.map(slot => (
                  <div 
                    key={slot.id} 
                    className={`p-4 rounded-2xl border transition duration-300 flex flex-col gap-3.5 ${
                      slot.status === 'booked' 
                        ? 'bg-orange-50/10 dark:bg-orange-950/5 border-orange-100 dark:border-orange-900/35' 
                        : 'bg-green-50/5 border-green-100/50 dark:border-green-900/10'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                            slot.status === 'booked' ? 'bg-orange-50 dark:bg-orange-950 text-[#FF6B00]' : 'bg-green-50 dark:bg-green-950 text-green-700'
                          }`}>
                            {slot.status === 'booked' ? 'ĐÃ ĐẶT LỊCH' : 'TRỐNG'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-semibold">
                            Mentor: {slot.lecturer?.name}
                          </span>
                        </div>
                        
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
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
                          <a 
                            href={getGoogleCalendarLink(slot)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] text-[#FF6B00] font-bold hover:underline flex items-center gap-1 mt-1"
                          >
                            <Calendar className="w-3.5 h-3.5 text-[#FF6B00]" />
                            Đồng bộ Google Calendar
                          </a>
                        )}
                      </div>

                      {/* Action buttons on Slot Card */}
                      {slot.status === 'booked' && (role === 'manager' || role === 'admin') && (
                        <button
                          onClick={() => handleOpenMinutesModal(slot)}
                          className="px-2.5 py-1 bg-gray-800 dark:bg-gray-700 hover:bg-gray-950 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition flex items-center gap-1"
                        >
                          <PenTool className="w-3 h-3" /> Viết biên bản
                        </button>
                      )}
                    </div>

                    {slot.status === 'booked' && (
                      <div className="text-[10px] text-gray-505 dark:text-gray-400 bg-gray-50/50 dark:bg-[#0B0B0F]/40 p-3 rounded-xl border border-gray-100 dark:border-gray-850 space-y-2.5">
                        <div className="flex justify-between border-b dark:border-gray-850 pb-1">
                          <strong className="text-gray-700 dark:text-gray-300">Nhóm: {slot.bookedByTeam?.name}</strong>
                          <span className="text-[9px] italic">Chủ đề: {slot.topic}</span>
                        </div>

                        {/* Meeting Minutes display */}
                        {slot.meetingMinutes ? (
                          <div className="space-y-2.5">
                            <span className="font-bold text-[#FF6B00] block">📝 Biên bản làm việc cố vấn:</span>
                            <p className="text-gray-600 dark:text-gray-350 whitespace-pre-line leading-relaxed font-medium bg-white dark:bg-[#13131C] p-2.5 rounded-lg border dark:border-gray-850">
                              {slot.meetingMinutes}
                            </p>

                            {/* Signatures status */}
                            <div className="flex justify-between items-center pt-1.5">
                              {slot.isSigned ? (
                                <div className="w-full bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-900/40 p-2.5 rounded-xl flex items-center gap-2 text-[10px] text-green-700 dark:text-green-400">
                                  <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                                  <div className="flex-1">
                                    <span className="font-bold block">Biên bản đã được ký số điện tử:</span>
                                    <span className="text-[8px] opacity-80 block">✔ Ký bởi Giảng viên: {slot.lecturer?.name}</span>
                                    <span className="text-[8px] opacity-80 block">✔ Đồng xác nhận bởi nhóm: {slot.bookedByTeam?.name}</span>
                                  </div>
                                  <QrCode className="w-8 h-8 text-green-600/70" />
                                </div>
                              ) : (
                                <div className="w-full flex justify-between items-center bg-amber-50/30 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/20 p-2.5 rounded-xl text-[9px]">
                                  <span className="text-amber-700 dark:text-amber-400 font-semibold">
                                    Đang chờ Trưởng nhóm ký xác nhận (Co-sign)...
                                  </span>
                                  {role === 'member' && (
                                    <button
                                      onClick={() => handleCoSign(slot.id)}
                                      className="px-3 py-1 bg-[#FF6B00] text-white font-black uppercase rounded-lg hover:bg-orange-650 transition tracking-wider shrink-0"
                                    >
                                      Ký xác nhận
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[9px] text-gray-400 italic">
                            Chưa có biên bản làm việc được cập nhật bởi Giảng viên.
                          </div>
                        )}
                      </div>
                    )}
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

      {/* LECTURER WRITE MINUTES DIALOG */}
      {showMinutesModal && activeSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#13131C] rounded-3xl p-6 w-full max-w-md border border-gray-100 dark:border-gray-800 shadow-2xl animate-scaleUp">
            <h3 className="text-sm font-black text-gray-800 dark:text-white mb-2.5 flex items-center gap-1.5">
              <FileText className="w-4.5 h-4.5 text-[#FF6B00]" />
              Biên bản họp cố vấn - Nhóm: {activeSlot.bookedByTeam?.name}
            </h3>
            <p className="text-[10px] text-gray-450 dark:text-gray-500 mb-4">
              Ghi lại tóm tắt định hướng phát triển, nhiệm vụ cần hoàn thành cho nhóm. Sau khi lưu, Trưởng nhóm sinh viên cần ký duyệt xác nhận.
            </p>

            <form onSubmit={handleSaveMinutes} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                  Chủ đề làm việc của nhóm
                </label>
                <input
                  type="text"
                  disabled
                  value={activeSlot.topic || ''}
                  className="w-full bg-gray-50 dark:bg-[#0B0B0F] border border-gray-100 dark:border-gray-850 rounded-xl px-4 py-2 text-xs text-gray-400 font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                  Nội dung Biên bản họp chi tiết *
                </label>
                <textarea
                  required
                  rows={6}
                  value={meetingMinutesText}
                  onChange={e => setMeetingMinutesText(e.target.value)}
                  placeholder="Ví dụ: Nhóm AgriGreen đã trình bày mô hình tài chính. Cố vấn góp ý điều chỉnh chi phí biến đổi tăng thêm 10%. Nhiệm vụ tuần tới: Khảo sát thêm 20 hộ nông dân để đo lường mức độ CAC chính xác..."
                  className="w-full bg-transparent border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] dark:text-gray-300 resize-none font-medium leading-relaxed"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={minutesSaving}
                  className="flex-1 py-2.5 bg-[#FF6B00] text-white text-[11px] font-bold rounded-xl shadow-md hover:bg-[#E85A00] transition flex items-center justify-center gap-1.5"
                >
                  {minutesSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Lưu biên bản
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMinutesModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-[11px] font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-850 transition"
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
