import dotenv from 'dotenv';
import { Job, Queue, Worker } from 'bullmq';

import {
  DEFAULT_WORKER_CONCURRENCY,
  MAX_RETRY_ATTEMPTS,
  PRIORITY_WEIGHTS,
  WORKER_CONCURRENCY_MAX,
  WORKER_CONCURRENCY_MIN,
  calculateBackoffDelaySeconds,
  ErrorClassification,
  JobPriority,
} from '@aita/shared';

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST ?? 'localhost';
const REDIS_PORT = Number(process.env.REDIS_PORT ?? 6379);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

const QUEUE_NAME = 'grading-queue';

const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
};

// --------------------------------------------------
// 1. BullMQ Queue
// --------------------------------------------------

const gradingQueue = new Queue(QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    // Project rule:
    // MAX_RETRY_ATTEMPTS = 3
    attempts: MAX_RETRY_ATTEMPTS,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: false,
    removeOnFail: false,
  },
});

// --------------------------------------------------
// 2. Runtime Worker Concurrency
// --------------------------------------------------

let currentConcurrency = DEFAULT_WORKER_CONCURRENCY;

// --------------------------------------------------
// 3. Error Classification
// --------------------------------------------------

function classifyError(error: Error): ErrorClassification {
  const message = error.message.toLowerCase();

  if (message.includes('timeout')) {
    return 'timeout';
  }

  if (message.includes('syntax')) {
    return 'syntax_error';
  }

  if (message.includes('auth')) {
    return 'auth_error';
  }

  if (message.includes('connection')) {
    return 'connection_refused';
  }

  return 'runtime_error';
}

// --------------------------------------------------
// 4. Mock Grading
// --------------------------------------------------

async function mockGrading(job: Job) {
  const startTime = Date.now();

  console.log(
    `[Worker] Processing job=${job.id} ` +
      `type=${job.data.type} ` +
      `priority=${job.opts.priority} ` +
      `attempt=${job.attemptsMade + 1}`,
  );

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Demo failure for retry/DLQ testing
  if (job.data.shouldFail === true) {
    throw new Error('Mock grading runtime_error');
  }

  const runtimeDurationMs = Date.now() - startTime;

  return {
    status: 'completed',
    runtimeDurationMs,
  };
}

// --------------------------------------------------
// 5. BullMQ Worker
// --------------------------------------------------

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    return mockGrading(job);
  },
  {
    connection,
    concurrency: currentConcurrency,
  },
);

// --------------------------------------------------
// 6. Completed Event
// --------------------------------------------------

worker.on('completed', (job, result) => {
  console.log(
    `[Worker] Completed job=${job.id} ` +
      `runtimeDurationMs=${result.runtimeDurationMs}`,
  );
});

// --------------------------------------------------
// 7. Failed Event + DLQ Simulation
// --------------------------------------------------

worker.on('failed', (job, error) => {
  if (!job) {
    console.error('[Worker] Failed job information unavailable.');
    return;
  }

  const errorClassification = classifyError(error);

  console.error(
    `[Worker] Failed job=${job.id} ` +
      `attemptsMade=${job.attemptsMade} ` +
      `classification=${errorClassification}`,
  );

  const isMaxAttemptsReached =
    job.attemptsMade >= MAX_RETRY_ATTEMPTS;

  if (isMaxAttemptsReached) {
    console.error(`[DLQ] Job ${job.id} is DEAD.`);
    console.error(
      `[DLQ] errorClassification=${errorClassification}`,
    );
    console.error(
      `[DLQ] stackTrace=${error.stack ?? 'N/A'}`,
    );
  } else {
    const nextRetryCount = job.attemptsMade;
    const delaySeconds =
      calculateBackoffDelaySeconds(nextRetryCount);

    console.log(
      `[Retry] Job ${job.id} will retry in ${delaySeconds}s.`,
    );
  }
});

// --------------------------------------------------
// 8. Worker Error Event
// --------------------------------------------------

worker.on('error', (error) => {
  console.error('[Worker] Worker error:', error);
});

// --------------------------------------------------
// 9. Dynamic Concurrency
// --------------------------------------------------

function updateConcurrency(value: number) {
  if (
    value < WORKER_CONCURRENCY_MIN ||
    value > WORKER_CONCURRENCY_MAX
  ) {
    throw new Error(
      `Concurrency must be between ${WORKER_CONCURRENCY_MIN} ` +
        `and ${WORKER_CONCURRENCY_MAX}.`,
    );
  }

  worker.concurrency = value;
  currentConcurrency = value;

  console.log(
    `[Config] Worker concurrency updated to ${currentConcurrency}`,
  );
}

// --------------------------------------------------
// 10. Add Demo Jobs
// --------------------------------------------------

async function addDemoJobs() {
  const demoJobs: Array<{
    type: JobPriority;
    shouldFail: boolean;
  }> = [
    {
      type: 'Exam',
      shouldFail: false,
    },
    {
      type: 'Assignment',
      shouldFail: false,
    },
    {
      type: 'Practice',
      shouldFail: true,
    },
  ];

  for (const demoJob of demoJobs) {
    const priority = PRIORITY_WEIGHTS[demoJob.type];

    await gradingQueue.add(
      'grading-job',
      {
        submissionId: `submission-${demoJob.type}`,
        type: demoJob.type,
        shouldFail: demoJob.shouldFail,
      },
      {
        priority,
      },
    );

    console.log(
      `[Queue] Added ${demoJob.type} job ` +
        `with priority=${priority}`,
    );
  }
}

// --------------------------------------------------
// 11. Start PoC
// --------------------------------------------------

async function main() {
  console.log('[System] Starting BullMQ PoC Worker...');
  console.log(
    `[System] Redis=${REDIS_HOST}:${REDIS_PORT}`,
  );
  console.log(
    `[System] Default concurrency=${DEFAULT_WORKER_CONCURRENCY}`,
  );
  console.log(
    `[System] Max retry attempts=${MAX_RETRY_ATTEMPTS}`,
  );

  await addDemoJobs();

  // Demonstrate runtime concurrency update
  updateConcurrency(3);

  console.log(
    '[System] BullMQ PoC Worker is running.',
  );
}

main().catch((error) => {
  console.error(
    '[System] Startup error:',
    error,
  );
});
