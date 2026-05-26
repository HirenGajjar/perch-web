import type { Request, Response } from 'express';
import { searchArticles } from '../services/search.service.ts';

export async function search(req: Request, res: Response) {
  try {
    const query = req.query.q as string;
    const results = await searchArticles(query, req.userId);
    res.json({ results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
