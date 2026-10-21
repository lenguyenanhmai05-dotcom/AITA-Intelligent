import { Router, Request, Response } from 'express';
import multer from 'multer';
import { prisma } from '@aita/database';
import fs from 'fs';
import path from 'path';
import { generateAssignmentFromLecture } from '../services/aiAssignment.service';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max for slides/documents
});

const DATA_DIR = path.resolve(__dirname, '../../data');
const ASSIGNMENTS_FILE = path.join(DATA_DIR, 'assignments.json');

const getStoredAssignments = (): any[] => {
  try {
    if (fs.existsSync(ASSIGNMENTS_FILE)) {
      return JSON.parse(fs.readFileSync(ASSIGNMENTS_FILE, 'utf-8'));
    }
  } catch {}
  return [];
};

const saveStoredAssignments = (list: any[]) => {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(ASSIGNMENTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch {}
};

/**
 * POST /api/ai/generate-assignment
 * AI-powered generator from uploaded slide file or curriculum text
 */
router.post('/ai/generate-assignment', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const {
      topicOrText,
      targetClass,
      programmingLang,
      difficulty,
      taskType,
      customInstructions,
    } = req.body;

    const file = req.file;

    const generated = await generateAssignmentFromLecture({
      topicOrText: topicOrText || '',
      fileBuffer: file ? file.buffer : undefined,
      fileName: file ? file.originalname : undefined,
      mimeType: file ? file.mimetype : undefined,
      targetClass,
      programmingLang,
      difficulty,
      taskType,
      customInstructions,
    });

    res.json({
      success: true,
      data: generated,
      sourceFileName: file ? file.originalname : null,
    });
  } catch (error: any) {
    console.error('[Assignment Routes] Error generating assignment with AI:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo đề bài bằng AI: ' + (error?.message || 'Lỗi không xác định'),
    });
  }
});

/**
 * POST /api/assignments
 * Lecturer creates and publishes a real assignment to database
 */
router.post('/assignments', async (req: Request, res: Response) => {
  try {
    const {
      classCode,
      classId,
      title,
      type = 'Assignment',
      description,
      rubric,
      testCases,
      difficulty = 'Medium',
      programmingLang = 'Java',
      deadline,
      allowedFormat = 'both',
      sourceFileName,
      lecturerEmail,
    } = req.body;

    if (!title || (!classCode && !classId)) {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề đề bài và thông tin lớp học là bắt buộc.',
      });
    }

    // 1. Resolve Class
    let targetClass: any = null;
    try {
      if (classId) {
        targetClass = await prisma.class.findUnique({ where: { id: Number(classId) } });
      } else if (classCode) {
        targetClass = await prisma.class.findFirst({
          where: {
            className: { equals: String(classCode).trim(), mode: 'insensitive' }
          }
        });
      }

      // Fallback: If class does not exist in DB yet, auto-find or link to first class or create it
      if (!targetClass && classCode) {
        let lecturer = null;
        if (lecturerEmail) {
          lecturer = await prisma.user.findUnique({ where: { email: lecturerEmail } });
        }
        if (!lecturer) {
          lecturer = await prisma.user.findFirst({ where: { role: 'lecturer' } }) ||
                     await prisma.user.findFirst();
        }

        if (lecturer) {
          targetClass = await prisma.class.create({
            data: {
              className: classCode.trim().toUpperCase(),
              lecturerId: lecturer.id,
            },
          });
        }
      }
    } catch {}

    const targetClassName = targetClass?.className || (classCode ? String(classCode).trim().toUpperCase() : 'SWP391-SE1801');

    let assignment: any = null;
    try {
      let creator = null;
      if (lecturerEmail) {
        creator = await prisma.user.findUnique({ where: { email: lecturerEmail } });
      }
      if (!creator && targetClass?.lecturerId) {
        creator = await prisma.user.findUnique({ where: { id: targetClass.lecturerId } });
      }
      if (!creator) {
        creator = await prisma.user.findFirst();
      }

      if (targetClass && creator) {
        assignment = await prisma.assignment.create({
          data: {
            classId: targetClass.id,
            title,
            type,
            description: description || '',
            rubric: rubric || null,
            testCases: testCases || null,
            difficulty,
            programmingLang,
            deadline: deadline ? new Date(deadline) : null,
            allowedFormat,
            sourceFileName: sourceFileName || null,
            createdById: creator.id,
          },
          include: {
            class: true,
            creator: { select: { id: true, fullName: true, email: true } },
          }
        });
      }
    } catch (dbErr: any) {
      console.warn('[Assignment Routes] DB insert warning, falling back to disk:', dbErr.message);
    }

    // Persist to disk fallback
    const stored = getStoredAssignments();
    const newEntry = {
      id: assignment?.id || (stored.length > 0 ? Math.max(...stored.map(s => Number(s.id) || 0)) + 1 : 1),
      classCode: targetClassName,
      title: title.trim(),
      type,
      description: description || '',
      rubric: rubric || null,
      testCases: testCases || null,
      difficulty,
      programmingLang,
      deadline,
      allowedFormat,
      sourceFileName: sourceFileName || null,
      createdAt: new Date().toISOString(),
      class: { className: targetClassName },
      creator: { fullName: 'Lê Nguyễn Anh Mai', email: lecturerEmail || 'lenguyenanhmai113@gmail.com' }
    };

    const updatedStored = [newEntry, ...stored.filter(s => s.id !== newEntry.id)];
    saveStoredAssignments(updatedStored);

    console.log(`[Assignment Routes] ✓ Created assignment #${newEntry.id}: "${newEntry.title}" strictly for class ${targetClassName}`);

    return res.status(201).json({
      success: true,
      message: 'Giao đề bài thành công!',
      data: assignment || newEntry,
    });
  } catch (error: any) {
    console.error('[Assignment Routes] Error publishing assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lưu đề bài: ' + (error?.message || 'Internal error'),
    });
  }
});

/**
 * GET /api/assignments
 * Get all assignments with class and submission stats
 */
router.get('/assignments', async (req: Request, res: Response) => {
  try {
    const { classCode, classId } = req.query;

    const whereClause: any = {};
    if (classId) {
      whereClause.classId = Number(classId);
    } else if (classCode) {
      const cls = await prisma.class.findFirst({ where: { className: { equals: String(classCode).trim(), mode: 'insensitive' } } });
      if (cls) {
        whereClause.classId = cls.id;
      }
    }

    const assignments = await prisma.assignment.findMany({
      where: whereClause,
      include: {
        class: true,
        creator: {
          select: { id: true, fullName: true, email: true },
        },
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error: any) {
    console.warn('[Assignment Routes] DB listing warning, using disk fallback:', error?.message);
    const stored = getStoredAssignments();
    const filtered = req.query.classCode
      ? stored.filter(a => (a.classCode || '').trim().toUpperCase() === String(req.query.classCode).trim().toUpperCase())
      : stored;
    res.json({ success: true, data: filtered });
  }
});

/**
 * GET /api/assignments/:id
 * Get single assignment details
 */
router.get('/assignments/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        class: true,
        creator: { select: { id: true, fullName: true, email: true } },
        submissions: {
          include: { student: { select: { id: true, fullName: true, email: true } } },
        },
      },
    });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đề bài' });
    }

    res.json({ success: true, data: assignment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

/**
 * POST /api/assignments/:id/extend
 * Lecturer extends assignment deadline
 */
router.post('/assignments/:id/extend', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const { newDeadline, reason } = req.body;

    if (!newDeadline) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp thời hạn nộp bài mới (newDeadline).' });
    }

    // 1. Update in PostgreSQL if possible
    let updatedDb: any = null;
    const numId = Number(rawId);
    if (!isNaN(numId)) {
      try {
        updatedDb = await prisma.assignment.update({
          where: { id: numId },
          data: {
            deadline: new Date(newDeadline),
          },
        });
      } catch (e: any) {
        console.warn('[Assignment Routes] DB extend warning:', e?.message);
      }
    }

    // 2. Update in disk storage
    const stored = getStoredAssignments();
    const idx = stored.findIndex((s) => String(s.id) === String(rawId));
    if (idx !== -1) {
      stored[idx].deadline = newDeadline;
      stored[idx].extendedDeadline = newDeadline;
      stored[idx].extensionReason = reason || 'Giảng viên đã gia hạn thời gian nộp bài';
      stored[idx].isExtended = true;
      saveStoredAssignments(stored);
    }

    console.log(`[Assignment Routes] ⏰ Extended deadline for assignment #${rawId} to ${newDeadline} (Reason: ${reason || 'N/A'})`);

    res.json({
      success: true,
      message: `Gia hạn thời gian nộp bài thành công đến ${newDeadline}!`,
      data: {
        id: rawId,
        deadline: newDeadline,
        reason,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

export default router;
