import { Router } from 'express';
import {
  getSettings,
  updateWorkerConcurrency,
  updateFreeRidingThreshold,
} from '../controllers/settingsController';

const router = Router();

router.get('/', getSettings);
router.put('/concurrency', updateWorkerConcurrency);
router.post('/concurrency', updateWorkerConcurrency);
router.put('/threshold', updateFreeRidingThreshold);
router.post('/threshold', updateFreeRidingThreshold);

export default router;
