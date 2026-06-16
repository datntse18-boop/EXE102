import { Router } from 'express'
import { handleGithubWebhook } from '../controllers/github.controller'

const router = Router()

// github webhook is public (no authenticate middleware needed to allow GitHub to call it directly)
router.post('/webhook', handleGithubWebhook)

export default router
