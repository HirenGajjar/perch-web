import type { Request, Response } from 'express';
import { addBookmark, removeBookmark, getBookmarks } from '../services/bookmark.service.ts';

export async function bookmark(req: Request, res: Response) {
  const { articleId } = req.params;
  try {
    const result = await addBookmark(req.userId, articleId);
    res.status(201).json({ bookmark: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to bookmark';
    res.status(400).json({ error: message });
  }
}

export async function unbookmark(req: Request, res: Response) {
  const { articleId } = req.params;
  try {
    await removeBookmark(req.userId, articleId);
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to remove bookmark';
    res.status(400).json({ error: message });
  }
}

export async function listBookmarks(req: Request, res: Response) {
  const bookmarks = await getBookmarks(req.userId);
  res.json({ bookmarks });
}
