import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  MAX_RETRY_ATTEMPTS,
  calculateBackoffDelaySeconds,
  DLQ_REPLAY_RESET_RETRY_COUNT,
} from '@aita/shared';

describe('Task 19: Exponential Backoff & Retry Mechanism (BR-04, BR-05, BR-06)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('tính toán chính xác thời gian delay theo lũy thừa 2^n giây (BR-04)', () => {
    // 2^1 = 2 giây
    expect(calculateBackoffDelaySeconds(1)).toBe(2);
    // 2^2 = 4 giây
    expect(calculateBackoffDelaySeconds(2)).toBe(4);
    // 2^3 = 8 giây
    expect(calculateBackoffDelaySeconds(3)).toBe(8);
    // Boundary check: 2^0 = 1 giây
    expect(calculateBackoffDelaySeconds(0)).toBe(1);
  });

  it('giới hạn số lần thử lại tối đa là 3 lần (MAX_RETRY_ATTEMPTS = 3) theo BR-05', () => {
    expect(MAX_RETRY_ATTEMPTS).toBe(3);
  });

  it('mô phỏng retry với fake timers: retry thành công ở lần thứ 2 sau backoff 2000ms', async () => {
    let attempts = 0;
    const mockGitCloneOperation = vi.fn().mockImplementation(async () => {
      attempts++;
      if (attempts === 1) {
        throw new Error('E_GIT_NETWORK_TIMEOUT: Connection to GitHub timed out');
      }
      return { success: true, commitCount: 42 };
    });

    const executeWithRetry = async (fn: () => Promise<any>, maxRetries = MAX_RETRY_ATTEMPTS) => {
      let lastError: any;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await fn();
        } catch (err) {
          lastError = err;
          if (attempt < maxRetries) {
            const delayMs = calculateBackoffDelaySeconds(attempt) * 1000;
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }
      }
      throw lastError;
    };

    const promise = executeWithRetry(mockGitCloneOperation);

    // Lần gọi đầu tiên thất bại ngay lập tức
    expect(attempts).toBe(1);

    // Đẩy thời gian trôi 2000ms (backoff lần 1: 2s)
    await vi.advanceTimersByTimeAsync(2000);

    const result = await promise;
    expect(result).toEqual({ success: true, commitCount: 42 });
    expect(attempts).toBe(2);
  });

  it('đẩy job vào Dead Letter Queue (DLQ) khi vượt quá 3 lần retry thất bại liên tiếp', async () => {
    let attempts = 0;
    const mockFailingJob = vi.fn().mockImplementation(async () => {
      attempts++;
      throw new Error(`Git clone failed on attempt #${attempts}`);
    });

    const dlqSink = vi.fn();

    const processJobWithQueue = async () => {
      for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
        try {
          await mockFailingJob();
          return;
        } catch (err: any) {
          if (attempt === MAX_RETRY_ATTEMPTS) {
            dlqSink({
              status: 'DLQ',
              failedAttempts: attempt,
              errorClassification: err.message,
              timestamp: Date.now(),
            });
            return;
          }
          const delayMs = calculateBackoffDelaySeconds(attempt) * 1000;
          await new Promise((res) => setTimeout(res, delayMs));
        }
      }
    };

    const jobPromise = processJobWithQueue();

    // Lần 1 thất bại -> chờ 2000ms
    expect(attempts).toBe(1);
    await vi.advanceTimersByTimeAsync(2000);

    // Lần 2 thất bại -> chờ 4000ms
    expect(attempts).toBe(2);
    await vi.advanceTimersByTimeAsync(4000);

    // Lần 3 thất bại -> chuyển vào DLQ
    await jobPromise;
    expect(attempts).toBe(3);
    expect(dlqSink).toHaveBeenCalledTimes(1);
    expect(dlqSink).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'DLQ',
        failedAttempts: 3,
        errorClassification: 'Git clone failed on attempt #3',
      })
    );
  });

  it('cho phép replay thủ công từ DLQ và reset retryCount về 0 (BR-06)', () => {
    expect(DLQ_REPLAY_RESET_RETRY_COUNT).toBe(0);

    const mockDLQJob = {
      id: 'job_dlq_001',
      retryCount: 3,
      status: 'DLQ',
    };

    // Replay handler
    const replayJob = (job: typeof mockDLQJob) => ({
      ...job,
      status: 'waiting',
      retryCount: DLQ_REPLAY_RESET_RETRY_COUNT,
    });

    const replayed = replayJob(mockDLQJob);
    expect(replayed.status).toBe('waiting');
    expect(replayed.retryCount).toBe(0);
  });
});
