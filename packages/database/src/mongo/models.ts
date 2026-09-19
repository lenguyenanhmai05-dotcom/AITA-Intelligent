import { Schema, model, Document } from 'mongoose';

// 1. USER SCHEMA
export interface IUser extends Document {
  numericId: number;
  fullName: string;
  email: string;
  gitEmails: string[];
  githubUsername?: string;
  role: 'lecturer' | 'student' | 'admin';
  password?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    numericId: { type: Number, index: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    gitEmails: { type: [String], default: [] },
    githubUsername: { type: String, default: null },
    role: { type: String, enum: ['lecturer', 'student', 'admin'], default: 'student' },
    password: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'users' }
);

// 2. CLASS SCHEMA
export interface IClass extends Document {
  numericId: number;
  className: string;
  lecturerEmail: string;
  createdAt: Date;
}

const ClassSchema = new Schema<IClass>(
  {
    numericId: { type: Number, index: true },
    className: { type: String, required: true },
    lecturerEmail: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'classes' }
);

// 3. TEAM SCHEMA
export interface ITeam extends Document {
  numericId: number;
  teamName: string;
  classId: number;
  members: string[]; // List of student emails
  createdAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    numericId: { type: Number, index: true },
    teamName: { type: String, required: true },
    classId: { type: Number, default: 1 },
    members: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'teams' }
);

// 4. GRADING BATCH SCHEMA (BR-01, BR-02)
export interface IGradingBatch extends Document {
  batchId: number;
  batchName: string;
  classId: number;
  createdBy: string;
  priority: 'Exam' | 'Assignment' | 'Practice';
  status: 'waiting' | 'active' | 'completed' | 'failed';
  jobsCount: number;
  createdAt: Date;
}

const GradingBatchSchema = new Schema<IGradingBatch>(
  {
    batchId: { type: Number, required: true, unique: true, index: true },
    batchName: { type: String, required: true },
    classId: { type: Number, default: 1 },
    createdBy: { type: String, default: 'admin@aita.fpt.edu.vn' },
    priority: { type: String, enum: ['Exam', 'Assignment', 'Practice'], default: 'Assignment' },
    status: { type: String, enum: ['waiting', 'active', 'completed', 'failed'], default: 'waiting' },
    jobsCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'grading_batches' }
);

// 5. GRADING JOB SCHEMA (BR-04, BR-05, BR-06 - DLQ)
export interface IGradingJob extends Document {
  jobId: number;
  batchId: number;
  submissionId: number;
  studentName: string;
  submissionTitle: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'dead';
  retryCount: number;
  runtimeDurationMs?: number | null;
  errorClassification?: string | null;
  stackTrace?: string | null;
  dismissed: boolean;
  dismissedBy?: string | null;
  dismissedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const GradingJobSchema = new Schema<IGradingJob>(
  {
    jobId: { type: Number, required: true, unique: true, index: true },
    batchId: { type: Number, required: true, index: true },
    submissionId: { type: Number, required: true },
    studentName: { type: String, required: true },
    submissionTitle: { type: String, required: true },
    status: { type: String, enum: ['waiting', 'active', 'completed', 'failed', 'dead'], default: 'waiting' },
    retryCount: { type: Number, default: 0 },
    runtimeDurationMs: { type: Number, default: null },
    errorClassification: { type: String, default: null },
    stackTrace: { type: String, default: null },
    dismissed: { type: Boolean, default: false },
    dismissedBy: { type: String, default: null },
    dismissedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'grading_jobs' }
);

// 6. GIT REPO SCHEMA (BR-08, BR-09)
export interface IGitRepo extends Document {
  repoId: number;
  teamId: number;
  repoUrl: string;
  branch: string;
  isPrivate: boolean;
  patEncrypted?: string;
  cloneStatus: 'pending' | 'cloning' | 'success' | 'failed';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GitRepoSchema = new Schema<IGitRepo>(
  {
    repoId: { type: Number, required: true, unique: true, index: true },
    teamId: { type: Number, default: 1 },
    repoUrl: { type: String, required: true },
    branch: { type: String, default: 'main' },
    isPrivate: { type: Boolean, default: false },
    patEncrypted: { type: String, default: null },
    cloneStatus: { type: String, enum: ['pending', 'cloning', 'success', 'failed'], default: 'pending' },
    errorMessage: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'git_repos' }
);

// 7. MEMBER CONTRIBUTION SCHEMA (BR-11, BR-12)
export interface IMemberContribution extends Document {
  repoId: number;
  studentName: string;
  userEmail: string;
  prCount: number;
  commitCount: number;
  locCount: number;
  contributionPercentage: number;
  isFreeRiding: boolean;
  createdAt: Date;
}

const MemberContributionSchema = new Schema<IMemberContribution>(
  {
    repoId: { type: Number, default: 1 },
    studentName: { type: String, required: true },
    userEmail: { type: String, required: true },
    prCount: { type: Number, default: 0 },
    commitCount: { type: Number, default: 0 },
    locCount: { type: Number, default: 0 },
    contributionPercentage: { type: Number, default: 0 },
    isFreeRiding: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'member_contributions' }
);

// 8. SYSTEM SETTINGS SCHEMA (BR-07, BR-12)
export interface ISystemSetting extends Document {
  settingKey: string;
  settingValue: number;
  updatedBy: string;
  updatedAt: Date;
}

const SystemSettingSchema = new Schema<ISystemSetting>(
  {
    settingKey: { type: String, required: true, unique: true, index: true },
    settingValue: { type: Number, required: true },
    updatedBy: { type: String, default: 'admin@aita.fpt.edu.vn' },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'system_settings' }
);

// EXPORT MONGOOSE MODELS
export const UserModel = model<IUser>('User', UserSchema);
export const ClassModel = model<IClass>('Class', ClassSchema);
export const TeamModel = model<ITeam>('Team', TeamSchema);
export const GradingBatchModel = model<IGradingBatch>('GradingBatch', GradingBatchSchema);
export const GradingJobModel = model<IGradingJob>('GradingJob', GradingJobSchema);
export const GitRepoModel = model<IGitRepo>('GitRepo', GitRepoSchema);
export const MemberContributionModel = model<IMemberContribution>('MemberContribution', MemberContributionSchema);
export const SystemSettingModel = model<ISystemSetting>('SystemSetting', SystemSettingSchema);
