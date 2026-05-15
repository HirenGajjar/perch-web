import type { Request, Response } from 'express'
import { addFeed, getUserFeeds, unsubscribeFeed } from '../services/feed.service.ts'

export async function subscribe(req: Request, res: Response) {
  const { url } = req.body

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'A valid feed URL is required' })
    return
  }

  try {
    const feed = await addFeed(url.trim(), req.userId)
    res.status(201).json({ feed })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add feed'
    res.status(400).json({ error: message })
  }
}

export async function getFeeds(req: Request, res: Response) {
  const subscriptions = await getUserFeeds(req.userId)
  res.json({ subscriptions })
}

export async function unsubscribe(req: Request, res: Response) {
  const { feedId } = req.params

  try {
    await unsubscribeFeed(feedId, req.userId)
    res.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to unsubscribe'
    res.status(400).json({ error: message })
  }
}
