import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding StudyConnect database...')

  // Clear existing data in correct order (respect FK constraints)
  await prisma.aIUsage.deleteMany()
  await prisma.investment.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.chatMessage.deleteMany()
  await prisma.aIMentorMessage.deleteMany()
  await prisma.customerSurvey.deleteMany()
  await prisma.financialModel.deleteMany()
  await prisma.projectKeyResult.deleteMany()
  await prisma.projectObjective.deleteMany()
  await prisma.projectVote.deleteMany()
  await prisma.projectComment.deleteMany()
  await prisma.jobApplication.deleteMany()
  await prisma.jobPost.deleteMany()
  await prisma.teamGrade.deleteMany()
  await prisma.peerEvaluation.deleteMany()
  await prisma.mentoringSlot.deleteMany()
  await prisma.weeklyReport.deleteMany()
  await prisma.invitation.deleteMany()
  await prisma.task.deleteMany()
  await prisma.project.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.team.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()

  const hashedPassword = await bcrypt.hash('password123', 10)

  // ─────────────────────────────────────────
  // USERS – Dữ liệu thực tế hơn, tên tiếng Việt
  // ─────────────────────────────────────────

  // Admin IT
  const david = await prisma.user.create({
    data: {
      id: 'u-admin-001',
      name: 'Nguyễn Đức Duy (Admin IT)',
      email: 'david@example.com',
      password: hashedPassword,
      role: 'admin',
      avatar: '👨‍💻',
      status: 'active',
      subscription: 'enterprise',
      lastActive: new Date(),
    },
  })

  // Dean / Quản lý khoa
  const emma = await prisma.user.create({
    data: {
      id: 'u-leader-001',
      name: 'Trần Thị Minh (Quản lý Khoa)',
      email: 'emma@example.com',
      password: hashedPassword,
      role: 'leader',
      avatar: '👩‍🎓',
      status: 'active',
      subscription: 'enterprise',
      lastActive: new Date(),
    },
  })

  // Giảng viên
  const carol = await prisma.user.create({
    data: {
      id: 'u-manager-001',
      name: 'Phạm Thị Lan (Giảng viên)',
      email: 'carol@example.com',
      password: hashedPassword,
      role: 'manager',
      avatar: '👩‍🔬',
      status: 'active',
      subscription: 'enterprise',
      classCode: 'EXE101-2026',
      lastActive: new Date(),
    },
  })

  // Sinh viên – nhóm trưởng
  const alice = await prisma.user.create({
    data: {
      id: 'u-member-001',
      name: 'Nguyễn Văn An (Trưởng nhóm)',
      email: 'alice@example.com',
      password: hashedPassword,
      role: 'member',
      avatar: '👨‍🎓',
      status: 'active',
      subscription: 'premium',
      classCode: 'EXE101-2026',
      skills: 'React, Node.js, Figma',
      desiredRole: 'Frontend Developer',
      commitmentHours: 20,
      lastActive: new Date(),
    },
  })

  // Sinh viên – thành viên
  const bob = await prisma.user.create({
    data: {
      id: 'u-member-002',
      name: 'Trần Thị Bích (Thành viên)',
      email: 'bob@example.com',
      password: hashedPassword,
      role: 'member',
      avatar: '👩‍🎓',
      status: 'active',
      subscription: 'premium',
      classCode: 'EXE101-2026',
      skills: 'Python, AI/ML, Data Analysis',
      desiredRole: 'Backend Developer',
      commitmentHours: 15,
      lastActive: new Date(),
    },
  })

  // Sinh viên – thành viên 3
  const frank = await prisma.user.create({
    data: {
      id: 'u-member-003',
      name: 'Lê Hoàng Minh (Thành viên)',
      email: 'frank@example.com',
      password: hashedPassword,
      role: 'member',
      avatar: '👨‍💼',
      status: 'active',
      subscription: 'free',
      classCode: 'EXE101-2026',
      skills: 'Marketing, Business Analysis',
      desiredRole: 'Business Analyst',
      commitmentHours: 12,
      lastActive: new Date(),
    },
  })

  console.log('✅ Users created (6 accounts)')

  // ─────────────────────────────────────────
  // TEAMS
  // ─────────────────────────────────────────
  const team1 = await prisma.team.create({
    data: {
      id: 't-001',
      name: 'EduConnect AI',
      description: 'Nền tảng kết nối học viên và giảng viên thông qua AI – tự động gợi ý nhóm học phù hợp dựa trên kỹ năng và mục tiêu.',
      leaderId: alice.id,
      status: 'active',
      healthScore: 88,
      classCode: 'EXE101-2026',
    },
  })

  const team2 = await prisma.team.create({
    data: {
      id: 't-002',
      name: 'GreenCart',
      description: 'Sàn thương mại điện tử xanh – kết nối nông dân địa phương với người tiêu dùng thành thị, giảm trung gian.',
      leaderId: bob.id,
      status: 'active',
      healthScore: 72,
      classCode: 'EXE101-2026',
    },
  })

  const team3 = await prisma.team.create({
    data: {
      id: 't-003',
      name: 'MediScan',
      description: 'Ứng dụng chuẩn đoán sơ bộ triệu chứng bệnh bằng AI – hỗ trợ vùng nông thôn thiếu bác sĩ.',
      leaderId: frank.id,
      status: 'at_risk',
      healthScore: 43,
      classCode: 'EXE101-2026',
    },
  })

  await prisma.teamMember.createMany({
    data: [
      { teamId: team1.id, userId: alice.id },
      { teamId: team1.id, userId: bob.id },
      { teamId: team2.id, userId: bob.id },
      { teamId: team2.id, userId: frank.id },
      { teamId: team3.id, userId: frank.id },
    ],
  })

  console.log('✅ Teams created (3 teams)')

  // ─────────────────────────────────────────
  // PROJECTS
  // ─────────────────────────────────────────
  const p1 = await prisma.project.create({
    data: {
      id: 'p-001',
      teamId: team1.id,
      name: 'MVP – AI Matching Engine',
      description: 'Module lõi: thuật toán gợi ý nhóm học phù hợp dựa trên kỹ năng, lịch học và mục tiêu nghề nghiệp',
      status: 'active',
      milestone: 2,
      progress: 65,
      isPublic: true,
      dueDate: new Date('2026-07-30'),
    },
  })

  const p2 = await prisma.project.create({
    data: {
      id: 'p-002',
      teamId: team1.id,
      name: 'Beta Testing – User Feedback',
      description: 'Thu thập phản hồi từ 30 sinh viên thử nghiệm, đo NPS và cải tiến UX',
      status: 'planning',
      milestone: 3,
      progress: 15,
      dueDate: new Date('2026-08-30'),
    },
  })

  const p3 = await prisma.project.create({
    data: {
      id: 'p-003',
      teamId: team2.id,
      name: 'GreenCart – Prototype',
      description: 'Xây dựng nguyên mẫu chợ online với 10 nông trại thử nghiệm tại Đà Lạt',
      status: 'active',
      milestone: 1,
      progress: 42,
      isPublic: true,
      dueDate: new Date('2026-07-15'),
    },
  })

  console.log('✅ Projects created (3 projects)')

  // ─────────────────────────────────────────
  // TASKS
  // ─────────────────────────────────────────
  await prisma.task.createMany({
    data: [
      {
        projectId: p1.id,
        title: 'Xây dựng API xác thực người dùng',
        description: 'JWT + Refresh token, bcrypt password hashing',
        assignedTo: alice.id,
        status: 'completed',
        priority: 'high',
        dueDate: new Date('2026-06-10'),
      },
      {
        projectId: p1.id,
        title: 'Thiết kế giao diện Dashboard sinh viên',
        description: 'Responsive, dark/light mode, Tailwind CSS',
        assignedTo: bob.id,
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date('2026-06-25'),
      },
      {
        projectId: p1.id,
        title: 'Tích hợp Gemini AI cho gợi ý nhóm',
        description: 'Gọi Gemini API, phân tích kỹ năng và trả về danh sách gợi ý',
        assignedTo: alice.id,
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date('2026-06-30'),
      },
      {
        projectId: p2.id,
        title: 'Lên kế hoạch beta testing',
        description: 'Xác định tiêu chí, chọn 30 sinh viên thử nghiệm, thiết kế survey',
        assignedTo: bob.id,
        status: 'todo',
        priority: 'medium',
        dueDate: new Date('2026-07-10'),
      },
      {
        projectId: p3.id,
        title: 'Kết nối API thanh toán VNPay',
        description: 'Tích hợp cổng thanh toán, xử lý callback và refund',
        assignedTo: bob.id,
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date('2026-07-01'),
      },
      {
        projectId: p3.id,
        title: 'Onboard 10 nông trại thử nghiệm',
        description: 'Liên hệ, ký hợp đồng thử nghiệm, tải sản phẩm lên hệ thống',
        assignedTo: frank.id,
        status: 'todo',
        priority: 'medium',
        dueDate: new Date('2026-07-05'),
      },
    ],
  })

  console.log('✅ Tasks created (6 tasks)')

  // ─────────────────────────────────────────
  // PAYMENTS
  // ─────────────────────────────────────────
  await prisma.payment.createMany({
    data: [
      { userId: alice.id, amount: 199000, plan: 'premium', status: 'completed' },
      { userId: bob.id, amount: 199000, plan: 'premium', status: 'completed' },
      { userId: carol.id, amount: 499000, plan: 'enterprise', status: 'completed' },
      { userId: david.id, amount: 499000, plan: 'enterprise', status: 'completed' },
      { userId: emma.id, amount: 499000, plan: 'enterprise', status: 'completed' },
    ],
  })

  console.log('✅ Payments created')

  // ─────────────────────────────────────────
  // AI USAGE RECORDS
  // ─────────────────────────────────────────
  await prisma.aIUsage.createMany({
    data: [
      { userId: alice.id, feature: 'idea_generator', count: 8 },
      { userId: alice.id, feature: 'team_matching', count: 4 },
      { userId: bob.id, feature: 'idea_generator', count: 12 },
      { userId: bob.id, feature: 'analytics', count: 3 },
      { userId: carol.id, feature: 'analytics', count: 5 },
    ],
  })

  console.log('✅ AI usage records created')

  // ─────────────────────────────────────────
  // INVITATIONS
  // ─────────────────────────────────────────
  await prisma.invitation.createMany({
    data: [
      {
        teamId: team1.id,
        fromUserId: alice.id,
        toUserId: frank.id,
        status: 'pending',
      },
      {
        teamId: team2.id,
        fromUserId: bob.id,
        toUserId: alice.id,
        status: 'accepted',
      },
    ],
  })

  console.log('✅ Invitations created')

  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📧 Tài khoản đăng nhập (mật khẩu: password123):')
  console.log('  david@example.com  → Admin IT (Quản trị hệ thống)')
  console.log('  emma@example.com   → Leader/Dean (Quản lý Khoa)')
  console.log('  carol@example.com  → Manager/Giảng viên')
  console.log('  alice@example.com  → Member/Sinh viên (Trưởng nhóm)')
  console.log('  bob@example.com    → Member/Sinh viên')
  console.log('  frank@example.com  → Member/Sinh viên')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
