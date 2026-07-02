import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/user.routes'
import teamRoutes from './routes/team.routes'
import projectRoutes from './routes/project.routes'
import taskRoutes from './routes/task.routes'
import invitationRoutes from './routes/invitation.routes'
import paymentRoutes from './routes/payment.routes'
import aiRoutes from './routes/ai.routes'
import reportRoutes from './routes/report.routes'
import weeklyRoutes from './routes/weekly.routes'
import mentoringRoutes from './routes/mentoring.routes'
import evaluationRoutes from './routes/evaluation.routes'
import gradeRoutes from './routes/grade.routes'
import jobRoutes from './routes/job.routes'
import notificationRoutes from './routes/notification.routes'
import chatRoutes from './routes/chat.routes'
import okrRoutes from './routes/okr.routes'
import surveyRoutes from './routes/survey.routes'
import financialRoutes from './routes/financial.routes'
import mentorRoutes from './routes/mentor.routes'
import investmentRoutes from './routes/investment.routes'
import githubRoutes from './routes/github.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
})

app.set('io', io)

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`)

  socket.on('join_team', (teamId) => {
    socket.join(teamId)
    console.log(`👥 Client ${socket.id} joined team room: ${teamId}`)
  })

  socket.on('leave_team', (teamId) => {
    socket.leave(teamId)
    console.log(`👥 Client ${socket.id} left team room: ${teamId}`)
  })

  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`)
    console.log(`👤 Client ${socket.id} joined user room: user_${userId}`)
  })

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`)
  })
})

// Parse multiple allowed origins from env (comma-separated)
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true)
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin === 'http://localhost:5173' ||
      origin === 'http://localhost:3000'
    ) {
      return callback(null, true)
    }
    return callback(new Error(`CORS blocked: ${origin}`))
  },
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'StudyConnect API is running 🚀', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/teams', teamRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/invitations', invitationRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/weekly', weeklyRoutes)
app.use('/api/mentoring', mentoringRoutes)
app.use('/api/evaluation', evaluationRoutes)
app.use('/api/grades', gradeRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/okr', okrRoutes)
app.use('/api/surveys', surveyRoutes)
app.use('/api/financial', financialRoutes)
app.use('/api/mentor', mentorRoutes)
app.use('/api/investments', investmentRoutes)
app.use('/api/github', githubRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  })
})

httpServer.listen(PORT, () => {
  console.log(`🚀 StudyConnect API running on http://localhost:${PORT}`)
  console.log(`📚 Environment: ${process.env.NODE_ENV}`)
})

export default app
