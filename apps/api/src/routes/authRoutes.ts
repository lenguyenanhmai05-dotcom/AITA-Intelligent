import { Router } from 'express';
import { login, googleSsoLogin, getCurrentUser } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/google', googleSsoLogin);
router.get('/me', getCurrentUser);

export default router;
