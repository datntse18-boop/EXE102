import { Router } from 'express'
import { authenticate, checkAiLimit } from '../middleware/auth.middleware'
import {
  listConversations,
  createConversation,
  getConversation,
  deleteConversation,
  sendSupportChat,
} from '../controllers/aiSupport.controller'

const router = Router()

router.use(authenticate)

router.get('/conversations', listConversations)
router.post('/conversations', createConversation)
router.get('/conversations/:id', getConversation)
router.delete('/conversations/:id', deleteConversation)
router.post('/chat', checkAiLimit, sendSupportChat)

export default router
