import { Router } from 'express'
import { addSurvey, getSurveys, analyzeSurveys } from '../controllers/survey.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.post('/:projectId', addSurvey)
router.get('/:projectId', getSurveys)
router.post('/:projectId/analyze', analyzeSurveys)

export default router
