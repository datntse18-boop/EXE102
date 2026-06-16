import { Router } from 'express'
import { getPayments, createPayment, confirmPayment, rejectPayment, getPaymentStats, handleBankWebhook } from '../controllers/payment.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

// Public bank webhook for auto-upgrade (Casso, SePay)
router.post('/webhook', handleBankWebhook)

router.use(authenticate)

router.get('/', getPayments)
router.post('/', createPayment)
router.get('/stats', authorize('admin'), getPaymentStats)
router.patch('/:id/confirm', authorize('admin'), confirmPayment)
router.patch('/:id/reject', authorize('admin'), rejectPayment)

export default router
