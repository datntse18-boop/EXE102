import { Router } from 'express'
import { getChatMessages, sendChatMessage } from '../controllers/chat.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/:teamId', getChatMessages)
router.post('/:teamId', sendChatMessage)

export default router
