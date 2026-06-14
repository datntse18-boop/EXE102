import { Router } from 'express'
import { getProjects, getProjectById, createProject, updateProject, deleteProject, generateCanvasAI, getPublicProjects, voteProject, getProjectComments, addProjectComment } from '../controllers/project.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

// Public showcase route
router.get('/showcase/public', authenticate, getPublicProjects)

router.use(authenticate)

router.get('/', getProjects)
router.post('/', createProject)
router.post('/:id/generate-canvas', generateCanvasAI)
router.post('/:id/vote', voteProject)
router.get('/:id/comments', getProjectComments)
router.post('/:id/comments', addProjectComment)
router.get('/:id', getProjectById)
router.patch('/:id', updateProject)
router.delete('/:id', deleteProject)

export default router
