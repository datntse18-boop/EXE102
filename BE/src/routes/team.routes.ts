import { Router } from 'express'
import { 
  getTeams, 
  getTeamById, 
  createTeam, 
  updateTeam, 
  deleteTeam, 
  addMember, 
  removeMember, 
  getTeamHealth,
  joinClass
} from '../controllers/team.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', getTeams)
router.post('/', createTeam)
router.get('/:id', getTeamById)
router.patch('/:id', updateTeam)
router.post('/:id/join-class', joinClass)
router.delete('/:id', authorize('admin', 'manager', 'leader', 'member'), deleteTeam)
router.get('/:id/health', getTeamHealth)
router.post('/:id/members', authorize('admin', 'manager', 'leader', 'member'), addMember)
router.delete('/:id/members/:userId', authorize('admin', 'manager', 'leader', 'member'), removeMember)

export default router
