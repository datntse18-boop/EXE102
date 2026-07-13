import { Router } from 'express'
import { createFeedback, getUserFeedbacks, getAllFeedbacks, replyFeedback } from '../controllers/feedback.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.post('/', createFeedback)
router.get('/my-feedbacks', getUserFeedbacks)
router.get('/', authorize('admin'), getAllFeedbacks)
router.patch('/:id/reply', authorize('admin'), replyFeedback)

export default router
