import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

// Compute health score based on tasks
const computeHealthScore = async (teamId: string): Promise<number> => {
  const projects = await prisma.project.findMany({ where: { teamId } })
  if (projects.length === 0) return 100
  const allTasks = await prisma.task.findMany({ where: { projectId: { in: projects.map(p => p.id) } } })
  if (allTasks.length === 0) return 80
  const completed = allTasks.filter(t => t.status === 'completed').length
  const overdue = allTasks.filter(t => t.dueDate && t.dueDate < new Date() && t.status !== 'completed').length
  const score = Math.max(0, Math.round((completed / allTasks.length) * 100) - overdue * 5)
  return Math.min(100, score)
}

// GET /api/teams
export const getTeams = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, search, classCode } = req.query
    const where: any = {}
    if (status && status !== 'all') where.status = status
    if (search) where.name = { contains: String(search), mode: 'insensitive' }

    // Role-based filtering
    if (req.user!.role === 'member') {
      // Sinh viên (member) sees only their teams
      where.members = { some: { userId: req.user!.id } }
    } else if (req.user!.role === 'manager') {
      // Giảng viên (manager) sees teams in their class
      where.classCode = req.user!.classCode || 'NO_CLASS_CODE_SET'
    } else if (req.user!.role === 'leader') {
      // Quản lý (leader) sees all teams, optionally filtered by classCode (Lecturer class code)
      if (classCode) {
        where.classCode = String(classCode)
      }
    }
    // Admin (admin) sees everything

    const teams = await prisma.team.findMany({
      where,
      include: {
        leader: { select: { id: true, name: true, avatar: true } },
        members: { include: { user: { select: { id: true, name: true, avatar: true, role: true } } } },
        projects: { select: { id: true, name: true, status: true, progress: true } },
        _count: { select: { projects: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: teams })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/teams/:id
export const getTeamById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        leader: { select: { id: true, name: true, avatar: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, avatar: true, role: true, email: true } } } },
        projects: { include: { tasks: true } },
      },
    })
    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' })
      return
    }
    // Security check: If team is inactive, only leader, admin, or manager can view it
    if (team.status === 'inactive' && team.leaderId !== req.user!.id && !['manager', 'admin'].includes(req.user!.role)) {
      res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập thông tin nhóm đã lưu trữ này.' })
      return
    }
    res.json({ success: true, data: team })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/teams
export const createTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body
    // Limit to max 3 teams per leader (bypass for admin, manager, enterprise, corporate)
    const bypassLimit = req.user!.role === 'admin' || req.user!.role === 'manager' || req.user!.subscription === 'enterprise' || req.user!.subscription === 'corporate'
    if (!bypassLimit) {
      const ledTeamsCount = await prisma.team.count({
        where: { leaderId: req.user!.id }
      })
      if (ledTeamsCount >= 3) {
        res.status(400).json({ success: false, message: 'Bạn chỉ được tạo tối đa 3 nhóm dự án để tránh tình trạng tạo tràn lan.' })
        return
      }
    }

    const team = await prisma.team.create({
      data: {
        name,
        description: description || '',
        leaderId: req.user!.id,
        classCode: req.user!.classCode, // Auto inherit joined class code if any
        members: { create: { userId: req.user!.id } },
      },
      include: {
        leader: { select: { id: true, name: true, avatar: true } },
        members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      },
    })

    res.status(201).json({ success: true, data: team })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// PATCH /api/teams/:id
export const updateTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const { name, description, status } = req.body
    const team = await prisma.team.findUnique({ where: { id } })
    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' })
      return
    }
    // Only leader, manager, admin can edit
    if (team.leaderId !== req.user!.id && !['manager', 'admin'].includes(req.user!.role)) {
      res.status(403).json({ success: false, message: 'Forbidden' })
      return
    }
    const updated = await prisma.team.update({
      where: { id },
      data: { name, description, status },
    })
    res.json({ success: true, data: updated })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// DELETE /api/teams/:id — Safe delete (archive team, kick members except leader)
export const deleteTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const team = await prisma.team.findUnique({ where: { id } })
    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' })
      return
    }
    if (team.leaderId !== req.user!.id && !['manager', 'admin'].includes(req.user!.role)) {
      res.status(403).json({ success: false, message: 'Forbidden' })
      return
    }

    // Kick all other members (delete their TeamMember records, keep only the leader's)
    await prisma.teamMember.deleteMany({
      where: {
        teamId: id,
        userId: { not: team.leaderId }
      }
    })

    // Set team status to inactive
    const updated = await prisma.team.update({
      where: { id },
      data: { status: 'inactive' }
    })

    res.json({ success: true, message: 'Nhóm đã được chuyển sang trạng thái lưu trữ (inactive) và tất cả thành viên khác đã bị xóa khỏi nhóm.', data: updated })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/teams/:id/members — Add member
export const addMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const { userId } = req.body
    const existing = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: id, userId } },
    })
    if (existing) {
      res.status(409).json({ success: false, message: 'User is already a member' })
      return
    }

    const team = await prisma.team.findUnique({ where: { id } })
    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' })
      return
    }
    // Check team size limit (max 6 members, bypass for enterprise/corporate)
    if (team.subscription !== 'enterprise') {
      const currentMemberCount = await prisma.teamMember.count({
        where: { teamId: id }
      })
      if (currentMemberCount >= 6) {
        res.status(400).json({ success: false, message: 'Nhóm đã đạt số lượng tối đa 6 thành viên (1 nhóm trưởng và 5 thành viên).' })
        return
      }
    }

    await prisma.teamMember.create({ data: { teamId: id, userId } })
    // Recalculate health
    const score = await computeHealthScore(id)
    await prisma.team.update({ where: { id }, data: { healthScore: score } })
    res.json({ success: true, message: 'Member added' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// DELETE /api/teams/:id/members/:userId — Remove member (Leader/Admin/Manager only)
export const removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, userId } = req.params as { id: string; userId: string }

    const team = await prisma.team.findUnique({ where: { id } })
    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' })
      return
    }

    // Security validation: Only team leader, admin, or manager can kick members
    if (team.leaderId !== req.user!.id && !['manager', 'admin'].includes(req.user!.role)) {
      res.status(403).json({ success: false, message: 'Chỉ Trưởng nhóm hoặc Giảng viên mới được phép xóa thành viên.' })
      return
    }

    if (userId === team.leaderId) {
      res.status(400).json({ success: false, message: 'Không thể xóa Trưởng nhóm khỏi nhóm.' })
      return
    }

    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId: id, userId } },
    })

    // Recalculate health
    const score = await computeHealthScore(id)
    await prisma.team.update({ where: { id }, data: { healthScore: score } })

    res.json({ success: true, message: 'Member removed' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/teams/:id/health
export const getTeamHealth = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const projects = await prisma.project.findMany({ where: { teamId: id } })
    const allTasks = await prisma.task.findMany({ where: { projectId: { in: projects.map(p => p.id) } } })
    const members = await prisma.teamMember.count({ where: { teamId: id } })
    const completed = allTasks.filter(t => t.status === 'completed').length
    const inProgress = allTasks.filter(t => t.status === 'in_progress').length
    const score = await computeHealthScore(id)

    await prisma.team.update({ where: { id }, data: { healthScore: score } })

    res.json({
      success: true,
      data: {
        healthScore: score,
        members,
        totalTasks: allTasks.length,
        completedTasks: completed,
        inProgressTasks: inProgress,
        totalProjects: projects.length,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/teams/:id/join-class
export const joinClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const { classCode } = req.body
    if (!classCode) {
      res.status(400).json({ success: false, message: 'Class code is required' })
      return
    }

    const normalizedCode = String(classCode).trim().toUpperCase()

    // Check if lecturer exists with this classCode
    const lecturer = await prisma.user.findFirst({
      where: { role: 'manager', classCode: normalizedCode },
    })
    if (!lecturer) {
      res.status(404).json({ success: false, message: 'Không tìm thấy giảng viên với mã lớp này' })
      return
    }

    const team = await prisma.team.findUnique({ where: { id } })
    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' })
      return
    }

    // Update team with the classCode
    const updated = await prisma.team.update({
      where: { id },
      data: { classCode: normalizedCode },
      include: { members: true }
    })

    // Propagate classCode to all team members
    const memberIds = updated.members.map(m => m.userId)
    await prisma.user.updateMany({
      where: { id: { in: memberIds } },
      data: { classCode: normalizedCode }
    })

    res.json({ success: true, message: 'Tham gia lớp học thành công', data: updated })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/teams/:id/leave-request — Member requests to leave the team
export const requestLeaveTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const team = await prisma.team.findUnique({ where: { id } })
    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' })
      return
    }

    // Check if the user is a member of the team
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: id, userId: req.user!.id } }
    })
    if (!membership) {
      res.status(400).json({ success: false, message: 'Bạn không phải là thành viên của nhóm này.' })
      return
    }

    // Check if the user is the leader of the team
    if (team.leaderId === req.user!.id) {
      res.status(400).json({ success: false, message: 'Trưởng nhóm không thể rời nhóm. Vui lòng chuyển quyền hoặc giải tán nhóm.' })
      return
    }

    // Check if a request already exists
    const existingRequest = await prisma.leaveRequest.findUnique({
      where: { teamId_userId: { teamId: id, userId: req.user!.id } }
    })
    if (existingRequest && existingRequest.status === 'pending') {
      res.status(400).json({ success: false, message: 'Yêu cầu rời nhóm của bạn đang chờ Trưởng nhóm phê duyệt.' })
      return
    }

    // Create or update leave request to pending
    const leaveRequest = await prisma.leaveRequest.upsert({
      where: { teamId_userId: { teamId: id, userId: req.user!.id } },
      update: { status: 'pending', createdAt: new Date() },
      create: { teamId: id, userId: req.user!.id, status: 'pending' }
    })

    // Send notification to team leader
    await prisma.notification.create({
      data: {
        userId: team.leaderId,
        title: '📩 Yêu cầu rời nhóm',
        content: `Thành viên ${req.user!.name} đã gửi yêu cầu xin rời khỏi nhóm ${team.name}.`,
        link: '/team-management'
      }
    })

    res.json({ success: true, message: 'Gửi yêu cầu rời nhóm thành công. Vui lòng đợi Trưởng nhóm phê duyệt.', data: leaveRequest })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/teams/:id/leave-requests — Get leave requests for a team (Leader only)
export const getLeaveRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string }
    const team = await prisma.team.findUnique({ where: { id } })
    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' })
      return
    }

    // Only leader, admin or manager can view requests
    if (team.leaderId !== req.user!.id && !['manager', 'admin'].includes(req.user!.role)) {
      res.status(403).json({ success: false, message: 'Forbidden' })
      return
    }

    const requests = await prisma.leaveRequest.findMany({
      where: { teamId: id },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ success: true, data: requests })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// POST /api/teams/:id/leave-requests/:requestId/resolve — Leader resolves leave request
export const resolveLeaveRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, requestId } = req.params as { id: string; requestId: string }
    const { action } = req.body as { action: 'approve' | 'reject' }

    if (!action || !['approve', 'reject'].includes(action)) {
      res.status(400).json({ success: false, message: 'Action must be approve or reject' })
      return
    }

    const team = await prisma.team.findUnique({ where: { id } })
    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' })
      return
    }

    // Only leader can resolve requests
    if (team.leaderId !== req.user!.id && !['manager', 'admin'].includes(req.user!.role)) {
      res.status(403).json({ success: false, message: 'Forbidden' })
      return
    }

    const request = await prisma.leaveRequest.findUnique({ where: { id: requestId } })
    if (!request) {
      res.status(404).json({ success: false, message: 'Leave request not found' })
      return
    }

    if (action === 'approve') {
      // Delete membership
      await prisma.teamMember.deleteMany({
        where: { teamId: id, userId: request.userId }
      })

      // Update team health
      const score = await computeHealthScore(id)
      await prisma.team.update({ where: { id }, data: { healthScore: score } })

      // Notify the user
      await prisma.notification.create({
        data: {
          userId: request.userId,
          title: '✅ Yêu cầu rời nhóm được phê duyệt',
          content: `Trưởng nhóm đã đồng ý cho bạn rời khỏi nhóm ${team.name}.`,
          link: '/dashboard'
        }
      })

      // Delete the request record
      await prisma.leaveRequest.delete({ where: { id: requestId } })

      res.json({ success: true, message: 'Đã duyệt yêu cầu rời nhóm. Thành viên đã bị xóa khỏi nhóm.' })
    } else {
      // Notify the user of rejection
      await prisma.notification.create({
        data: {
          userId: request.userId,
          title: '❌ Yêu cầu rời nhóm bị từ chối',
          content: `Trưởng nhóm đã từ chối yêu cầu rời khỏi nhóm ${team.name} của bạn. Bạn vẫn là thành viên của nhóm.`,
          link: `/dashboard`
        }
      })

      // Delete the request record so they can request again
      await prisma.leaveRequest.delete({ where: { id: requestId } })

      res.json({ success: true, message: 'Đã từ chối yêu cầu rời nhóm.' })
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
