import { Router } from 'express'
import { getInvitations, getTeamInvitations, createInvitation, respondToInvitation } from '../controllers/invitation.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', getInvitations)
router.post('/', createInvitation)
router.get('/team/:teamId', getTeamInvitations)
router.patch('/:id', respondToInvitation)

export default router
