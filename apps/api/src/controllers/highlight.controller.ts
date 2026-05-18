import type { Request, Response } from 'express';
import {
  createHighlight,
  updateHighlight,
  deleteHighlight,
  getHighlightsForArticle,
} from '../services/highlight.service.ts';

export async function addHighlight(req: Request, res: Response) {
  const { articleId } = req.params;
  const { text, startOffset, endOffset, color, note } = req.body;

  if (!text || startOffset === undefined || endOffset === undefined) {
    res.status(400).json({ error: 'text, startOffset and endOffset are required' });
    return;
  }

  try {
    const highlight = await createHighlight(
      req.userId,
      articleId,
      text,
      startOffset,
      endOffset,
      color,
      note
    );
    res.status(201).json({ highlight });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create highlight';
    res.status(400).json({ error: message });
  }
}

export async function editHighlight(req: Request, res: Response) {
  const { highlightId } = req.params;
  const { color, note } = req.body;

  try {
    const highlight = await updateHighlight(highlightId, req.userId, { color, note });
    res.json({ highlight });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update highlight';
    res.status(400).json({ error: message });
  }
}

export async function removeHighlight(req: Request, res: Response) {
  const { highlightId } = req.params;
  try {
    await deleteHighlight(highlightId, req.userId);
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete highlight';
    res.status(400).json({ error: message });
  }
}

export async function listHighlights(req: Request, res: Response) {
  const { articleId } = req.params;
  const highlights = await getHighlightsForArticle(req.userId, articleId);
  res.json({ highlights });
}
