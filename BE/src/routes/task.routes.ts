import { Router } from 'express'
import { getTasks, getTaskById, createTask, updateTask, deleteTask, getMyTasks } from '../controllers/task.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/my', getMyTasks)
router.get('/', getTasks)
router.post('/', createTask)
router.get('/:id', getTaskById)
router.patch('/:id', updateTask)
router.delete('/:id', deleteTask)

export default router
