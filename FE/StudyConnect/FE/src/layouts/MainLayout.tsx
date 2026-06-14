import { Outlet } from 'react-router-dom'
import Sidebar from '../components/common/Sidebar'
import TopNav from '../components/common/TopNav'

export default function MainLayout() {
  return (
    <div className="min-h-screen flex bg-[var(--color-bg)]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopNav />
        <main className="p-6">
          <div className="container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
