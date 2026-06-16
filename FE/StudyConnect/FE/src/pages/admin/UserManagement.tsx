import { useEffect, useState } from 'react'
import Card from '../../components/cards/Card'
import { userService } from '../../services/apiServices'

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  // Create User States
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('password123')
  const [newRole, setNewRole] = useState('member')
  const [newClassCode, setNewClassCode] = useState('')
  const [newSubscription, setNewSubscription] = useState('free')
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')
  const [creatingUser, setCreatingUser] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await userService.getUsers({ search: searchTerm || undefined, role: roleFilter !== 'all' ? roleFilter : undefined })
      setUsers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [searchTerm, roleFilter])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreateSuccess('')
    setCreatingUser(true)
    try {
      const created = await userService.createUser({
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
        classCode: newClassCode || undefined,
        subscription: newSubscription,
      })
      setCreateSuccess(`Đã tạo thành công tài khoản cho ${created.name}!`)
      setNewName('')
      setNewEmail('')
      setNewPassword('password123')
      setNewRole('member')
      setNewClassCode('')
      setNewSubscription('free')
      load()
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Tạo tài khoản thất bại.')
    } finally {
      setCreatingUser(false)
    }
  }

  const handleSuspend = async (userId: string) => {
    setUpdating(userId)
    try {
      await userService.toggleStatus(userId)
      setUsers(users.map(u => u.id === userId ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' } : u))
    } finally {
      setUpdating(null)
    }
  }

  const handleChangeRole = async (userId: string, newRole: string) => {
    setUpdating(userId)
    try {
      await userService.updateRole(userId, newRole)
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } finally {
      setUpdating(null)
    }
  }

  const handleDeleteUser = async (userId: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản của ${name} không? Thao tác này sẽ xóa toàn bộ dữ liệu liên quan và không thể phục hồi!`)) {
      setUpdating(userId)
      try {
        await userService.deleteUser(userId)
        setUsers(users.filter(u => u.id !== userId))
      } catch (err: any) {
        alert(err.response?.data?.message || 'Xóa tài khoản thất bại.')
      } finally {
        setUpdating(null)
      }
    }
  }

  // Calculate user statistics
  const totalUsers = users.length
  const studentCount = users.filter(u => u.role === 'member').length
  const managerCount = users.filter(u => u.role === 'manager').length
  const leaderCount = users.filter(u => u.role === 'leader').length
  const activeCount = users.filter(u => u.status === 'active').length

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-xs text-gray-400 mt-1">Quản lý tài khoản Giảng viên, Dean (Leader) và Sinh viên trong hệ thống</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2.5 bg-[#FF6B00] text-white font-bold text-xs rounded-xl hover:bg-[#E85A00] transition flex items-center gap-1.5 shadow-md shadow-orange-500/10 cursor-pointer"
        >
          {showCreateForm ? 'Đóng form' : '+ Tạo tài khoản mới'}
        </button>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Tổng số người dùng', value: totalUsers, icon: '👥', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
          { label: 'Sinh viên (Member)', value: studentCount, icon: '🎓', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
          { label: 'Giảng viên (Manager)', value: managerCount, icon: '👩‍🔬', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
          { label: 'Dean / Leader', value: leaderCount, icon: '👩‍🎓', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
          { label: 'Đang hoạt động', value: activeCount, icon: '✅', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
        ].map(s => (
          <div key={s.label} className={`border rounded-2xl p-4 bg-white dark:bg-[#13131C] ${s.color} flex flex-col justify-between h-24 shadow-sm`}>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">{s.label}</span>
              <span className="text-lg">{s.icon}</span>
            </div>
            <span className="text-2xl font-black text-gray-800 dark:text-white mt-2">{s.value}</span>
          </div>
        ))}
      </div>

      {showCreateForm && (
        <Card className="mb-6 border-t-4 border-[#FF6B00] animate-fadeIn">
          <h3 className="text-sm font-extrabold text-gray-800 dark:text-white mb-4">Tạo tài khoản thành viên mới</h3>
          
          {createError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs border border-red-200 font-bold">{createError}</div>
          )}
          {createSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-green-50 text-green-700 text-xs border border-green-200 font-bold">{createSuccess}</div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF6B00] bg-white dark:bg-[#13131C] text-gray-805 dark:text-gray-200 font-medium"
                />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="email@example.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF6B00] bg-white dark:bg-[#13131C] text-gray-805 dark:text-gray-200 font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Mật khẩu *</label>
                <input
                  type="text"
                  required
                  placeholder="Mật khẩu tài khoản..."
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF6B00] bg-white dark:bg-[#13131C] text-gray-850 dark:text-gray-200 font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Vai trò (Role) *</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF6B00] bg-white dark:bg-[#13131C] text-gray-800 dark:text-gray-200 font-bold"
                >
                  <option value="member">Sinh viên (Member)</option>
                  <option value="leader">Quản lý (Dean / Leader)</option>
                  <option value="manager">Giảng viên (Manager)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Mã lớp (Class Code)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: CLASS-EXE-101"
                  value={newClassCode}
                  onChange={e => setNewClassCode(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF6B00] bg-white dark:bg-[#13131C] text-gray-850 dark:text-gray-200 font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Gói dịch vụ (Subscription)</label>
                <select
                  value={newSubscription}
                  onChange={e => setNewSubscription(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF6B00] bg-white dark:bg-[#13131C] text-gray-800 dark:text-gray-200 font-bold"
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creatingUser}
                className="px-6 py-2.5 bg-gradient-to-r from-[#FF6B00] to-[#FF801A] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-60 text-xs cursor-pointer"
              >
                {creatingUser ? 'Đang tạo...' : 'Lưu tài khoản'}
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card className="mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Search Users</label>
            <input
              type="text"
              placeholder="Name or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full mt-1 border rounded px-3 py-2 focus:outline-none focus:border-[#FF6B00]"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Filter by Role</label>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="w-full mt-1 border rounded px-3 py-2 focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="all">All Roles</option>
              <option value="member">Member</option>
              <option value="leader">Leader</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Results</label>
            <div className="mt-1 px-3 py-2 bg-[#FFF4E8] rounded text-[#FF6B00] font-bold">
              {loading ? '...' : `${users.length} users`}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-center text-gray-400 py-8">Đang tải...</p>
          ) : (
            <table className="w-full">
              <thead className="border-b-2 border-[#FF6B00]">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold">User</th>
                  <th className="text-left p-3 text-sm font-semibold">Email</th>
                  <th className="text-left p-3 text-sm font-semibold">Role</th>
                  <th className="text-left p-3 text-sm font-semibold">Subscription</th>
                  <th className="text-left p-3 text-sm font-semibold">Status</th>
                  <th className="text-left p-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className={`border-b hover:bg-[#FFF4E8] ${updating === user.id ? 'opacity-50' : ''}`}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{user.avatar || '👤'}</span>
                        <strong>{user.name}</strong>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-600">{user.email}</td>
                    <td className="p-3">
                      {user.role === 'admin' ? (
                        <span className="px-2.5 py-1 text-xs font-black text-[#FF6B00] bg-orange-500/10 border border-orange-500/20 rounded-lg uppercase tracking-wider">
                          System Admin
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          onChange={e => handleChangeRole(user.id, e.target.value)}
                          disabled={updating === user.id}
                          className="border rounded px-2 py-1 text-sm capitalize focus:outline-none focus:border-[#FF6B00] bg-transparent text-gray-700 dark:text-gray-300 font-bold"
                        >
                          <option value="member">Member</option>
                          <option value="leader">Leader</option>
                          <option value="manager">Manager</option>
                        </select>
                      )}
                    </td>
                    <td className="p-3 text-sm capitalize">
                      <span className={`px-2 py-1 rounded text-xs ${user.subscription === 'premium' ? 'bg-[#FFA64D] text-white' : user.subscription === 'enterprise' ? 'bg-[#FF6B00] text-white' : 'bg-gray-100'}`}>
                        {user.subscription}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSuspend(user.id)}
                          disabled={updating === user.id || user.role === 'admin'}
                          className={`px-3 py-1 rounded text-xs font-medium transition ${user.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400' : 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/20 dark:text-green-400'} disabled:opacity-50`}
                        >
                          {user.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={updating === user.id}
                            className="px-3 py-1 bg-red-100 hover:bg-red-600 text-red-650 hover:text-white dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-600 rounded text-xs font-medium transition disabled:opacity-50"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
