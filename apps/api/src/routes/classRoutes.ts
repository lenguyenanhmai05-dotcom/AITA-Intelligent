import { Router, Request, Response } from 'express';
import { prisma } from '@aita/database';

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

import fs from 'fs';
import path from 'path';

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
  {
    id: 3,
    className: 'PRJ301-IS1702',
    courseName: 'Java Web Application Development (PRJ301)',
    department: 'Kỹ thuật phần mềm (SE)',
    lecturer: { fullName: 'TS. Nguyễn Văn Giảng', email: 'giangnv@fpt.edu.vn' },
    createdAt: '2026-10-12',
  },
  {
    id: 4,
    className: 'MMA301',
    courseName: 'Mobile Application Architecture & Microservices (MMA301)',
    department: 'Kỹ thuật phần mềm (SE)',
    lecturer: { fullName: 'TS. Nguyễn Văn Giảng', email: 'giangnv@fpt.edu.vn' },
    createdAt: '2026-10-15',
  },
];

let inMemoryClasses: InMemoryClass[] = [...defaultClasses];

/**
 * GET /api/classes
 * Fetch all classes from database (with in-memory resilience)
 */
router.get('/classes', async (_req: Request, res: Response) => {
  // Sync any classes from assignments.json into inMemoryClasses
  try {
    const assignmentsPath = path.resolve(__dirname, '../../data/assignments.json');
    if (fs.existsSync(assignmentsPath)) {
      const raw = fs.readFileSync(assignmentsPath, 'utf-8');
      const storedAsms = JSON.parse(raw);
      if (Array.isArray(storedAsms)) {
        const knownCodes = new Set(inMemoryClasses.map(c => c.className.toUpperCase()));
        storedAsms.forEach((asm: any) => {
          const cName = (asm.classCode || asm.class?.className || '').trim().toUpperCase();
          if (cName && !knownCodes.has(cName)) {
            knownCodes.add(cName);
            inMemoryClasses.push({
              id: inMemoryClasses.length + 1,
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
  } catch {}

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

    if (dbClasses.length > 0) {
      // Merge any newly added in-memory classes that might not yet be in DB
      const dbNames = new Set(dbClasses.map(c => c.className.toUpperCase()));
      const extraMemoryClasses = inMemoryClasses.filter(c => !dbNames.has(c.className.toUpperCase()));

      return res.json({
        success: true,
        source: 'database',
        data: [...dbClasses, ...extraMemoryClasses],
      });
    }

    return res.json({
      success: true,
      source: 'memory_fallback',
      data: inMemoryClasses,
    });
  } catch (error: any) {
    console.warn('[Class Routes] Database unavailable, using in-memory classes:', error?.message);
    return res.json({
      success: true,
      source: 'memory_fallback',
      data: inMemoryClasses,
    });
  }
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

    const cleanCode = classCode.trim().toUpperCase();
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
    const existingMemory = inMemoryClasses.find(c => c.className.toUpperCase() === cleanCode);
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

export default router;
