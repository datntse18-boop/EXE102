// Mock data with relationships for a realistic SaaS platform

export type UserRole = 'member' | 'leader' | 'manager' | 'admin'
export type SubscriptionPlan = 'free' | 'premium' | 'enterprise'
export type TaskStatus = 'todo' | 'in-progress' | 'completed'
export type TeamStatus = 'active' | 'at-risk' | 'inactive'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  status: 'active' | 'suspended'
  subscription: SubscriptionPlan
  joinedAt: string
  lastActive: string
}

export interface Team {
  id: string
  name: string
  description: string
  leaderId: string
  members: string[] // user IDs
  status: TeamStatus
  createdAt: string
  projectCount: number
  tasksCompleted: number
  healthScore: number // 0-100
}

export interface Project {
  id: string
  teamId: string
  name: string
  description: string
  status: 'planning' | 'active' | 'completed'
  milestone: number
  progress: number // 0-100
  dueDate: string
}

export interface Task {
  id: string
  projectId: string
  title: string
  description: string
  assignedTo: string
  status: TaskStatus
  priority: 'low' | 'medium' | 'high'
  dueDate: string
  createdAt: string
}

export interface Invitation {
  id: string
  teamId: string
  fromUserId: string
  toUserId: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

export interface Subscription {
  userId: string
  plan: SubscriptionPlan
  startDate: string
  endDate: string
  autoRenew: boolean
  price: number
}

export interface Payment {
  id: string
  userId: string
  amount: number
  plan: SubscriptionPlan
  status: 'completed' | 'pending' | 'failed'
  date: string
}

export interface AIUsage {
  id: string
  userId: string
  feature: 'idea-generator' | 'team-matching' | 'analytics'
  date: string
  count: number
}

// ========== MOCK DATA INSTANCES ==========

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'member',
    avatar: '👩‍💼',
    status: 'active',
    subscription: 'premium',
    joinedAt: '2025-01-15',
    lastActive: '2026-06-07',
  },
  {
    id: 'u2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'leader',
    avatar: '👨‍💼',
    status: 'active',
    subscription: 'premium',
    joinedAt: '2025-02-10',
    lastActive: '2026-06-07',
  },
  {
    id: 'u3',
    name: 'Carol Williams',
    email: 'carol@example.com',
    role: 'manager',
    avatar: '👩‍🔬',
    status: 'active',
    subscription: 'enterprise',
    joinedAt: '2024-12-01',
    lastActive: '2026-06-07',
  },
  {
    id: 'u4',
    name: 'David Brown',
    email: 'david@example.com',
    role: 'admin',
    avatar: '👨‍💻',
    status: 'active',
    subscription: 'enterprise',
    joinedAt: '2024-01-01',
    lastActive: '2026-06-07',
  },
  {
    id: 'u5',
    name: 'Emma Davis',
    email: 'emma@example.com',
    role: 'member',
    avatar: '👩‍🎓',
    status: 'active',
    subscription: 'free',
    joinedAt: '2026-05-01',
    lastActive: '2026-06-06',
  },
  {
    id: 'u6',
    name: 'Frank Miller',
    email: 'frank@example.com',
    role: 'member',
    avatar: '👨‍🎓',
    status: 'suspended',
    subscription: 'free',
    joinedAt: '2026-03-15',
    lastActive: '2026-05-20',
  },
]

export const mockTeams: Team[] = [
  {
    id: 't1',
    name: 'EduMatch AI',
    description: 'AI-powered student matching platform',
    leaderId: 'u2',
    members: ['u2', 'u1', 'u5'],
    status: 'active',
    createdAt: '2026-01-10',
    projectCount: 2,
    tasksCompleted: 24,
    healthScore: 92,
  },
  {
    id: 't2',
    name: 'GreenTech Solutions',
    description: 'Sustainable technology for smart cities',
    leaderId: 'u1',
    members: ['u1', 'u2'],
    status: 'active',
    createdAt: '2026-02-05',
    projectCount: 1,
    tasksCompleted: 15,
    healthScore: 78,
  },
  {
    id: 't3',
    name: 'HealthSync',
    description: 'Healthcare management system',
    leaderId: 'u5',
    members: ['u5', 'u6'],
    status: 'at-risk',
    createdAt: '2026-03-01',
    projectCount: 1,
    tasksCompleted: 5,
    healthScore: 45,
  },
]

export const mockProjects: Project[] = [
  {
    id: 'p1',
    teamId: 't1',
    name: 'MVP Development',
    description: 'Core MVP features',
    status: 'active',
    milestone: 2,
    progress: 65,
    dueDate: '2026-07-15',
  },
  {
    id: 'p2',
    teamId: 't1',
    name: 'Beta Testing',
    description: 'User testing and feedback',
    status: 'planning',
    milestone: 3,
    progress: 20,
    dueDate: '2026-08-30',
  },
  {
    id: 'p3',
    teamId: 't2',
    name: 'Prototype Phase',
    description: 'Create working prototype',
    status: 'active',
    milestone: 1,
    progress: 45,
    dueDate: '2026-07-01',
  },
  {
    id: 'p4',
    teamId: 't3',
    name: 'Initial Design',
    description: 'System design and architecture',
    status: 'planning',
    milestone: 1,
    progress: 30,
    dueDate: '2026-06-30',
  },
]

export const mockTasks: Task[] = [
  {
    id: 'task1',
    projectId: 'p1',
    title: 'Setup authentication',
    description: 'Implement user auth system',
    assignedTo: 'u1',
    status: 'completed',
    priority: 'high',
    dueDate: '2026-06-10',
    createdAt: '2026-05-20',
  },
  {
    id: 'task2',
    projectId: 'p1',
    title: 'Build dashboard UI',
    description: 'Create responsive dashboard',
    assignedTo: 'u2',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2026-06-15',
    createdAt: '2026-05-25',
  },
  {
    id: 'task3',
    projectId: 'p1',
    title: 'API Integration',
    description: 'Connect to backend API',
    assignedTo: 'u5',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-06-20',
    createdAt: '2026-05-30',
  },
  {
    id: 'task4',
    projectId: 'p2',
    title: 'Create test plan',
    description: 'Beta testing strategy',
    assignedTo: 'u1',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-07-10',
    createdAt: '2026-06-01',
  },
  {
    id: 'task5',
    projectId: 'p3',
    title: 'Database schema',
    description: 'Design database structure',
    assignedTo: 'u2',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2026-06-25',
    createdAt: '2026-06-05',
  },
]

export const mockInvitations: Invitation[] = [
  {
    id: 'inv1',
    teamId: 't1',
    fromUserId: 'u2',
    toUserId: 'u6',
    status: 'pending',
    createdAt: '2026-06-05',
  },
  {
    id: 'inv2',
    teamId: 't2',
    fromUserId: 'u1',
    toUserId: 'u5',
    status: 'accepted',
    createdAt: '2026-06-03',
  },
]

export const mockSubscriptions: Subscription[] = [
  { userId: 'u1', plan: 'premium', startDate: '2026-01-15', endDate: '2027-01-15', autoRenew: true, price: 9.99 },
  { userId: 'u2', plan: 'premium', startDate: '2026-02-10', endDate: '2027-02-10', autoRenew: true, price: 9.99 },
  { userId: 'u3', plan: 'enterprise', startDate: '2024-12-01', endDate: '2025-12-01', autoRenew: true, price: 49.99 },
  { userId: 'u4', plan: 'enterprise', startDate: '2024-01-01', endDate: '2025-01-01', autoRenew: true, price: 49.99 },
  { userId: 'u5', plan: 'free', startDate: '2026-05-01', endDate: '2099-12-31', autoRenew: false, price: 0 },
]

export const mockPayments: Payment[] = [
  { id: 'pay1', userId: 'u1', amount: 9.99, plan: 'premium', status: 'completed', date: '2026-01-15' },
  { id: 'pay2', userId: 'u2', amount: 9.99, plan: 'premium', status: 'completed', date: '2026-02-10' },
  { id: 'pay3', userId: 'u3', amount: 49.99, plan: 'enterprise', status: 'completed', date: '2026-06-01' },
  { id: 'pay4', userId: 'u4', amount: 49.99, plan: 'enterprise', status: 'completed', date: '2026-06-02' },
]

export const mockAIUsage: AIUsage[] = [
  { id: 'ai1', userId: 'u1', feature: 'idea-generator', date: '2026-06-05', count: 5 },
  { id: 'ai2', userId: 'u1', feature: 'team-matching', date: '2026-06-04', count: 3 },
  { id: 'ai3', userId: 'u2', feature: 'idea-generator', date: '2026-06-06', count: 8 },
  { id: 'ai4', userId: 'u3', feature: 'analytics', date: '2026-06-06', count: 2 },
]

// ========== HELPER FUNCTIONS ==========

export function getTeamMembers(teamId: string): User[] {
  const team = mockTeams.find(t => t.id === teamId)
  if (!team) return []
  return mockUsers.filter(u => team.members.includes(u.id))
}

export function getTeamsByLeader(leaderId: string): Team[] {
  return mockTeams.filter(t => t.leaderId === leaderId)
}

export function getTeamProjects(teamId: string): Project[] {
  return mockProjects.filter(p => p.teamId === teamId)
}

export function getProjectTasks(projectId: string): Task[] {
  return mockTasks.filter(t => t.projectId === projectId)
}

export function getUserSubscription(userId: string): Subscription | undefined {
  return mockSubscriptions.find(s => s.userId === userId)
}

export function getUserAIUsage(userId: string): AIUsage[] {
  return mockAIUsage.filter(a => a.userId === userId)
}

export function getTeamHealthMetrics(teamId: string) {
  const team = mockTeams.find(t => t.id === teamId)
  const projects = getTeamProjects(teamId)
  const allTasks = projects.flatMap(p => getProjectTasks(p.id))
  
  return {
    teamName: team?.name,
    members: team?.members.length || 0,
    totalTasks: allTasks.length,
    completedTasks: allTasks.filter(t => t.status === 'completed').length,
    inProgressTasks: allTasks.filter(t => t.status === 'in-progress').length,
    healthScore: team?.healthScore || 0,
  }
}

export function calculatePlatformStats() {
  const totalUsers = mockUsers.length
  const activeUsers = mockUsers.filter(u => u.status === 'active').length
  const premiumUsers = mockUsers.filter(u => u.subscription === 'premium').length
  const activeTeams = mockTeams.filter(t => t.status === 'active').length
  const totalRevenue = mockPayments.reduce((sum, p) => sum + p.amount, 0)
  
  return { totalUsers, activeUsers, premiumUsers, activeTeams, totalRevenue }
}
