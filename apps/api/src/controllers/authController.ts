import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@aita/database';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'aita-jwt-secret-key-swp391-2026';

// Persistent Storage Paths
const DATA_DIR = path.resolve(__dirname, '../../data');
const REQUESTS_FILE = path.join(DATA_DIR, 'lecturer_requests.json');
const APPROVED_FILE = path.join(DATA_DIR, 'approved_lecturers.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}

// Danh sách email Quản trị viên tối cao của hệ thống (System Administrator)
export const SYSTEM_ADMIN_EMAILS: string[] = [
  'lenguyenanhmai05@gmail.com',      // Admin / Team Lead
  'tuongvy22102004@gmail.com',       // Admin / Co-Lead
  'n133vy@gmail.com',
  'khanhlinh9a4tqd@gmail.com',
  'admin@aita.fpt.edu.vn',
  'admin@fpt.edu.vn',
];

export const isSystemAdminEmail = (email: string): boolean => {
  if (!email) return false;
  return SYSTEM_ADMIN_EMAILS.includes(email.trim().toLowerCase());
};

// Danh sách email Giảng viên được phê duyệt (Approved Lecturer Whitelist)
export const APPROVED_LECTURER_EMAILS: string[] = [
  'giangnv@fpt.edu.vn',              // TS. Nguyễn Văn Giảng (Giảng viên FPT)
  'giangvien.aita@gmail.com',        // Tài khoản test Giảng viên
  'giangvien.aita@fpt.edu.vn',       // Giảng viên FPT
  'lenguyenanhmai113@gmail.com',     // Giảng viên Đồ án SWP391 (Đã duyệt)
  ...(process.env.APPROVED_LECTURERS ? process.env.APPROVED_LECTURERS.split(',').map((e) => e.trim().toLowerCase()) : []),
];

// Regex kiểm tra định dạng MSSV (ví dụ: qe190151, se172000, he160001, ia180000, ...)
const STUDENT_CODE_REGEX = /([a-z]{2}\d{5,6})/i;

const formatVietnamDateTime = (date: Date = new Date()): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date).replace(',', '');
};

export interface LecturerRequest {
  id: string;
  email: string;
  fullName: string;
  department: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export const sanitizeFullName = (name?: string, email?: string): string => {
  if (email) {
    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail === 'lenguyenlinhnhi2110@gmail.com' || cleanEmail.includes('linhnhi')) {
      return 'Lê Nguyễn Linh Nhi';
    }
    if (cleanEmail === 'lenguyenanhmai113@gmail.com' || cleanEmail === 'lenguyenanhmai05@gmail.com' || cleanEmail.includes('anhmai')) {
      return 'Lê Nguyễn Anh Mai';
    }
    if (cleanEmail === 'tuongvy22102004@gmail.com' || cleanEmail === 'n133vy@gmail.com') {
      return 'Nguyễn Tường Vy';
    }
    if (cleanEmail === 'giangnv@fpt.edu.vn') {
      return 'TS. Nguyễn Văn Giảng';
    }
    if (cleanEmail === 'khanhlinh9a4tqd@gmail.com') {
      return 'Nguyễn Châu Khánh Linh';
    }
  }
  if (!name || !name.trim() || name.includes('?') || name.includes('\uFFFD')) {
    if (email) {
      const prefix = email.split('@')[0];
      return prefix
        .split(/[._-]/)
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
    return 'Lê Nguyễn Linh Nhi';
  }
  return name.trim();
};

// Danh sách yêu cầu cấp quyền Giảng viên (Được quản lý bởi Admin)
export let lecturerRequests: LecturerRequest[] = [
  {
    id: 'req-1',
    email: 'lenguyenanhmai113@gmail.com',
    fullName: 'Lê Nguyễn Anh Mai',
    department: 'Bộ môn Kỹ thuật phần mềm (SE)',
    reason: 'Đăng ký tài khoản Giảng viên giảng dạy & chấm thi đồ án',
    status: 'APPROVED',
    requestedAt: '2026-10-14 08:30:15',
    reviewedAt: '2026-10-19 18:30:00',
    reviewedBy: 'Lê Nguyễn Anh Mai (Admin)',
  },
];

// Circuit breaker cho kết nối PostgreSQL Docker (Tránh API bị delay khi DB chưa chạy)
let isPostgresAvailable = true;
let lastDbAttemptTime = 0;
const DB_RETRY_COOLDOWN_MS = 60000; // Thử lại kết nối DB tối đa 1 lần mỗi phút nếu DB đang tắt

export const safeDbQuery = async <T>(queryFn: () => Promise<T>, timeoutMs = 1500): Promise<T | null> => {
  if (!isPostgresAvailable && Date.now() - lastDbAttemptTime < DB_RETRY_COOLDOWN_MS) {
    return null;
  }
  let timer: any;
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('PostgreSQL connection timeout')), timeoutMs);
    });
    const result = await Promise.race([queryFn(), timeoutPromise]);
    clearTimeout(timer);
    isPostgresAvailable = true;
    return result as T;
  } catch (err: any) {
    clearTimeout(timer);
    isPostgresAvailable = false;
    lastDbAttemptTime = Date.now();
    return null;
  }
};

const SETTING_KEY_REQUESTS = 'lecturer_approval_requests';

// Đồng bộ danh sách duyệt vào Disk JSON và PostgreSQL system_settings
const persistRequestsToDb = async () => {
  try {
    // 1. Lưu file JSON dự phòng trên ổ đĩa để không bao giờ bị mất khi restart server
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(lecturerRequests, null, 2), 'utf-8');
    fs.writeFileSync(APPROVED_FILE, JSON.stringify(APPROVED_LECTURER_EMAILS, null, 2), 'utf-8');
  } catch (fileErr: any) {
    console.warn(`[LecturerApproval] File sync warning: ${fileErr.message}`);
  }

  try {
    // 2. Lưu vào CSDL PostgreSQL Docker qua Prisma (safeDbQuery)
    await safeDbQuery(() =>
      prisma.systemSetting.upsert({
        where: { settingKey: SETTING_KEY_REQUESTS },
        update: { settingValue: JSON.stringify(lecturerRequests) },
        create: { settingKey: SETTING_KEY_REQUESTS, settingValue: JSON.stringify(lecturerRequests) },
      })
    );
  } catch (err: any) {
    console.warn(`[LecturerApproval] DB sync warning: ${err.message}`);
  }
};

// Khôi phục danh sách duyệt từ Disk JSON và PostgreSQL
const loadRequestsFromDb = async () => {
  // 1. Tải từ file disk trước
  try {
    if (fs.existsSync(APPROVED_FILE)) {
      const fileData = fs.readFileSync(APPROVED_FILE, 'utf-8');
      const parsedApproved = JSON.parse(fileData);
      if (Array.isArray(parsedApproved)) {
        parsedApproved.forEach((email: string) => {
          const e = email.toLowerCase().trim();
          if (!APPROVED_LECTURER_EMAILS.includes(e)) {
            APPROVED_LECTURER_EMAILS.push(e);
          }
        });
      }
    }

    if (fs.existsSync(REQUESTS_FILE)) {
      const fileData = fs.readFileSync(REQUESTS_FILE, 'utf-8');
      const parsedRequests = JSON.parse(fileData);
      if (Array.isArray(parsedRequests) && parsedRequests.length > 0) {
        lecturerRequests = parsedRequests.map((r: any) => ({
          ...r,
          fullName: sanitizeFullName(r.fullName, r.email),
        }));
        for (const r of parsedRequests.filter((item: any) => item.status === 'APPROVED')) {
          const e = r.email.toLowerCase().trim();
          if (!APPROVED_LECTURER_EMAILS.includes(e)) {
            APPROVED_LECTURER_EMAILS.push(e);
          }
        }
      }
    }
  } catch (fileErr: any) {
    console.warn(`[LecturerApproval] File load warning: ${fileErr.message}`);
  }

  // 2. Tải bổ sung từ PostgreSQL nếu CSDL đang chạy (safeDbQuery)
  try {
    const setting = await safeDbQuery(() =>
      prisma.systemSetting.findUnique({
        where: { settingKey: SETTING_KEY_REQUESTS },
      })
    );
    if (setting?.settingValue) {
      const parsed = JSON.parse(setting.settingValue);
      if (Array.isArray(parsed) && parsed.length > 0) {
        lecturerRequests = parsed.map((r: any) => ({
          ...r,
          fullName: sanitizeFullName(r.fullName, r.email),
        }));
        for (const r of parsed.filter((item: any) => item.status === 'APPROVED')) {
          const e = r.email.toLowerCase().trim();
          if (!APPROVED_LECTURER_EMAILS.includes(e)) {
            APPROVED_LECTURER_EMAILS.push(e);
          }
          try {
            await safeDbQuery(() =>
              prisma.user.updateMany({
                where: { email: e },
                data: { role: 'lecturer' },
              })
            );
          } catch {}
        }
      }
    }
  } catch (err: any) {
    console.warn(`[LecturerApproval] DB load warning: ${err.message}`);
  }
};
loadRequestsFromDb();

/**
 * Kiểm tra xem một email có quyền truy cập vai trò Giảng viên hay không
 */
export const isApprovedLecturer = (email: string, dbUserRole?: string): boolean => {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();

  // Admin tối cao không tính là lecturer thông thường
  if (isSystemAdminEmail(cleanEmail)) {
    return false;
  }

  // 0. Nếu trong database user đã mang role lecturer
  if (dbUserRole === 'lecturer') {
    return true;
  }

  // 1. Nếu nằm trong Whitelist Giảng viên được cấp phép
  if (APPROVED_LECTURER_EMAILS.some((e) => e.toLowerCase() === cleanEmail)) {
    return true;
  }

  // 2. Nếu đã có đơn xin cấp quyền và đã được Admin APPROVED
  const approvedReq = lecturerRequests.find(
    (r) => r.email.toLowerCase() === cleanEmail && r.status === 'APPROVED'
  );
  if (approvedReq) {
    return true;
  }

  // 3. Nếu email có chứa mã số sinh viên (ví dụ: se170001, qe190151) -> Không thể là Giảng viên
  const prefix = cleanEmail.split('@')[0];
  if (STUDENT_CODE_REGEX.test(prefix)) {
    return false;
  }

  // 4. Nếu là email giảng viên chính thức của trường FPT (@fe.edu.vn hoặc @fpt.edu.vn không chứa ký tự sinh viên)
  if (
    cleanEmail.endsWith('@fe.edu.vn') ||
    (cleanEmail.endsWith('@fpt.edu.vn') &&
      !cleanEmail.includes('he') &&
      !cleanEmail.includes('se') &&
      !cleanEmail.includes('qe') &&
      !cleanEmail.includes('ia') &&
      !cleanEmail.includes('ss'))
  ) {
    return true;
  }

  return false;
};

// Mock system users for fallback
const mockUsers = [
  {
    id: 1,
    fullName: 'TS. Nguyễn Văn Giảng',
    email: 'giangnv@fpt.edu.vn',
    githubUsername: 'giangnv-fpt',
    role: 'lecturer',
    password: 'password123',
  },
  {
    id: 2,
    fullName: 'Quản Trị Viên Hệ Thống',
    email: 'admin@aita.fpt.edu.vn',
    githubUsername: 'aita-admin',
    role: 'admin',
    password: 'adminpassword',
  },
];

/**
 * 1. Đăng nhập bằng Email / Mật khẩu cấp phát JWT Token
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, role = 'student', fullName } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp địa chỉ email hợp lệ.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    await loadRequestsFromDb();

    const isSystemAdmin = isSystemAdminEmail(cleanEmail);
    const requestedRole = isSystemAdmin 
      ? 'admin' 
      : (role === 'admin' ? 'admin' : (role === 'lecturer' ? 'lecturer' : 'student'));

    // Tìm user trong DB trước
    let dbUser: any = await safeDbQuery(() => prisma.user.findUnique({
      where: { email: cleanEmail },
    }));

    const isApproved = isApprovedLecturer(cleanEmail, dbUser?.role);
    const hasApprovedLecturerRecord = isApproved || dbUser?.role === 'lecturer';
    const existingReq = lecturerRequests.find((r) => r.email.toLowerCase() === cleanEmail);

    // 1. RÀNG BUỘC KHÓA VAI TRÒ: Nếu email đã đăng ký/phê duyệt Giảng viên mà chọn vai trò Sinh viên -> Khóa đăng nhập
    if ((hasApprovedLecturerRecord || existingReq) && requestedRole === 'student' && !isSystemAdmin) {
      return res.status(403).json({
        success: false,
        roleMismatch: true,
        registeredRole: 'lecturer',
        message: `⛔ Quyền truy cập bị khóa: Email "${cleanEmail}" đã được cấp quyền Giảng viên (Lecturer). Mail này chỉ dành cho Giảng viên, không thể đăng nhập bằng vai trò Sinh viên! Vui lòng chọn vai trò Giảng viên trên màn hình đăng nhập.`,
      });
    }

    // 2. RÀNG BUỘC KHÓA VAI TRÒ: Nếu tài khoản đã là Sinh viên trong DB -> Khóa khi chọn Giảng viên nếu chưa duyệt
    if (dbUser && dbUser.role === 'student' && requestedRole === 'lecturer' && !hasApprovedLecturerRecord && !isSystemAdmin) {
      return res.status(403).json({
        success: false,
        roleMismatch: true,
        registeredRole: 'student',
        message: `⛔ Quyền truy cập bị từ chối: Tài khoản "${cleanEmail}" đã được đăng ký với vai trò Sinh viên, không có quyền truy cập Cổng Giảng viên!`,
      });
    }


    // 4. QUY TRÌNH DUYỆT GIẢNG VIÊN (Approval Workflow)
    if (requestedRole === 'lecturer' && !hasApprovedLecturerRecord && !isSystemAdmin) {
      const prefix = cleanEmail.split('@')[0];
      if (STUDENT_CODE_REGEX.test(prefix)) {
        return res.status(403).json({
          success: false,
          message: `⛔ Quyền truy cập bị từ chối: Email "${cleanEmail}" có mã số sinh viên. Vui lòng chọn vai trò Sinh viên!`,
        });
      }

      let reqItem = existingReq;
      if (!reqItem) {
        reqItem = {
          id: `req-${Date.now()}`,
          email: cleanEmail,
          fullName: fullName || cleanEmail.split('@')[0],
          department: 'Bộ môn Kỹ thuật phần mềm (SE)',
          reason: 'Đăng ký tài khoản Giảng viên giảng dạy môn học',
          status: 'PENDING',
          requestedAt: formatVietnamDateTime(),
        };
        lecturerRequests.unshift(reqItem);
        persistRequestsToDb();
      }

      if (reqItem.status === 'REJECTED') {
        return res.status(403).json({
          success: false,
          requiresApproval: true,
          status: 'REJECTED',
          message: `Hồ sơ đăng ký Giảng viên của email "${cleanEmail}" đã bị Quản trị viên từ chối.`,
          applicant: reqItem,
        });
      }

      return res.status(200).json({
        success: false,
        requiresApproval: true,
        status: 'PENDING',
        message: 'Hồ sơ Giảng viên đang chờ Quản trị viên (Admin) phê duyệt.',
        applicant: reqItem,
      });
    }

    // Tự động tạo tên hiển thị đẹp nếu là user mới
    const displayName = sanitizeFullName(fullName, cleanEmail);

    let user: any = null;

    // 1. Tìm hoặc lưu tài khoản trực tiếp vào Docker PostgreSQL
    try {
      // Nếu user đã tồn tại trong DB với vai trò Sinh viên và không thuộc whitelist
      if (dbUser && requestedRole === 'lecturer' && dbUser.role === 'student' && !isApprovedLecturer(cleanEmail) && !isSystemAdmin) {
        return res.status(403).json({
          success: false,
          message: `⛔ Quyền truy cập bị từ chối: Tài khoản "${cleanEmail}" đã được đăng ký với vai trò Sinh viên, không có quyền truy cập Cổng Giảng viên!`,
        });
      }

      const assignedRole = isSystemAdmin
        ? 'admin'
        : (isApprovedLecturer(cleanEmail) ? requestedRole : 'student');

      if (!dbUser) {
        dbUser = await safeDbQuery(() => prisma.user.create({
          data: {
            fullName: displayName,
            email: cleanEmail,
            githubUsername: cleanEmail.split('@')[0],
            role: assignedRole,
            password: password || '123456',
            gitEmails: {
              create: { gitEmail: cleanEmail },
            },
          },
        }));
        if (dbUser) {
          console.log(`[PostgreSQL Docker] 👤 New user registered: ${cleanEmail} (${assignedRole})`);
        }
      } else if ((isApprovedLecturer(cleanEmail) || isSystemAdmin) && dbUser.role !== assignedRole) {
        // Cập nhật vai trò nếu là admin hoặc giảng viên được duyệt
        dbUser = await safeDbQuery(() => prisma.user.update({
          where: { id: dbUser.id },
          data: { role: assignedRole },
        }));
      }

      if (dbUser) {
        user = {
          id: dbUser.id,
          fullName: dbUser.fullName,
          email: dbUser.email,
          githubUsername: dbUser.githubUsername,
          role: dbUser.role,
        };
      } else {
        throw new Error('Database unavailable, using fallback mock user');
      }
    } catch (dbErr: any) {
      console.warn(`[PostgreSQL Docker] Fallback to in-memory: ${dbErr.message}`);
      let fallbackUser = mockUsers.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!fallbackUser) {
        const assignedRole = isApprovedLecturer(cleanEmail) ? requestedRole : 'student';
        fallbackUser = {
          id: mockUsers.length + 10,
          fullName: displayName,
          email: cleanEmail,
          githubUsername: cleanEmail.split('@')[0],
          role: assignedRole,
          password: password || '123456',
        };
        mockUsers.push(fallbackUser);
      }
      user = fallbackUser;
    }

    // Tạo JWT Token thật hạn 7 ngày
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userSafe } = user;

    res.json({
      success: true,
      message: `Đăng nhập thành công với tài khoản ${user.email}!`,
      data: {
        token,
        user: userSafe,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2. Đăng nhập Google SSO (OAuth2 / OpenID Connect)
 */
export const googleSsoLogin = async (req: Request, res: Response) => {
  try {
    let { googleToken, email, name, avatarUrl, role } = req.body;

    // Decode Google ID token nếu có
    if (googleToken && typeof googleToken === 'string' && googleToken.includes('.')) {
      try {
        const payloadBase64 = googleToken.split('.')[1];
        const decodedPayload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
        if (decodedPayload.email) {
          email = decodedPayload.email;
        }
        if (decodedPayload.name && !name) {
          name = decodedPayload.name;
        }
        if (decodedPayload.picture && !avatarUrl) {
          avatarUrl = decodedPayload.picture;
        }
      } catch (tokenErr) {
        console.warn('[Google SSO] JWT decode error:', tokenErr);
      }
    }

    // Nhận email thật từ client hoặc Google OAuth token
    const userEmail = (email || 'lenguyenanhmai05@gmail.com').trim().toLowerCase();
    await loadRequestsFromDb();

    const isSystemAdmin = isSystemAdminEmail(userEmail);
    const requestedRole = isSystemAdmin
      ? 'admin'
      : (role === 'admin' ? 'admin' : (role === 'lecturer' ? 'lecturer' : 'student'));

    let userName = sanitizeFullName(name, userEmail);

    // Tìm user trong DB trước
    let dbUser: any = await safeDbQuery(() => prisma.user.findUnique({
      where: { email: userEmail },
    }));

    const isApproved = isApprovedLecturer(userEmail, dbUser?.role);
    const hasApprovedLecturerRecord = isApproved || dbUser?.role === 'lecturer';
    const existingReq = lecturerRequests.find((r) => r.email.toLowerCase() === userEmail);

    // 1. RÀNG BUỘC KHÓA VAI TRÒ: Nếu email đã đăng ký/phê duyệt Giảng viên mà chọn vai trò Sinh viên -> Khóa đăng nhập
    if ((hasApprovedLecturerRecord || existingReq) && requestedRole === 'student' && !isSystemAdmin) {
      return res.status(403).json({
        success: false,
        roleMismatch: true,
        registeredRole: 'lecturer',
        message: `⛔ Quyền truy cập bị khóa: Email "${userEmail}" đã được cấp quyền Giảng viên (Lecturer). Mail này chỉ dành cho Giảng viên, không thể đăng nhập bằng vai trò Sinh viên! Vui lòng chọn vai trò Giảng viên trên màn hình đăng nhập.`,
      });
    }

    // 2. RÀNG BUỘC KHÓA VAI TRÒ: Nếu tài khoản đã là Sinh viên trong DB -> Khóa khi chọn Giảng viên nếu chưa duyệt
    if (dbUser && dbUser.role === 'student' && requestedRole === 'lecturer' && !hasApprovedLecturerRecord && !isSystemAdmin) {
      return res.status(403).json({
        success: false,
        roleMismatch: true,
        registeredRole: 'student',
        message: `⛔ Quyền truy cập bị từ chối: Tài khoản "${userEmail}" đã được đăng ký với vai trò Sinh viên, không có quyền truy cập Cổng Giảng viên!`,
      });
    }


    // 4. QUY TRÌNH DUYỆT GIẢNG VIÊN (Approval Workflow)
    if (requestedRole === 'lecturer' && !hasApprovedLecturerRecord && !isSystemAdmin) {
      const prefix = userEmail.split('@')[0];
      if (STUDENT_CODE_REGEX.test(prefix)) {
        return res.status(403).json({
          success: false,
          message: `⛔ Quyền truy cập bị từ chối: Email "${userEmail}" có mã số sinh viên. Vui lòng đăng nhập với vai trò Sinh viên!`,
        });
      }

      let reqItem = existingReq;
      if (!reqItem) {
        reqItem = {
          id: `req-${Date.now()}`,
          email: userEmail,
          fullName: userName,
          department: 'Bộ môn Kỹ thuật phần mềm (SE)',
          reason: 'Đăng ký tài khoản Giảng viên giảng dạy & chấm thi đồ án',
          status: 'PENDING',
          requestedAt: formatVietnamDateTime(),
        };
        lecturerRequests.unshift(reqItem);
        persistRequestsToDb();
      }

      if (reqItem.status === 'REJECTED') {
        return res.status(403).json({
          success: false,
          requiresApproval: true,
          status: 'REJECTED',
          message: `Hồ sơ đăng ký Giảng viên của email "${userEmail}" đã bị Quản trị viên từ chối.`,
          applicant: reqItem,
        });
      }

      // Trả về yêu cầu duyệt cho Frontend hiển thị Pending Approval Screen
      return res.status(200).json({
        success: false,
        requiresApproval: true,
        status: 'PENDING',
        message: 'Hồ sơ Giảng viên đang chờ Quản trị viên (Admin) phê duyệt.',
        applicant: reqItem,
      });
    }

    const userRole = isSystemAdmin 
      ? 'admin' 
      : (requestedRole === 'lecturer' ? 'lecturer' : 'student');

    let user: any = null;

    // Đồng bộ vào Docker PostgreSQL
    try {
      if (!dbUser) {
        dbUser = await safeDbQuery(() => prisma.user.create({
          data: {
            fullName: userName,
            email: userEmail,
            githubUsername: userEmail.split('@')[0],
            role: userRole,
            password: '',
            gitEmails: {
              create: { gitEmail: userEmail },
            },
          },
        }));
        if (dbUser) {
          console.log(`[PostgreSQL Docker] 👤 New Google SSO user registered: ${userEmail} (${userRole})`);
        }
      } else if (dbUser.role !== userRole && (isSystemAdmin || (requestedRole === 'lecturer' && isApproved))) {
        // Chỉ cho phép update role nếu email thuộc danh sách phê duyệt hoặc admin
        dbUser = await safeDbQuery(() => prisma.user.update({
          where: { id: dbUser.id },
          data: { role: userRole },
        }));
      }

      if (dbUser) {
        user = {
          id: dbUser.id,
          fullName: dbUser.fullName,
          email: dbUser.email,
          githubUsername: dbUser.githubUsername,
          role: dbUser.role,
        };
      } else {
        throw new Error('Database unavailable, using fallback mock user');
      }
    } catch (dbErr: any) {
      console.warn(`[PostgreSQL Docker] Fallback to mock user for Google SSO: ${dbErr.message}`);
      let fallbackUser = mockUsers.find((u) => u.email.toLowerCase() === userEmail.toLowerCase());
      if (!fallbackUser) {
        fallbackUser = {
          id: mockUsers.length + 1,
          fullName: userName,
          email: userEmail,
          githubUsername: userEmail.split('@')[0],
          role: isSystemAdmin ? 'admin' : (requestedRole === 'lecturer' && isApprovedLecturer(userEmail) ? 'lecturer' : 'student'),
          password: '',
        };
        mockUsers.push(fallbackUser);
      } else if (isSystemAdmin) {
        fallbackUser.role = 'admin';
      }
      user = fallbackUser;
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        authProvider: 'google',
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userSafe } = user;

    res.json({
      success: true,
      message: 'Đăng nhập Google SSO thành công!',
      data: {
        token,
        user: userSafe,
        avatarUrl,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. Lấy thông tin người dùng hiện tại (Xác thực Auth Guard JWT)
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Yêu cầu token xác thực Bearer JWT.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    try {
      const dbUser = await safeDbQuery(() => prisma.user.findUnique({
        where: { id: decoded.userId },
      }));
      if (dbUser) {
        const { password: _, ...userSafe } = dbUser;
        return res.json({ success: true, data: userSafe });
      }
    } catch {
      // Fallback
    }

    const user = mockUsers.find((u) => u.id === decoded.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin tài khoản.' });
    }

    const { password: _, ...userSafe } = user;
    res.json({ success: true, data: userSafe });
  } catch (error: any) {
    res.status(401).json({ success: false, message: 'Token JWT không hợp lệ hoặc đã hết hạn.' });
  }
};

/**
 * 4. Lấy danh sách các yêu cầu cấp quyền Giảng viên (Dành cho Admin)
 */
export const getLecturerRequests = async (_req: Request, res: Response) => {
  await loadRequestsFromDb();
  res.json({
    success: true,
    data: lecturerRequests,
  });
};

/**
 * 5. Admin phê duyệt hoặc từ chối cấp quyền Giảng viên (1 lần duy nhất)
 */
export const approveLecturerRequest = async (req: Request, res: Response) => {
  try {
    const { email, action = 'approve', reviewedBy = 'Lê Nguyễn Anh Mai (Admin)' } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Thiếu email cần xử lý.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const reqIndex = lecturerRequests.findIndex((r) => r.email.toLowerCase() === cleanEmail);
    const isApprove = String(action).toLowerCase() === 'approve' || String(action).toLowerCase() === 'approved';

    if (isApprove) {
      if (reqIndex !== -1) {
        lecturerRequests[reqIndex].status = 'APPROVED';
        lecturerRequests[reqIndex].reviewedAt = formatVietnamDateTime();
        lecturerRequests[reqIndex].reviewedBy = reviewedBy;
      } else {
        lecturerRequests.unshift({
          id: `req-${Date.now()}`,
          email: cleanEmail,
          fullName: cleanEmail.split('@')[0],
          department: 'Bộ môn Kỹ thuật phần mềm (SE)',
          status: 'APPROVED',
          requestedAt: formatVietnamDateTime(),
          reviewedAt: formatVietnamDateTime(),
          reviewedBy,
        });
      }

      // Thêm vĩnh viễn vào APPROVED_LECTURER_EMAILS
      if (!APPROVED_LECTURER_EMAILS.includes(cleanEmail)) {
        APPROVED_LECTURER_EMAILS.push(cleanEmail);
      }

      // Cập nhật vai trò vĩnh viễn trong PostgreSQL
      try {
        await prisma.user.updateMany({
          where: { email: cleanEmail },
          data: { role: 'lecturer' },
        });
        console.log(`[PostgreSQL] ✓ Approved lecturer updated in DB: ${cleanEmail}`);
      } catch (dbErr: any) {
        console.warn(`[PostgreSQL] User update warning: ${dbErr.message}`);
      }

      await persistRequestsToDb();

      return res.json({
        success: true,
        message: `✓ Đã phê duyệt thành công tài khoản ${cleanEmail} trở thành Giảng viên chính thức!`,
        data: lecturerRequests[reqIndex !== -1 ? reqIndex : 0],
      });
    } else {
      // Từ chối (reject)
      if (reqIndex !== -1) {
        lecturerRequests[reqIndex].status = 'REJECTED';
        lecturerRequests[reqIndex].reviewedAt = formatVietnamDateTime();
        lecturerRequests[reqIndex].reviewedBy = reviewedBy;
      }
      await persistRequestsToDb();

      return res.json({
        success: true,
        message: `Đã từ chối cấp quyền Giảng viên cho tài khoản ${cleanEmail}.`,
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 6. Người dùng kiểm tra trạng thái phê duyệt Giảng viên
 */
export const checkLecturerRequestStatus = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Thiếu email kiểm tra.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    await loadRequestsFromDb();
    const approved = isApprovedLecturer(cleanEmail);
    const existingReq = lecturerRequests.find((r) => r.email.toLowerCase() === cleanEmail);

    if (approved) {
      // Đã được duyệt -> Cấp phát JWT token để vào thẳng Cổng Giảng viên
      let dbUser: any = null;
      try {
        dbUser = await safeDbQuery(() => prisma.user.findUnique({ where: { email: cleanEmail } }));
        if (dbUser && dbUser.role !== 'lecturer') {
          dbUser = await safeDbQuery(() => prisma.user.update({
            where: { id: dbUser.id },
            data: { role: 'lecturer' },
          }));
        }
      } catch {}

      const resolvedName = sanitizeFullName(existingReq?.fullName || dbUser?.fullName, cleanEmail);
      const user = {
        id: dbUser?.id || 99,
        email: cleanEmail,
        fullName: resolvedName,
        role: 'lecturer',
      };

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: 'lecturer',
          fullName: user.fullName,
          authProvider: 'google',
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        isApproved: true,
        status: 'APPROVED',
        message: 'Chúc mừng! Hồ sơ Giảng viên của bạn đã được Admin phê duyệt thành công.',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: 'lecturer',
          },
        },
      });
    }

    return res.json({
      success: true,
      isApproved: false,
      status: existingReq?.status || 'PENDING',
      message: existingReq?.status === 'REJECTED'
        ? 'Hồ sơ của bạn đã bị từ chối.'
        : 'Hồ sơ vẫn đang chờ Quản trị viên xét duyệt. Vui lòng thử lại sau!',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

