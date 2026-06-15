import { Router } from 'express'
import { createSlots, getSlots, bookSlot, updateMeetingMinutes, coSignMeetingMinutes } from '../controllers/mentoring.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/slots', getSlots)
router.post('/slots', createSlots)
router.post('/slots/:id/book', bookSlot)
router.put('/slots/:id/minutes', updateMeetingMinutes)
router.post('/slots/:id/co-sign', coSignMeetingMinutes)

export default router
