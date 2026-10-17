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

    // 2. Seed a roster with both university and personal Git author emails.
    const studentSeeds = [
      { fullName: 'Ngô Sử Việt Anh', email: 'vietanh.student@fpt.edu.vn', githubUsername: 'ngosuvietanhqn05-cpu', gitEmails: ['vietanh.student@fpt.edu.vn', 'vietanh.dev@gmail.com'] },
      { fullName: 'Đào Minh Nghĩa', email: 'nghia.student@fpt.edu.vn', githubUsername: 'Nghiad04052k5', gitEmails: ['nghia.student@fpt.edu.vn', 'nghia.dev@gmail.com'] },
      { fullName: 'Nguyễn Châu Khánh Linh', email: 'linh.student@fpt.edu.vn', githubUsername: 'khanhlinhz2k4-max', gitEmails: ['linh.student@fpt.edu.vn', 'linh.dev@gmail.com'] },
      { fullName: 'Lê Nguyễn Anh Mai', email: 'mai.student@fpt.edu.vn', githubUsername: 'lenguyenanhmai05-dotcom', gitEmails: ['mai.student@fpt.edu.vn', 'mai.dev@gmail.com'] },
      { fullName: 'Nguyễn Tường Vy', email: 'vy.student@fpt.edu.vn', githubUsername: 'gi098', gitEmails: ['vy.student@fpt.edu.vn', 'vy.dev@gmail.com'] },
    ];

    const students = await Promise.all(studentSeeds.map((student) =>
      prisma.user.upsert({
        where: { email: student.email },
        update: { fullName: student.fullName, githubUsername: student.githubUsername, role: 'student' },
        create: {
          fullName: student.fullName,
          email: student.email,
          githubUsername: student.githubUsername,
          role: 'student',
          password: 'password123',
        },
      }),
    ));

    const gitEmailSeeds = [
      { userId: adminUser.id, gitEmail: 'lenguyenanhmai05@gmail.com' },
      ...students.flatMap((student, index) => studentSeeds[index].gitEmails.map((gitEmail) => ({ userId: student.id, gitEmail }))),
    ];

    for (const gitEmail of gitEmailSeeds) {
      await prisma.userGitEmail.upsert({
        where: { gitEmail: gitEmail.gitEmail },
        update: { userId: gitEmail.userId },
        create: gitEmail,
      });
    }

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

    // 4. Seed team membership and sample submissions.
    for (const student of students) {
      await prisma.teamMember.upsert({
        where: { teamId_userId: { teamId: defaultTeam.id, userId: student.id } },
        update: {},
        create: { teamId: defaultTeam.id, userId: student.id },
      });

      const submissionTitle = `SWP391 sample submission - ${student.fullName}`;
      const existingSubmission = await prisma.submission.findFirst({
        where: { classId: defaultClass.id, studentId: student.id, title: submissionTitle },
      });
      const submissionData = {
        classId: defaultClass.id,
        studentId: student.id,
        title: submissionTitle,
        codeUrl: 'https://github.com/example/aita-student-submission',
        submissionStatus: 'submitted',
      };
      if (existingSubmission) {
        await prisma.submission.update({ where: { id: existingSubmission.id }, data: submissionData });
      } else {
        await prisma.submission.create({ data: submissionData });
      }
    }

    // 5. Seed SystemSettings
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
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedPostgres();
}
