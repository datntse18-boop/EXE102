import { Router } from 'express'
import { getPayments, createPayment, confirmPayment, rejectPayment, getPaymentStats } from '../controllers/payment.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', getPayments)
router.post('/', createPayment)
router.get('/stats', authorize('admin'), getPaymentStats)
router.patch('/:id/confirm', authorize('admin'), confirmPayment)
router.patch('/:id/reject', authorize('admin'), rejectPayment)

export default router
