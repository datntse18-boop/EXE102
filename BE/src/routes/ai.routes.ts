import { Router } from 'express'
import { generateIdea, teamMatching, analyzeProgress, analyzePitchDeck, virtualDemoDay, generateSlides } from '../controllers/ai.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.post('/idea-generator', generateIdea)
router.post('/team-matching', teamMatching)
router.post('/analyze-progress', analyzeProgress)
router.post('/pitch-deck-advisor', analyzePitchDeck)
router.post('/demo-day', virtualDemoDay)
router.post('/projects/:projectId/generate-slides', generateSlides)

export default router
