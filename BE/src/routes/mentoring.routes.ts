import { Router } from 'express'
import { createSlots, getSlots, bookSlot } from '../controllers/mentoring.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/slots', getSlots)
router.post('/slots', createSlots)
router.post('/slots/:id/book', bookSlot)

export default router
