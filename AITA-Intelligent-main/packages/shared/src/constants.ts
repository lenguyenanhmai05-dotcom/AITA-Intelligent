// Business Rules Constants (AITA-INTELLIGENT Subsystem 5)

// BR-01: Priority Weighting
export const PRIORITY_WEIGHTS = {
  Exam: 100,
  Assignment: 50,
  Practice: 10,
} as const;

// BR-02: Batch Creation Limit
export const MAX_CONCURRENT_ACTIVE_BATCHES_PER_CLASS = 3;

// BR-03: Real-Time Sync Interval (minimum 2000ms)
export const TELEMETRY_MIN_POLL_INTERVAL_MS = 2000;

// BR-04 & BR-05: Retries and Exponential Backoff Formula
export const MAX_RETRY_ATTEMPTS = 3;
export const calculateBackoffDelaySeconds = (retryCount: number): number => {
  // 2^retryCount seconds: (2s, 4s, 8s)
  return Math.pow(2, retryCount);
};

// BR-06: DLQ Manual Replay
export const DLQ_REPLAY_RESET_RETRY_COUNT = 0;

// BR-07: Worker Concurrency Boundaries
export const WORKER_CONCURRENCY_MIN = 1;
export const WORKER_CONCURRENCY_MAX = 10;
export const DEFAULT_WORKER_CONCURRENCY = 5;

// BR-10: Suspicious Commit Heuristic Types
export const SUSPICIOUS_REASONS = {
  WHITESPACE_ONLY: 'whitespace-only',
  SELF_REVERT: 'self-revert',
} as const;

// BR-11: Contribution Weight Formula
// contributionPercentage = 40% LOC share + 40% commit share + 20% PR share
export const CONTRIBUTION_WEIGHTS = {
  LOC: 0.4,
  COMMITS: 0.4,
  PRS: 0.2,
} as const;

// BR-12: Free-Riding Threshold Range
export const FREE_RIDING_THRESHOLD_DEFAULT = 5; // 5%
export const FREE_RIDING_THRESHOLD_MIN = 1;
export const FREE_RIDING_THRESHOLD_MAX = 20;

// BR-13: Generated File & Noise Exclusion List
export const EXCLUDED_PATH_PATTERNS = [
  'node_modules/**',
  'dist/**',
  'build/**',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  '.git/**',
  '**/*.min.js',
  '**/*.min.css',
  '**/*.map',
  '**/*.png',
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.gif',
  '**/*.svg',
  '**/*.ico',
  '**/*.pdf',
  '**/*.zip',
  '**/*.tar.gz',
];
