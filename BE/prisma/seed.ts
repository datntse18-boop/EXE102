import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.aIUsage.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.invitation.deleteMany()
  await prisma.task.deleteMany()
  await prisma.project.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.team.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()

  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create users
  const alice = await prisma.user.create({
    data: {
      id: 'u1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password: hashedPassword,
      role: 'member',
      avatar: '👩‍💼',
      status: 'active',
      subscription: 'premium',
      classCode: 'CLASS-EXE-101',
      lastActive: new Date('2026-06-07'),
    },
  })

  const bob = await prisma.user.create({
    data: {
      id: 'u2',
      name: 'Bob Smith',
      email: 'bob@example.com',
      password: hashedPassword,
      role: 'member', // Sinh viên
      avatar: '👨‍💼',
      status: 'active',
      subscription: 'premium',
      classCode: 'CLASS-EXE-101',
      lastActive: new Date('2026-06-07'),
    },
  })

  const carol = await prisma.user.create({
    data: {
      id: 'u3',
      name: 'Carol Williams',
      email: 'carol@example.com',
      password: hashedPassword,
      role: 'manager', // Giảng viên
      avatar: '👩‍🔬',
      status: 'active',
      subscription: 'enterprise',
      classCode: 'CLASS-EXE-101', // Class code that Bob and Alice join
      lastActive: new Date('2026-06-07'),
    },
  })

  const david = await prisma.user.create({
    data: {
      id: 'u4',
      name: 'David Brown',
      email: 'david@example.com',
      password: hashedPassword,
      role: 'admin', // Admin
      avatar: '👨‍💻',
      status: 'active',
      subscription: 'enterprise',
      lastActive: new Date('2026-06-07'),
    },
  })

  const emma = await prisma.user.create({
    data: {
      id: 'u5',
      name: 'Emma Davis',
      email: 'emma@example.com',
      password: hashedPassword,
      role: 'leader', // Quản lý (Dean)
      avatar: '👩‍🎓',
      status: 'active',
      subscription: 'free',
      lastActive: new Date('2026-06-06'),
    },
  })

  const frank = await prisma.user.create({
    data: {
      id: 'u6',
      name: 'Frank Miller',
      email: 'frank@example.com',
      password: hashedPassword,
      role: 'member',
      avatar: '👨‍🎓',
      status: 'active', // make Frank active
      subscription: 'free',
      lastActive: new Date('2026-05-20'),
    },
  })

  console.log('✅ Users created')

  // Create teams
  const team1 = await prisma.team.create({
    data: {
      id: 't1',
      name: 'EduMatch AI',
      description: 'AI-powered student matching platform',
      leaderId: bob.id,
      status: 'active',
      healthScore: 92,
      classCode: 'CLASS-EXE-101',
    },
  })

  const team2 = await prisma.team.create({
    data: {
      id: 't2',
      name: 'GreenTech Solutions',
      description: 'Sustainable technology for smart cities',
      leaderId: alice.id,
      status: 'active',
      healthScore: 78,
      classCode: 'CLASS-EXE-101',
    },
  })

  const team3 = await prisma.team.create({
    data: {
      id: 't3',
      name: 'HealthSync',
      description: 'Healthcare management system',
      leaderId: frank.id,
      status: 'at_risk',
      healthScore: 45,
      classCode: 'CLASS-EXE-102', // Frank is in different class or empty
    },
  })

  // Add team members
  await prisma.teamMember.createMany({
    data: [
      { teamId: team1.id, userId: bob.id },
      { teamId: team1.id, userId: alice.id },
      { teamId: team1.id, userId: emma.id },
      { teamId: team2.id, userId: alice.id },
      { teamId: team2.id, userId: bob.id },
      { teamId: team3.id, userId: emma.id },
      { teamId: team3.id, userId: frank.id },
    ],
  })

  console.log('✅ Teams created')

  // Create projects
  const p1 = await prisma.project.create({
    data: {
      id: 'p1',
      teamId: team1.id,
      name: 'MVP Development',
      description: 'Core MVP features',
      status: 'active',
      milestone: 2,
      progress: 65,
      dueDate: new Date('2026-07-15'),
    },
  })

  const p2 = await prisma.project.create({
    data: {
      id: 'p2',
      teamId: team1.id,
      name: 'Beta Testing',
      description: 'User testing and feedback',
      status: 'planning',
      milestone: 3,
      progress: 20,
      dueDate: new Date('2026-08-30'),
    },
  })

  const p3 = await prisma.project.create({
    data: {
      id: 'p3',
      teamId: team2.id,
      name: 'Prototype Phase',
      description: 'Create working prototype',
      status: 'active',
      milestone: 1,
      progress: 45,
      dueDate: new Date('2026-07-01'),
    },
  })

  await prisma.project.create({
    data: {
      id: 'p4',
      teamId: team3.id,
      name: 'Initial Design',
      description: 'System design and architecture',
      status: 'planning',
      milestone: 1,
      progress: 30,
      dueDate: new Date('2026-06-30'),
    },
  })

  console.log('✅ Projects created')

  // Create tasks
  await prisma.task.createMany({
    data: [
      {
        id: 'task1',
        projectId: p1.id,
        title: 'Setup authentication',
        description: 'Implement user auth system',
        assignedTo: alice.id,
        status: 'completed',
        priority: 'high',
        dueDate: new Date('2026-06-10'),
      },
      {
        id: 'task2',
        projectId: p1.id,
        title: 'Build dashboard UI',
        description: 'Create responsive dashboard',
        assignedTo: bob.id,
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date('2026-06-15'),
      },
      {
        id: 'task3',
        projectId: p1.id,
        title: 'API Integration',
        description: 'Connect to backend API',
        assignedTo: emma.id,
        status: 'todo',
        priority: 'medium',
        dueDate: new Date('2026-06-20'),
      },
      {
        id: 'task4',
        projectId: p2.id,
        title: 'Create test plan',
        description: 'Beta testing strategy',
        assignedTo: alice.id,
        status: 'todo',
        priority: 'medium',
        dueDate: new Date('2026-07-10'),
      },
      {
        id: 'task5',
        projectId: p3.id,
        title: 'Database schema',
        description: 'Design database structure',
        assignedTo: bob.id,
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date('2026-06-25'),
      },
    ],
  })

  console.log('✅ Tasks created')

  // Create invitations
  await prisma.invitation.createMany({
    data: [
      {
        id: 'inv1',
        teamId: team1.id,
        fromUserId: bob.id,
        toUserId: frank.id,
        status: 'pending',
      },
      {
        id: 'inv2',
        teamId: team2.id,
        fromUserId: alice.id,
        toUserId: emma.id,
        status: 'accepted',
      },
    ],
  })

  console.log('✅ Invitations created')

  // Create payments
  await prisma.payment.createMany({
    data: [
      { id: 'pay1', userId: alice.id, amount: 9.99, plan: 'premium', status: 'completed' },
      { id: 'pay2', userId: bob.id, amount: 9.99, plan: 'premium', status: 'completed' },
      { id: 'pay3', userId: carol.id, amount: 49.99, plan: 'enterprise', status: 'completed' },
      { id: 'pay4', userId: david.id, amount: 49.99, plan: 'enterprise', status: 'completed' },
    ],
  })

  console.log('✅ Payments created')

  // Create AI usage records
  await prisma.aIUsage.createMany({
    data: [
      { userId: alice.id, feature: 'idea_generator', count: 5 },
      { userId: alice.id, feature: 'team_matching', count: 3 },
      { userId: bob.id, feature: 'idea_generator', count: 8 },
      { userId: carol.id, feature: 'analytics', count: 2 },
    ],
  })

  console.log('✅ AI usage records created')
  console.log('🎉 Database seeded successfully!')
  console.log('')
  console.log('📧 Demo accounts (password: password123):')
  console.log('  alice@example.com  → member')
  console.log('  bob@example.com    → leader')
  console.log('  carol@example.com  → manager')
  console.log('  david@example.com  → admin')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
