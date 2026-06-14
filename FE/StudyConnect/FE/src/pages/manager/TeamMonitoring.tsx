import { useEffect, useState } from 'react'
import Card from '../../components/cards/Card'
import { teamService } from '../../services/apiServices'

export default function TeamMonitoring() {
  const [teams, setTeams] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await teamService.getTeams({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
      })
      setTeams(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [searchTerm, statusFilter])

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhóm này?')) {
      try {
        await teamService.deleteTeam(id)
        setTeams(teams.filter(t => t.id !== id))
      } catch (err) {
        console.error(err)
        alert('Không thể xóa nhóm')
      }
    }
  }

  const TeamRow = ({ team }: { team: any }) => {
    return (
      <div className="card mb-3 border-l-4 border-[#FF6B00]">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-lg">{team.name}</h3>
            <p className="text-sm text-gray-600 my-1">{team.description}</p>
            <div className="flex gap-4 text-sm my-2">
              <span>👥 {team.members?.length || 0} members</span>
              <span>📋 {team.projects?.length || 0} projects</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-[#FF6B00]">{team.healthScore}%</div>
            <div className={`text-xs font-medium capitalize px-2 py-1 rounded mt-2 ${team.status === 'active' ? 'bg-green-100 text-green-700' : team.status === 'at_risk' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{team.status}</div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button className="px-3 py-1 rounded text-sm bg-[#FF6B00] text-white hover:bg-[#E85A00]">View Details</button>
          <button className="px-3 py-1 rounded text-sm border border-[#FF6B00] text-[#FF6B00] hover:bg-[#FFF4E8]">Edit Team</button>
          <button onClick={() => handleDelete(team.id)} className="px-3 py-1 rounded text-sm border border-red-500 text-red-500 hover:bg-red-50">Delete</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Team Monitoring</h1>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Search Teams</label>
            <input
              type="text"
              placeholder="Team name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full mt-1 border rounded px-3 py-2 focus:outline-none focus:border-[#FF6B00]"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full mt-1 border rounded px-3 py-2 focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="all">All Teams</option>
              <option value="active">Active</option>
              <option value="at_risk">At Risk</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Results</label>
            <div className="mt-1 px-3 py-2 bg-[#FFF4E8] rounded text-[#FF6B00] font-bold">
              {loading ? '...' : `${teams.length} teams`}
            </div>
          </div>
        </div>
      </Card>

      {/* Teams List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Đang tải...</p>
        ) : teams.length > 0 ? (
          teams.map(team => (
            <TeamRow key={team.id} team={team} />
          ))
        ) : (
          <Card className="text-center text-gray-500 py-8">No teams found</Card>
        )}
      </div>

      {/* Quick Stats */}
      {!loading && teams.length > 0 && (
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-green-500">
            <p className="text-sm text-gray-600">Active Teams</p>
            <p className="text-3xl font-bold text-[#FF6B00]">{teams.filter(t => t.status === 'active').length}</p>
          </Card>
          <Card className="border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600">At-Risk Teams</p>
            <p className="text-3xl font-bold text-[#FF6B00]">{teams.filter(t => t.status === 'at_risk').length}</p>
          </Card>
          <Card className="border-l-4 border-blue-500">
            <p className="text-sm text-gray-600">Avg Team Health</p>
            <p className="text-3xl font-bold text-[#FF6B00]">
              {Math.round(teams.reduce((sum, t) => sum + t.healthScore, 0) / teams.length)}%
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}
