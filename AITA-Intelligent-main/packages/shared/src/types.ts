// Shared Domain Types & Enums (AITA-INTELLIGENT Subsystem 5)

export type UserRole = 'lecturer' | 'student' | 'admin';

export type JobPriority = 'Exam' | 'Assignment' | 'Practice';

export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'dead';

export type BatchStatus = 'waiting' | 'active' | 'completed' | 'failed';

export type CloneStatus = 'pending' | 'cloning' | 'success' | 'failed';

export type ErrorClassification =
  | 'timeout'
  | 'runtime_error'
  | 'syntax_error'
  | 'auth_error'
  | 'connection_refused'
  | 'unknown';

export type SuspiciousReason = 'whitespace-only' | 'self-revert';

export interface TelemetryMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  total: number;
}

export interface MemberContributionDto {
  userId: number;
  fullName: string;
  email: string;
  commitCount: number;
  locAdded: number;
  locDeleted: number;
  netLoc: number;
  prCount: number;
  locShare: number;
  commitShare: number;
  prShare: number;
  contributionPercentage: number;
  isFreeRiding: boolean;
}
