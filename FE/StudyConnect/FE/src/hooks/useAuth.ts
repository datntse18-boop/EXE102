import { useAuth as useCtxAuth } from '../contexts/AuthContext'

export default function useAuth() {
  return useCtxAuth()
}
