import { Router } from 'express';
import { login, register, forgotPassword, logout, refresh } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/logout', logout);

export default router;