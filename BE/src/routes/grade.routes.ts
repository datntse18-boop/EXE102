import { Router } from 'express'
import { gradeTeam, getTeamGrades, getClassGrades } from '../controllers/grade.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.post('/submit', gradeTeam)
router.get('/team/:teamId', getTeamGrades)
router.get('/class', getClassGrades)

export default router
