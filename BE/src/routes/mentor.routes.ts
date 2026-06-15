import { Router } from 'express'
import { getMentorMessages, sendMentorMessage } from '../controllers/mentor.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/projects/:projectId/mentor', getMentorMessages)
router.post('/projects/:projectId/mentor', sendMentorMessage)

export default router
