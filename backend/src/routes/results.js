import { Router } from 'express';
import { getResultByUsn } from '../controllers/resultsController.js';

const router = Router();

// Support both /api/results/:usn and /api/results?usn=...
router.get(['/', '/:usn'], getResultByUsn);

export default router;
