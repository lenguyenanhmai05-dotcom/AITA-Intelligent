import { connectMongoDB } from './connection';
import {
  UserModel,
  ClassModel,
  TeamModel,
  GradingBatchModel,
  GradingJobModel,
  MemberContributionModel,
  SystemSettingModel,
} from './models';

export async function seedMongoDBAtlas() {
  console.log('[Seed] Connecting to MongoDB Atlas Cluster0...');
  await connectMongoDB();

  console.log('[Seed] Initializing collections on Atlas...');

  // 1. Seed Users
  const users = [
    {
      numericId: 1,
      fullName: 'Lê Nguyễn Anh Mai',
      email: 'lenguyenanhmai05@gmail.com',
      gitEmails: ['lenguyenanhmai05@gmail.com'],
      githubUsername: 'lenguyenanhmai05',
      role: 'student',
      password: 'password123',
    },
    {
      numericId: 2,
      fullName: 'TS. Nguyễn Văn Giảng',
      email: 'giangnv@fpt.edu.vn',
      gitEmails: ['giangnv@fpt.edu.vn', 'nguyen.giang@gmail.com'],
      githubUsername: 'giangnv-fpt',
      role: 'lecturer',
      password: 'password123',
    },
    {
      numericId: 3,
      fullName: 'Quản Trị Viên Hệ Thống',
      email: 'admin@aita.fpt.edu.vn',
      gitEmails: ['admin@aita.fpt.edu.vn'],
      githubUsername: 'aita-admin',
      role: 'admin',
      password: 'adminpassword',
    },
    {
      numericId: 4,
      fullName: 'Nguyễn Văn A',
      email: 'anv@fpt.edu.vn',
      gitEmails: ['anv@fpt.edu.vn'],
      githubUsername: 'anv-dev',
      role: 'student',
      password: 'studentpassword',
    },
    {
      numericId: 5,
      fullName: 'Trần Thị B',
      email: 'tranb@fpt.edu.vn',
      gitEmails: ['tranb@fpt.edu.vn'],
      githubUsername: 'tranb-fpt',
      role: 'student',
      password: 'studentpassword',
    },
    {
      numericId: 6,
      fullName: 'Lê Văn C',
      email: 'cle@fpt.edu.vn',
      gitEmails: ['cle@fpt.edu.vn'],
      githubUsername: 'cle-coder',
      role: 'student',
      password: 'studentpassword',
    },
  ];

  for (const u of users) {
    await UserModel.updateOne({ email: u.email }, { $set: u }, { upsert: true });
  }
  console.log(`[Seed] ✅ Seeded ${users.length} Users on Atlas`);

  // 2. Seed Class & Team
  await ClassModel.updateOne(
    { className: 'SWP391 - Đồ án phần mềm' },
    { $set: { numericId: 1, className: 'SWP391 - Đồ án phần mềm', lecturerEmail: 'giangnv@fpt.edu.vn' } },
    { upsert: true }
  );

  await TeamModel.updateOne(
    { teamName: 'Nhóm 2 - AITA Intelligent' },
    {
      $set: {
        numericId: 1,
        teamName: 'Nhóm 2 - AITA Intelligent',
        classId: 1,
        members: ['lenguyenanhmai05@gmail.com', 'anv@fpt.edu.vn', 'tranb@fpt.edu.vn', 'cle@fpt.edu.vn'],
      }
    },
    { upsert: true }
  );
  console.log(`[Seed] ✅ Seeded Class & Team on Atlas`);

  // 3. Seed Batch & Jobs
  await GradingBatchModel.updateOne(
    { batchId: 1 },
    {
      $set: {
        batchId: 1,
        batchName: 'Assignment 3 — Spring Boot REST',
        classId: 1,
        createdBy: 'giangnv@fpt.edu.vn',
        priority: 'Assignment',
        status: 'active',
        jobsCount: 3,
      }
    },
    { upsert: true }
  );

  const jobs = [
    {
      jobId: 1042,
      batchId: 1,
      submissionId: 101,
      studentName: 'Nguyễn Văn A',
      submissionTitle: 'Assignment 3 — Spring Boot REST',
      status: 'active' as const,
      retryCount: 0,
      runtimeDurationMs: 2410,
    },
    {
      jobId: 1043,
      batchId: 1,
      submissionId: 102,
      studentName: 'Lê Văn C',
      submissionTitle: 'Assignment 3 — Spring Boot REST',
      status: 'waiting' as const,
      retryCount: 0,
      runtimeDurationMs: null,
    },
    {
      jobId: 1041,
      batchId: 1,
      submissionId: 103,
      studentName: 'Trần Thị B',
      submissionTitle: 'Assignment 3 — Spring Boot REST',
      status: 'dead' as const,
      retryCount: 3,
      runtimeDurationMs: 30124,
      errorClassification: 'timeout: sandbox execution exceeded 30s',
      stackTrace: 'TimeoutError: exec exceeded 30000ms at MockDispatcher.run (dispatcher.js:42)',
      dismissed: false,
    },
  ];

  for (const j of jobs) {
    await GradingJobModel.updateOne({ jobId: j.jobId }, { $set: j }, { upsert: true });
  }
  console.log(`[Seed] ✅ Seeded Batches & DLQ Jobs on Atlas`);

  // 4. Seed Contributions
  const contributions = [
    { repoId: 1, studentName: 'Lê Nguyễn Anh Mai', userEmail: 'lenguyenanhmai05@gmail.com', prCount: 14, commitCount: 42, locCount: 3820, contributionPercentage: 38.5, isFreeRiding: false },
    { repoId: 1, studentName: 'Nguyễn Văn A', userEmail: 'anv@fpt.edu.vn', prCount: 12, commitCount: 35, locCount: 3100, contributionPercentage: 31.0, isFreeRiding: false },
    { repoId: 1, studentName: 'Lê Văn C', userEmail: 'cle@fpt.edu.vn', prCount: 9, commitCount: 28, locCount: 2650, contributionPercentage: 26.5, isFreeRiding: false },
    { repoId: 1, studentName: 'Trần Thị B', userEmail: 'tranb@fpt.edu.vn', prCount: 1, commitCount: 3, locCount: 120, contributionPercentage: 4.0, isFreeRiding: true },
  ];

  for (const c of contributions) {
    await MemberContributionModel.updateOne({ userEmail: c.userEmail }, { $set: c }, { upsert: true });
  }
  console.log(`[Seed] ✅ Seeded Team Contributions with Free-Rider on Atlas`);

  // 5. Seed System Settings
  await SystemSettingModel.updateOne(
    { settingKey: 'worker_concurrency' },
    { $set: { settingKey: 'worker_concurrency', settingValue: 5, updatedBy: 'admin@aita.fpt.edu.vn' } },
    { upsert: true }
  );

  await SystemSettingModel.updateOne(
    { settingKey: 'free_riding_threshold' },
    { $set: { settingKey: 'free_riding_threshold', settingValue: 5, updatedBy: 'admin@aita.fpt.edu.vn' } },
    { upsert: true }
  );
  console.log(`[Seed] ✅ Seeded System Settings on Atlas`);

  console.log('🎉 ALL SEED DATA SUCCESSFULLY SYNCED TO MONGODB ATLAS!');
}

if (require.main === module) {
  seedMongoDBAtlas()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed Error:', err);
      process.exit(1);
    });
}
