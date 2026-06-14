import { Router } from 'express'
import { createJobPost, getJobPosts, applyJob, getApplications, reviewApplication } from '../controllers/job.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.post('/create', createJobPost)
router.get('/', getJobPosts)
router.post('/apply', applyJob)
router.get('/applications/:jobPostId', getApplications)
router.put('/applications/:id/review', reviewApplication)

export default router
