import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@aita/database';

const JWT_SECRET = process.env.JWT_SECRET || 'aita-jwt-secret-key-swp391-2026';

// Danh sách email Giảng viên được phê duyệt (Approved Lecturer Whitelist)
// Áp dụng cho mô hình thực tế khi nhà trường / bộ môn sử dụng tài khoản Gmail hoặc email nội bộ
export const APPROVED_LECTURER_EMAILS: string[] = [
  'lenguyenanhmai05@gmail.com',      // Admin / Team Lead
  'tuongvy22102004@gmail.com',       // Admin / Co-Lead
  'giangnv@fpt.edu.vn',              // TS. Nguyễn Văn Giảng (Giảng viên FPT)
  'giangvien.aita@gmail.com',        // Tài khoản test Giảng viên
  'giangvien.aita@fpt.edu.vn',       // Giảng viên FPT
  'admin@aita.fpt.edu.vn',
  'admin@fpt.edu.vn',
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

// Danh sách yêu cầu cấp quyền Giảng viên (Được quản lý bởi Admin)
export let lecturerRequests: LecturerRequest[] = [
  {
    id: 'req-1',
    email: 'lenguyenanhmai113@gmail.com',
    fullName: 'Ánh Mai Lê Nguyễn',
    department: 'Bộ môn Kỹ thuật phần mềm (SE)',
    reason: 'Đăng ký tài khoản Giảng viên giảng dạy & chấm thi đồ án',
    status: 'PENDING',
    requestedAt: '2026-10-14 08:30:15',
  },
];

const SETTING_KEY_REQUESTS = 'lecturer_approval_requests';

// Đồng bộ danh sách duyệt vào PostgreSQL system_settings
const persistRequestsToDb = async () => {
  try {
    await prisma.systemSetting.upsert({
      where: { settingKey: SETTING_KEY_REQUESTS },
      update: { settingValue: JSON.stringify(lecturerRequests) },
      create: { settingKey: SETTING_KEY_REQUESTS, settingValue: JSON.stringify(lecturerRequests) },
    });
  } catch (err: any) {
    console.warn(`[LecturerApproval] DB sync warning: ${err.message}`);
  }
};

// Khôi phục danh sách duyệt từ PostgreSQL
const loadRequestsFromDb = async () => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { settingKey: SETTING_KEY_REQUESTS },
    });
    if (setting?.settingValue) {
      const parsed = JSON.parse(setting.settingValue);
      if (Array.isArray(parsed) && parsed.length > 0) {
        lecturerRequests = parsed;
        // Thêm các email đã APPROVED vào whitelist
        parsed.filter((r) => r.status === 'APPROVED').forEach((r) => {
          const e = r.email.toLowerCase();
          if (!APPROVED_LECTURER_EMAILS.includes(e)) {
            APPROVED_LECTURER_EMAILS.push(e);
          }
        });
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
export const isApprovedLecturer = (email: string): boolean => {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();

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
  {
    id: 3,
    fullName: 'Trần Minh Sinh',
    email: 'sinhtmhe160001@fpt.edu.vn',
    githubUsername: 'minhsinh-dev',
    role: 'student',
    password: 'studentpassword',
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
    const isSystemAdmin = 
      cleanEmail === 'lenguyenanhmai05@gmail.com' ||
      cleanEmail === 'tuongvy22102004@gmail.com' ||
      cleanEmail === 'admin@aita.fpt.edu.vn' ||
      cleanEmail === 'admin@fpt.edu.vn';
    const requestedRole = isSystemAdmin ? 'admin' : (role === 'lecturer' ? 'lecturer' : (role === 'admin' ? 'admin' : 'student'));

    // RÀNG BUỘC ROLE & QUY TRÌNH DUYỆT GIẢNG VIÊN (Approval Workflow)
    if (requestedRole === 'lecturer' && !isApprovedLecturer(cleanEmail) && !isSystemAdmin) {
      const prefix = cleanEmail.split('@')[0];
      if (STUDENT_CODE_REGEX.test(prefix)) {
        return res.status(403).json({
          success: false,
          message: `⛔ Quyền truy cập bị từ chối: Email "${cleanEmail}" có mã số sinh viên. Vui lòng chọn vai trò Sinh viên!`,
        });
      }

      let existingReq = lecturerRequests.find((r) => r.email.toLowerCase() === cleanEmail);
      if (!existingReq) {
        existingReq = {
          id: `req-${Date.now()}`,
          email: cleanEmail,
          fullName: fullName || cleanEmail.split('@')[0],
          department: 'Bộ môn Kỹ thuật phần mềm (SE)',
          reason: 'Đăng ký tài khoản Giảng viên giảng dạy môn học',
          status: 'PENDING',
          requestedAt: formatVietnamDateTime(),
        };
        lecturerRequests.unshift(existingReq);
        persistRequestsToDb();
      }

      if (existingReq.status === 'REJECTED') {
        return res.status(403).json({
          success: false,
          requiresApproval: true,
          status: 'REJECTED',
          message: `Hồ sơ đăng ký Giảng viên của email "${cleanEmail}" đã bị Quản trị viên từ chối.`,
          applicant: existingReq,
        });
      }

      return res.status(200).json({
        success: false,
        requiresApproval: true,
        status: 'PENDING',
        message: 'Hồ sơ Giảng viên đang chờ Quản trị viên (Admin) phê duyệt.',
        applicant: existingReq,
      });
    }

    // Tự động tạo tên hiển thị đẹp nếu là user mới
    let displayName = fullName;
    if (!displayName) {
      if (cleanEmail.includes('lenguyenanhmai') || cleanEmail.includes('anhmai')) {
        displayName = 'Lê Nguyễn Anh Mai';
      } else {
        const prefix = cleanEmail.split('@')[0];
        displayName = prefix
          .split(/[._-]/)
          .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      }
    }

    let user: any = null;

    // 1. Tìm hoặc lưu tài khoản trực tiếp vào Docker PostgreSQL
    try {
      let dbUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

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
        dbUser = await prisma.user.create({
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
        });
        console.log(`[PostgreSQL Docker] 👤 New user registered: ${cleanEmail} (${assignedRole})`);
      } else if ((isApprovedLecturer(cleanEmail) || isSystemAdmin) && dbUser.role !== assignedRole) {
        // Cập nhật vai trò nếu là admin hoặc giảng viên được duyệt
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { role: assignedRole },
        });
      }

      user = {
        id: dbUser.id,
        fullName: dbUser.fullName,
        email: dbUser.email,
        githubUsername: dbUser.githubUsername,
        role: dbUser.role,
      };
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
    const requestedRole = role === 'lecturer' ? 'lecturer' : 'student';
    await loadRequestsFromDb();

    let userName = name;
    if (!userName) {
      if (userEmail.includes('lenguyenanhmai') || userEmail.includes('anhmai')) {
        userName = 'Lê Nguyễn Anh Mai';
      } else {
        const prefix = userEmail.split('@')[0];
        userName = prefix
          .split(/[._-]/)
          .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      }
    }

    // Email cố định là Admin tối cao: lenguyenanhmai05@gmail.com, tuongvy22102004@gmail.com
    const isSystemAdmin = 
      userEmail === 'lenguyenanhmai05@gmail.com' || 
      userEmail === 'tuongvy22102004@gmail.com' || 
      userEmail === 'admin@aita.fpt.edu.vn' || 
      userEmail === 'admin@fpt.edu.vn';

    // RÀNG BUỘC ROLE & QUY TRÌNH DUYỆT GIẢNG VIÊN (Approval Workflow)
    if (requestedRole === 'lecturer' && !isApprovedLecturer(userEmail) && !isSystemAdmin) {
      const prefix = userEmail.split('@')[0];
      if (STUDENT_CODE_REGEX.test(prefix)) {
        return res.status(403).json({
          success: false,
          message: `⛔ Quyền truy cập bị từ chối: Email "${userEmail}" có mã số sinh viên. Vui lòng đăng nhập với vai trò Sinh viên!`,
        });
      }

      let existingReq = lecturerRequests.find((r) => r.email.toLowerCase() === userEmail);
      if (!existingReq) {
        existingReq = {
          id: `req-${Date.now()}`,
          email: userEmail,
          fullName: userName,
          department: 'Bộ môn Kỹ thuật phần mềm (SE)',
          reason: 'Đăng ký tài khoản Giảng viên giảng dạy & chấm thi đồ án',
          status: 'PENDING',
          requestedAt: formatVietnamDateTime(),
        };
        lecturerRequests.unshift(existingReq);
        persistRequestsToDb();
      }

      if (existingReq.status === 'REJECTED') {
        return res.status(403).json({
          success: false,
          requiresApproval: true,
          status: 'REJECTED',
          message: `Hồ sơ đăng ký Giảng viên của email "${userEmail}" đã bị Quản trị viên từ chối.`,
          applicant: existingReq,
        });
      }

      // Trả về yêu cầu duyệt cho Frontend hiển thị Pending Approval Screen
      return res.status(200).json({
        success: false,
        requiresApproval: true,
        status: 'PENDING',
        message: 'Hồ sơ Giảng viên đang chờ Quản trị viên (Admin) phê duyệt.',
        applicant: existingReq,
      });
    }

    const userRole = isSystemAdmin 
      ? 'admin' 
      : (requestedRole === 'lecturer' && isApprovedLecturer(userEmail) ? 'lecturer' : 'student');

    let user: any = null;

    // Đồng bộ vào Docker PostgreSQL
    try {
      let dbUser = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      // Nếu user đã tồn tại trong DB với vai trò Sinh viên và không thuộc whitelist
      if (dbUser && requestedRole === 'lecturer' && dbUser.role === 'student' && !isApprovedLecturer(userEmail) && !isSystemAdmin) {
        return res.status(403).json({
          success: false,
          message: `⛔ Quyền truy cập bị từ chối: Tài khoản "${userEmail}" đã được đăng ký với vai trò Sinh viên, không có quyền truy cập Cổng Giảng viên!`,
        });
      }

      if (!dbUser) {
        dbUser = await prisma.user.create({
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
        });
        console.log(`[PostgreSQL Docker] 👤 New Google SSO user registered: ${userEmail} (${userRole})`);
      } else if ((isApprovedLecturer(userEmail) || isSystemAdmin) && dbUser.role !== userRole) {
        // Chỉ cho phép update role nếu email thuộc danh sách phê duyệt hoặc admin
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { role: userRole },
        });
      }
      user = {
        id: dbUser.id,
        fullName: dbUser.fullName,
        email: dbUser.email,
        githubUsername: dbUser.githubUsername,
        role: dbUser.role,
      };
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
      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });
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
        dbUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (dbUser && dbUser.role !== 'lecturer') {
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: { role: 'lecturer' },
          });
        }
      } catch {}

      const user = dbUser || {
        id: 99,
        email: cleanEmail,
        fullName: existingReq?.fullName || cleanEmail.split('@')[0],
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

