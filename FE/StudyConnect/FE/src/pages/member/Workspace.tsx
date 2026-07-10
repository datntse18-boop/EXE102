import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import Card from '../../components/cards/Card'
import { teamService, projectService, taskService, chatService, okrService, mentorService, githubService, aiService } from '../../services/apiServices'
import AiConfigModal from '../../components/common/AiConfigModal'
import { useAuth } from '../../contexts/AuthContext'
import {
  MessageSquare,
  Send,
  Target,
  Plus,
  Loader2,
  CheckCircle2,
  Trash,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  X,
  PlusCircle,
  Sparkles,
  Bot,
  Video,
  Gauge,
  Award
} from 'lucide-react'

export default function Workspace() {
  const { user } = useAuth()
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Tab State
  const [activeTab, setActiveTab] = useState<'kanban' | 'okr' | 'mentor' | 'pitch'>('kanban')

  // AI Pitch Video Analyzer states
  const [pitchVideoUrl, setPitchVideoUrl] = useState('')
  const [analyzingPitch, setAnalyzingPitch] = useState(false)
  const [pitchAnalysisResult, setPitchAnalysisResult] = useState<any>(null)

  // AI Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)

  // Chat Box States
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // AI Mentor States
  const [mentorMessages, setMentorMessages] = useState<any[]>([])
  const [newMentorMessage, setNewMentorMessage] = useState('')
  const [loadingMentor, setLoadingMentor] = useState(false)
  const [sendingMentor, setSendingMentor] = useState(false)
  const mentorEndRef = useRef<HTMLDivElement>(null)

  // OKR States
  const [objectives, setObjectives] = useState<any[]>([])
  const [loadingOKRs, setLoadingOKRs] = useState(false)
  const [showAddObjModal, setShowAddObjModal] = useState(false)
  const [newObjTitle, setNewObjTitle] = useState('')
  const [submittingObj, setSubmittingObj] = useState(false)

  // Key Result Modal States
  const [showAddKRModal, setShowAddKRModal] = useState(false)
  const [selectedObjId, setSelectedObjId] = useState('')
  const [krTitle, setKrTitle] = useState('')
  const [krTargetValue, setKrTargetValue] = useState(100)
  const [krUnit, setKrUnit] = useState('%')
  const [submittingKR, setSubmittingKR] = useState(false)

  // Task form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [newDueDate, setNewDueDate] = useState('')

  // GitHub Integration States
  const [githubUrl, setGithubUrl] = useState('')
  const [savingGithubUrl, setSavingGithubUrl] = useState(false)
  const [gitAction, setGitAction] = useState('close')
  const [gitTaskTitle, setGitTaskTitle] = useState('')
  const [simulatingWebhook, setSimulatingWebhook] = useState(false)

  // Sync githubUrl when project changes
  useEffect(() => {
    if (selectedProject) {
      setGithubUrl(selectedProject.githubUrl || '')
    } else {
      setGithubUrl('')
    }
  }, [selectedProject])

  const handleSaveGithubUrl = async () => {
    if (!selectedProject) return
    setSavingGithubUrl(true)
    try {
      await projectService.updateProject(selectedProject.id, { githubUrl })
      // Update local state
      setSelectedProject((prev: any) => prev ? { ...prev, githubUrl } : null)
      alert('Cấu hình GitHub Repository URL thành công!')
    } catch (err) {
      console.error(err)
      alert('Không thể lưu GitHub URL. Vui lòng kiểm tra lại kết nối.')
    } finally {
      setSavingGithubUrl(false)
    }
  }

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject || !gitTaskTitle) return
    setSimulatingWebhook(true)
    try {
      const res = await githubService.simulateWebhook(selectedProject.id, `${gitAction}: ${gitTaskTitle}`, githubUrl)
      if (res.success && res.closedTask) {
        // Automatically move task to completed in UI state
        setTasks(prev => prev.map(t => t.id === res.closedTask.id ? { ...t, status: 'completed' } : t))
        alert(res.message)
        setGitTaskTitle('')
      } else {
        alert(res.message || 'Webhook đã được xử lý nhưng không tìm thấy Task phù hợp để đóng.')
      }
    } catch (err) {
      console.error(err)
      alert('Lỗi giả lập Webhook push commit.')
    } finally {
      setSimulatingWebhook(false)
    }
  }


  // Load initial teams
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teamsData = await teamService.getTeams()
        setTeams(teamsData)
        if (teamsData.length > 0) {
          setSelectedTeam(teamsData[0])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadTeams()
  }, [])

  // Load projects when selected team changes
  useEffect(() => {
    if (!selectedTeam) return
    const loadProjects = async () => {
      try {
        const projectsData = await projectService.getProjects({ teamId: selectedTeam.id })
        setProjects(projectsData)
        if (projectsData.length > 0) {
          setSelectedProject(projectsData[0])
        } else {
          setSelectedProject(null)
          setTasks([])
          setObjectives([])
        }
      } catch (err) {
        console.error(err)
      }
    }
    loadProjects()
  }, [selectedTeam])

  // Load tasks when selected project changes
  useEffect(() => {
    if (!selectedProject) {
      setTasks([])
      return
    }
    const loadTasks = async () => {
      try {
        const tasksData = await taskService.getTasks({ projectId: selectedProject.id })
        setTasks(tasksData)
      } catch (err) {
        console.error(err)
      }
    }
    loadTasks()
    loadObjectives()
  }, [selectedProject])

  // Get Socket Server URL
  const getSocketUrl = () => {
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000'
    }
    if (import.meta.env.VITE_API_URL) {
      return (import.meta.env.VITE_API_URL as string).replace('/api', '')
    }
    return window.location.origin
  }

  // Real-time Socket.io Chat & Notifications
  useEffect(() => {
    if (!selectedTeam) return

    const socketUrl = getSocketUrl()
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    })

    socket.on('connect', () => {
      console.log('🔌 Socket connected to backend!')
      socket.emit('join_team', selectedTeam.id)
      if (user?.id) {
        socket.emit('join_user', user.id)
      }
    })

    socket.on('chat_message', (msg: any) => {
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
    })

    return () => {
      socket.emit('leave_team', selectedTeam.id)
      socket.disconnect()
    }
  }, [selectedTeam, user])

  // Initial chat messages fetch
  useEffect(() => {
    if (!selectedTeam || !showChat) return
    
    const fetchChat = async () => {
      try {
        const data = await chatService.getMessages(selectedTeam.id)
        setChatMessages(data)
      } catch (err) {
        console.error(err)
      }
    }

    fetchChat()
  }, [selectedTeam, showChat])

  // Sync pitch url and reset result on project change
  useEffect(() => {
    if (selectedProject) {
      setPitchVideoUrl(selectedProject.pitchVideoUrl || '')
      setPitchAnalysisResult(null)
    } else {
      setPitchVideoUrl('')
      setPitchAnalysisResult(null)
    }
  }, [selectedProject])

  const handleAnalyzePitchVideo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject || !pitchVideoUrl.trim()) return
    setAnalyzingPitch(true)
    try {
      const updatedProj = await projectService.updateProject(selectedProject.id, { pitchVideoUrl })
      setSelectedProject(updatedProj)
      const res = await aiService.analyzePitchVideo(selectedProject.id, pitchVideoUrl)
      setPitchAnalysisResult(res)
    } catch (err) {
      console.error(err)
      alert('Không thể hoàn tất phân tích video. Vui lòng cấu hình API Key và thử lại.')
    } finally {
      setAnalyzingPitch(false)
    }
  }

  const loadObjectives = async () => {
    if (!selectedProject) return
    setLoadingOKRs(true)
    try {
      const data = await okrService.getObjectives(selectedProject.id)
      setObjectives(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingOKRs(false)
    }
  }

  const loadMentorMessages = async () => {
    if (!selectedProject) return
    setLoadingMentor(true)
    try {
      const data = await mentorService.getMentorMessages(selectedProject.id)
      setMentorMessages(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMentor(false)
    }
  }

  const handleSendMentorMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject || !newMentorMessage.trim()) return

    const userMsgText = newMentorMessage
    setNewMentorMessage('')

    // Optimistically add user message
    const tempUserMsg = { id: `temp-${Date.now()}`, role: 'user', message: userMsgText, createdAt: new Date().toISOString() }
    setMentorMessages(prev => [...prev, tempUserMsg])
    setSendingMentor(true)

    try {
      await mentorService.sendMentorMessage(selectedProject.id, userMsgText)
      const data = await mentorService.getMentorMessages(selectedProject.id)
      setMentorMessages(data)
    } catch (err) {
      console.error(err)
      alert('Không thể gửi tin nhắn cố vấn AI.')
    } finally {
      setSendingMentor(false)
    }
  }

  // Auto-scroll AI mentor chat
  useEffect(() => {
    mentorEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mentorMessages])

  // Trigger load AI mentor when tab switches or project changes
  useEffect(() => {
    if (activeTab === 'mentor' && selectedProject) {
      loadMentorMessages()
    }
  }, [activeTab, selectedProject])

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const updated = await taskService.updateTask(taskId, { status: newStatus })
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: updated.status } : t))
    } catch (err) {
      console.error(err)
      alert('Không thể cập nhật trạng thái công việc')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Bạn có muốn xóa công việc này?')) {
      try {
        await taskService.deleteTask(taskId)
        setTasks(tasks.filter(t => t.id !== taskId))
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject || !newTitle || !newAssignee) return
    try {
      const created = await taskService.createTask({
        projectId: selectedProject.id,
        title: newTitle,
        description: newDesc,
        assignedTo: newAssignee,
        priority: newPriority,
        dueDate: newDueDate || undefined,
      })
      setTasks([created, ...tasks])
      setShowAddForm(false)
      setNewTitle('')
      setNewDesc('')
      setNewAssignee('')
      setNewPriority('medium')
      setNewDueDate('')
    } catch (err) {
      console.error(err)
      alert('Không thể tạo công việc')
    }
  }

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMsg.trim() || !selectedTeam) return
    setSendingMsg(true)
    try {
      const res = await chatService.sendMessage(selectedTeam.id, newMsg)
      setChatMessages(prev => [...prev, res])
      setNewMsg('')
    } catch (err) {
      console.error(err)
    } finally {
      setSendingMsg(false)
    }
  }

  const handleCreateObjective = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject || !newObjTitle.trim()) return
    setSubmittingObj(true)
    try {
      await okrService.createObjective(selectedProject.id, newObjTitle)
      setNewObjTitle('')
      setShowAddObjModal(false)
      loadObjectives()
    } catch (err) {
      console.error(err)
      alert('Tạo mục tiêu thất bại.')
    } finally {
      setSubmittingObj(false)
    }
  }

  const handleCreateKeyResult = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedObjId || !krTitle.trim()) return
    setSubmittingKR(true)
    try {
      await okrService.createKeyResult(selectedObjId, {
        title: krTitle,
        targetValue: krTargetValue,
        unit: krUnit
      })
      setKrTitle('')
      setKrTargetValue(100)
      setKrUnit('%')
      setShowAddKRModal(false)
      loadObjectives()
    } catch (err) {
      console.error(err)
      alert('Tạo kết quả then chốt thất bại.')
    } finally {
      setSubmittingKR(false)
    }
  }

  const handleUpdateKRValue = async (krId: string, currentVal: number) => {
    try {
      await okrService.updateKeyResult(krId, currentVal)
      loadObjectives()
    } catch (err) {
      console.error(err)
    }
  }

  const todoTasks = tasks.filter(t => t.status === 'todo')
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  const isLeader = selectedTeam?.leaderId === user?.id

  const TaskCard = ({ task }: { task: any }) => (
    <Card className="mb-3 border-l-4 border-[#FF6B00] bg-white dark:bg-[#13131C] shadow-sm hover:shadow transition p-4">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-tight">{task.title}</h4>
        <button onClick={() => handleDeleteTask(task.id)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{task.description || 'Không có mô tả'}</p>
      
      <div className="flex justify-between items-center text-[10px] text-gray-500 mb-3">
        <span className="capitalize px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold">🎯 {task.priority}</span>
        {task.dueDate && <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>}
      </div>

      <div className="flex justify-between items-center border-t dark:border-gray-800 pt-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{task.assignee?.avatar || '👤'}</span>
          <span className="text-[10px] font-bold text-gray-750 dark:text-gray-300">{task.assignee?.name || 'Chưa phân công'}</span>
        </div>
        <select
          value={task.status}
          onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
          className="text-[10px] border dark:border-gray-800 rounded bg-white dark:bg-[#13131C] text-gray-700 dark:text-gray-300 px-2 py-1 focus:outline-none font-bold cursor-pointer"
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex justify-center p-20 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00] mr-2" /> Đang tải không gian làm việc...
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen">
      
      {/* Workspace Main Column */}
      <div className="flex-1 space-y-6 animate-fadeIn pb-10">
        
        {/* Banner with Chat trigger */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#13131C] p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800/40">
          <div>
            <h1 className="text-2xl font-black text-gray-800 dark:text-white leading-none">Không gian làm việc (Workspace) 📋</h1>
            <p className="text-xs text-gray-500 mt-2 font-medium">Quản lý dự án, tiến độ công việc nhóm và thảo luận trực tiếp.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChat(!showChat)}
              className={`px-4 py-2 border rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                showChat 
                  ? 'bg-orange-50 border-orange-200 text-[#FF6B00]' 
                  : 'bg-white dark:bg-[#13131C] border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Chat Nhóm
            </button>

            {activeTab === 'kanban' && selectedProject && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-[#FF6B00] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#E85A00] transition flex items-center gap-1.5"
              >
                + Thêm công việc
              </button>
            )}

            {activeTab === 'okr' && selectedProject && isLeader && (
              <button
                onClick={() => setShowAddObjModal(true)}
                className="px-4 py-2 bg-[#FF6B00] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#E85A00] transition flex items-center gap-1.5"
              >
                <Target className="w-4 h-4" />
                Mục tiêu mới
              </button>
            )}
          </div>
        </div>

        {/* Project Selectors */}
        <div className="grid md:grid-cols-2 gap-4 bg-white dark:bg-[#13131C] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/40">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Chọn nhóm</label>
            <select
              value={selectedTeam?.id || ''}
              onChange={(e) => setSelectedTeam(teams.find(t => t.id === e.target.value))}
              className="w-full border dark:border-gray-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] bg-white dark:bg-[#13131C] font-bold text-gray-700 dark:text-gray-300"
            >
              {teams.length > 0 ? (
                teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
              ) : (
                <option>Không có nhóm nào</option>
              )}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Chọn dự án</label>
            <select
              value={selectedProject?.id || ''}
              onChange={(e) => setSelectedProject(projects.find(p => p.id === e.target.value))}
              disabled={!selectedTeam || projects.length === 0}
              className="w-full border dark:border-gray-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] bg-white dark:bg-[#13131C] font-bold text-gray-700 dark:text-gray-300 disabled:bg-gray-100 dark:disabled:bg-white/5"
            >
              {projects.length > 0 ? (
                projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.status})</option>)
              ) : (
                <option>Chưa có dự án nào</option>
              )}
            </select>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-gray-250 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`pb-3 px-6 font-black text-xs transition border-b-2 ${activeTab === 'kanban' ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            📋 Bảng công việc Kanban
          </button>
          <button
            onClick={() => setActiveTab('okr')}
            className={`pb-3 px-6 font-black text-xs transition border-b-2 ${activeTab === 'okr' ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            🎯 Quản lý mục tiêu OKR
          </button>
          <button
            onClick={() => setActiveTab('mentor')}
            className={`pb-3 px-6 font-black text-xs transition border-b-2 ${activeTab === 'mentor' ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            🤖 Cố vấn AI 24/7
          </button>
          <button
            onClick={() => setActiveTab('pitch')}
            className={`pb-3 px-6 font-black text-xs transition border-b-2 ${activeTab === 'pitch' ? 'border-[#FF6B00] text-[#FF6B00]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            🎥 AI Pitching Analyzer
          </button>
        </div>

        {/* TAB PANELS */}
        {activeTab === 'kanban' ? (
          /* KANBAN BOARD PANEL */
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
            {/* TO DO Column */}
            <div className="bg-gray-550/30 dark:bg-white/5 rounded-2xl p-4 min-h-[500px] border border-gray-200 dark:border-gray-800/40">
              <div className="flex justify-between items-center mb-4 pb-2 border-b dark:border-gray-800">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> To Do
                </h3>
                <span className="px-2 py-0.5 bg-gray-250 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-[10px] font-black rounded-full">
                  {todoTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {todoTasks.map(t => <TaskCard key={t.id} task={t} />)}
                {todoTasks.length === 0 && <p className="text-[10px] text-gray-400 text-center py-10 font-bold">Chưa có công việc</p>}
              </div>
            </div>

            {/* IN PROGRESS Column */}
            <div className="bg-gray-550/30 dark:bg-white/5 rounded-2xl p-4 min-h-[500px] border border-gray-200 dark:border-gray-800/40">
              <div className="flex justify-between items-center mb-4 pb-2 border-b dark:border-gray-800">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> In Progress
                </h3>
                <span className="px-2 py-0.5 bg-gray-250 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-[10px] font-black rounded-full">
                  {inProgressTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {inProgressTasks.map(t => <TaskCard key={t.id} task={t} />)}
                {inProgressTasks.length === 0 && <p className="text-[10px] text-gray-400 text-center py-10 font-bold">Chưa có công việc</p>}
              </div>
            </div>

            {/* COMPLETED Column */}
            <div className="bg-gray-550/30 dark:bg-white/5 rounded-2xl p-4 min-h-[500px] border border-gray-200 dark:border-gray-800/40">
              <div className="flex justify-between items-center mb-4 pb-2 border-b dark:border-gray-800">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Completed
                </h3>
                <span className="px-2 py-0.5 bg-gray-250 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-[10px] font-black rounded-full">
                  {completedTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {completedTasks.map(t => <TaskCard key={t.id} task={t} />)}
                {completedTasks.length === 0 && <p className="text-[10px] text-gray-400 text-center py-10 font-bold">Chưa có công việc</p>}
              </div>
            </div>
          </div>

          {/* GitHub Automation Panel */}
          <div className="bg-white dark:bg-[#13131C] border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4 mt-6">
            <div className="flex items-center justify-between border-b dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🐙</span>
                <div>
                  <h4 className="text-xs font-black text-gray-800 dark:text-white">Cấu hình & Giả lập GitHub Webhook (Kanban Automation)</h4>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">Tự động cập nhật công việc Kanban khi lập trình viên push commit</p>
                </div>
              </div>
              <span className="bg-orange-50 dark:bg-orange-950/20 text-[#FF6B00] border border-orange-100 dark:border-orange-900/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                GitHub Integration
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6 pt-1">
              {/* Save GitHub URL Column */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">GitHub Repository URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://github.com/username/repository"
                    value={githubUrl}
                    onChange={e => setGithubUrl(e.target.value)}
                    className="flex-1 text-xs border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:border-[#FF6B00]"
                  />
                  <button
                    onClick={handleSaveGithubUrl}
                    disabled={savingGithubUrl}
                    className="px-4 py-2 bg-[#FF6B00] hover:bg-[#E85A00] text-white rounded-xl text-xs font-bold transition disabled:opacity-55"
                  >
                    {savingGithubUrl ? 'Đang lưu...' : 'Lưu URL'}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-normal">
                  💡 Điền URL GitHub của nhóm để kết nối với Webhook đồng bộ của dự án.
                </p>
              </div>

              {/* Webhook Simulator Column */}
              <div className="space-y-3 bg-gray-550/20 dark:bg-[#181824]/20 p-4 rounded-xl border border-gray-150 dark:border-gray-850">
                <label className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider block">Giả lập Push Commit từ GitHub</label>
                <form onSubmit={handleSimulateWebhook} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-gray-400 block mb-1">Mã lệnh (Action)</label>
                      <select 
                        value={gitAction} 
                        onChange={e => setGitAction(e.target.value)}
                        className="w-full text-[11px] border dark:border-gray-800 rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#13131C] font-bold text-gray-700 dark:text-gray-300 focus:outline-none"
                      >
                        <option value="close">close:</option>
                        <option value="fix">fix:</option>
                        <option value="resolve">resolve:</option>
                        <option value="complete">complete:</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-gray-400 block mb-1">Chọn công việc đóng</label>
                      <select 
                        value={gitTaskTitle} 
                        onChange={e => setGitTaskTitle(e.target.value)}
                        className="w-full text-[11px] border dark:border-gray-800 rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#13131C] font-bold text-gray-700 dark:text-gray-300 focus:outline-none"
                        required
                      >
                        <option value="">-- Chọn Task --</option>
                        {todoTasks.map(t => <option key={t.id} value={t.title}>{t.title}</option>)}
                        {inProgressTasks.map(t => <option key={t.id} value={t.title}>{t.title}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 block mb-1">Commit Message cuối cùng sẽ gửi</label>
                    <input
                      type="text"
                      disabled
                      value={`${gitAction}: "${gitTaskTitle || 'Tên công việc'}"`}
                      className="w-full text-xs border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 bg-gray-150 dark:bg-gray-900 text-gray-500 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={simulatingWebhook || !gitTaskTitle || !selectedProject}
                    className="w-full py-2 bg-gradient-to-r from-orange-500 to-[#FF6B00] hover:shadow-md transition text-white text-xs font-black rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
                  >
                    {simulatingWebhook ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" /> Đang gửi Webhook...
                      </>
                    ) : (
                      'Gửi Webhook push commit'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'okr' ? (
          /* OKR & KPI DASHBOARD PANEL */
          <div className="space-y-6">
            {loadingOKRs ? (
              <div className="flex justify-center py-12 text-gray-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin text-[#FF6B00] mr-2" /> Đang tải mục tiêu OKRs...
              </div>
            ) : objectives.length === 0 ? (
              <div className="bg-white dark:bg-[#13131C] p-12 text-center rounded-2xl border border-gray-100 dark:border-gray-800/40 text-gray-400 text-xs font-semibold">
                🎯 Nhóm chưa tạo Mục tiêu OKR nào cho dự án này.
              </div>
            ) : (
              <div className="space-y-4">
                {objectives.map(obj => (
                  <Card key={obj.id} className="p-5">
                    <div className="flex justify-between items-start border-b dark:border-gray-800 pb-3 mb-4">
                      <div>
                        <span className="text-[9px] bg-orange-50 dark:bg-orange-950/20 text-[#FF6B00] font-black px-2 py-0.5 rounded border border-orange-100 dark:border-orange-900/20 uppercase">
                          Mục tiêu (Objective)
                        </span>
                        <h4 className="font-black text-gray-800 dark:text-white text-sm mt-1.5">{obj.title}</h4>
                      </div>
                      
                      {/* Objective progress indicator */}
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block font-bold">Tiến độ tổng hợp</span>
                        <span className="text-base font-black text-orange-500">{obj.progress}%</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden mb-4">
                      <div className="bg-orange-500 h-full transition-all duration-300" style={{ width: `${obj.progress}%` }}></div>
                    </div>

                    {/* Key Results list */}
                    <div className="space-y-3 pl-4 border-l border-gray-100 dark:border-gray-800">
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase">
                        <span>Kết quả then chốt (Key Results)</span>
                        {isLeader && (
                          <button
                            onClick={() => { setSelectedObjId(obj.id); setShowAddKRModal(true); }}
                            className="text-[#FF6B00] hover:underline flex items-center gap-0.5 cursor-pointer font-black"
                          >
                            <PlusCircle className="w-3.5 h-3.5" /> Thêm KR
                          </button>
                        )}
                      </div>

                      {obj.keyResults?.length === 0 ? (
                        <p className="text-[10px] text-gray-400 italic">Chưa có kết quả then chốt nào.</p>
                      ) : (
                        obj.keyResults.map((kr: any) => (
                          <div key={kr.id} className="p-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800/40 rounded-xl space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-gray-700 dark:text-gray-200">{kr.title}</span>
                              <span className="font-bold text-gray-600 dark:text-gray-400">
                                {kr.currentValue} / {kr.targetValue} {kr.unit}
                              </span>
                            </div>

                            {/* KR Progress slider / bar */}
                            <div className="flex items-center gap-3">
                              <input
                                type="range"
                                min="0"
                                max={kr.targetValue}
                                value={kr.currentValue}
                                onChange={e => handleUpdateKRValue(kr.id, Number(e.target.value))}
                                className="flex-1 accent-orange-500 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              />
                              <span className="text-[10px] font-black text-orange-500 w-8 text-right">
                                {Math.round((kr.currentValue / kr.targetValue) * 100)}%
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'mentor' ? (
          /* AI MENTOR 24/7 PANEL */
          <div className="bg-white dark:bg-[#13131C] rounded-3xl p-6 border border-gray-100 dark:border-gray-800/40 shadow-sm flex flex-col h-[600px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b dark:border-gray-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/10 dark:bg-orange-950/20 text-[#FF6B00] rounded-2xl border border-orange-100 dark:border-orange-900/20">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-gray-800 dark:text-white text-sm flex items-center gap-1.5">
                    Cố vấn Khởi nghiệp AI 24/7 <span className="text-[9px] bg-green-50 dark:bg-green-950/20 text-green-500 font-bold px-1.5 py-0.5 rounded border border-green-100 dark:border-green-900/20 uppercase animate-pulse">Online</span>
                  </h3>
                  <p className="text-[10px] text-gray-400 font-medium">Hỗ trợ pháp lý, mô hình kinh doanh, tài chính & pitching từ Gemini AI</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(true)}
                  className="px-2.5 py-1 text-[10px] font-bold text-orange-400 hover:text-orange-350 border border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 rounded-lg transition"
                >
                  ⚙️ Cấu hình AI
                </button>
                <button
                  type="button"
                  onClick={loadMentorMessages}
                  className="px-2.5 py-1 text-[10px] font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border dark:border-gray-800 rounded-lg transition"
                >
                  Tải lại lịch sử
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-thin">
              {loadingMentor ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00] mb-2" />
                  Đang tải lịch sử hội thoại...
                </div>
              ) : mentorMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-3 text-orange-500 text-2xl">
                    🤖
                  </div>
                  <h4 className="font-bold text-xs text-gray-800 dark:text-gray-250 mb-1">Xin chào dự án {selectedProject?.name || 'mới'}!</h4>
                  <p className="text-[10px] max-w-sm mb-4">Tôi là Cố vấn Khởi nghiệp AI của bạn. Hãy hỏi tôi bất kỳ câu hỏi nào về xây dựng dự án startup, luật doanh nghiệp, tài chính hoặc slide pitching.</p>
                  
                  {/* Suggested questions */}
                  <div className="w-full max-w-md space-y-2 mt-2">
                    <p className="text-[9px] font-bold text-gray-500 uppercase block">Gợi ý chủ đề hỏi:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                      {[
                        "Làm thế nào để chia cổ phần co-founder hợp lý?",
                        "Tư vấn mô hình kinh doanh Canvas (BMC) phù hợp.",
                        "Làm sao viết slide pitching thuyết phục nhà đầu tư?",
                        "Nên chọn hộ kinh doanh cá thể hay công ty TNHH?"
                      ].map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setNewMentorMessage(q)}
                          className="p-2.5 bg-gray-550/30 dark:bg-white/5 hover:bg-orange-50 dark:hover:bg-orange-950/15 border border-gray-200 dark:border-gray-800 rounded-xl text-[10px] text-gray-600 dark:text-gray-300 hover:text-[#FF6B00] dark:hover:text-[#FF6B00] font-semibold transition text-left leading-snug"
                        >
                          💬 {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Explanatory banner */}
                  <div className="p-3 bg-orange-50/20 dark:bg-orange-950/10 border border-orange-100/50 dark:border-orange-900/10 rounded-2xl text-[10px] text-[#FF6B00] font-semibold">
                    💡 <strong>Cố vấn AI:</strong> Thông tin tư vấn chỉ mang tính chất tham khảo học thuật dựa trên syllabus môn học và kiến thức khởi nghiệp.
                  </div>

                  {mentorMessages.map((msg, idx) => {
                    const isSelf = msg.role === 'user'
                    return (
                      <div key={msg.id || idx} className={`flex gap-3 ${isSelf ? 'justify-end' : 'justify-start'}`}>
                        {!isSelf && (
                          <div className="w-8 h-8 rounded-xl bg-orange-500/10 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/20 flex items-center justify-center text-sm font-bold text-[#FF6B00] flex-shrink-0">
                            🤖
                          </div>
                        )}
                        <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} max-w-[80%]`}>
                          <span className="text-[8px] text-gray-400 font-bold mb-0.5">
                            {isSelf ? user?.name : 'AI Startup Mentor'} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div
                            className={`p-3 rounded-2xl text-xs leading-relaxed font-medium whitespace-pre-wrap ${
                              isSelf
                                ? 'bg-[#FF6B00] text-white rounded-tr-none'
                                : 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-gray-800/40'
                            }`}
                          >
                            {msg.message}
                          </div>
                        </div>
                        {isSelf && (
                          <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-gray-750 dark:text-gray-300 flex-shrink-0">
                            👤
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {sendingMentor && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/10 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/20 flex items-center justify-center text-sm font-bold text-[#FF6B00] flex-shrink-0 animate-pulse">
                        🤖
                      </div>
                      <div className="flex flex-col items-start max-w-[80%]">
                        <span className="text-[8px] text-gray-400 font-bold mb-0.5">AI Startup Mentor đang suy nghĩ...</span>
                        <div className="bg-gray-100 dark:bg-white/10 text-gray-500 p-3 rounded-2xl rounded-tl-none text-xs flex items-center gap-1.5 border border-gray-200 dark:border-gray-800/40">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF6B00]" />
                          Đang phân tích và soạn thảo câu trả lời chuyên môn...
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={mentorEndRef} />
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMentorMessage} className="border-t border-gray-200 dark:border-gray-800/60 pt-3 bg-transparent flex gap-2">
              <input
                type="text"
                value={newMentorMessage}
                onChange={e => setNewMentorMessage(e.target.value)}
                placeholder={selectedProject ? "Nhập câu hỏi khởi nghiệp (ví dụ: tư vấn mô hình kinh doanh, tài chính, luật...)" : "Vui lòng chọn hoặc tạo dự án để bắt đầu hỏi cố vấn..."}
                disabled={!selectedProject || sendingMentor || loadingMentor}
                className="w-full text-xs bg-gray-50 dark:bg-[#181824] border dark:border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-[#FF6B00] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!selectedProject || !newMentorMessage.trim() || sendingMentor || loadingMentor}
                className="px-4 bg-[#FF6B00] text-white rounded-xl hover:bg-[#E85A00] transition disabled:opacity-50 flex items-center justify-center flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : activeTab === 'pitch' ? (
          /* AI PITCHING ANALYZER PANEL */
          <div className="bg-white dark:bg-[#13131C] rounded-3xl p-6 border border-gray-100 dark:border-gray-800/40 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b dark:border-gray-800 pb-4">
              <div className="p-2.5 bg-orange-500/10 dark:bg-orange-950/20 text-[#FF6B00] rounded-2xl border border-orange-100 dark:border-orange-900/20">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-gray-800 dark:text-white text-sm">
                  Trình Phân Tích Thuyết Trình Gọi Vốn (AI Pitching Video Analyzer)
                </h3>
                <p className="text-[10px] text-gray-400 font-medium">
                  Đánh giá kỹ năng thuyết trình, nội dung, tốc độ nói (wpm) và ngôn ngữ hình thể giả lập bằng AI
                </p>
              </div>
            </div>

            {/* Input URL Form */}
            <form onSubmit={handleAnalyzePitchVideo} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Đường dẫn Video Thuyết trình (YouTube / Drive / Vimeo)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={pitchVideoUrl}
                    onChange={e => setPitchVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    disabled={!selectedProject || analyzingPitch}
                    className="w-full text-xs bg-gray-50 dark:bg-[#181824] border dark:border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-[#FF6B00] disabled:opacity-50 font-medium"
                    required
                  />
                  <button
                    type="submit"
                    disabled={!selectedProject || !pitchVideoUrl.trim() || analyzingPitch}
                    className="px-6 bg-[#FF6B00] text-white rounded-xl hover:bg-[#E85A00] transition disabled:opacity-50 flex items-center justify-center gap-1.5 flex-shrink-0 font-bold text-xs"
                  >
                    {analyzingPitch ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Đang phân tích...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Phân tích bằng AI
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Result display */}
            {pitchAnalysisResult ? (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Left Column: Overall Score & Metrics */}
                  <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800/40 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Điểm Thuyết trình</span>
                    <div className="relative flex items-center justify-center">
                      <div className="text-4xl font-black text-[#FF6B00]">{pitchAnalysisResult.scores.overall}</div>
                      <span className="text-xs text-gray-400 font-bold ml-0.5">/100</span>
                    </div>
                    <div className="mt-4 flex gap-1.5 justify-center flex-wrap">
                      <span className="bg-[#FF6B00]/10 text-[#FF6B00] px-2 py-0.5 rounded text-[9px] font-black border border-[#FF6B00]/25">
                        {pitchAnalysisResult.scores.overall >= 80 ? 'Xuất Sắc (Excellent)' : 'Khá (Good)'}
                      </span>
                    </div>
                  </div>

                  {/* Middle Column: Detailed Score Parameters */}
                  <div className="md:col-span-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800/40 rounded-2xl p-5 space-y-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Chi tiết các tiêu chí</span>
                    
                    {/* Progress bars */}
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-gray-700 dark:text-gray-300">Hook & Dẫn dắt (Hook)</span>
                          <span className="text-[#FF6B00] font-bold">{pitchAnalysisResult.scores.hook}/100</span>
                        </div>
                        <div className="w-full bg-gray-250 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#FF6B00] h-full" style={{ width: `${pitchAnalysisResult.scores.hook}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-gray-700 dark:text-gray-300">Tính nhất quán Vấn đề & Giải pháp</span>
                          <span className="text-[#FF6B00] font-bold">{pitchAnalysisResult.scores.problemSolution}/100</span>
                        </div>
                        <div className="w-full bg-gray-250 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#FF6B00] h-full" style={{ width: `${pitchAnalysisResult.scores.problemSolution}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-gray-700 dark:text-gray-300">Phong thái tự tin & Ngôn ngữ cơ thể</span>
                          <span className="text-[#FF6B00] font-bold">{pitchAnalysisResult.scores.confidence}/100</span>
                        </div>
                        <div className="w-full bg-gray-250 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#FF6B00] h-full" style={{ width: `${pitchAnalysisResult.scores.confidence}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-gray-700 dark:text-gray-300">Nhịp độ & Phân bổ thời gian (Pacing)</span>
                          <span className="text-[#FF6B00] font-bold">{pitchAnalysisResult.scores.pacing}/100</span>
                        </div>
                        <div className="w-full bg-gray-250 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#FF6B00] h-full" style={{ width: `${pitchAnalysisResult.scores.pacing}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Speech Pacing Analysis */}
                <div className="bg-orange-500/5 border border-orange-500/20 dark:border-orange-500/10 rounded-2xl p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-500/10 dark:bg-orange-950/20 text-[#FF6B00] rounded-xl border border-orange-500/20 flex-shrink-0">
                      <Gauge className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-white text-xs">Phân Tích Tốc Độ Nói (Speech Pacing)</h4>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">{pitchAnalysisResult.pacingAnalysis.toneFeedback}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[8px] text-gray-400 block font-black uppercase">Tốc độ trung bình</span>
                    <span className="text-lg font-black text-[#FF6B00]">{pitchAnalysisResult.pacingAnalysis.wpm} WPM</span>
                    <span className="text-[9px] bg-green-550/10 text-green-500 font-bold px-1.5 py-0.5 rounded border border-green-500/20 ml-2 uppercase">
                      {pitchAnalysisResult.pacingAnalysis.status}
                    </span>
                  </div>
                </div>

                {/* Text feedbacks */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-gray-550/20 dark:bg-white/5 border border-gray-100 dark:border-gray-800/40 rounded-2xl p-4">
                    <h5 className="font-bold text-gray-800 dark:text-white text-xs mb-2 flex items-center gap-1.5">
                      📣 Hook & Mở bài
                    </h5>
                    <p className="text-[11px] text-gray-400 leading-relaxed font-medium">{pitchAnalysisResult.feedback.hook}</p>
                  </div>
                  <div className="bg-gray-550/20 dark:bg-white/5 border border-gray-100 dark:border-gray-800/40 rounded-2xl p-4">
                    <h5 className="font-bold text-gray-800 dark:text-white text-xs mb-2 flex items-center gap-1.5">
                      💡 Cốt lõi Nội dung
                    </h5>
                    <p className="text-[11px] text-gray-400 leading-relaxed font-medium">{pitchAnalysisResult.feedback.content}</p>
                  </div>
                  <div className="bg-gray-550/20 dark:bg-white/5 border border-gray-100 dark:border-gray-800/40 rounded-2xl p-4">
                    <h5 className="font-bold text-gray-800 dark:text-white text-xs mb-2 flex items-center gap-1.5">
                      👤 Phong thái & Ngữ điệu
                    </h5>
                    <p className="text-[11px] text-gray-400 leading-relaxed font-medium">{pitchAnalysisResult.feedback.confidence}</p>
                  </div>
                </div>

                {/* Suggestions List */}
                <div className="bg-gray-550/20 dark:bg-white/5 border border-gray-100 dark:border-gray-800/40 rounded-2xl p-5 space-y-3">
                  <h4 className="font-black text-gray-800 dark:text-white text-xs flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-yellow-500 animate-bounce" /> Khuyến nghị cải thiện của giám khảo AI
                  </h4>
                  <ul className="space-y-2 pl-4 list-disc text-[11px] text-gray-450 font-medium">
                    {pitchAnalysisResult.suggestions.map((s: string, idx: number) => (
                      <li key={idx} className="leading-relaxed">{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-white/5 p-12 text-center rounded-2xl border border-gray-100 dark:border-gray-800/40 text-gray-400 text-xs font-semibold">
                🎥 Vui lòng nhập đường dẫn video thuyết trình dự án của bạn và nhấn nút để bắt đầu phân tích bằng AI.
              </div>
            )}
          </div>
        ) : null}

        </div>
      {/* RIGHT SIDE PANEL: Drawer for Team Chat */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-[#111119] border-l border-gray-100 dark:border-gray-800 shadow-2xl z-40 transition-transform duration-300 transform flex flex-col ${
          showChat ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Chat Drawer Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-orange-50/5 dark:bg-white/5 mt-16">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#FF6B00]" />
            <h3 className="font-black text-gray-800 dark:text-white text-sm">
              Kênh Chat Nhóm: {selectedTeam?.name}
            </h3>
          </div>
          <button
            onClick={() => setShowChat(false)}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat message logs */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pr-2 scrollbar-thin">
          {chatMessages.map((msg, idx) => {
            const isSelf = msg.userId === user?.id
            return (
              <div key={msg.id || idx} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} text-xs`}>
                <span className="text-[8px] text-gray-400 font-bold mb-0.5">
                  {msg.user?.name} {msg.user?.role === 'manager' && '🎓'}
                </span>
                <div
                  className={`p-2.5 rounded-2xl max-w-[85%] leading-normal font-medium ${
                    isSelf 
                      ? 'bg-[#FF6B00] text-white rounded-tr-none' 
                      : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 rounded-tl-none'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            )
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Chat input form */}
        <form onSubmit={handleSendChat} className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#111119] flex gap-2">
          <input
            type="text"
            placeholder="Gửi tin nhắn cho nhóm..."
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            className="w-full text-xs bg-white dark:bg-[#181824] border dark:border-gray-800 rounded-xl px-3 focus:outline-none focus:border-[#FF6B00]"
          />
          <button
            type="submit"
            disabled={sendingMsg}
            className="p-2 bg-[#FF6B00] text-white rounded-xl hover:bg-[#E85A00] transition disabled:opacity-50"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>

      {/* CREATE OBJECTIVE MODAL */}
      {showAddObjModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-gray-100 shadow-2xl animate-scaleUp">
            <h3 className="text-lg font-black text-gray-800 mb-4">
              Tạo mục tiêu (Objective) mới
            </h3>

            <form onSubmit={handleCreateObjective} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Tên mục tiêu *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàn thiện sản phẩm mẫu (MVP)"
                  value={newObjTitle}
                  onChange={e => setNewObjTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={submittingObj}
                  className="flex-1 py-2.5 bg-[#FF6B00] text-white text-[11px] font-bold rounded-xl shadow-md hover:bg-[#E85A00] transition flex items-center justify-center"
                >
                  {submittingObj ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tạo mục tiêu'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddObjModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-500 text-[11px] font-bold rounded-xl hover:bg-gray-50 transition"
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE KEY RESULT MODAL */}
      {showAddKRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-gray-100 shadow-2xl animate-scaleUp">
            <h3 className="text-lg font-black text-gray-800 mb-4">
              Thêm kết quả then chốt (Key Result)
            </h3>

            <form onSubmit={handleCreateKeyResult} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Tên kết quả then chốt *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thu thập 50 câu trả lời khảo sát"
                  value={krTitle}
                  onChange={e => setKrTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Giá trị mục tiêu *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={krTargetValue}
                    onChange={e => setKrTargetValue(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Đơn vị đo lường *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="%, người, bài viết,..."
                    value={krUnit}
                    onChange={e => setKrUnit(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={submittingKR}
                  className="flex-1 py-2.5 bg-[#FF6B00] text-white text-[11px] font-bold rounded-xl shadow-md hover:bg-[#E85A00] transition flex items-center justify-center"
                >
                  {submittingKR ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tạo KR'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddKRModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-500 text-[11px] font-bold rounded-xl hover:bg-gray-50 transition"
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-gray-100 shadow-2xl animate-scaleUp">
            <h3 className="text-lg font-black text-gray-800 mb-4">Thêm công việc mới</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Tên công việc *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thiết kế giao diện"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Mô tả công việc</label>
                <textarea
                  placeholder="Mô tả chi tiết nhiệm vụ..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#FF6B00] resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Người thực hiện *</label>
                <select
                  required
                  value={newAssignee}
                  onChange={e => setNewAssignee(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] bg-white font-bold"
                >
                  <option value="">-- Chọn thành viên --</option>
                  {selectedTeam?.members?.map((m: any) => (
                    <option key={m.userId} value={m.userId}>{m.user?.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-550 uppercase tracking-wider block mb-1">Độ ưu tiên</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] bg-white font-bold"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-550 uppercase tracking-wider block mb-1">Hạn hoàn thành</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#FF6B00] text-white text-[11px] font-bold rounded-xl shadow-md hover:bg-[#E85A00] transition"
                >
                  Tạo mới
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-500 text-[11px] font-bold rounded-xl hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AiConfigModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
    </div>
  )
}
