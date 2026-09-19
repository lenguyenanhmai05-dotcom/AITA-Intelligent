import { Request, Response } from 'express';
import { prisma, GradingBatchModel, GradingJobModel, connectMongoDB } from '@aita/database';
import { 
  addGradingJobToQueue, 
  getQueueTelemetryCounts 
} from '../queues/gradingQueue';
import { 
  JobPriority, 
  MAX_CONCURRENT_ACTIVE_BATCHES_PER_CLASS,
  DLQ_REPLAY_RESET_RETRY_COUNT 
} from '@aita/shared';

// Mock in-memory storage fallback if PostgreSQL is not currently running locally
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
 * 1. Lọc danh sách bài nộp của sinh viên (SRS Section 1.1)
 */
export const getSubmissions = async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;
    let list = [...inMemorySubmissions];

    if (status && status !== 'all') {
      list = list.filter((s) => s.status.toLowerCase() === String(status).toLowerCase());
    }

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(
        (s) => s.studentName.toLowerCase().includes(q) || s.title.toLowerCase().includes(q)
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
      await connectMongoDB();
      activeBatchCount = await GradingBatchModel.countDocuments({
        classId: Number(classId),
        status: { $in: ['waiting', 'active'] },
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

    // Lưu đợt chấm bài mới vào MongoDB Atlas
    const newBatchId = Math.floor(Math.random() * 90000) + 1000;
    const newBatch = {
      id: newBatchId,
      batchId: newBatchId,
      classId: Number(classId),
      createdBy: String(createdBy),
      batchName,
      priority: priority as JobPriority,
      status: 'waiting' as const,
      jobsCount: submissionIds.length,
      createdAt: new Date(),
    };

    try {
      await GradingBatchModel.create(newBatch);
      console.log(`[MongoDB Atlas] 📦 Batch #${newBatchId} saved to MongoDB Atlas`);
    } catch (err: any) {
      console.warn(`[MongoDB Atlas] Batch save notice: ${err.message}`);
    }
    inMemoryBatches.push(newBatch);

    const createdJobs: any[] = [];

    // Tạo các tác vụ chấm cho từng bài nộp đã chọn
    for (const subId of submissionIds) {
      const sub = inMemorySubmissions.find((s) => s.id === Number(subId));
      const jobDbId = 1000 + inMemoryJobs.length + 1;
      const newJob = {
        id: jobDbId,
        jobId: jobDbId,
        batchId: newBatchId,
        submissionId: Number(subId),
        studentName: sub?.studentName || 'Sinh viên',
        submissionTitle: sub?.title || batchName,
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
        await GradingJobModel.create(newJob);
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
        batch: newBatch,
        jobsCount: createdJobs.length,
        jobs: createdJobs,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. Lấy dữ liệu Telemetry cập nhật mỗi 2s (UC-02 & BR-03)
 */
export const getTelemetry = async (_req: Request, res: Response) => {
  try {
    const queueCounts = await getQueueTelemetryCounts();

    let waitingJobs = 0;
    let activeJobs = 0;
    let completedJobs = 0;
    let failedJobs = 0;

    try {
      await connectMongoDB();
      waitingJobs = await GradingJobModel.countDocuments({ status: 'waiting' });
      activeJobs = await GradingJobModel.countDocuments({ status: 'active' });
      completedJobs = await GradingJobModel.countDocuments({ status: 'completed' });
      failedJobs = await GradingJobModel.countDocuments({ status: { $in: ['failed', 'dead'] } });
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

/**
 * 4. Lấy chi tiết tác vụ theo ID (UC-02 / Page 33)
 */
export const getJobDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let job: any = null;

    try {
      await connectMongoDB();
      job = await GradingJobModel.findOne({ jobId: Number(id) });
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
      await connectMongoDB();
      const deadDbJobs = await GradingJobModel.find({ status: 'dead', dismissed: false });
      if (deadDbJobs && deadDbJobs.length > 0) {
        return res.json({
          success: true,
          data: deadDbJobs.map((j) => ({
            id: j.jobId,
            batchId: j.batchId,
            studentName: j.studentName,
            submissionTitle: j.submissionTitle,
            status: j.status,
            retryCount: j.retryCount,
            runtimeDurationMs: j.runtimeDurationMs,
            errorClassification: j.errorClassification,
            stackTrace: j.stackTrace,
            batchName: 'Assignment 3 — Spring Boot REST',
            batchPriority: 'Assignment',
          })),
        });
      }
    } catch {}

    const deadJobs = inMemoryJobs.filter((j) => j.status === 'dead' && !j.dismissed);
    res.json({
      success: true,
      data: deadJobs.map((j) => {
        const batch = inMemoryBatches.find((b) => b.id === j.batchId);
        return {
          ...j,
          batchName: batch?.batchName || 'Batch #' + j.batchId,
          batchPriority: batch?.priority || 'Assignment',
        };
      }),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 6. Chạy lại thủ công từ DLQ (UC-04 & BR-06 / Page 36)
 */
export const manualRetryJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPriority = 'Assignment' } = req.body;
    const job = inMemoryJobs.find((j) => j.id === Number(id));

    // Cập nhật trên MongoDB Atlas
    try {
      await connectMongoDB();
      await GradingJobModel.findOneAndUpdate(
        { jobId: Number(id) },
        { status: 'waiting', retryCount: DLQ_REPLAY_RESET_RETRY_COUNT, errorClassification: null, stackTrace: null }
      );
      console.log(`[MongoDB Atlas] 🔄 Job #${id} replayed & reset retryCount to 0 (BR-06) on Atlas`);
    } catch {}

    if (job) {
      // BR-06: Đặt lại retry_count về 0 và chuyển status thành 'waiting'
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
    const { userId = 'admin@aita.fpt.edu.vn' } = req.body;
    const job = inMemoryJobs.find((j) => j.id === Number(id));

    try {
      await connectMongoDB();
      await GradingJobModel.findOneAndUpdate(
        { jobId: Number(id) },
        { dismissed: true, dismissedBy: String(userId), dismissedAt: new Date() }
      );
      console.log(`[MongoDB Atlas] 🗑️ Job #${id} dismissed on Atlas by ${userId}`);
    } catch {}

    if (job) {
      job.dismissed = true;
      job.dismissedBy = userId;
      job.dismissedAt = new Date();
    }

    res.json({
      success: true,
      message: `Tác vụ #${id} đã được đánh dấu đóng vĩnh viễn bởi ${userId}.`,
      data: job || { id: Number(id), dismissed: true },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
