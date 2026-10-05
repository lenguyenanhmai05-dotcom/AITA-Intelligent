import { prisma } from './index';

export async function seedPostgres() {
  console.log('[PostgreSQL Seed] 🚀 Seeding initial database data...');

  try {
    // 1. Seed Core Users
    const adminUser = await prisma.user.upsert({
      where: { email: 'lenguyenanhmai05@gmail.com' },
      update: { role: 'admin' },
      create: {
        fullName: 'Lê Nguyễn Anh Mai',
        email: 'lenguyenanhmai05@gmail.com',
        githubUsername: 'lenguyenanhmai05',
        role: 'admin',
        password: 'password123',
      },
    });

    const lecturerUser = await prisma.user.upsert({
      where: { email: 'giangnv@fpt.edu.vn' },
      update: {},
      create: {
        fullName: 'TS. Nguyễn Văn Giảng',
        email: 'giangnv@fpt.edu.vn',
        githubUsername: 'giangnv-fpt',
        role: 'lecturer',
        password: 'password123',
      },
    });

    const studentUser = await prisma.user.upsert({
      where: { email: 'sinhtmhe160001@fpt.edu.vn' },
      update: {},
      create: {
        fullName: 'Trần Minh Sinh',
        email: 'sinhtmhe160001@fpt.edu.vn',
        githubUsername: 'minhsinh-dev',
        role: 'student',
        password: 'password123',
      },
    });

    // 2. Seed UserGitEmails
    await prisma.userGitEmail.upsert({
      where: { gitEmail: 'lenguyenanhmai05@gmail.com' },
      update: {},
      create: {
        userId: adminUser.id,
        gitEmail: 'lenguyenanhmai05@gmail.com',
      },
    });

    await prisma.userGitEmail.upsert({
      where: { gitEmail: 'minhsinh.dev@gmail.com' },
      update: {},
      create: {
        userId: studentUser.id,
        gitEmail: 'minhsinh.dev@gmail.com',
      },
    });

    // 3. Seed Classes
    const defaultClass = await prisma.class.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        className: 'SE1801 - Software Project (SWP391)',
        lecturerId: lecturerUser.id,
      },
    });

    // 4. Seed Teams
    const defaultTeam = await prisma.team.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        teamName: 'Group 2 - AITA Intelligent',
        classId: defaultClass.id,
      },
    });

    // 5. Seed TeamMembers
    await prisma.teamMember.upsert({
      where: {
        teamId_userId: {
          teamId: defaultTeam.id,
          userId: studentUser.id,
        },
      },
      update: {},
      create: {
        teamId: defaultTeam.id,
        userId: studentUser.id,
      },
    });

    // 6. Seed Submissions
    const submission1 = await prisma.submission.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        classId: defaultClass.id,
        studentId: studentUser.id,
        title: 'Assignment 1 - Sorting Algorithms & Complexity',
        codeUrl: 'https://github.com/aita-demo/assignment-1-submission',
        submissionStatus: 'submitted',
      },
    });

    // 7. Seed GradingBatches
    const defaultBatch = await prisma.gradingBatch.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        batchName: 'Assignment 1 - Batch Grading Class SE1801',
        classId: defaultClass.id,
        createdBy: lecturerUser.id,
        priority: 'Assignment',
        status: 'completed',
      },
    });

    // 8. Seed GradingJobs
    await prisma.gradingJob.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        batchId: defaultBatch.id,
        submissionId: submission1.id,
        queueJobId: 'bullmq-job-101',
        priority: 'Assignment',
        studentName: studentUser.fullName,
        submissionTitle: submission1.title,
        status: 'completed',
        retryCount: 0,
        runtimeDurationMs: 1420,
      },
    });

    // 9. Seed SystemSettings
    await prisma.systemSetting.upsert({
      where: { settingKey: 'worker_concurrency' },
      update: { settingValue: '5' },
      create: {
        settingKey: 'worker_concurrency',
        settingValue: '5',
        updatedBy: adminUser.id,
      },
    });

    await prisma.systemSetting.upsert({
      where: { settingKey: 'free_riding_threshold' },
      update: { settingValue: '5' },
      create: {
        settingKey: 'free_riding_threshold',
        settingValue: '5',
        updatedBy: adminUser.id,
      },
    });

    console.log('[PostgreSQL Seed] ✅ Seeding completed successfully!');
  } catch (error: any) {
    console.warn('[PostgreSQL Seed] ⚠️ Seeding note:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedPostgres();
}
