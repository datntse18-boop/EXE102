import { Router } from 'express'
import { getPayments, getPaymentDetail, createPayment, confirmPayment, rejectPayment, getPaymentStats, handleBankWebhook, activateTrial } from '../controllers/payment.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

// Public bank webhook for auto-upgrade (Casso, SePay)
router.post('/webhook', handleBankWebhook)

router.use(authenticate)

router.get('/', authorize('admin', 'supervisor'), getPayments)
router.get('/stats', authorize('admin', 'supervisor'), getPaymentStats)
router.post('/', createPayment)
router.post('/trial', activateTrial)
router.get('/:id', getPaymentDetail) 
router.patch('/:id/confirm', authorize('admin', 'supervisor'), confirmPayment)
router.patch('/:id/reject', authorize('admin', 'supervisor'), rejectPayment)

export default router