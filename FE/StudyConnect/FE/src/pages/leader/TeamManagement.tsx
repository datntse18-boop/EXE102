import { useEffect, useState } from 'react'
import Card from '../../components/cards/Card'
import { teamService, userService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'

export default function TeamManagement() {
  const { user } = useAuth()
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  
  // Edit team details
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('active')

  // Users list to add
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [teamsData, usersData] = await Promise.all([
        teamService.getTeams(),
        userService.getUsers(),
      ])
      // Filter teams where logged in user is the leader
      const ledTeams = teamsData.filter((t: any) => t.leaderId === user?.id)
      setTeams(ledTeams)
      setAllUsers(usersData)

      if (ledTeams.length > 0) {
        setSelectedTeam(ledTeams[0])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedTeam) {
      setName(selectedTeam.name)
      setDescription(selectedTeam.description || '')
      setStatus(selectedTeam.status)
    }
  }, [selectedTeam])

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeam) return
    try {
      const updated = await teamService.updateTeam(selectedTeam.id, { name, description, status })
      alert('Cập nhật thông tin nhóm thành công!')
      // Refresh list
      setTeams(teams.map(t => t.id === selectedTeam.id ? { ...t, ...updated } : t))
      setSelectedTeam({ ...selectedTeam, ...updated })
    } catch (err) {
      console.error(err)
      alert('Không thể cập nhật nhóm')
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!selectedTeam) return
    if (userId === selectedTeam.leaderId) {
      alert('Không thể xóa trưởng nhóm!')
      return
    }
    if (window.confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?')) {
      try {
        await teamService.removeMember(selectedTeam.id, userId)
        // Refresh team info
        const updatedTeam = await teamService.getTeamById(selectedTeam.id)
        setSelectedTeam(updatedTeam)
        setTeams(teams.map(t => t.id === selectedTeam.id ? updatedTeam : t))
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleAddMember = async (userId: string) => {
    if (!selectedTeam) return
    try {
      await teamService.addMember(selectedTeam.id, userId)
      alert('Thêm thành viên thành công!')
      // Refresh team info
      const updatedTeam = await teamService.getTeamById(selectedTeam.id)
      setSelectedTeam(updatedTeam)
      setTeams(teams.map(t => t.id === selectedTeam.id ? updatedTeam : t))
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể thêm thành viên')
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Đang tải quản lý nhóm...</div>
  }

  // Filter users who are not in the selected team yet
  const nonMembers = allUsers.filter(u => {
    if (!selectedTeam) return false
    return !selectedTeam.members?.some((m: any) => m.userId === u.id)
  })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Team Management</h1>
      <p className="text-sm text-gray-500 mb-6">Trang dành cho Trưởng nhóm để chỉnh sửa thông tin dự án và quản lý nhân sự</p>

      {teams.length === 0 ? (
        <Card className="text-center py-12 text-gray-500">
          Bạn chưa làm trưởng nhóm của nhóm nào. Hãy tạo nhóm mới tại phần **Team Matching** để bắt đầu quản lý nhé!
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Team Selector */}
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">Chọn nhóm bạn quản lý</label>
            <select
              value={selectedTeam?.id || ''}
              onChange={(e) => setSelectedTeam(teams.find(t => t.id === e.target.value))}
              className="max-w-md w-full border rounded px-3 py-2 focus:outline-none focus:border-[#FF6B00] bg-white font-medium shadow-sm"
            >
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Edit details form */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <h3 className="font-bold text-lg text-gray-800 mb-4 pb-2 border-b border-[#FF6B00]">Chỉnh sửa thông tin nhóm</h3>
                <form onSubmit={handleUpdateTeam} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Tên nhóm *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:border-[#FF6B00]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Mô tả định hướng nhóm</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:border-[#FF6B00]"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Trạng thái hoạt động</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:border-[#FF6B00] bg-white"
                    >
                      <option value="active">Active</option>
                      <option value="at_risk">At Risk</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#FF6B00] text-white rounded font-medium hover:bg-[#E85A00] transition"
                  >
                    Lưu thay đổi
                  </button>
                </form>
              </Card>

              {/* Members List */}
              <Card>
                <h3 className="font-bold text-lg text-gray-800 mb-4 pb-2 border-b border-[#FF6B00]">Danh sách thành viên hiện tại</h3>
                <div className="divide-y">
                  {selectedTeam?.members?.map((m: any) => (
                    <div key={m.userId} className="flex justify-between items-center py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{m.user?.avatar || '👤'}</span>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{m.user?.name}</p>
                          <p className="text-xs text-gray-500">{m.user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.userId === selectedTeam.leaderId ? (
                          <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">Trưởng nhóm</span>
                        ) : (
                          <button
                            onClick={() => handleRemoveMember(m.userId)}
                            className="text-xs border border-red-200 text-red-500 hover:bg-red-50 px-2.5 py-1 rounded transition"
                          >
                            Xóa khỏi nhóm
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right column: Add new members */}
            <div className="md:col-span-1">
              <Card>
                <h3 className="font-bold text-lg text-gray-800 mb-4 pb-2 border-b border-[#FF6B00]">Thêm sinh viên khác</h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {nonMembers.length > 0 ? (
                    nonMembers.map(u => (
                      <div key={u.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{u.avatar || '👤'}</span>
                          <div>
                            <p className="font-bold text-xs text-gray-800">{u.name}</p>
                            <p className="text-[10px] text-gray-500">{u.role}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddMember(u.id)}
                          className="text-[10px] bg-[#FF6B00] text-white font-medium hover:bg-[#E85A00] px-2 py-1 rounded transition"
                        >
                          + Thêm
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-4">Tất cả sinh viên đều đã tham gia nhóm</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
