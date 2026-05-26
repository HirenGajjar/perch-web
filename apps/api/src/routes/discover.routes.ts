import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.ts';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query || query.trim().length < 2) {
      return res.json({ results: [] });
    }
    const response = await fetch(
      `https://cloud.feedly.com/v3/search/feeds?query=${encodeURIComponent(query)}&count=10`,
      { headers: { 'User-Agent': 'Perch RSS Reader/1.0' } }
    );
    const data = await response.json();
    res.json({ results: data.results ?? [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
