import { Router } from 'express'
import { subscribe, getFeeds, unsubscribe } from '../controllers/feed.controller.ts'
import { requireAuth } from '../middleware/auth.middleware.ts'

const router = Router()

router.use(requireAuth)

router.post('/', subscribe)
router.get('/', getFeeds)
router.delete('/:feedId', unsubscribe)

export default router
