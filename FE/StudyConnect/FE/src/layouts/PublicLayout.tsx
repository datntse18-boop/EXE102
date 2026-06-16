import { Outlet } from 'react-router-dom'
import TopNav from '../components/common/TopNav'

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#060608]">
      <TopNav />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
