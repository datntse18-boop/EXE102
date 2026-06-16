import { Router } from 'express'
import { getUsers, getUserById, updateUserRole, updateUserStatus, updateProfile, createUser, deleteUser, getUnassignedStudents, updateUserSubscription } from '../controllers/user.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', authorize('admin', 'manager', 'leader'), getUsers)
router.get('/unassigned', authorize('admin', 'manager', 'leader'), getUnassignedStudents)
router.post('/', authorize('admin', 'manager', 'leader'), createUser)
router.get('/:id', getUserById)
router.patch('/profile', updateProfile)
router.patch('/:id/role', authorize('admin', 'leader'), updateUserRole)
router.patch('/:id/status', authorize('admin', 'leader'), updateUserStatus)
router.patch('/:id/subscription', authorize('admin', 'leader'), updateUserSubscription)
router.delete('/:id', authorize('admin'), deleteUser)

export default router
