import express from 'express';
import { register, login, me, changePassword } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', authenticate, register);
router.post('/login', login);
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, changePassword);

export default router;
