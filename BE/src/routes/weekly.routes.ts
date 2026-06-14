import { Router } from 'express'
import { submitReport, getWeeklyReports } from '../controllers/weekly.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/reports', getWeeklyReports)
router.post('/submit', submitReport)

export default router
