import { useEffect, useState } from 'react'
import ContributionChart from '../../components/charts/ContributionChart'
import { taskService } from '../../services/apiServices'

export default function Analytics() {
  const [completedCount, setCompletedCount] = useState<number | string>('...')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const myTasks = await taskService.getMyTasks()
        const completed = myTasks.filter((t: any) => t.status === 'completed').length
        setCompletedCount(completed)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadTasks()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Contribution Analytics</h1>
      <p className="text-sm text-gray-500 mb-6">Thống kê hoạt động đóng góp dự án của bạn trên StudyConnect</p>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card border-l-4 border-green-500">
          <h3 className="font-semibold text-gray-600">Participation Score</h3>
          <p className="text-3xl font-bold text-[#FF6B00] mt-2">{loading ? '...' : '82'}</p>
        </div>
        <div className="card border-l-4 border-blue-500">
          <h3 className="font-semibold text-gray-600">Completed Tasks</h3>
          <p className="text-3xl font-bold text-[#FF6B00] mt-2">{completedCount}</p>
        </div>
      </div>

      <div className="mt-6 card">
        <h3 className="font-semibold mb-4">Weekly Activity</h3>
        <ContributionChart />
      </div>
    </div>
  )
}
