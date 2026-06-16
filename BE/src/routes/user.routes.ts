import { Router } from 'express'
import { getUsers, getUserById, updateUserRole, updateUserStatus, updateProfile, createUser, deleteUser } from '../controllers/user.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', authorize('admin', 'manager', 'leader'), getUsers)
router.post('/', authorize('admin', 'leader'), createUser)
router.get('/:id', getUserById)
router.patch('/profile', updateProfile)
router.patch('/:id/role', authorize('admin', 'leader'), updateUserRole)
router.patch('/:id/status', authorize('admin', 'leader'), updateUserStatus)
router.delete('/:id', authorize('admin'), deleteUser)

export default router
