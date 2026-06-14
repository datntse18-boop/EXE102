import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/cards/Card'
import ContributionChart from '../../components/charts/ContributionChart'
import { teamService, taskService, aiService, userService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Sparkles, 
  Brain, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  Calendar, 
  UserPlus, 
  FileText, 
  ChevronRight, 
  Activity, 
  Plus, 
  Clock, 
  User, 
  Loader2,
  BookOpen,
  Eye,
  GraduationCap,
  LayoutGrid
} from 'lucide-react'

export default function Dashboard() {
  const { user, role } = useAuth()
  const navigate = useNavigate()
  const [teams, setTeams] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Dynamically determine active course based on user classCode
  const activeCourse = user?.classCode?.includes('201') ? 'EXE201' : 'EXE101'
  const activeCourseName = activeCourse === 'EXE101' 
    ? 'Dự án Khởi nghiệp 1 (EXE101)' 
    : 'Dự án Khởi nghiệp 2 (EXE201)'

  // Student specific states
  const [selectedLeadTeamId, setSelectedLeadTeamId] = useState<string>('')
  const [joinClassCode, setJoinClassCode] = useState<Record<string, string>>({})
  const [joiningClassTeamId, setJoiningClassTeamId] = useState<string | null>(null)

  // Student AI progress analysis states
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState<any>(null)

  // Student Quick Task Assigner states
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskAssigneeId, setTaskAssigneeId] = useState('')
  const [taskPriority, setTaskPriority] = useState('medium')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [assigningTask, setAssigningTask] = useState(false)

  // Quản lý (Dean / Coordinator) specific states
  const [lecturers, setLecturers] = useState<any[]>([])
  const [selectedLecturerCode, setSelectedLecturerCode] = useState<string>('all')
  const [deanAiAnalyzing, setDeanAiAnalyzing] = useState(false)
  const [deanAiResult, setDeanAiResult] = useState<any>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      if (role === 'leader') {
        // Quản lý (Dean) sees all lecturers and all teams
        const [lecturersData, allTeamsData] = await Promise.all([
          userService.getUsers({ role: 'manager' }),
          teamService.getTeams(),
        ])
        setLecturers(lecturersData)
        setTeams(allTeamsData)
      } else {
        // Students (member) see their own teams and tasks
        const [teamsData, tasksData] = await Promise.all([
          teamService.getTeams(),
          taskService.getMyTasks(),
        ])
        setTeams(teamsData)
        setTasks(tasksData)
        
        // Select first led team by default for AI Analysis
        const led = teamsData.filter((t: any) => t.leaderId === user?.id)
        if (led.length > 0) {
          setSelectedLeadTeamId(led[0].id)
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

  const leadTeams = teams.filter(t => t.leaderId === user?.id)
  const isTeamLeader = role === 'member' && leadTeams.length > 0

  // Student join team to lecturer class
  const handleJoinClass = async (teamId: string) => {
    const code = joinClassCode[teamId]
    if (!code) {
      alert('Vui lòng nhập mã lớp học')
      return
    }
    setJoiningClassTeamId(teamId)
    try {
      await teamService.joinClass(teamId, code)
      alert('Liên kết nhóm với lớp học của giảng viên thành công!')
      // Refresh teams data
      const teamsData = await teamService.getTeams()
      setTeams(teamsData)
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || 'Không thể liên kết lớp học. Vui lòng kiểm tra lại mã lớp.')
    } finally {
      setJoiningClassTeamId(null)
    }
  }

  // Handle task status update for members
  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      await taskService.updateTask(taskId, { status: newStatus })
      // Update local state
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    } catch (err) {
      console.error('Failed to update task status', err)
      alert('Không thể cập nhật trạng thái công việc')
    }
  }

  // Handle AI project analysis for Student Leaders
  const handleAIAnalysis = async () => {
    if (!selectedLeadTeamId) return
    setAiAnalyzing(true)
    setAiResult(null)
    try {
      const data = await aiService.analyzeProgress(selectedLeadTeamId)
      setAiResult(data)
    } catch (err) {
      console.error('AI Analysis failed', err)
      alert('Phân tích tiến độ bằng AI thất bại. Vui lòng thử lại sau.')
    } finally {
      setAiAnalyzing(false)
    }
  }

  // Handle AI Coordination Advice for Dean/Coordinator
  const handleDeanAIAnalysis = async () => {
    setDeanAiAnalyzing(true)
    setDeanAiResult(null)
    // Run AI on first team under supervision as a sample or analyze batch stats
    if (teams.length === 0) {
      alert('Không có dữ liệu nhóm nào để phân tích.')
      setDeanAiAnalyzing(false)
      return
    }
    try {
      // Run AI progress analysis on the first active team to generate advice
      const sampleTeamId = teams[0].id
      const data = await aiService.analyzeProgress(sampleTeamId)
      setDeanAiResult(data)
    } catch (err) {
      console.error(err)
      alert('Không thể chẩn đoán lưu lượng dự án. Thử lại sau.')
    } finally {
      setDeanAiAnalyzing(false)
    }
  }

  // Handle quick task assignment
  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLeadTeamId || !taskTitle || !taskAssigneeId) {
      alert('Vui lòng điền đầy đủ tên công việc và chọn người thực hiện')
      return
    }

    const currentTeam = teams.find(t => t.id === selectedLeadTeamId)
    const activeProject = currentTeam?.projects?.[0]
    if (!activeProject) {
      alert('Nhóm hiện chưa có dự án nào được tạo. Hãy tạo dự án trước.')
      return
    }

    setAssigningTask(true)
    try {
      await taskService.createTask({
        projectId: activeProject.id,
        title: taskTitle,
        description: taskDesc || undefined,
        assignedTo: taskAssigneeId,
        priority: taskPriority,
        dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
      })
      alert('Giao việc thành công!')
      setTaskTitle('')
      setTaskDesc('')
      setTaskAssigneeId('')
      setTaskDueDate('')
      // Reload tasks & data
      await loadData()
    } catch (err) {
      console.error(err)
      alert('Giao việc thất bại')
    } finally {
      setAssigningTask(false)
    }
  }

  const StatBox = ({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) => (
    <div className={`card border-l-4 ${color} flex items-center justify-between p-5 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:shadow-md transition-all duration-300`}>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-gray-800 mt-1">{loading ? '...' : value}</p>
      </div>
      <div className="text-2xl">{icon}</div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-500">
        <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin mb-2" />
        <span className="text-sm font-semibold">Đang tải bàn làm việc của bạn...</span>
      </div>
    )
  }

  // RENDER DEAN/COORDINATOR DASHBOARD (role === 'leader')
  if (role === 'leader') {
    // Filter teams by selected lecturer's classCode
    const deanFilteredTeams = selectedLecturerCode === 'all' 
      ? teams 
      : teams.filter(t => t.classCode === selectedLecturerCode)

    const avgHealth = teams.length > 0 
      ? Math.round(teams.reduce((s, t) => s + (t.healthScore || 0), 0) / teams.length) 
      : 100

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Dean Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#1E1E24] via-[#2D2D38] to-[#1E1E26] text-white rounded-3xl p-8 shadow-xl border border-gray-800/80">
          <div className="relative z-10 max-w-xl">
            <span className="bg-[#FF6B00] px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm flex items-center gap-1.5 w-max">
              <GraduationCap className="w-3.5 h-3.5" />
              Dean / Coordinator Control Center
            </span>
            <h1 className="text-3xl font-black mt-4 tracking-tight leading-none text-white">
              Chào Quản lý, {user?.name}! 🎓
            </h1>
            <p className="text-sm text-gray-300 mt-3 font-medium opacity-90 leading-relaxed">
              Giám sát chất lượng giảng dạy của Giảng viên và thông số sức khỏe của tất cả các nhóm dự án trong khối ngành EXE.
            </p>
          </div>
          <div className="absolute right-8 bottom-0 top-0 opacity-10 w-1/4 flex items-center justify-center pointer-events-none">
            <span className="text-9xl">📊</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox label="Giảng viên phụ trách" value={lecturers.length} icon="👨‍🏫" color="border-[#FF6B00]" />
          <StatBox label="Số lớp học hiện tại" value={new Set(lecturers.map(l => l.classCode).filter(Boolean)).size} icon="📚" color="border-blue-500" />
          <StatBox label="Tổng số nhóm dự án" value={teams.length} icon="👥" color="border-green-500" />
          <StatBox label="Điểm sức khỏe trung bình" value={`${avgHealth}%`} icon="❤️" color="border-yellow-500" />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Lecturers & Supervised Teams List (2/3) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Lecturer Directory */}
            <Card>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👨‍🏫</span>
                  <h3 className="font-bold text-gray-800 text-sm">Danh sách Giảng viên phụ trách</h3>
                </div>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {lecturers.length} Mentor
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lecturers.map(lecturer => (
                  <div 
                    key={lecturer.id} 
                    onClick={() => setSelectedLecturerCode(lecturer.classCode || 'NO_CODE')}
                    className={`p-3.5 rounded-2xl border transition duration-200 cursor-pointer flex items-center gap-3 ${
                      selectedLecturerCode === lecturer.classCode 
                        ? 'border-[#FF6B00] bg-[#FFF4E8]/40 shadow-sm' 
                        : 'border-gray-50 bg-gray-50/20 hover:border-orange-100 hover:bg-white'
                    }`}
                  >
                    <span className="text-2xl">{lecturer.avatar || '👨‍🏫'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-800 truncate">{lecturer.name}</p>
                      <p className="text-[9px] text-[#FF6B00] font-bold mt-0.5">Code: {lecturer.classCode || 'Chưa đặt'}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Supervised Teams */}
            <Card>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👥</span>
                  <h3 className="font-bold text-gray-800 text-sm">
                    Thông số chung của các nhóm dự án ({selectedLecturerCode === 'all' ? 'Tất cả' : selectedLecturerCode})
                  </h3>
                </div>
                {selectedLecturerCode !== 'all' && (
                  <button 
                    onClick={() => setSelectedLecturerCode('all')}
                    className="text-xs text-gray-400 hover:text-[#FF6B00] font-bold"
                  >
                    Xem tất cả
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {deanFilteredTeams.length > 0 ? (
                  deanFilteredTeams.map(t => (
                    <div 
                      key={t.id}
                      className="p-4 rounded-2xl bg-gray-50/30 border border-gray-50 hover:border-orange-100 transition duration-300 flex justify-between items-center"
                    >
                      <div>
                        <h4 className="font-bold text-gray-800 text-xs">{t.name}</h4>
                        <p className="text-[9px] text-gray-400 font-bold mt-1">
                          Mentor lớp: <span className="text-gray-600">{t.classCode || 'Chưa liên kết'}</span>
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <span className="text-lg font-black text-[#FF6B00]">{t.healthScore}%</span>
                          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Health Score</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                          t.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    Không có nhóm nào trong lớp học này.
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Dean AI Assistant (1/3) */}
          <div className="md:col-span-1 space-y-6">
            <Card className="border-t-4 border-amber-500 bg-amber-50/5">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50">
                <Brain className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-gray-800 text-xs">AI Dean Coordination Advisor</h3>
              </div>

              <p className="text-[10px] text-gray-500 leading-relaxed font-medium mb-3">
                Chạy phân tích AI để Gemini quét toàn bộ các lớp học và gợi ý phương pháp tổ chức giảng dạy cho các Giảng viên.
              </p>

              <button
                onClick={handleDeanAIAnalysis}
                disabled={deanAiAnalyzing}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-[#FF6B00] text-white text-[10px] font-bold rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {deanAiAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    AI đang đánh giá...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Báo cáo Chẩn đoán Khoa
                  </>
                )}
              </button>

              {deanAiResult && (
                <div className="mt-4 p-4 rounded-xl border border-amber-200/60 bg-white shadow-inner space-y-3 animate-fadeIn text-[11px] text-gray-600 leading-relaxed font-medium">
                  <div className="font-bold text-gray-800 border-b pb-1">Khuyến nghị chẩn đoán:</div>
                  <p>{deanAiResult.summary}</p>
                  <div className="font-bold text-amber-600 mt-2">Đề xuất quản lý:</div>
                  <ul className="list-decimal list-inside space-y-1.5">
                    {deanAiResult.recommendations?.slice(0, 3).map((r: string, i: number) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // RENDER STUDENT DASHBOARD (role === 'member')
  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Student Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#FF6B00] via-[#FF801A] to-[#FFA64D] text-white rounded-3xl p-8 shadow-xl border border-orange-200/20">
        <div className="relative z-10 max-w-xl">
          <span className="bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-max">
            <Activity className="w-3.5 h-3.5" />
            {activeCourse} - Sinh viên
          </span>
          <h1 className="text-3xl font-black mt-4 tracking-tight leading-none text-white">
            Chào bạn đồng hành, {user?.name}! ✨
          </h1>
          <p className="text-sm text-orange-50 mt-3 font-medium opacity-95 leading-relaxed">
            Hãy tập trung hoàn thành tốt các nhiệm vụ được phân công. Hãy cập nhật tiến độ công việc để Trưởng nhóm nắm bắt nhé!
          </p>
        </div>
        <div className="absolute right-8 bottom-0 top-0 opacity-15 w-1/4 flex items-center justify-center pointer-events-none">
          <span className="text-9xl">🚀</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Nhóm đang tham gia" value={teams.length} icon="👥" color="border-[#FF6B00]" />
        <StatBox label="Nhiệm vụ được giao" value={tasks.length} icon="🎯" color="border-blue-500" />
        <StatBox label="Đã hoàn thành" value={tasks.filter(t => t.status === 'completed').length} icon="✓" color="border-green-500" />
        <StatBox label="Đang làm" value={tasks.filter(t => t.status === 'in_progress').length} icon="⚡" color="border-yellow-500" />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* LEFT & CENTER PANEL (Width: 2/3) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Active Course & Syllabus Card */}
          <Card className="border-t-4 border-[#FF6B00]">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                📖 Học phần đang học: <span className="text-[#FF6B00]">{activeCourse}</span>
              </h3>
              <button 
                onClick={() => navigate('/syllabus')} 
                className="text-xs text-[#FF6B00] hover:underline font-bold flex items-center gap-0.5"
              >
                Đề cương chi tiết <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1.5 flex-1">
                <h4 className="font-extrabold text-gray-800 text-sm">{activeCourseName}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {activeCourse === 'EXE101' 
                    ? 'Xác thực vấn đề thực tế, nghiên cứu khách hàng mục tiêu và phác thảo mô hình kinh doanh Canvas (BMC).' 
                    : 'Phát triển MVP (Sản phẩm khả dụng tối thiểu), đo lường mức độ đón nhận và tiếp cận những người mua đầu tiên.'}
                </p>
              </div>
              
              <div className="bg-[#FFF4E8]/60 border border-orange-100 rounded-2xl p-4 w-full md:w-56 shrink-0">
                <span className="text-[9px] uppercase font-bold text-[#FF6B00] tracking-wider block">Cột mốc sắp tới</span>
                <h5 className="font-bold text-gray-800 text-xs mt-1">
                  {activeCourse === 'EXE101' ? 'Checkpoint 2 (20% điểm)' : 'Outcome 2 (20% điểm)'}
                </h5>
                <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                  {activeCourse === 'EXE101' ? 'Khảo sát khách hàng' : 'Tiếp thị & Khách hàng đầu tiên'}
                </p>
              </div>
            </div>
          </Card>

          {/* Student My Tasks */}
          <Card>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                <h3 className="font-bold text-gray-800 text-sm">Nhiệm vụ của tôi trong dự án</h3>
              </div>
              <button 
                onClick={() => navigate('/workspace')} 
                className="text-xs text-blue-500 hover:underline font-bold"
              >
                Mở Kanban board →
              </button>
            </div>

            {tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map(task => (
                  <div 
                    key={task.id} 
                    className="p-4 rounded-2xl bg-gray-50/50 border border-gray-100 hover:border-orange-100 transition duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-800">{task.title}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          task.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500">{task.description || 'Không có mô tả chi tiết'}</p>
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold">
                          <Clock className="w-3 h-3" />
                          Hạn: {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-gray-400 font-bold">Trạng thái:</span>
                      <select
                        value={task.status}
                        onChange={e => handleUpdateStatus(task.id, e.target.value)}
                        className="text-xs bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#FF6B00] font-bold text-gray-700"
                      >
                        <option value="todo">Chưa bắt đầu</option>
                        <option value="in_progress">Đang làm</option>
                        <option value="completed">Hoàn thành</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-xs">
                🎉 Bạn chưa được giao nhiệm vụ nào.
              </div>
            )}
          </Card>

          {/* Student Team List with JOIN CLASS CODE FUNCTIONALITY */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50">
              <span className="text-xl">📋</span>
              <h3 className="font-bold text-gray-800 text-sm">Các nhóm bạn tham gia</h3>
            </div>
            <div className="space-y-4">
              {teams.length > 0 ? teams.map(team => (
                <div key={team.id} className="p-4 rounded-2xl bg-[#FFF4E8]/20 border border-orange-50/50 hover:bg-[#FFF4E8]/40 transition duration-300 space-y-3.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-800 text-xs">{team.name}</h4>
                      <p className="text-[9px] text-gray-500 mt-1">{team.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-[#FF6B00]">{team.healthScore}%</div>
                      <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Health Score</div>
                    </div>
                  </div>

                  {/* Lecturer association section */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-3 border-t border-orange-100/50">
                    <div className="text-[10px] text-gray-500 font-bold">
                      {team.classCode ? (
                        <span className="flex items-center gap-1 text-green-700">
                          ✓ Đang học Lớp: <strong className="font-extrabold">{team.classCode}</strong>
                        </span>
                      ) : (
                        <span className="text-red-500">⚠ Chưa tham gia lớp học của Giảng viên nào</span>
                      )}
                    </div>
                    
                    {/* Join Class form */}
                    {!team.classCode && (
                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <input
                          type="text"
                          placeholder="Mã lớp học..."
                          value={joinClassCode[team.id] || ''}
                          onChange={e => setJoinClassCode({ ...joinClassCode, [team.id]: e.target.value })}
                          className="border border-orange-100/80 rounded-xl px-2.5 py-1 text-[10px] bg-white focus:outline-none focus:border-[#FF6B00] w-full sm:w-28 font-medium"
                        />
                        <button
                          onClick={() => handleJoinClass(team.id)}
                          disabled={joiningClassTeamId === team.id}
                          className="px-3 py-1.5 bg-[#FF6B00] text-white text-[9px] font-bold rounded-xl hover:bg-[#E85A00] transition shrink-0"
                        >
                          {joiningClassTeamId === team.id ? 'Đang vào...' : 'Tham gia'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <p className="text-xs text-gray-500 text-center py-6">Bạn chưa tham gia nhóm nào</p>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT PANEL (Width: 1/3) */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Student Leader controls (dynamic) */}
          {isTeamLeader && selectedLeadTeamId && (
            <>
              {/* Quick Assign Task */}
              <Card className="border-t-4 border-blue-500 bg-blue-50/5">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50">
                  <Plus className="w-5 h-5 text-blue-500" />
                  <h3 className="font-bold text-gray-800 text-xs">Giao việc nhanh (Quick Assign)</h3>
                </div>

                <form onSubmit={handleAssignTask} className="space-y-3">
                  <div>
                    <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Tên công việc *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Khảo sát khách hàng..."
                      value={taskTitle}
                      onChange={e => setTaskTitle(e.target.value)}
                      className="w-full border border-gray-200/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Thành viên *</label>
                      <select
                        required
                        value={taskAssigneeId}
                        onChange={e => setTaskAssigneeId(e.target.value)}
                        className="w-full border border-gray-200/80 rounded-xl px-2.5 py-2 text-[10px] focus:outline-none focus:border-blue-500 bg-white font-medium"
                      >
                        <option value="">Chọn...</option>
                        {teams.find(t => t.id === selectedLeadTeamId)?.members?.map((m: any) => (
                          <option key={m.userId} value={m.userId}>{m.user?.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Độ ưu tiên</label>
                      <select
                        value={taskPriority}
                        onChange={e => setTaskPriority(e.target.value)}
                        className="w-full border border-gray-200/80 rounded-xl px-2.5 py-2 text-[10px] focus:outline-none focus:border-blue-500 bg-white font-medium"
                      >
                        <option value="low">Thấp</option>
                        <option value="medium">Trung bình</option>
                        <option value="high">Cao</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={assigningTask}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] font-bold rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-60"
                  >
                    {assigningTask ? 'Đang tạo...' : '+ Giao việc thành viên'}
                  </button>
                </form>
              </Card>

              {/* AI Progress Analyzer */}
              <Card className="border-t-4 border-amber-500 bg-amber-50/5">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50">
                  <Brain className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-gray-800 text-xs">Cố vấn Phân tích tiến độ bằng Gemini AI</h3>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleAIAnalysis}
                    disabled={aiAnalyzing}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-[#FF6B00] text-white text-[10px] font-bold rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-60 flex items-center justify-center gap-1.5"
                  >
                    {aiAnalyzing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    Chạy phân tích dự án
                  </button>

                  {aiResult && (
                    <div className="mt-2 p-3 rounded-xl border border-amber-100 bg-white shadow-inner text-[10px] text-gray-600 leading-relaxed font-medium space-y-2">
                      <div className="font-bold text-gray-800">Tóm tắt:</div>
                      <p>{aiResult.summary}</p>
                      <div className="font-bold text-orange-600">Đề xuất AI:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {aiResult.recommendations?.slice(0, 2).map((rec: string, i: number) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}

          {/* Quick stats and action shortcuts */}
          <Card className="bg-[#FFF4E8]/20 border border-[#FFF4E8]">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-orange-100">
              <span className="text-xl">📊</span>
              <h3 className="font-bold text-gray-800 text-xs">Thông số dự án</h3>
            </div>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Nhóm bạn làm Leader:</span>
                <span className="text-[#FF6B00] font-black bg-[#FFF4E8] px-2 py-0.5 rounded-full text-[10px]">{leadTeams.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Tổng số đồng đội:</span>
                <span className="text-[#FF6B00] font-black bg-[#FFF4E8] px-2 py-0.5 rounded-full text-[10px]">
                  {teams.reduce((s, t) => s + (t.members?.length || 0), 0)}
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50">
              <span className="text-xl">⚡</span>
              <h3 className="font-bold text-gray-800 text-xs">Hành động nhanh</h3>
            </div>
            <div className="space-y-2">
              <button 
                onClick={() => navigate('/team-matching')} 
                className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF801A] text-white hover:shadow-md transition font-bold text-xs text-center cursor-pointer"
              >
                + Thành lập nhóm mới
              </button>
              <button 
                onClick={() => navigate('/idea-generator')} 
                className="w-full px-4 py-2.5 rounded-xl border border-orange-100 text-[#FF6B00] bg-[#FFF4E8]/20 hover:bg-[#FFF4E8] font-bold text-xs text-center transition cursor-pointer"
              >
                💡 Đề xuất ý tưởng AI
              </button>
              <button 
                onClick={() => navigate('/team-matching')} 
                className="w-full px-4 py-2.5 rounded-xl border border-orange-100 text-[#FF6B00] bg-[#FFF4E8]/20 hover:bg-[#FFF4E8] font-bold text-xs text-center transition cursor-pointer"
              >
                🎯 Tìm bạn làm dự án
              </button>
            </div>
          </Card>

        </div>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50">
          <span className="text-xl">📈</span>
          <h3 className="font-bold text-gray-800 text-sm">Hoạt động tiến độ trong tuần</h3>
        </div>
        <div className="h-64">
          <ContributionChart />
        </div>
      </Card>
    </div>
  )
}
