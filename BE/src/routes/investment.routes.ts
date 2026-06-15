import { Router } from 'express'
import { investInProject, getProjectLeaderboard } from '../controllers/investment.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.post('/:projectId/invest', investInProject)
router.get('/leaderboard', getProjectLeaderboard)

export default router
