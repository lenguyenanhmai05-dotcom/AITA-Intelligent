import { Router } from 'express';
import {
  getSettings,
  patchSettings,
  updateWorkerConcurrency,
  updateFreeRidingThreshold,
} from '../controllers/settingsController';

const router = Router();

router.get('/', getSettings);
router.patch('/', patchSettings);
router.put('/concurrency', updateWorkerConcurrency);
router.post('/concurrency', updateWorkerConcurrency);
router.put('/threshold', updateFreeRidingThreshold);
router.post('/threshold', updateFreeRidingThreshold);
router.put('/free-riding-threshold', updateFreeRidingThreshold);
router.post('/free-riding-threshold', updateFreeRidingThreshold);

export default router;
