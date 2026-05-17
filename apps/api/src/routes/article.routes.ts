import { Router } from 'express'
import { listArticles, getArticle, saveScroll } from '../controllers/article.controller.ts'
import { requireAuth } from '../middleware/auth.middleware.ts'

const router = Router()

router.use(requireAuth)

router.get('/', listArticles)
router.get('/:id', getArticle)
router.patch('/:id/scroll', saveScroll)

export default router
