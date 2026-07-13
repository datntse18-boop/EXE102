import { Router } from 'express'
import { register, login, refresh, logout, me, verifyOtp } from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.post('/register', register)
router.post('/verify-otp', verifyOtp)
router.post('/login', login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.get('/me', authenticate, me)

export default router
