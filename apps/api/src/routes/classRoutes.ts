import { Router, Request, Response } from 'express';
import { prisma } from '@aita/database';
import fs from 'fs';
import path from 'path';
import { purgeGradingDataByClassCode, resetAllGradingData } from '../controllers/gradingController';

const router = Router();

export interface InMemoryClass {
  id: number;
  className: string;
  courseName?: string;
  department?: string;
  lecturerId?: number;
  lecturer?: { fullName: string; email: string };
  createdAt: string;
}

export const DELETED_CLASSES_FILE = path.resolve(__dirname, '../../data/deleted_classes.json');

export const normalizeClassCodeStr = (raw?: string | null): string => {
  if (!raw) return '';
  const trimmed = String(raw).trim();
  // Strip anything after em dash (—), en dash (–), or hyphen with spaces
  const codePart = trimmed.split(/\s*[—–-]\s*/)[0].trim().toUpperCase();
  if (codePart.includes('SWP391') || codePart.includes('SE1801')) return 'SWP391-SE1801';
  if (codePart.includes('PRN231') || codePart.includes('SE1803')) return 'PRN231-SE1803';
  if (codePart.includes('PRJ301') || codePart.includes('IS1702')) return 'PRJ301-IS1702';
  if (codePart.includes('MMA301') || codePart.includes('MMA')) return 'MMA301';
  if (codePart.includes('SDN302') || codePart.includes('SDN')) return 'SDN302';
  return codePart || trimmed.toUpperCase();
};

export const getDeletedClassCodes = (): Set<string> => {
  try {
    if (fs.existsSync(DELETED_CLASSES_FILE)) {
      const raw = fs.readFileSync(DELETED_CLASSES_FILE, 'utf-8');
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(
          arr.map((c: any) => normalizeClassCodeStr(String(c)))
        );
      }
    }
  } catch { }
  return new Set([]);
};

export const isClassCodeInDeletedSet = (raw?: string | null, deletedSet?: Set<string>): boolean => {
  if (!raw) return false;
  const set = deletedSet || getDeletedClassCodes();
  const upper = String(raw).trim().toUpperCase();
  const norm = normalizeClassCodeStr(raw);

  if (set.has(norm) || set.has(upper)) return true;
  for (const del of set) {
    if (upper === del || norm === del) return true;
  }
  return false;
};

export const addDeletedClassCode = (cCode: string) => {
  try {
    const clean = normalizeClassCodeStr(cCode);
    const set = getDeletedClassCodes();
    set.add(clean);
    const dataDir = path.resolve(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(DELETED_CLASSES_FILE, JSON.stringify(Array.from(set), null, 2), 'utf-8');
  } catch { }
};

export const removeDeletedClassCode = (cCode: string) => {
  try {
    const clean = normalizeClassCodeStr(cCode);
    const set = getDeletedClassCodes();
    if (set.has(clean)) {
      set.delete(clean);
      const dataDir = path.resolve(__dirname, '../../data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(DELETED_CLASSES_FILE, JSON.stringify(Array.from(set), null, 2), 'utf-8');
    }
  } catch { }
};

const defaultClasses: InMemoryClass[] = [
  {
    id: 1,
    className: 'SWP391-SE1801',
    courseName: 'Application Development Project (SWP391)',
    department: 'Kỹ thuật phần mềm (SE)',
    lecturer: { fullName: 'Lê Nguyễn Anh Mai', email: 'lenguyenanhmai113@gmail.com' },
    createdAt: '2026-10-10',
  },
  {
    id: 2,
    className: 'PRN231-SE1803',
    courseName: 'Building Cross-Platform Apps with .NET (PRN231)',
    department: 'Kỹ thuật phần mềm (SE)',
    lecturer: { fullName: 'TS. Nguyễn Văn Giảng', email: 'giangnv@fpt.edu.vn' },
    createdAt: '2026-10-11',
  },
];

let inMemoryClasses: InMemoryClass[] = [...defaultClasses];

/**
 * GET /api/classes
 * Fetch all classes from database (with in-memory resilience)
 */
router.get('/classes', async (_req: Request, res: Response) => {
  const deletedSet = getDeletedClassCodes();
  let rawClasses: any[] = [];

  // 1. Fetch DB Classes
  try {
    const dbClasses = await prisma.class.findMany({
      include: {
        lecturer: { select: { id: true, fullName: true, email: true } },
        teams: true,
        assignments: { select: { id: true, title: true, type: true, deadline: true } },
        _count: { select: { submissions: true, teams: true, assignments: true } },
      },
      orderBy: { id: 'asc' },
    });
    rawClasses.push(...dbClasses);
  } catch (error: any) {
    console.warn('[Class Routes] Database unavailable, using in-memory classes:', error?.message);
  }

  // 2. Merge in-memory classes
  rawClasses.push(...inMemoryClasses);

  // 3. Sync from assignments.json if any
  try {
    const assignmentsPath = path.resolve(__dirname, '../../data/assignments.json');
    if (fs.existsSync(assignmentsPath)) {
      const raw = fs.readFileSync(assignmentsPath, 'utf-8');
      const storedAsms = JSON.parse(raw);
      if (Array.isArray(storedAsms)) {
        storedAsms.forEach((asm: any) => {
          const cName = (asm.classCode || asm.class?.className || '').trim();
          if (cName) {
            rawClasses.push({
              id: asm.id || 999,
              className: cName,
              courseName: asm.title || `Lớp học ${cName}`,
              department: 'Kỹ thuật phần mềm (SE)',
              lecturer: asm.creator || { fullName: 'TS. Nguyễn Văn Giảng', email: 'giangnv@fpt.edu.vn' },
              createdAt: asm.createdAt || new Date().toISOString(),
            });
          }
        });
      }
    }
  } catch { }

  // 4. Strict deduplication & deletion filtering
  const dedupMap = new Map<string, any>();
  for (const c of rawClasses) {
    const rawName = String(c.className || c.code || '').trim();
    if (!rawName) continue;
    const cleanCode = normalizeClassCodeStr(rawName);
    if (!cleanCode) continue;

    // Filter against deleted set
    if (isClassCodeInDeletedSet(rawName, deletedSet) || isClassCodeInDeletedSet(cleanCode, deletedSet)) {
      continue;
    }

    if (!dedupMap.has(cleanCode)) {
      let friendlyName = c.courseName || c.name || '';
      if (!friendlyName || friendlyName.toUpperCase() === cleanCode) {
        if (cleanCode.includes('SWP391')) friendlyName = 'Đồ án Phát triển Phần mềm';
        else if (cleanCode.includes('PRN231')) friendlyName = 'Lập trình .NET & C# Nâng cao';
        else friendlyName = `Lớp học ${cleanCode}`;
      } else {
        friendlyName = friendlyName.replace(new RegExp(`^${cleanCode}\\s*[—–-]\\s*`, 'i'), '').trim();
      }

      dedupMap.set(cleanCode, {
        id: c.id,
        className: cleanCode,
        code: cleanCode,
        courseName: friendlyName,
        name: friendlyName,
        department: c.department || 'Kỹ thuật phần mềm (SE)',
        lecturer: c.lecturer || { fullName: 'TS. Nguyễn Văn Giảng', email: 'giangnv@fpt.edu.vn' },
        createdAt: c.createdAt || new Date().toISOString(),
        teams: Array.isArray(c.teams) ? c.teams : [],
        assignments: Array.isArray(c.assignments) ? c.assignments : [],
        _count: c._count,
      });
    }
  }

  return res.json({
    success: true,
    data: Array.from(dedupMap.values()),
  });
});

/**
 * POST /api/classes
 * Create a new class in the database
 */
router.post('/classes', async (req: Request, res: Response) => {
  try {
    const { classCode, className, department, lecturerEmail, lecturerName } = req.body;

    if (!classCode || !classCode.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Mã lớp học (Class Code) không được để trống.',
      });
    }

    const cleanCode = normalizeClassCodeStr(classCode);
    removeDeletedClassCode(cleanCode);
    const courseTitle = className?.trim() || cleanCode;
    const dept = department?.trim() || 'Kỹ thuật phần mềm (SE)';

    let createdRecord: any = null;

    // Try PostgreSQL Database first
    try {
      // 1. Resolve or create lecturer user
      let lecturer = null;
      if (lecturerEmail) {
        lecturer = await prisma.user.findUnique({ where: { email: lecturerEmail.trim().toLowerCase() } });
      }
      if (!lecturer) {
        lecturer = await prisma.user.findFirst({ where: { role: 'lecturer' } });
      }
      if (!lecturer) {
        lecturer = await prisma.user.create({
          data: {
            fullName: lecturerName?.trim() || 'Giảng viên AITA',
            email: lecturerEmail?.trim().toLowerCase() || `lecturer_${Date.now()}@fpt.edu.vn`,
            role: 'lecturer',
          },
        });
      }

      // 2. Upsert or create Class
      const existingClass = await prisma.class.findFirst({
        where: { className: cleanCode },
      });

      if (existingClass) {
        createdRecord = existingClass;
      } else {
        createdRecord = await prisma.class.create({
          data: {
            className: cleanCode,
            lecturerId: lecturer.id,
          },
          include: {
            lecturer: { select: { id: true, fullName: true, email: true } },
          },
        });

        // 3. Create default team for this class
        await prisma.team.create({
          data: {
            teamName: 'Nhóm 1 (Team 1)',
            classId: createdRecord.id,
          },
        });
      }

      console.log(`[Class Routes] 🏫 Saved class "${cleanCode}" to PostgreSQL database (ID: ${createdRecord.id})`);
    } catch (dbError: any) {
      console.warn(`[Class Routes] DB create warning: ${dbError?.message}. Storing in memory fallback.`);
    }

    // Always update inMemoryClasses for resilience
    const existingMemory = inMemoryClasses.find(c => normalizeClassCodeStr(c.className) === cleanCode);
    if (!existingMemory) {
      const newMemoryClass: InMemoryClass = {
        id: createdRecord?.id || (inMemoryClasses.length + 100),
        className: cleanCode,
        courseName: courseTitle,
        department: dept,
        lecturer: {
          fullName: lecturerName || 'Lê Nguyễn Anh Mai',
          email: lecturerEmail || 'lenguyenanhmai113@gmail.com',
        },
        createdAt: new Date().toISOString().slice(0, 10),
      };
      inMemoryClasses.push(newMemoryClass);
    }

    return res.status(201).json({
      success: true,
      message: `Đã lưu lớp ${cleanCode} thành công vào cơ sở dữ liệu!`,
      data: createdRecord || existingMemory || { className: cleanCode, courseName: courseTitle },
    });
  } catch (error: any) {
    console.error('[Class Routes] Error creating class:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo lớp học: ' + (error?.message || 'Internal server error'),
    });
  }
});

/**
 * DELETE /api/classes/:classCode
 * Remove a class from database and in-memory fallback, with full cascade deletion
 */
router.delete('/classes/:classCode', async (req: Request, res: Response) => {
  try {
    const { classCode } = req.params;
    if (!classCode) {
      return res.status(400).json({ success: false, message: 'Class code is required' });
    }
    const rawDecoded = decodeURIComponent(classCode).trim();
    const cleanCode = normalizeClassCodeStr(rawDecoded);

    // Persist deleted code (both exact input and normalized code)
    addDeletedClassCode(cleanCode);
    if (rawDecoded.toUpperCase() !== cleanCode) {
      addDeletedClassCode(rawDecoded.toUpperCase());
    }

    // 1. Remove from inMemoryClasses
    inMemoryClasses = inMemoryClasses.filter(c => {
      const norm = normalizeClassCodeStr(c.className);
      return norm !== cleanCode && !c.className.toUpperCase().includes(cleanCode);
    });

    // 2. Try DB deletion with comprehensive matching (cascade submissions, assignments, teams, jobs, class)
    try {
      const numId = Number(cleanCode);
      const matchingClasses = await prisma.class.findMany({
        where: {
          OR: [
            { className: { equals: cleanCode, mode: 'insensitive' } },
            { className: { startsWith: cleanCode, mode: 'insensitive' } },
            { className: { contains: cleanCode, mode: 'insensitive' } },
            ...(!isNaN(numId) ? [{ id: numId }] : [])
          ]
        }
      });

      for (const cls of matchingClasses) {
        await prisma.gradingJob.deleteMany({
          where: { submission: { classId: cls.id } }
        }).catch(() => { });
        await prisma.submission.deleteMany({ where: { classId: cls.id } }).catch(() => { });
        await prisma.assignment.deleteMany({ where: { classId: cls.id } }).catch(() => { });
        await prisma.team.deleteMany({ where: { classId: cls.id } }).catch(() => { });
        await prisma.class.delete({ where: { id: cls.id } }).catch(() => { });
      }
    } catch (err: any) {
      console.warn('[Class Routes] DB delete warning:', err?.message);
    }

    // 3. Clean up disk assignments for this class
    try {
      const assignmentsPath = path.resolve(__dirname, '../../data/assignments.json');
      if (fs.existsSync(assignmentsPath)) {
        const raw = fs.readFileSync(assignmentsPath, 'utf-8');
        const storedAsms = JSON.parse(raw);
        if (Array.isArray(storedAsms)) {
          const filtered = storedAsms.filter((a: any) => {
            const asmCode = normalizeClassCodeStr(a.classCode || a.class?.className || '');
            return asmCode !== cleanCode && !String(a.classCode || '').toUpperCase().includes(cleanCode);
          });
          fs.writeFileSync(assignmentsPath, JSON.stringify(filtered, null, 2), 'utf-8');
        }
      }
    } catch { }

    // 4. Cascade purge all submissions & queue jobs for this class
    purgeGradingDataByClassCode(cleanCode);

    return res.json({
      success: true,
      message: `Đã xóa lớp "${cleanCode}" và toàn bộ đề thi, bài nộp, hàng đợi liên quan thành công!`,
    });
  } catch (error: any) {
    console.error('[Class Routes] Error deleting class:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa lớp: ' + (error?.message || 'Internal error'),
    });
  }
});

/**
 * POST /api/classes/reset-all
 * Clear ALL classes, assignments, submissions, queue jobs, and DLQ
 */
router.post('/classes/reset-all', async (_req: Request, res: Response) => {
  try {
    inMemoryClasses = [];
    const deletedCodes = ['SWP391-SE1801', 'PRN231-SE1803', 'PRJ301-IS1702', 'MMA301', 'SDN302'];
    const dataDir = path.resolve(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(DELETED_CLASSES_FILE, JSON.stringify(deletedCodes, null, 2), 'utf-8');

    const assignmentsPath = path.resolve(__dirname, '../../data/assignments.json');
    fs.writeFileSync(assignmentsPath, '[]', 'utf-8');

    resetAllGradingData();

    try {
      await prisma.gradingJob.deleteMany({}).catch(() => { });
      await prisma.submission.deleteMany({}).catch(() => { });
      await prisma.assignment.deleteMany({}).catch(() => { });
      await prisma.team.deleteMany({}).catch(() => { });
      await prisma.class.deleteMany({}).catch(() => { });
    } catch (dbErr: any) {
      console.warn('[Class Routes] DB reset warning:', dbErr?.message);
    }

    return res.json({
      success: true,
      message: 'Đã xóa toàn bộ lớp học, đề thi, bài nộp, hàng đợi và DLQ thành công!',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message });
  }
});

/**
 * POST /api/classes/restore-defaults
 * Restore default classes (SWP391, PRN231)
 */
router.post('/classes/restore-defaults', async (_req: Request, res: Response) => {
  try {
    inMemoryClasses = [...defaultClasses];
    const dataDir = path.resolve(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(DELETED_CLASSES_FILE, JSON.stringify(['PRJ301-IS1702', 'MMA301', 'SDN302'], null, 2), 'utf-8');

    return res.json({
      success: true,
      message: 'Đã khôi phục các lớp học mặc định!',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message });
  }
});

export default router;
