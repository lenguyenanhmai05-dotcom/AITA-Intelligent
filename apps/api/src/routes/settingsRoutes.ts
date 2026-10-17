import { Router } from 'express';
import {
  getSettings,
<<<<<<< HEAD
  patchSettings,
=======
>>>>>>> origin/main
  updateWorkerConcurrency,
  updateFreeRidingThreshold,
} from '../controllers/settingsController';

const router = Router();

router.get('/', getSettings);
<<<<<<< HEAD
router.patch('/', patchSettings);
=======
>>>>>>> origin/main
router.put('/concurrency', updateWorkerConcurrency);
router.post('/concurrency', updateWorkerConcurrency);
router.put('/threshold', updateFreeRidingThreshold);
router.post('/threshold', updateFreeRidingThreshold);
<<<<<<< HEAD
router.put('/free-riding-threshold', updateFreeRidingThreshold);
router.post('/free-riding-threshold', updateFreeRidingThreshold);
=======
>>>>>>> origin/main

export default router;
