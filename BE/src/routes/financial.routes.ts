import { Router } from 'express'
import { getFinancialModel, saveFinancialModel } from '../controllers/financial.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/:projectId', getFinancialModel)
router.put('/:projectId', saveFinancialModel)

export default router
