import { Router } from 'express'
import { getUsers, getUserById, updateUserRole, updateUserStatus, updateProfile } from '../controllers/user.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', authorize('admin', 'manager'), getUsers)
router.get('/:id', getUserById)
router.patch('/profile', updateProfile)
router.patch('/:id/role', authorize('admin'), updateUserRole)
router.patch('/:id/status', authorize('admin'), updateUserStatus)

export default router
