import { Router } from 'express';
import { search } from '../controllers/search.controller.ts';
import { requireAuth } from '../middleware/auth.middleware.ts';

const router = Router();
router.get('/', requireAuth, search);
export default router;
