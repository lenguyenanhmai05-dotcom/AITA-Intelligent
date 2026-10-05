import { Worker, Job } from 'bullmq';
import { MockDispatcher, ExecutionResult } from './mockDispatcher';
import { 
  DEFAULT_WORKER_CONCURRENCY,
  WORKER_CONCURRENCY_MIN,
  WORKER_CONCURRENCY_MAX,
  MAX_RETRY_ATTEMPTS,
  calculateBackoffDelaySeconds 
} from '@aita/shared';

const redisConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
};

export class GradingWorkerService {
  private static workerInstance: Worker | null = null;
  private static currentConcurrency: number = DEFAULT_WORKER_CONCURRENCY;

  public static start(): Worker {
    console.log(`[BullMQ Worker] Starting Priority Job Dequeuing Worker daemon...`);
    console.log(`[BullMQ Worker] Initial Concurrency: ${this.currentConcurrency}`);

    this.workerInstance = new Worker(
      'grading-queue',
      async (job: Job) => {
        console.log(`[Worker] Processing Job #${job.id} (Attempt ${job.attemptsMade + 1}/${MAX_RETRY_ATTEMPTS}) - Priority: ${job.data.priority}`);
        
        // Chạy mock grading dispatcher
        const result: ExecutionResult = await MockDispatcher.run(
          job.data.submissionTitle,
          job.data.isSimulatedFailure
        );

        if (!result.success) {
          throw new Error(result.errorClassification || 'Grading task execution failed');
        }

        return result;
      },
      {
        connection: redisConnectionOptions,
        concurrency: this.currentConcurrency, // BR-07: Concurrency range 1-10
      }
    );

    // Event: Chấm bài thành công
    this.workerInstance.on('completed', (job: Job, result: ExecutionResult) => {
      console.log(`[Worker] ✅ Job #${job.id} COMPLETED in ${result.runtimeDurationMs}ms - Score: ${result.score}/100`);
    });

    // Event: Lỗi thực thi & Exponential Backoff Retry (BR-04, BR-05, UC-03)
    this.workerInstance.on('failed', (job: Job | undefined, err: Error) => {
      if (!job) return;

      const attempt = job.attemptsMade;
      if (attempt < MAX_RETRY_ATTEMPTS) {
        const nextDelay = calculateBackoffDelaySeconds(attempt);
        console.warn(`[Worker] ⚠️ Job #${job.id} FAILED attempt ${attempt}/${MAX_RETRY_ATTEMPTS}. Rescheduling with Exponential Backoff (waiting ${nextDelay}s) [BR-05]`);
      } else {
        // Hết 3 lần thử: Chuyển sang Dead-Letter Queue (DLQ Status Mover - UC-04)
        console.error(`[Worker] 💀 Job #${job.id} EXHAUSTED all ${MAX_RETRY_ATTEMPTS} attempts! Quarantined to Dead-Letter Queue (status = 'dead').`);
        console.error(`[Worker] Root Cause: ${err.message}`);
      }
    });

    this.workerInstance.on('error', (err) => {
      console.warn(`[BullMQ Worker] Queue connection warning: ${err.message}`);
    });

    return this.workerInstance;
  }

  /**
   * Cập nhật số lượng Worker Concurrency động tại runtime mà không cần restart server (UC-05 & BR-07)
   */
  public static updateConcurrency(newConcurrency: number): boolean {
    if (newConcurrency < WORKER_CONCURRENCY_MIN || newConcurrency > WORKER_CONCURRENCY_MAX) {
      console.error(`[BullMQ Worker] Invalid concurrency: ${newConcurrency}. Must be between 1 and 10.`);
      return false;
    }

    this.currentConcurrency = newConcurrency;
    if (this.workerInstance) {
      this.workerInstance.concurrency = newConcurrency;
      console.log(`[BullMQ Worker] 🔄 Dynamically updated worker concurrency pool to: ${newConcurrency} without restart (BR-07, UC-05)`);
      return true;
    }
    return false;
  }
}
