import { createContext, useState, useContext, useEffect, ReactNode } from 'react'
import { authService } from '../services/apiServices'

export type Role = 'guest' | 'member' | 'leader' | 'manager' | 'admin'

type User = {
  id: string
  name: string
  email: string
  role: Role
  avatar?: string
  subscription?: string
  status?: string
  skills?: string
  desiredRole?: string
  commitmentHours?: number
  pastProjects?: string
  classCode?: string
  balance?: number
}

type AuthContextValue = {
  user: User | null
  role: Role
  loading: boolean
  login: (identifier: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUserData: (data: Partial<User>) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Auto-restore session on mount
  useEffect(() => {
    const restore = async () => {
      const token = sessionStorage.getItem('accessToken')
      if (token) {
        try {
          const me = await authService.me()
          setUser(me)
        } catch {
          sessionStorage.removeItem('accessToken')
          sessionStorage.removeItem('refreshToken')
        }
      }
      setLoading(false)
    }
    restore()
  }, [])

  const login = async (identifier: string, password: string) => {
    const { user: userData, accessToken, refreshToken } = await authService.login(identifier, password)
    sessionStorage.setItem('accessToken', accessToken)
    sessionStorage.setItem('refreshToken', refreshToken)
    setUser(userData)
  }

  const logout = async () => {
    try {
      await authService.logout()
    } finally {
      setUser(null)
    }
  }

  const updateUserData = (data: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...data } : null)
  }

  return (
    <AuthContext.Provider value={{ user, role: (user?.role ?? 'guest') as Role, loading, login, logout, updateUserData }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
