import { Router } from 'express';
import { 
  login, 
  googleSsoLogin, 
  getCurrentUser,
  getLecturerRequests,
  approveLecturerRequest,
  checkLecturerRequestStatus
} from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/google', googleSsoLogin);
router.get('/me', getCurrentUser);
router.get('/lecturer-requests', getLecturerRequests);
router.post('/approve-lecturer', approveLecturerRequest);
router.post('/check-status', checkLecturerRequestStatus);

export default router;
