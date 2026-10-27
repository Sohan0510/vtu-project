import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { parsePlacementNotice } from '../controllers/parseController.js';

const router = Router();

router.post('/', requireAdmin, parsePlacementNotice);

export default router;
