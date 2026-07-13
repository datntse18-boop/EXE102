import { useEffect, useState } from 'react'
import Card from '../../components/cards/Card'
import { userService } from '../../services/apiServices'
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  Trash2, 
  UserPlus, 
  Search, 
  Filter, 
  Loader2, 
  Award,
  Sparkles,
  ShieldAlert
} from 'lucide-react'

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

  const handleChangeSubscription = async (userId: string, newSubscription: string) => {
    setUpdating(userId)
    try {
      await userService.updateSubscription(userId, newSubscription)
      setUsers(users.map(u => u.id === userId ? { ...u, subscription: newSubscription } : u))
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cập nhật gói dịch vụ thất bại.')
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
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Quản Lý Người Dùng 👥</h1>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            Quản lý tài khoản Giảng viên, Dean (Leader) và Sinh viên trong hệ thống StudyConnect.
          </p>
        </div>
        <button
          onClick={() => {
            setCreateError('')
            setCreateSuccess('')
            setShowCreateForm(!showCreateForm)
          }}
          className="px-5 py-2.5 bg-[#FF6B00] text-white font-bold text-xs rounded-xl hover:bg-orange-600 transition flex items-center gap-1.5 shadow-md shadow-orange-500/10 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          {showCreateForm ? 'Đóng Form' : 'Tạo thành viên mới'}
        </button>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Tổng số tài khoản', value: totalUsers, icon: '👥', color: 'text-blue-500 bg-blue-500/5 border-blue-500/10' },
          { label: 'Sinh viên (Member)', value: studentCount, icon: '🎓', color: 'text-orange-500 bg-orange-500/5 border-orange-500/10' },
          { label: 'Giảng viên (Manager)', value: managerCount, icon: '👩‍🏫', color: 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10' },
          { label: 'Dean / Leader', value: leaderCount, icon: '👩‍🎓', color: 'text-purple-500 bg-purple-500/5 border-purple-500/10' },
          { label: 'Đang hoạt động', value: activeCount, icon: '✅', color: 'text-green-500 bg-green-500/5 border-green-500/10' },
        ].map(s => (
          <div key={s.label} className={`border rounded-2xl p-4 bg-white dark:bg-[#13131C] ${s.color} flex flex-col justify-between h-24 shadow-sm`}>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">{s.label}</span>
              <span className="text-base">{s.icon}</span>
            </div>
            <span className="text-xl font-black text-gray-800 dark:text-white mt-2">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <Card className="border border-orange-500/20 bg-orange-500/[0.01] animate-fadeIn">
          <h3 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-[#FF6B00]" />
            Tạo tài khoản thành viên mới
          </h3>
          
          {createError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-400 text-xs border border-red-500/20 font-bold">{createError}</div>
          )}
          {createSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20 font-bold">{createSuccess}</div>
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
                  className="w-full border border-gray-250 dark:border-gray-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF6B00] bg-white dark:bg-[#1C1C28] text-gray-800 dark:text-white font-semibold"
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
                  className="w-full border border-gray-250 dark:border-gray-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF6B00] bg-white dark:bg-[#1C1C28] text-gray-800 dark:text-white font-semibold"
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
                  className="w-full border border-gray-250 dark:border-gray-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF6B00] bg-white dark:bg-[#1C1C28] text-gray-800 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Vai trò (Role) *</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full border border-gray-250 dark:border-gray-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF6B00] bg-white dark:bg-[#1C1C28] text-gray-800 dark:text-white font-semibold"
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
                  className="w-full border border-gray-250 dark:border-gray-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF6B00] bg-white dark:bg-[#1C1C28] text-gray-850 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Gói dịch vụ (Subscription)</label>
                <select
                  value={newSubscription}
                  onChange={e => setNewSubscription(e.target.value)}
                  className="w-full border border-gray-250 dark:border-gray-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#FF6B00] bg-white dark:bg-[#1C1C28] text-gray-800 dark:text-white font-semibold"
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
                className="px-6 py-2.5 bg-gradient-to-r from-[#FF6B00] to-orange-600 text-white font-bold rounded-xl shadow transition disabled:opacity-60 text-xs flex items-center gap-1.5"
              >
                {creatingUser ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                {creatingUser ? 'Đang tạo...' : 'Lưu tài khoản'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Filters card */}
      <Card className="bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" /> Tìm kiếm thành viên
            </label>
            <input
              type="text"
              placeholder="Nhập tên hoặc email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full mt-1.5 border border-gray-200 dark:border-gray-750 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#FF6B00] bg-gray-50/50 dark:bg-[#1C1C28] text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Lọc theo Vai Trò
            </label>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="w-full mt-1.5 border border-gray-200 dark:border-gray-750 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#FF6B00] bg-gray-50/50 dark:bg-[#1C1C28] text-gray-900 dark:text-white font-bold"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="member">Học viên (Member)</option>
              <option value="leader">Dean / Leader</option>
              <option value="manager">Giảng viên (Manager)</option>
              <option value="admin">System Admin</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block">Kết quả truy vấn</label>
            <div className="w-full mt-1.5 px-4 py-2.5 bg-orange-500/10 border border-orange-500/20 text-[#FF6B00] rounded-xl text-xs font-black text-center">
              {loading ? 'Đang truy xuất...' : `${users.length} tài khoản`}
            </div>
          </div>
        </div>
      </Card>

      {/* Users table list */}
      <Card className="bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center py-12 text-gray-400 text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00] mb-2" /> Đang lấy danh sách người dùng...
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="text-left p-3">Thành viên</th>
                  <th className="text-left p-3">Thông tin liên lạc</th>
                  <th className="text-left p-3">Vai trò (Role)</th>
                  <th className="text-left p-3">Gói (Sub)</th>
                  <th className="text-left p-3">Trạng thái</th>
                  <th className="text-right p-3">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-850/40">
                {users.map(user => (
                  <tr 
                    key={user.id} 
                    className={`hover:bg-gray-50/40 dark:hover:bg-[#1C1C28]/20 transition ${updating === user.id ? 'opacity-40' : ''}`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg bg-gray-100 dark:bg-[#1C1C28] w-8 h-8 rounded-full flex items-center justify-center border dark:border-gray-800">
                          {user.avatar || '👤'}
                        </span>
                        <strong className="text-gray-900 dark:text-white font-extrabold">{user.name}</strong>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-gray-900 dark:text-gray-300 font-medium">{user.email}</div>
                      {user.phone && <div className="text-[10px] text-gray-450 dark:text-gray-500 font-mono mt-0.5">{user.phone}</div>}
                    </td>
                    <td className="p-3">
                      {user.role === 'admin' ? (
                        <span className="px-2.5 py-1 text-[9px] font-black text-[#FF6B00] bg-orange-500/10 border border-orange-500/20 rounded-lg uppercase tracking-wider">
                          System Admin
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          onChange={e => handleChangeRole(user.id, e.target.value)}
                          disabled={updating === user.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-[11px] capitalize focus:outline-none focus:border-[#FF6B00] bg-transparent text-gray-800 dark:text-gray-300 font-extrabold"
                        >
                          <option value="member">Member</option>
                          <option value="leader">Leader</option>
                          <option value="manager">Manager</option>
                        </select>
                      )}
                    </td>
                    <td className="p-3">
                      {user.role === 'admin' ? (
                        <span className="px-2.5 py-1 text-[9px] font-black text-[#FF6B00] bg-orange-500/10 border border-orange-500/20 rounded-lg uppercase tracking-wider">
                          Enterprise
                        </span>
                      ) : (
                        <select
                          value={user.subscription}
                          onChange={e => handleChangeSubscription(user.id, e.target.value)}
                          disabled={updating === user.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-[11px] capitalize focus:outline-none focus:border-[#FF6B00] bg-transparent text-gray-800 dark:text-gray-300 font-extrabold"
                        >
                          <option value="free">Free</option>
                          <option value="premium">Premium</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      )}
                    </td>
                    <td className="p-3">
                      {user.status === 'active' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 text-[9px] font-bold">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/25 text-[9px] font-bold">
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleSuspend(user.id)}
                          disabled={updating === user.id || user.role === 'admin'}
                          className={`p-1.5 rounded-lg border text-[10px] font-bold transition flex items-center gap-1 ${
                            user.status === 'active' 
                              ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/20' 
                              : 'border-green-200 text-green-600 hover:bg-green-50 dark:border-green-950 dark:text-green-400 dark:hover:bg-green-950/20'
                          } disabled:opacity-50`}
                        >
                          {user.status === 'active' ? <UserMinus className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          {user.status === 'active' ? 'Khóa' : 'Kích hoạt'}
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={updating === user.id}
                            className="p-1.5 bg-red-50 hover:bg-red-600 border border-red-100 text-red-650 hover:text-white dark:bg-red-950/20 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-600 rounded-lg text-[10px] font-bold transition flex items-center gap-1 disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
