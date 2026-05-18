import { Router } from 'express'
import { bookmark, unbookmark, listBookmarks } from '../controllers/bookmark.controller.ts'
import { requireAuth } from '../middleware/auth.middleware.ts'

const router = Router()
router.use(requireAuth)

router.get('/', listBookmarks)
router.post('/:articleId', bookmark)
router.delete('/:articleId', unbookmark)

export default router
