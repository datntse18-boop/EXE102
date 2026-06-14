import { Outlet } from 'react-router-dom'
import TopNav from '../components/common/TopNav'

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-white">
      <TopNav />
      <div className="container p-6">
        <Outlet />
      </div>
    </div>
  )
}
