import { Router } from 'express';
import { register, login } from '../controllers/authController.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', register);
router.post('/login', loginLimiter, login); // stricter limit on login only

export default router;
