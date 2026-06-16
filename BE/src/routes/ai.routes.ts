import { Router } from 'express'
import { generateIdea, teamMatching, analyzeProgress, analyzePitchDeck, virtualDemoDay, generateSlides, saveGeminiKey, globalAudit } from '../controllers/ai.controller'
import { authenticate, checkAiLimit } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.post('/idea-generator', checkAiLimit, generateIdea)
router.post('/team-matching', checkAiLimit, teamMatching)
router.post('/analyze-progress', checkAiLimit, analyzeProgress)
router.post('/pitch-deck-advisor', checkAiLimit, analyzePitchDeck)
router.post('/demo-day', checkAiLimit, virtualDemoDay)
router.post('/projects/:projectId/generate-slides', checkAiLimit, generateSlides)
router.post('/global-audit', checkAiLimit, globalAudit)
router.post('/save-key', saveGeminiKey)

export default router
