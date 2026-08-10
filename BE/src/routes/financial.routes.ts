import { Router } from 'express'
import { 
  getFinancialModel, 
  saveFinancialModel, 
  getRevenueSummary, 
  getRevenueDetails, 
  getTransactionHistory 
} from '../controllers/financial.controller'
import { authenticate, authorize, checkAiLimit } from '../middleware/auth.middleware'

const router = Router()
router.use(authenticate)
router.get('/revenue/summary', authorize('admin', 'leader', 'manager', 'supervisor'), getRevenueSummary)
router.get('/revenue/details', authorize('admin', 'leader', 'manager', 'supervisor'), getRevenueDetails)
router.get('/transactions', authorize('admin', 'leader', 'manager', 'supervisor'), getTransactionHistory)

router.get('/:projectId', getFinancialModel)
router.put('/:projectId', checkAiLimit, saveFinancialModel)

export default router