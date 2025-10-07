import { Router } from 'express';
import { signup, login, logout, me } from '../controllers/authController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', verifyAuth, me);

export default router;
