import { Router } from 'express';
import {
  getSubmissions,
  createSubmission,
  createBatch,
  getBatches,
  cancelBatch,
  getTelemetry,
  getJobDetail,
  getDeadLetterQueue,
  manualRetryJob,
  dismissJob,
  reviewGradingJob,
  getSubmissionReport,
} from '../controllers/gradingController';

const router = Router();

// Submissions (Student submission & Lecturer listing)
router.get('/submissions', getSubmissions);
router.post('/submissions', createSubmission);
router.get('/submissions/:id/report', getSubmissionReport);

// Batch Grading Orchestration (UC-01 & BR-02)
router.get('/batches', getBatches);
router.post('/batches', createBatch);
router.post('/batches/:id/cancel', cancelBatch);

// Queue Telemetry (UC-02 & BR-03)
router.get('/telemetry', getTelemetry);

// Job Detail (UC-02)
router.get('/jobs/:id', getJobDetail);

// Human-in-the-Loop AI Grading Review (UC-04b, BR-14, BR-15, BR-16)
router.post('/jobs/:id/review', reviewGradingJob);

// Dead-Letter Queue (UC-04)
router.get('/dlq', getDeadLetterQueue);
router.post('/dlq/:id/retry', manualRetryJob);
router.post('/dlq/:id/dismiss', dismissJob);

export default router;
