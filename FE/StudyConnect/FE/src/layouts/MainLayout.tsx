import { Outlet } from 'react-router-dom'
import Sidebar from '../components/common/Sidebar'
import TopNav from '../components/common/TopNav'

export default function MainLayout() {
  return (
    <div className="h-screen flex overflow-hidden bg-[var(--color-bg)]">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
