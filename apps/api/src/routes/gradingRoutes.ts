import { Router } from 'express';
import {
  getSubmissions,
  createSubmission,
  createBatch,
  getTelemetry,
  getJobDetail,
  getDeadLetterQueue,
  manualRetryJob,
  dismissJob,
} from '../controllers/gradingController';

const router = Router();

// Submissions (Student submission & Lecturer listing)
router.get('/submissions', getSubmissions);
router.post('/submissions', createSubmission);

// Batch Grading Orchestration (UC-01)
router.post('/batches', createBatch);

// Queue Telemetry (UC-02 & BR-03)
router.get('/telemetry', getTelemetry);

// Job Detail (UC-02)
router.get('/jobs/:id', getJobDetail);

// Dead-Letter Queue (UC-04)
router.get('/dlq', getDeadLetterQueue);
router.post('/dlq/:id/retry', manualRetryJob);
router.post('/dlq/:id/dismiss', dismissJob);

export default router;
