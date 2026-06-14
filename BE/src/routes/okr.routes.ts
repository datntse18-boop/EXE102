import { Router } from 'express'
import { getObjectives, createObjective, createKeyResult, updateKeyResult } from '../controllers/okr.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/:projectId', getObjectives)
router.post('/:projectId', createObjective)
router.post('/objective/:objectiveId/key-result', createKeyResult)
router.put('/key-result/:id', updateKeyResult)

export default router
