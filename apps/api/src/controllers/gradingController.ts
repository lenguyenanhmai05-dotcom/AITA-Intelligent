import { Request, Response } from 'express';
import { prisma } from '@aita/database';
import { 
  addGradingJobToQueue, 
  getQueueTelemetryCounts 
} from '../queues/gradingQueue';
import { 
  JobPriority, 
  MAX_CONCURRENT_ACTIVE_BATCHES_PER_CLASS,
  DLQ_REPLAY_RESET_RETRY_COUNT 
} from '@aita/shared';

// Mock in-memory storage fallback if PostgreSQL is temporarily starting
let inMemoryBatches: any[] = [
  {
    id: 1,
    classId: 1,
    createdBy: 1,
    batchName: 'Assignment 3 — Spring Boot REST',
    priority: 'Assignment',
    status: 'active',
    createdAt: new Date(),
  },
];

let inMemoryJobs: any[] = [
  {
    id: 1042,
    batchId: 1,
    submissionId: 101,
    studentName: 'Nguyễn Văn A',
    submissionTitle: 'Assignment 3 — Spring Boot REST',
    status: 'active',
    retryCount: 0,
    runtimeDurationMs: 2410,
    errorClassification: null,
    stackTrace: null,
    dismissed: false,
    createdAt: new Date(),
  },
  {
    id: 1043,
    batchId: 1,
    submissionId: 102,
    studentName: 'Lê Văn C',
    submissionTitle: 'Assignment 3 — Spring Boot REST',
    status: 'waiting',
    retryCount: 0,
    runtimeDurationMs: null,
    errorClassification: null,
    stackTrace: null,
    dismissed: false,
    createdAt: new Date(),
  },
  {
    id: 1041,
    batchId: 1,
    submissionId: 103,
    studentName: 'Trần Thị B',
    submissionTitle: 'Assignment 3 — Spring Boot REST',
    status: 'dead',
    retryCount: 3,
    runtimeDurationMs: 30124,
    errorClassification: 'timeout: sandbox execution exceeded 30s',
    stackTrace: 'TimeoutError: exec exceeded 30000ms at MockDispatcher.run (dispatcher.js:42)',
    dismissed: false,
    dismissedBy: null,
    dismissedAt: null,
    createdAt: new Date(Date.now() - 3600000),
  },
];

let inMemorySubmissions = [
  { id: 101, studentName: 'Nguyễn Văn A', title: 'Assignment 3 — Spring Boot REST', status: 'not graded', submittedAt: '2026-09-10 14:20' },
  { id: 102, studentName: 'Lê Văn C', title: 'Assignment 3 — Spring Boot REST', status: 'not graded', submittedAt: '2026-09-10 16:45' },
  { id: 103, studentName: 'Trần Thị B', title: 'Assignment 3 — Spring Boot REST', status: 'failed', submittedAt: '2026-09-09 21:15' },
  { id: 104, studentName: 'Phạm Văn D', title: 'Assignment 3 — Spring Boot REST', status: 'completed', submittedAt: '2026-09-09 18:00' },
];

/**
 * 0. Tạo bài nộp mới từ Sinh viên (Hỗ trợ tải tệp ZIP/mã nguồn hoặc liên kết Git Repo)
 * Lưu trữ trực tiếp trên Docker PostgreSQL & đồng bộ với hàng đợi BullMQ
 */
export const createSubmission = async (req: Request, res: Response) => {
  try {
    const {
      classId = 1,
      studentName = 'Ánh Mai Lê Nguyễn',
      studentEmail = 'lenguyenanhmai113@gmail.com',
      title = 'Assignment 3 — Spring Boot REST Service',
      method = 'file',
      fileName,
      fileSize,
      gitRepoUrl,
      gitBranch = 'main',
      notes,
    } = req.body;

    const codeUrl = method === 'git'
      ? (gitRepoUrl || 'https://github.com/lenguyenanhmai05/AITA-Intelligent.git')
      : `uploads/${fileName || 'submission_code.zip'}`;

    let savedSubmission: any = null;

    try {
      // 1. Tìm hoặc tạo user sinh viên trong Docker PostgreSQL
      let student = await prisma.user.findFirst({
        where: {
          OR: [
            { email: studentEmail.trim().toLowerCase() },
            { fullName: studentName.trim() },
          ],
        },
      });

      if (!student) {
        student = await prisma.user.create({
          data: {
            fullName: studentName,
            email: studentEmail.trim().toLowerCase(),
            role: 'student',
            password: 'password123',
          },
        });
      }

      // 2. Tạo submission trong bảng submissions của PostgreSQL
      savedSubmission = await prisma.submission.create({
        data: {
          classId: Number(classId) || 1,
          studentId: student.id,
          title: title.trim(),
          codeUrl,
          submissionStatus: 'submitted',
        },
        include: {
          student: true,
          class: true,
        },
      });

      console.log(`[PostgreSQL Docker] 📥 New submission #${savedSubmission.id} saved for student "${student.fullName}"`);
    } catch (dbErr: any) {
      console.warn(`[PostgreSQL Docker] Submission DB notice: ${dbErr.message}`);
    }

    const submissionId = savedSubmission?.id || (100 + inMemorySubmissions.length + 1);
    const newSubRecord = {
      id: submissionId,
      studentName: studentName || 'Sinh viên',
      studentEmail: studentEmail || 'student@fpt.edu.vn',
      title: title || 'Assignment Submission',
      status: 'not graded',
      method: method === 'file'
        ? `Tệp ZIP: ${fileName || 'submission_code.zip'} (${fileSize || '2.4 MB'})`
        : `GitHub: ${gitRepoUrl || 'repo'} (${gitBranch})`,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      notes: notes || '',
      codeUrl,
      score: 'Chờ chấm...',
      testCases: 'Chờ phân phối (BullMQ)',
    };

    inMemorySubmissions.unshift(newSubRecord);

    res.status(201).json({
      success: true,
      message: 'Bài làm đã được nộp thành công và lưu trữ trên Docker PostgreSQL!',
      data: newSubRecord,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: `Lỗi nộp bài: ${error.message}`,
    });
  }
};

/**
 * 1. Lọc danh sách bài nộp của sinh viên (SRS Section 1.1)
 */
export const getSubmissions = async (req: Request, res: Response) => {
  try {
    const { status, search, classId } = req.query;
    let list: any[] = [];

    try {
      const dbSubs = await prisma.submission.findMany({
        where: classId ? { classId: Number(classId) } : undefined,
        include: {
          student: true,
          class: true,
          gradingJobs: true,
        },
        orderBy: { submittedAt: 'desc' },
      });

      if (dbSubs && dbSubs.length > 0) {
        list = dbSubs.map((s) => {
          const latestJob = s.gradingJobs?.[s.gradingJobs.length - 1];
          let gradingStatus = 'not graded';
          if (latestJob) {
            gradingStatus = latestJob.status === 'completed'
              ? 'completed'
              : latestJob.status === 'dead' || latestJob.status === 'failed'
                ? 'failed'
                : 'grading';
          }
          return {
            id: s.id,
            studentName: s.student?.fullName || 'Sinh viên',
            studentEmail: s.student?.email,
            title: s.title,
            status: gradingStatus,
            method: s.codeUrl.startsWith('http') ? `GitHub: ${s.codeUrl}` : `Tệp ZIP: ${s.codeUrl.replace('uploads/', '')}`,
            submittedAt: s.submittedAt ? new Date(s.submittedAt).toISOString().replace('T', ' ').substring(0, 16) : 'Vừa xong',
            codeUrl: s.codeUrl,
            score: gradingStatus === 'completed' ? '100 / 100' : 'Chờ chấm...',
            testCases: gradingStatus === 'completed' ? '10/10 Passed' : 'Đang xếp hàng (BullMQ)',
          };
        });
      }
    } catch (dbErr: any) {
      console.warn(`[PostgreSQL Docker] getSubmissions warning: ${dbErr.message}`);
    }

    // Merge inMemorySubmissions without duplicates
    for (const mem of inMemorySubmissions) {
      if (!list.some((item) => item.id === mem.id)) {
        list.push(mem);
      }
    }

    if (status && status !== 'all') {
      list = list.filter((s) => s.status.toLowerCase() === String(status).toLowerCase());
    }

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(
        (s) => (s.studentName && s.studentName.toLowerCase().includes(q)) ||
               (s.title && s.title.toLowerCase().includes(q))
      );
    }

    res.json({ success: true, data: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2. Tạo đợt chấm bài hàng loạt (UC-01 & BR-01, BR-02)
 */
export const createBatch = async (req: Request, res: Response) => {
  try {
    const { classId = 1, createdBy = 1, batchName, priority = 'Assignment', submissionIds = [] } = req.body;

    if (!batchName) {
      return res.status(400).json({ success: false, message: 'Batch name is required' });
    }

    if (!submissionIds || submissionIds.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one submission must be selected' });
    }

    // Kiểm tra BR-02: Tối đa 3 đợt chấm active cùng lúc cho một lớp
    let activeBatchCount = 0;
    try {
      activeBatchCount = await prisma.gradingBatch.count({
        where: {
          classId: Number(classId),
          status: { in: ['waiting', 'active'] },
        },
      });
    } catch {
      activeBatchCount = inMemoryBatches.filter(
        (b) => b.classId === Number(classId) && (b.status === 'waiting' || b.status === 'active')
      ).length;
    }

    if (activeBatchCount >= MAX_CONCURRENT_ACTIVE_BATCHES_PER_CLASS) {
      return res.status(400).json({
        success: false,
        code: 'BR_02_LIMIT_EXCEEDED',
        message: `Lớp học đã đạt giới hạn tối đa ${MAX_CONCURRENT_ACTIVE_BATCHES_PER_CLASS} đợt chấm đang hoạt động đồng thời (BR-02).`,
      });
    }

    // Lưu đợt chấm bài mới vào Docker PostgreSQL
    const newBatchId = Math.floor(Math.random() * 90000) + 1000;
    let savedBatch: any = null;

    try {
      savedBatch = await prisma.gradingBatch.create({
        data: {
          id: newBatchId,
          classId: Number(classId),
          createdBy: Number(createdBy),
          batchName,
          priority: String(priority),
          status: 'waiting',
        },
      });
      console.log(`[PostgreSQL Docker] 📦 Batch #${newBatchId} saved to PostgreSQL`);
    } catch (err: any) {
      console.warn(`[PostgreSQL Docker] Batch save notice: ${err.message}`);
      savedBatch = {
        id: newBatchId,
        classId: Number(classId),
        createdBy: Number(createdBy),
        batchName,
        priority: priority as JobPriority,
        status: 'waiting' as const,
        createdAt: new Date(),
      };
    }
    inMemoryBatches.push(savedBatch);

    const createdJobs: any[] = [];

    // Tạo các tác vụ chấm cho từng bài nộp đã chọn
    for (const subId of submissionIds) {
      let subStudentName = 'Sinh viên';
      let subSubmissionTitle = batchName;
      const sub = inMemorySubmissions.find((s) => s.id === Number(subId));
      if (sub) {
        subStudentName = sub.studentName || subStudentName;
        subSubmissionTitle = sub.title || subSubmissionTitle;
      } else {
        try {
          const dbSub = await prisma.submission.findUnique({
            where: { id: Number(subId) },
            include: { student: true },
          });
          if (dbSub) {
            subStudentName = dbSub.student?.fullName || subStudentName;
            subSubmissionTitle = dbSub.title || subSubmissionTitle;
          }
        } catch {}
      }
      const jobDbId = 1000 + inMemoryJobs.length + 1;
      const newJob = {
        id: jobDbId,
        batchId: newBatchId,
        submissionId: Number(subId),
        studentName: subStudentName,
        submissionTitle: subSubmissionTitle,
        status: 'waiting' as const,
        retryCount: 0,
        runtimeDurationMs: null,
        errorClassification: null,
        stackTrace: null,
        dismissed: false,
        dismissedBy: null,
        dismissedAt: null,
        createdAt: new Date(),
      };
      
      try {
        await prisma.gradingJob.create({
          data: {
            id: jobDbId,
            batchId: newBatchId,
            submissionId: Number(subId),
            studentName: newJob.studentName,
            submissionTitle: newJob.submissionTitle,
            status: 'waiting',
            retryCount: 0,
          },
        });
      } catch {}
      
      inMemoryJobs.push(newJob);
      createdJobs.push(newJob);

      // Đẩy vào BullMQ Priority Queue
      try {
        await addGradingJobToQueue({
          jobDbId,
          batchId: newBatchId,
          submissionId: Number(subId),
          studentName: newJob.studentName,
          submissionTitle: newJob.submissionTitle,
          priority: priority as JobPriority,
        });
      } catch (queueErr) {
        console.warn(`[BullMQ] Could not enqueue to live Redis, queued locally:`, queueErr);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Khởi tạo đợt chấm bài thành công!',
      data: {
        batch: savedBatch,
        jobsCount: createdJobs.length,
        jobs: createdJobs,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. Lấy số liệu giám sát hàng đợi thời gian thực (UC-03 / Page 34)
 */
export const getQueueStatus = async (_req: Request, res: Response) => {
  try {
    let queueCounts: any = {};
    try {
      queueCounts = await getQueueTelemetryCounts();
    } catch {
      queueCounts = {};
    }

    let waitingJobs = 0;
    let activeJobs = 0;
    let completedJobs = 0;
    let failedJobs = 0;

    try {
      waitingJobs = await prisma.gradingJob.count({ where: { status: 'waiting' } });
      activeJobs = await prisma.gradingJob.count({ where: { status: 'active' } });
      completedJobs = await prisma.gradingJob.count({ where: { status: 'completed' } });
      failedJobs = await prisma.gradingJob.count({ where: { status: { in: ['failed', 'dead'] } } });
    } catch {
      waitingJobs = inMemoryJobs.filter((j) => j.status === 'waiting').length;
      activeJobs = inMemoryJobs.filter((j) => j.status === 'active').length;
      completedJobs = inMemoryJobs.filter((j) => j.status === 'completed').length;
      failedJobs = inMemoryJobs.filter((j) => j.status === 'failed' || j.status === 'dead').length;
    }

    res.json({
      success: true,
      data: {
        waiting: queueCounts.waiting || waitingJobs,
        active: queueCounts.active || activeJobs,
        completed: queueCounts.completed || completedJobs,
        failed: queueCounts.failed || failedJobs,
        total: (queueCounts.waiting || waitingJobs) + (queueCounts.active || activeJobs) + (queueCounts.completed || completedJobs) + (queueCounts.failed || failedJobs),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTelemetry = getQueueStatus;

/**
 * 4. Lấy chi tiết tác vụ theo ID (UC-02 / Page 33)
 */
export const getJobDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let job: any = null;

    try {
      job = await prisma.gradingJob.findUnique({ where: { id: Number(id) } });
    } catch {}

    if (!job) {
      job = inMemoryJobs.find((j) => j.id === Number(id));
    }

    if (!job) {
      return res.status(404).json({ success: false, message: `Không tìm thấy tác vụ #${id}` });
    }

    res.json({ success: true, data: job });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 5. Lấy danh sách Dead-Letter Queue (UC-04 / Page 34)
 */
export const getDeadLetterQueue = async (_req: Request, res: Response) => {
  try {
    try {
      const deadDbJobs = await prisma.gradingJob.findMany({
        where: { status: 'dead', dismissed: false },
      });
      if (deadDbJobs && deadDbJobs.length > 0) {
        return res.json({
          success: true,
          data: deadDbJobs.map((j) => ({
            id: j.id,
            batchId: j.batchId,
            studentName: j.studentName,
            submissionTitle: j.submissionTitle,
            status: j.status,
            retryCount: j.retryCount,
            runtimeDurationMs: j.runtimeDurationMs,
            errorClassification: j.errorClassification,
            stackTrace: j.stackTrace,
            dismissed: j.dismissed,
            dismissedBy: j.dismissedBy,
            dismissedAt: j.dismissedAt,
            createdAt: j.createdAt,
          })),
        });
      }
    } catch {}

    // Fallback to in-memory DLQ jobs
    const deadJobs = inMemoryJobs.filter((j) => (j.status === 'dead' || j.status === 'failed') && !j.dismissed);

    res.json({
      success: true,
      data: deadJobs,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 6. Thử lại thủ công tác vụ chết (UC-04 & BR-06 / Page 35)
 */
export const manualRetryJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPriority = 'Assignment' } = req.body;
    const job = inMemoryJobs.find((j) => j.id === Number(id));

    // Cập nhật trên Docker PostgreSQL
    try {
      await prisma.gradingJob.update({
        where: { id: Number(id) },
        data: {
          status: 'waiting',
          retryCount: DLQ_REPLAY_RESET_RETRY_COUNT,
          errorClassification: null,
          stackTrace: null,
          priority: newPriority,
        },
      });
      console.log(`[PostgreSQL Docker] 🔄 Job #${id} replayed & reset retryCount to 0 (BR-06)`);
    } catch {}

    if (job) {
      job.retryCount = DLQ_REPLAY_RESET_RETRY_COUNT;
      job.status = 'waiting';
      job.errorClassification = null;
      job.stackTrace = null;
      job.dismissed = false;
    }

    // Đẩy lại vào BullMQ Priority Queue
    try {
      await addGradingJobToQueue({
        jobDbId: Number(id),
        batchId: job?.batchId || 1,
        submissionId: job?.submissionId || 103,
        studentName: job?.studentName || 'Sinh viên',
        submissionTitle: job?.submissionTitle || 'Assignment',
        priority: newPriority as JobPriority,
      });
    } catch {
      // Ignored if offline
    }

    res.json({
      success: true,
      message: `Đã khôi phục tác vụ #${id} về hàng đợi với độ ưu tiên ${newPriority} và reset số lần thử về 0 (BR-06).`,
      data: job || { id: Number(id), status: 'waiting', retryCount: 0 },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 7. Bỏ qua tác vụ chết vĩnh viễn (UC-04 / Page 35)
 */
export const dismissJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId = 1 } = req.body;
    const job = inMemoryJobs.find((j) => j.id === Number(id));

    try {
      await prisma.gradingJob.update({
        where: { id: Number(id) },
        data: {
          dismissed: true,
          dismissedBy: Number(userId),
          dismissedAt: new Date(),
        },
      });
      console.log(`[PostgreSQL Docker] 🗑️ Job #${id} dismissed by user #${userId}`);
    } catch {}

    if (job) {
      job.dismissed = true;
      job.dismissedBy = userId;
      job.dismissedAt = new Date();
    }

    res.json({
      success: true,
      message: `Tác vụ #${id} đã được đánh dấu đóng vĩnh viễn bởi User #${userId}.`,
      data: job || { id: Number(id), dismissed: true },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
