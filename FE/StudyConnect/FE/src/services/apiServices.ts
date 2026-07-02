import api from './api'

export const authService = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    return data.data // { user, accessToken, refreshToken }
  },

  register: async (name: string, email: string, password: string) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    return data.data
  },

  logout: async () => {
    const refreshToken = sessionStorage.getItem('refreshToken')
    await api.post('/auth/logout', { refreshToken })
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('refreshToken')
  },

  me: async () => {
    const { data } = await api.get('/auth/me')
    return data.data
  },
}

export const userService = {
  getUsers: async (params?: { search?: string; role?: string; status?: string }) => {
    const { data } = await api.get('/users', { params })
    return data.data
  },

  getUnassignedStudents: async (classCode: string) => {
    const { data } = await api.get('/users/unassigned', { params: { classCode } })
    return data.data
  },

  getUserById: async (id: string) => {
    const { data } = await api.get(`/users/${id}`)
    return data.data
  },

  createUser: async (user: { name: string; email: string; password?: string; role: string; classCode?: string; subscription?: string }) => {
    const { data } = await api.post('/users', user)
    return data.data
  },

  updateRole: async (id: string, role: string) => {
    const { data } = await api.patch(`/users/${id}/role`, { role })
    return data.data
  },

  updateSubscription: async (id: string, subscription: string) => {
    const { data } = await api.patch(`/users/${id}/subscription`, { subscription })
    return data.data
  },

  toggleStatus: async (id: string) => {
    const { data } = await api.patch(`/users/${id}/status`)
    return data.data
  },

  updateProfile: async (profile: { name?: string; avatar?: string; skills?: string; desiredRole?: string; commitmentHours?: number; pastProjects?: string; classCode?: string }) => {
    const { data } = await api.patch('/users/profile', profile)
    return data.data
  },

  deleteUser: async (id: string) => {
    const { data } = await api.delete(`/users/${id}`)
    return data
  },
}

export const teamService = {
  getTeams: async (params?: { status?: string; search?: string }) => {
    const { data } = await api.get('/teams', { params })
    return data.data
  },

  getTeamById: async (id: string) => {
    const { data } = await api.get(`/teams/${id}`)
    return data.data
  },

  createTeam: async (team: { name: string; description?: string }) => {
    const { data } = await api.post('/teams', team)
    return data.data
  },

  updateTeam: async (id: string, updates: { name?: string; description?: string; status?: string }) => {
    const { data } = await api.patch(`/teams/${id}`, updates)
    return data.data
  },

  deleteTeam: async (id: string) => {
    const { data } = await api.delete(`/teams/${id}`)
    return data
  },

  getTeamHealth: async (id: string) => {
    const { data } = await api.get(`/teams/${id}/health`)
    return data.data
  },

  addMember: async (teamId: string, userId: string) => {
    const { data } = await api.post(`/teams/${teamId}/members`, { userId })
    return data
  },

  removeMember: async (teamId: string, userId: string) => {
    const { data } = await api.delete(`/teams/${teamId}/members/${userId}`)
    return data
  },

  joinClass: async (teamId: string, classCode: string) => {
    const { data } = await api.post(`/teams/${teamId}/join-class`, { classCode })
    return data.data
  },

  requestLeaveTeam: async (teamId: string) => {
    const { data } = await api.post(`/teams/${teamId}/leave-request`)
    return data
  },

  getLeaveRequests: async (teamId: string) => {
    const { data } = await api.get(`/teams/${teamId}/leave-requests`)
    return data.data
  },

  resolveLeaveRequest: async (teamId: string, requestId: string, action: 'approve' | 'reject') => {
    const { data } = await api.post(`/teams/${teamId}/leave-requests/${requestId}/resolve`, { action })
    return data
  },
}

export const projectService = {
  getProjects: async (params?: { teamId?: string }) => {
    const { data } = await api.get('/projects', { params })
    return data.data
  },

  getProjectById: async (id: string) => {
    const { data } = await api.get(`/projects/${id}`)
    return data.data
  },

  createProject: async (project: { teamId: string; name: string; description?: string; dueDate?: string }) => {
    const { data } = await api.post('/projects', project)
    return data.data
  },

  updateProject: async (id: string, updates: object) => {
    const { data } = await api.patch(`/projects/${id}`, updates)
    return data.data
  },

  deleteProject: async (id: string) => {
    const { data } = await api.delete(`/projects/${id}`)
    return data
  },

  generateCanvasAI: async (id: string) => {
    const { data } = await api.post(`/projects/${id}/generate-canvas`)
    return data.data
  },

  getPublicProjects: async () => {
    const { data } = await api.get('/projects/showcase/public')
    return data.data
  },

  voteProject: async (id: string) => {
    const { data } = await api.post(`/projects/${id}/vote`)
    return data.data
  },

  getComments: async (id: string) => {
    const { data } = await api.get(`/projects/${id}/comments`)
    return data.data
  },

  addComment: async (id: string, content: string) => {
    const { data } = await api.post(`/projects/${id}/comments`, { content })
    return data.data
  },
}

export const taskService = {
  getTasks: async (params?: { projectId?: string; assignedTo?: string; status?: string }) => {
    const { data } = await api.get('/tasks', { params })
    return data.data
  },

  getMyTasks: async () => {
    const { data } = await api.get('/tasks/my')
    return data.data
  },

  createTask: async (task: { projectId: string; title: string; description?: string; assignedTo: string; priority?: string; dueDate?: string }) => {
    const { data } = await api.post('/tasks', task)
    return data.data
  },

  updateTask: async (id: string, updates: object) => {
    const { data } = await api.patch(`/tasks/${id}`, updates)
    return data.data
  },

  deleteTask: async (id: string) => {
    const { data } = await api.delete(`/tasks/${id}`)
    return data
  },
}

export const invitationService = {
  getInvitations: async (type?: 'sent' | 'received') => {
    const { data } = await api.get('/invitations', { params: { type } })
    return data.data
  },

  sendInvitation: async (teamId: string, toUserId: string) => {
    const { data } = await api.post('/invitations', { teamId, toUserId })
    return data.data
  },

  respond: async (id: string, status: 'accepted' | 'rejected') => {
    const { data } = await api.patch(`/invitations/${id}`, { status })
    return data.data
  },
}

export const paymentService = {
  getPayments: async () => {
    const { data } = await api.get('/payments')
    return data.data
  },

  createPayment: async (
    plan: 'premium' | 'enterprise',
    txId?: string,
    discountCode?: string,
    amount?: number,
    evidence?: string,
    bankId?: string,
    teamId?: string
  ) => {
    const { data } = await api.post('/payments', { plan, txId, discountCode, amount, evidence, bankId, teamId })
    return data.data
  },

  confirmPayment: async (id: string) => {
    const { data } = await api.patch(`/payments/${id}/confirm`)
    return data.data
  },

  rejectPayment: async (id: string, reason?: string) => {
    const { data } = await api.patch(`/payments/${id}/reject`, { reason })
    return data.data
  },

  getStats: async () => {
    const { data } = await api.get('/payments/stats')
    return data.data
  },
}


export const aiService = {
  generateIdea: async (params: { targetUsers: string; problemArea: string; technology?: string }) => {
    const { data } = await api.post('/ai/idea-generator', params)
    return data.data
  },

  teamMatching: async (params: { skills: string; interests?: string; availability?: string }) => {
    const { data } = await api.post('/ai/team-matching', params)
    return data.data
  },

  analyzeProgress: async (teamId: string) => {
    const { data } = await api.post('/ai/analyze-progress', { teamId })
    return data.data
  },

  analyzePitchDeck: async (content: string) => {
    const { data } = await api.post('/ai/pitch-deck-advisor', { content })
    return data.data
  },

  virtualDemoDay: async (params: {
    pitchIdea: string
    chatHistory?: Array<{ role: 'user' | 'assistant' | 'panel'; content: string; panelMember?: string }>
    action: 'start' | 'submit_answer' | 'finalize'
    lastQuestion?: string
    userAnswer?: string
    currentJudge?: string
  }) => {
    const { data } = await api.post('/ai/demo-day', params)
    return data.data
  },

  saveKeyOnServer: async (apiKey: string) => {
    const { data } = await api.post('/ai/save-key', { apiKey })
    return data
  },

  testKeyOnServer: async () => {
    const { data } = await api.post('/ai/idea-generator', { targetUsers: 'Test Users', problemArea: 'Test Problem', technology: 'React' })
    return data.success
  },

  globalAudit: async (teamId: string, userQuestion?: string) => {
    const { data } = await api.post('/ai/global-audit', { teamId, userQuestion })
    return data.data
  },

  autoGrouping: async (classCode: string) => {
    const { data } = await api.post('/ai/auto-grouping', { classCode })
    return data
  },

  analyzePitchVideo: async (projectId: string, videoUrl: string) => {
    const { data } = await api.post('/ai/pitch-analysis', { projectId, videoUrl })
    return data.data
  },
}

export const reportService = {
  getPlatformStats: async () => {
    const { data } = await api.get('/reports/platform-stats')
    return data.data
  },

  getAIUsage: async () => {
    const { data } = await api.get('/reports/ai-usage')
    return data.data
  },
}

export const weeklyReportService = {
  submitReport: async (report: { teamId: string; weekNumber: number; achievements: string; plans: string; blockers: string }) => {
    const { data } = await api.post('/weekly/submit', report)
    return data.data
  },

  getWeeklyReports: async (params?: { teamId?: string }) => {
    const { data } = await api.get('/weekly/reports', { params })
    return data.data
  },
}

export const mentoringService = {
  getSlots: async (params?: { lecturerId?: string; status?: string }) => {
    const { data } = await api.get('/mentoring/slots', { params })
    return data.data
  },

  createSlot: async (slot: { startTime: string; endTime: string; meetingLink?: string }) => {
    const { data } = await api.post('/mentoring/slots', slot)
    return data.data
  },

  bookSlot: async (id: string, booking: { teamId: string; topic: string }) => {
    const { data } = await api.post(`/mentoring/slots/${id}/book`, booking)
    return data.data
  },

  updateMeetingMinutes: async (id: string, meetingMinutes: string) => {
    const { data } = await api.put(`/mentoring/slots/${id}/minutes`, { meetingMinutes })
    return data.data
  },

  coSignMeetingMinutes: async (id: string) => {
    const { data } = await api.post(`/mentoring/slots/${id}/co-sign`)
    return data.data
  },
}

export const evaluationService = {
  submitEvaluation: async (evaluation: {
    evaluateeId: string
    teamId: string
    milestone: number
    contribution: number
    professionalism: number
    communication: number
    punctuality: number
    qualityOfWork: number
    feedback?: string
  }) => {
    const { data } = await api.post('/evaluation/submit', evaluation)
    return data.data
  },

  getEvaluationStats: async (params: { teamId: string; userId?: string }) => {
    const { data } = await api.get('/evaluation/stats', { params })
    return data.data
  },
}

export const gradeService = {
  gradeTeam: async (grade: { teamId: string; milestone: number; score: number; feedback?: string }) => {
    const { data } = await api.post('/grades/submit', grade)
    return data.data
  },

  getTeamGrades: async (teamId: string) => {
    const { data } = await api.get(`/grades/team/${teamId}`)
    return data.data
  },

  getClassGrades: async (params?: { classCode?: string }) => {
    const { data } = await api.get('/grades/class', { params })
    return data.data
  },
}

export const jobService = {
  createJobPost: async (post: { teamId: string; title: string; description: string; commitmentHours: number }) => {
    const { data } = await api.post('/jobs/create', post)
    return data.data
  },

  getJobPosts: async (params?: { search?: string }) => {
    const { data } = await api.get('/jobs', { params })
    return data.data
  },

  applyJob: async (application: { jobPostId: string; introduction: string }) => {
    const { data } = await api.post('/jobs/apply', application)
    return data.data
  },

  getApplications: async (jobPostId: string) => {
    const { data } = await api.get(`/jobs/applications/${jobPostId}`)
    return data.data
  },

  reviewApplication: async (id: string, status: 'accepted' | 'rejected') => {
    const { data } = await api.put(`/jobs/applications/${id}/review`, { status })
    return data.data
  },
}

export const notificationService = {
  getNotifications: async () => {
    const { data } = await api.get('/notifications')
    return data.data
  },

  markAsRead: async (id: string) => {
    const { data } = await api.put(`/notifications/${id}/read`)
    return data.data
  },
}

export const chatService = {
  getMessages: async (teamId: string) => {
    const { data } = await api.get(`/chat/${teamId}`)
    return data.data
  },

  sendMessage: async (teamId: string, message: string) => {
    const { data } = await api.post(`/chat/${teamId}`, { message })
    return data.data
  },
}

export const okrService = {
  getObjectives: async (projectId: string) => {
    const { data } = await api.get(`/okr/${projectId}`)
    return data.data
  },

  createObjective: async (projectId: string, title: string) => {
    const { data } = await api.post(`/okr/${projectId}`, { title })
    return data.data
  },

  createKeyResult: async (objectiveId: string, kr: { title: string; targetValue: number; unit?: string }) => {
    const { data } = await api.post(`/okr/objective/${objectiveId}/key-result`, kr)
    return data.data
  },

  updateKeyResult: async (id: string, currentValue: number) => {
    const { data } = await api.put(`/okr/key-result/${id}`, { currentValue })
    return data.data
  },
}

export const surveyService = {
  addSurvey: async (projectId: string, survey: { respondentName?: string; feedbackText: string; willPayRate: number; demographics?: string }) => {
    const { data } = await api.post(`/surveys/${projectId}`, survey)
    return data.data
  },

  getSurveys: async (projectId: string) => {
    const { data } = await api.get(`/surveys/${projectId}`)
    return data.data
  },

  analyzeSurveys: async (projectId: string) => {
    const { data } = await api.post(`/surveys/${projectId}/analyze`)
    return data.data
  },
}

export const financialService = {
  getFinancialModel: async (projectId: string) => {
    const { data } = await api.get(`/financial/${projectId}`)
    return data.data
  },

  saveFinancialModel: async (projectId: string, financialData: { fixedCosts: number; variableCosts: number; sellingPrice: number; projectedSales: number; cac: number; ltv: number; triggerAI?: boolean }) => {
    const { data } = await api.put(`/financial/${projectId}`, financialData)
    return data.data
  },
}

export const slideService = {
  generateSlides: async (projectId: string) => {
    const { data } = await api.post(`/ai/projects/${projectId}/generate-slides`)
    return data.data
  },
}

export const mentorService = {
  getMentorMessages: async (projectId: string) => {
    const { data } = await api.get(`/mentor/projects/${projectId}/mentor`)
    return data.data
  },

  sendMentorMessage: async (projectId: string, message: string) => {
    const { data } = await api.post(`/mentor/projects/${projectId}/mentor`, { message })
    return data.data
  },
}

export const crowdfundingService = {
  investInProject: async (projectId: string, amount: number) => {
    const { data } = await api.post(`/investments/${projectId}/invest`, { amount })
    return data.data
  },

  getProjectLeaderboard: async () => {
    const { data } = await api.get('/investments/leaderboard')
    return data.data
  },
}

export const peerRadarService = {
  getTeamRadarStats: async (teamId: string) => {
    const { data } = await api.get(`/evaluation/team-radar/${teamId}`)
    return data.data
  },
}

export const githubService = {
  simulateWebhook: async (projectId: string, commitMessage: string, repoUrl?: string) => {
    const { data } = await api.post('/github/webhook', { projectId, commitMessage, repoUrl })
    return data
  }
}

