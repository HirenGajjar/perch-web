import { Router } from 'express'
import {
  addHighlight,
  editHighlight,
  removeHighlight,
  listHighlights
} from '../controllers/highlight.controller.ts'
import { requireAuth } from '../middleware/auth.middleware.ts'

const router = Router()
router.use(requireAuth)

router.get('/:articleId', listHighlights)
router.post('/:articleId', addHighlight)
router.patch('/:highlightId', editHighlight)
router.delete('/:highlightId', removeHighlight)

export default router
