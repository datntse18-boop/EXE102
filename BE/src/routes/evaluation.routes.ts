import { Router } from 'express'
import { submitEvaluation, getEvaluationStats, getTeamRadarStats } from '../controllers/evaluation.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.post('/submit', submitEvaluation)
router.get('/stats', getEvaluationStats)
router.get('/team-radar/:teamId', getTeamRadarStats)

export default router
