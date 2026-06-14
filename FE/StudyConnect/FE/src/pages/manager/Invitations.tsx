import { useEffect, useState } from 'react'
import Card from '../../components/cards/Card'
import { invitationService, teamService, userService } from '../../services/apiServices'

export default function Invitations() {
  const [receivedInvites, setReceivedInvites] = useState<any[]>([])
  const [sentInvites, setSentInvites] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Send invitation form state
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [receivedData, sentData, teamsData, usersData] = await Promise.all([
        invitationService.getInvitations('received'),
        invitationService.getInvitations('sent'),
        teamService.getTeams(),
        userService.getUsers(),
      ])
      setReceivedInvites(receivedData)
      setSentInvites(sentData)
      setTeams(teamsData)
      setUsers(usersData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleResponse = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      await invitationService.respond(id, status)
      alert(`Đã ${status === 'accepted' ? 'chấp nhận' : 'từ chối'} lời mời!`)
      loadData()
    } catch (err) {
      console.error(err)
      alert('Không thể thực hiện phản hồi lời mời')
    }
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeamId || !selectedUserId) return
    try {
      await invitationService.sendInvitation(selectedTeamId, selectedUserId)
      alert('Gửi lời mời thành công!')
      setSelectedUserId('')
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể gửi lời mời')
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Đang tải hộp thư lời mời...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Invitations</h1>
      <p className="text-sm text-gray-500 mb-6">Quản lý lời mời tham gia nhóm và yêu cầu gia nhập dự án</p>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left column: Sent and Received lists */}
        <div className="md:col-span-2 space-y-6">
          {/* Received Invitations */}
          <Card>
            <h3 className="font-bold text-lg text-gray-800 mb-4 pb-2 border-b border-[#FF6B00]">Lời mời đã nhận</h3>
            <div className="space-y-3">
              {receivedInvites.length > 0 ? (
                receivedInvites.map(inv => (
                  <div key={inv.id} className="p-4 rounded-lg border border-gray-100 flex justify-between items-center bg-[#FFF4E8]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{inv.fromUser?.avatar || '👤'}</span>
                        <p className="text-sm font-bold text-gray-800">{inv.fromUser?.name}</p>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Mời bạn gia nhập nhóm của họ</p>
                      <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-bold mt-2 inline-block capitalize">
                        {inv.status}
                      </span>
                    </div>

                    {inv.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResponse(inv.id, 'accepted')}
                          className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 transition"
                        >
                          Chấp nhận
                        </button>
                        <button
                          onClick={() => handleResponse(inv.id, 'rejected')}
                          className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition"
                        >
                          Từ chối
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm text-center py-6">Không có lời mời nào được nhận</p>
              )}
            </div>
          </Card>

          {/* Sent Invitations */}
          <Card>
            <h3 className="font-bold text-lg text-gray-800 mb-4 pb-2 border-b border-[#FF6B00]">Lời mời đã gửi</h3>
            <div className="space-y-3">
              {sentInvites.length > 0 ? (
                sentInvites.map(inv => (
                  <div key={inv.id} className="p-4 rounded-lg border border-gray-100 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{inv.toUser?.avatar || '👤'}</span>
                        <p className="text-sm font-bold text-gray-800">{inv.toUser?.name}</p>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Lời mời gia nhập dự án</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${inv.status === 'accepted' ? 'bg-green-100 text-green-700' : inv.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {inv.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm text-center py-6">Bạn chưa gửi lời mời nào</p>
              )}
            </div>
          </Card>
        </div>

        {/* Right column: Send new invite */}
        <div className="md:col-span-1">
          <Card className="border-t-4 border-[#FF6B00]">
            <h3 className="font-bold text-lg text-gray-800 mb-4 pb-2 border-b border-gray-100">Gửi lời mời mới</h3>
            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Chọn nhóm mời</label>
                <select
                  required
                  value={selectedTeamId}
                  onChange={e => setSelectedTeamId(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:border-[#FF6B00] bg-white text-sm"
                >
                  <option value="">-- Chọn nhóm --</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Chọn sinh viên</label>
                <select
                  required
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:border-[#FF6B00] bg-white text-sm"
                >
                  <option value="">-- Chọn sinh viên --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#FF6B00] text-white rounded font-bold hover:bg-[#E85A00] transition"
              >
                Gửi lời mời
              </button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
