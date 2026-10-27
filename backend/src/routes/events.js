import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import {
  getEvents,
  headEvents,
  postEvent,
  putEvent,
  deleteEvent
} from '../controllers/eventsController.js';

const router = Router();

// Public endpoints
router.get('/', getEvents);
router.head('/', headEvents);

// Protected endpoints (Admin token required)
router.post('/', requireAdmin, postEvent);
router.put('/', requireAdmin, putEvent);
router.delete('/', requireAdmin, deleteEvent);

export default router;
