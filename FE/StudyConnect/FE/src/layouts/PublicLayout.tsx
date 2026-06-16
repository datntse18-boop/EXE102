import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import TopNav from '../components/common/TopNav'
import { ArrowLeft } from 'lucide-react'

export default function PublicLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const showBack = location.pathname !== '/'

  return (
    <div className="min-h-screen flex flex-col bg-[#060608]">
      <TopNav />
      <main className="flex-1">
        {showBack && (
          <div className="container mx-auto px-6 pt-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-gray-500 hover:text-white hover:bg-gray-800/60 transition text-xs font-bold border border-gray-150 dark:border-gray-800 hover:shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </button>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  )
}
