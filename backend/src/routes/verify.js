import { Router } from 'express';
import { verify } from '../controllers/authController.js';

const router = Router();

router.get('/', verify);

export default router;
