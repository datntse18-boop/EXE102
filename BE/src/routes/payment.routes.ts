import { Router } from 'express'
import { getPayments, createPayment, getPaymentStats } from '../controllers/payment.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', getPayments)
router.post('/', createPayment)
router.get('/stats', authorize('admin'), getPaymentStats)

export default router
