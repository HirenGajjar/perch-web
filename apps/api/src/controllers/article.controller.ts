import type { Request, Response } from 'express'
import {
  getArticlesForUser,
  getArticleById,
  updateScrollPosition
} from '../services/article.service.ts'

export async function listArticles(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1

  const result = await getArticlesForUser(req.userId, page)
  res.json(result)
}

export async function getArticle(req: Request, res: Response) {
  const article = await getArticleById(req.params.id, req.userId)

  if (!article) {
    res.status(404).json({ error: 'Article not found' })
    return
  }

  res.json({ article })
}

export async function saveScroll(req: Request, res: Response) {
  const { scrollOffset } = req.body
  const { id } = req.params

  if (typeof scrollOffset !== 'number') {
    res.status(400).json({ error: 'scrollOffset must be a number' })
    return
  }

  await updateScrollPosition(id, req.userId, scrollOffset)
  res.json({ success: true })
}
