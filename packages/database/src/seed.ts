import { prisma } from './index';

export async function seedPostgres() {
  console.log('[PostgreSQL Seed] 🚀 Seeding initial database data across all 12 tables...');

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
      update: { role: 'lecturer' },
      create: {
        fullName: 'TS. Nguyễn Văn Giảng',
        email: 'giangnv@fpt.edu.vn',
        githubUsername: 'giangnv-fpt',
        role: 'lecturer',
        password: 'password123',
      },
    });

    const studentSeeds = [
      { fullName: 'Lê Nguyễn Anh Mai', email: 'mai.student@fpt.edu.vn', githubUsername: 'lenguyenanhmai05', gitEmails: ['mai.student@fpt.edu.vn', 'lenguyenanhmai05@gmail.com'] },
      { fullName: 'Trần Quốc Bảo', email: 'baotq@fpt.edu.vn', githubUsername: 'baotq-dev', gitEmails: ['baotq@fpt.edu.vn', 'baotran.dev@gmail.com'] },
      { fullName: 'Nguyễn Khánh Linh', email: 'linhnk@fpt.edu.vn', githubUsername: 'khanhlinh-fpt', gitEmails: ['linhnk@fpt.edu.vn', 'khanhlinh.dev@gmail.com'] },
      { fullName: 'Phạm Hoàng Long', email: 'longph@fpt.edu.vn', githubUsername: 'longph-fpt', gitEmails: ['longph@fpt.edu.vn', 'longph.engineer@gmail.com'] },
      { fullName: 'Võ Minh Trí', email: 'trivm@fpt.edu.vn', githubUsername: 'trivm-fpt', gitEmails: ['trivm@fpt.edu.vn', 'trivm.dev@gmail.com'] },
      { fullName: 'Hoàng Thị Thảo Vy', email: 'vyhtt@fpt.edu.vn', githubUsername: 'thaovy-fpt', gitEmails: ['vyhtt@fpt.edu.vn', 'thaovy.tech@gmail.com'] },
      { fullName: 'Nguyễn Văn Đạt', email: 'datnv@fpt.edu.vn', githubUsername: 'datnv-net', gitEmails: ['datnv@fpt.edu.vn', 'datnguyen.net@gmail.com'] },
      { fullName: 'Trần Thị Mỹ Duyên', email: 'duyenttm@fpt.edu.vn', githubUsername: 'myduyen-fpt', gitEmails: ['duyenttm@fpt.edu.vn', 'myduyen.dev@gmail.com'] },
      { fullName: 'Bùi Gia Huy', email: 'huybg@fpt.edu.vn', githubUsername: 'huybg-java', gitEmails: ['huybg@fpt.edu.vn', 'giahuy.dev@gmail.com'] },
    ];

    const students = await Promise.all(
      studentSeeds.map((student) =>
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
        })
      )
    );

    // 2. UserGitEmails
    const gitEmailSeeds = [
      { userId: adminUser.id, gitEmail: 'lenguyenanhmai05@gmail.com' },
      ...students.flatMap((student, index) =>
        studentSeeds[index].gitEmails.map((gitEmail) => ({ userId: student.id, gitEmail }))
      ),
    ];

    for (const item of gitEmailSeeds) {
      await prisma.userGitEmail.upsert({
        where: { gitEmail: item.gitEmail },
        update: { userId: item.userId },
        create: item,
      });
    }

    // 3. Classes
    const swpClass = await prisma.class.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        className: 'SWP391-SE1801 — Software Development Project',
        lecturerId: lecturerUser.id,
      },
    });

    const prnClass = await prisma.class.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        className: 'PRN231-SE1803 — Advanced .NET & C# Programming',
        lecturerId: lecturerUser.id,
      },
    });

    const prjClass = await prisma.class.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3,
        className: 'PRJ301-IS1702 — Java Web Application Development',
        lecturerId: lecturerUser.id,
      },
    });

    // 3b. Assignments
    const assignmentSeeds = [
      {
        id: 1,
        classId: swpClass.id,
        title: 'Assignment 3: Xây dựng Kiến trúc Microservices & Redis BullMQ Queue',
        type: 'Assignment',
        description: 'Yêu cầu các nhóm hoàn thiện tích hợp hàng đợi phân tán BullMQ, thiết lập worker concurrency 1-10, cấu hình Exponential Backoff retry 3 lần và giao diện giám sát 2s. Nộp link GitHub Repository nhóm.',
        difficulty: 'Hard',
        programmingLang: 'Java',
        allowedFormat: 'both',
        createdById: lecturerUser.id,
      },
      {
        id: 2,
        classId: swpClass.id,
        title: 'Final Project: Nền tảng AST Code Analytics & Đánh Giá Đóng Góp Nhóm',
        type: 'Exam',
        description: 'Yêu cầu hoàn thiện toàn diện 4 giai đoạn bóc tách Git (Cloning, Parsing, Sanitizing, Scoring 40/40/20), quét mã gian lận Whitespace & Self-revert, bắt cờ Free-Rider và kiểm thử >= 80% coverage.',
        difficulty: 'Hard',
        programmingLang: 'Java',
        allowedFormat: 'git',
        createdById: lecturerUser.id,
      },
      {
        id: 3,
        classId: swpClass.id,
        title: 'Lab 5: Tối ưu hóa Database Indexing 12 Bảng 3NF & Caching < 100ms',
        type: 'Assignment',
        description: 'Thực hiện đánh chỉ mục (Index) trên grading_jobs và git_commits, cấu hình Redis Cache cho Telemetry và kiểm thử tải throughput.',
        difficulty: 'Medium',
        programmingLang: 'Java',
        allowedFormat: 'both',
        createdById: lecturerUser.id,
      },
      {
        id: 4,
        classId: 1,
        title: 'Bài Tập Lập Trình: Thiết Kế Hệ Thống Backend Node.js & Kiến Trúc Microservices',
        type: 'Assignment',
        description: 'Xây dựng hệ thống Backend hiệu năng cao với Node.js, xử lý I/O bất đồng bộ (Non-blocking I/O), phân quyền JWT và bảo mật API.',
        difficulty: 'Easy',
        programmingLang: 'Node.js',
        allowedFormat: 'both',
        createdById: lecturerUser.id,
      },
    ];

    for (const a of assignmentSeeds) {
      await prisma.assignment.upsert({
        where: { id: a.id },
        update: a,
        create: a,
      });
    }

    // 4. Teams
    const teams = [
      { id: 1, teamName: 'Nhóm 1: AITA Intelligent', classId: swpClass.id },
      { id: 2, teamName: 'Nhóm 2: Smart Logistics Platform', classId: swpClass.id },
      { id: 3, teamName: 'Nhóm 3: E-Commerce AI Recommender', classId: swpClass.id },
      { id: 4, teamName: 'Nhóm 4: Clinic Booking Management', classId: swpClass.id },
      { id: 5, teamName: 'Nhóm 5: IoT Smart Home Gateway', classId: swpClass.id },
    ];

    for (const t of teams) {
      await prisma.team.upsert({
        where: { id: t.id },
        update: { teamName: t.teamName, classId: t.classId },
        create: t,
      });
    }

    // 5. TeamMembers
    const team1Members = students.slice(0, 5); // Mai, Bảo, Linh, Long, Trí
    for (const s of team1Members) {
      await prisma.teamMember.upsert({
        where: { teamId_userId: { teamId: 1, userId: s.id } },
        update: {},
        create: { teamId: 1, userId: s.id },
      });
    }

    // 6. Submissions
    const submissionsData = [
      { id: 101, classId: 1, studentId: students[0].id, title: 'Exam', codeUrl: 'https://github.com/lenguyenanhmai05/AITA-Intelligent.git' },
      { id: 102, classId: 1, studentId: students[0].id, title: 'Assignment 3 — Spring Boot REST Service', codeUrl: 'uploads/assignment3_springboot.zip' },
      { id: 103, classId: 1, studentId: students[1].id, title: 'Lab 4 — Redis Queue Worker', codeUrl: 'uploads/lab4_worker_redis.zip' },
      { id: 104, classId: 1, studentId: students[2].id, title: 'Assignment 2 — Git Analytics & Contribution Engine', codeUrl: 'https://github.com/khanhlinh-fpt/aita-git-analytics.git' },
      { id: 105, classId: 1, studentId: students[3].id, title: 'Practical Exam — Git Engine API', codeUrl: 'https://github.com/longph-fpt/practical-exam-api.git' },
      { id: 106, classId: 1, studentId: students[4].id, title: 'Assignment 2 — Docker PostgreSQL', codeUrl: 'uploads/assignment2_docker_db.zip' },
      { id: 107, classId: 1, studentId: students[5].id, title: 'Lab 3 — AST Parser & Code Quality Metrics', codeUrl: 'https://github.com/thaovy-fpt/ast-parser-engine.git' },
      { id: 108, classId: 2, studentId: students[6].id, title: 'Assignment 2: RESTful Web API với ASP.NET Core & EF Core', codeUrl: 'uploads/PRN231_Assignment2_DatNV.zip' },
      { id: 109, classId: 2, studentId: students[7].id, title: 'Assignment 2: RESTful Web API với ASP.NET Core & EF Core', codeUrl: 'https://github.com/myduyen-fpt/aspnet-rest-service.git' },
      { id: 111, classId: 3, studentId: students[8].id, title: 'Assignment 1: Java Servlet & JSP Web App with MySQL', codeUrl: 'uploads/PRJ301_Assignment1_HuyBG.zip' },
    ];

    for (const sub of submissionsData) {
      await prisma.submission.upsert({
        where: { id: sub.id },
        update: { classId: sub.classId, studentId: sub.studentId, title: sub.title, codeUrl: sub.codeUrl },
        create: {
          id: sub.id,
          classId: sub.classId,
          studentId: sub.studentId,
          title: sub.title,
          codeUrl: sub.codeUrl,
          submissionStatus: 'submitted',
        },
      });
    }

    // 7. GradingBatches
    const batch1 = await prisma.gradingBatch.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        batchName: 'Đợt chấm Giữa kỳ SWP391 — Batch 1',
        classId: swpClass.id,
        createdBy: lecturerUser.id,
        priority: 'Exam',
        status: 'completed',
      },
    });

    // 8. GradingJobs
    const jobsData = [
      { id: 1001, batchId: batch1.id, submissionId: 101, studentName: 'Lê Nguyễn Anh Mai', submissionTitle: 'Exam', status: 'completed', reviewStatus: 'pending', runtimeDurationMs: 1250, score: 100 },
      { id: 1002, batchId: batch1.id, submissionId: 102, studentName: 'Lê Nguyễn Anh Mai', submissionTitle: 'Assignment 3 — Spring Boot REST Service', status: 'completed', reviewStatus: 'approved', reviewComment: 'Cấu trúc Controller và Service rõ ràng, đạt chuẩn.', runtimeDurationMs: 1420, score: 95 },
      { id: 1003, batchId: batch1.id, submissionId: 103, studentName: 'Trần Quốc Bảo', submissionTitle: 'Lab 4 — Redis Queue Worker', status: 'completed', reviewStatus: 'approved', reviewComment: 'Xử lý concurrency và BullMQ backoff xuất sắc.', runtimeDurationMs: 980, score: 100 },
      { id: 1004, batchId: batch1.id, submissionId: 104, studentName: 'Nguyễn Khánh Linh', submissionTitle: 'Assignment 2 — Git Analytics & Contribution Engine', status: 'completed', reviewStatus: 'pending', runtimeDurationMs: 1100, score: 90 },
      { id: 1005, batchId: batch1.id, submissionId: 105, studentName: 'Phạm Hoàng Long', submissionTitle: 'Practical Exam — Git Engine API', status: 'completed', reviewStatus: 'pending', runtimeDurationMs: 1300, score: 85 },
      { id: 1006, batchId: batch1.id, submissionId: 106, studentName: 'Võ Minh Trí', submissionTitle: 'Assignment 2 — Docker PostgreSQL', status: 'completed', reviewStatus: 'pending', runtimeDurationMs: 1500, score: 80 },
    ];

    for (const j of jobsData) {
      await prisma.gradingJob.upsert({
        where: { id: j.id },
        update: {
          status: j.status,
          reviewStatus: j.reviewStatus,
          reviewComment: j.reviewComment || null,
          runtimeDurationMs: j.runtimeDurationMs,
        },
        create: {
          id: j.id,
          batchId: j.batchId,
          submissionId: j.submissionId,
          studentName: j.studentName,
          submissionTitle: j.submissionTitle,
          status: j.status,
          priority: 'Exam',
          reviewStatus: j.reviewStatus,
          reviewComment: j.reviewComment || null,
          runtimeDurationMs: j.runtimeDurationMs,
        },
      });
    }

    // 9. GitRepos
    const gitRepo1 = await prisma.gitRepo.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        teamId: 1,
        submittedBy: students[0].id,
        repoUrl: 'https://github.com/lenguyenanhmai05/AITA-Intelligent.git',
        branch: 'main',
        cloneStatus: 'success',
      },
    });

    // 10. GitCommits
    const commitsData = [
      { repoId: gitRepo1.id, userId: students[0].id, commitHash: 'a1b2c3d4e5f6', authorEmail: 'mai.student@fpt.edu.vn', authorName: 'Lê Nguyễn Anh Mai', commitDate: new Date('2026-10-18T10:00:00Z'), linesAdded: 450, linesDeleted: 30, isSuspicious: false },
      { repoId: gitRepo1.id, userId: students[1].id, commitHash: 'b2c3d4e5f6a1', authorEmail: 'baotq@fpt.edu.vn', authorName: 'Trần Quốc Bảo', commitDate: new Date('2026-10-18T11:00:00Z'), linesAdded: 380, linesDeleted: 20, isSuspicious: false },
      { repoId: gitRepo1.id, userId: students[2].id, commitHash: 'c3d4e5f6a1b2', authorEmail: 'linhnk@fpt.edu.vn', authorName: 'Nguyễn Khánh Linh', commitDate: new Date('2026-10-18T14:00:00Z'), linesAdded: 310, linesDeleted: 15, isSuspicious: false },
      { repoId: gitRepo1.id, userId: students[3].id, commitHash: 'd4e5f6a1b2c3', authorEmail: 'longph@fpt.edu.vn', authorName: 'Phạm Hoàng Long', commitDate: new Date('2026-10-18T16:00:00Z'), linesAdded: 290, linesDeleted: 25, isSuspicious: false },
      { repoId: gitRepo1.id, userId: students[4].id, commitHash: 'e5f6a1b2c3d4', authorEmail: 'trivm@fpt.edu.vn', authorName: 'Võ Minh Trí', commitDate: new Date('2026-10-18T17:30:00Z'), linesAdded: 25, linesDeleted: 5, isSuspicious: true, suspiciousReason: 'whitespace-only (adding spaces to farm LOC)' },
    ];

    for (const c of commitsData) {
      await prisma.gitCommit.create({ data: c });
    }

    // 11. MemberContributions
    const contributionsData = [
      { repoId: gitRepo1.id, userId: students[0].id, prCount: 6, commitCount: 38, locCount: 3200, contributionPercentage: 35.5, isFreeRiding: false },
      { repoId: gitRepo1.id, userId: students[1].id, prCount: 5, commitCount: 32, locCount: 2600, contributionPercentage: 29.0, isFreeRiding: false },
      { repoId: gitRepo1.id, userId: students[2].id, prCount: 4, commitCount: 26, locCount: 2100, contributionPercentage: 23.5, isFreeRiding: false },
      { repoId: gitRepo1.id, userId: students[3].id, prCount: 3, commitCount: 18, locCount: 1400, contributionPercentage: 15.0, isFreeRiding: false },
      { repoId: gitRepo1.id, userId: students[4].id, prCount: 0, commitCount: 3, locCount: 80, contributionPercentage: 4.0, isFreeRiding: true, thresholdApplied: 5.0 },
    ];

    for (const contrib of contributionsData) {
      await prisma.memberContribution.upsert({
        where: { repoId_userId: { repoId: contrib.repoId, userId: contrib.userId } },
        update: contrib,
        create: contrib,
      });
    }

    // 12. SystemSettings
    await prisma.systemSetting.upsert({
      where: { settingKey: 'worker_concurrency' },
      update: { settingValue: '5' },
      create: { settingKey: 'worker_concurrency', settingValue: '5', updatedBy: adminUser.id },
    });

    await prisma.systemSetting.upsert({
      where: { settingKey: 'free_riding_threshold' },
      update: { settingValue: '5' },
      create: { settingKey: 'free_riding_threshold', settingValue: '5', updatedBy: adminUser.id },
    });

    console.log('[PostgreSQL Seed] ✅ All 12 tables seeded successfully with full data!');
  } catch (error: any) {
    console.error('[PostgreSQL Seed] ❌ Seeding error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedPostgres();
}
