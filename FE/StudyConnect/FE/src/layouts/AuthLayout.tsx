import { Outlet, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function AuthLayout() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#060608] p-6 relative">
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-gray-500 hover:text-white hover:bg-gray-800/60 transition text-xs font-bold border border-gray-150 dark:border-gray-800 hover:shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Quay về Trang chủ
      </button>
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  )
}
