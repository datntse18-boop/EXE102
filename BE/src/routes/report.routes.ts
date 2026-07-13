import { Router } from 'express'
import { getPlatformStats, getAIUsageReport, getRevenueStats } from '../controllers/report.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/platform-stats', authorize('admin', 'manager'), getPlatformStats)
router.get('/ai-usage', authorize('admin', 'manager'), getAIUsageReport)
router.get('/revenue-stats', authorize('admin', 'manager'), getRevenueStats)

export default router
