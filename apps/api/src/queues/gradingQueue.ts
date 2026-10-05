import { Queue } from 'bullmq';
import { redisConnectionOptions } from './redis';
import { JobPriority } from '@aita/shared';

export interface GradingJobPayload {
  jobDbId: number;
  batchId: number;
  submissionId: number;
  studentName?: string;
  submissionTitle?: string;
  priority: JobPriority;
}

const BULLMQ_PRIORITY_MAP: Record<JobPriority, number> = {
  Exam: 1,       // BR-01: Highest priority (weight 100)
  Assignment: 5, // BR-01: Medium priority (weight 50)
  Practice: 10,  // BR-01: Standard priority (weight 10)
};

export const GRADING_QUEUE_NAME = 'grading-queue';

export const gradingQueue = new Queue<GradingJobPayload>(GRADING_QUEUE_NAME, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 3, // BR-04: Capped at exactly 3 attempts
    backoff: {
      type: 'exponential',
      delay: 2000, // BR-05: 2s, 4s, 8s
    },
    removeOnComplete: false,
    removeOnFail: false,
  },
});

// Suppress unhandled redis connection error in background
gradingQueue.on('error', (err) => {
  // Silent or debug log
});

export const addGradingJobToQueue = async (payload: GradingJobPayload) => {
  const priorityScore = BULLMQ_PRIORITY_MAP[payload.priority] || 5;
  try {
    const jobPromise = gradingQueue.add(`grading-job-${payload.jobDbId}`, payload, {
      priority: priorityScore,
    });
    // Fast 500ms timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Redis timeout')), 500)
    );
    return await Promise.race([jobPromise, timeoutPromise]);
  } catch (err: any) {
    console.warn(`[BullMQ] Enqueue skipped (Redis offline): ${err.message}`);
    return null;
  }
};

export const getQueueTelemetryCounts = async () => {
  try {
    const countsPromise = gradingQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Redis timeout')), 400)
    );
    const counts: any = await Promise.race([countsPromise, timeoutPromise]);
    return {
      waiting: counts.waiting + counts.delayed,
      active: counts.active,
      completed: counts.completed,
      failed: counts.failed,
      total: counts.waiting + counts.delayed + counts.active + counts.completed + counts.failed,
    };
  } catch {
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      total: 0,
    };
  }
};
