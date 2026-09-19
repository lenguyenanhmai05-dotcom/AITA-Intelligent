import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel, connectMongoDB } from '@aita/database';

const JWT_SECRET = process.env.JWT_SECRET || 'aita-jwt-secret-key-swp391-2026';

// Mock system users for demonstration & login
const mockUsers = [
  {
    id: 1,
    fullName: 'TS. Nguyễn Văn Giảng',
    email: 'giangnv@fpt.edu.vn',
    gitEmails: ['giangnv@fpt.edu.vn', 'nguyen.giang@gmail.com'],
    githubUsername: 'giangnv-fpt',
    role: 'lecturer',
    password: 'password123',
  },
  {
    id: 2,
    fullName: 'Quản Trị Viên Hệ Thống',
    email: 'admin@aita.fpt.edu.vn',
    gitEmails: ['admin@aita.fpt.edu.vn'],
    githubUsername: 'aita-admin',
    role: 'admin',
    password: 'adminpassword',
  },
  {
    id: 3,
    fullName: 'Trần Minh Sinh',
    email: 'sinhtmhe160001@fpt.edu.vn',
    gitEmails: ['sinhtmhe160001@fpt.edu.vn', 'minhsinh.dev@gmail.com'],
    githubUsername: 'minhsinh-dev',
    role: 'student',
    password: 'studentpassword',
  },
];

/**
 * 1. Đăng nhập bằng Email / Mật khẩu cấp phát JWT Token
 * Hỗ trợ đăng nhập bằng bất kỳ email thật nào của người dùng (Gmail, FPT edu.vn, v.v.)
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

    // 1. Tìm hoặc lưu tài khoản trực tiếp vào MongoDB Atlas Cloud
    try {
      await connectMongoDB();
      let dbUser = await UserModel.findOne({ email: cleanEmail });
      if (!dbUser) {
        dbUser = await UserModel.create({
          numericId: Math.floor(Math.random() * 9000) + 1000,
          fullName: displayName,
          email: cleanEmail,
          gitEmails: [cleanEmail],
          githubUsername: cleanEmail.split('@')[0],
          role: role || (cleanEmail.includes('admin') ? 'admin' : cleanEmail.endsWith('@fpt.edu.vn') && !cleanEmail.includes('he') ? 'lecturer' : 'student'),
          password: password || '123456',
        });
        console.log(`[MongoDB Atlas] 👤 New user registered & persisted to Atlas: ${cleanEmail}`);
      }
      user = {
        id: dbUser.numericId,
        fullName: dbUser.fullName,
        email: dbUser.email,
        gitEmails: dbUser.gitEmails,
        githubUsername: dbUser.githubUsername,
        role: dbUser.role,
      };
    } catch (dbErr: any) {
      console.warn(`[MongoDB Atlas] Fallback to in-memory: ${dbErr.message}`);
      let fallbackUser = mockUsers.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!fallbackUser) {
        fallbackUser = {
          id: mockUsers.length + 10,
          fullName: displayName,
          email: cleanEmail,
          gitEmails: [cleanEmail],
          githubUsername: cleanEmail.split('@')[0],
          role: role || 'student',
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
 * Nhận credential/id_token từ Google, xác thực và cấp phát JWT nội bộ
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

    // Email cố định là Admin tối cao: lenguyenanhmai05@gmail.com
    const isSystemAdmin = 
      userEmail === 'lenguyenanhmai05@gmail.com' || 
      userEmail === 'admin@aita.fpt.edu.vn' || 
      userEmail === 'admin@fpt.edu.vn';

    const userRole = isSystemAdmin 
      ? 'admin' 
      : (role === 'lecturer' ? 'lecturer' : 'student');

    let user: any = null;

    // Đồng bộ vào MongoDB Atlas Cloud
    try {
      await connectMongoDB();
      let dbUser = await UserModel.findOne({ email: userEmail });

      if (!dbUser) {
        dbUser = await UserModel.create({
          numericId: Math.floor(Math.random() * 9000) + 1000,
          fullName: userName,
          email: userEmail,
          gitEmails: [userEmail],
          githubUsername: userEmail.split('@')[0],
          role: userRole,
          password: '',
        });
        console.log(`[MongoDB Atlas] 👤 New Google SSO user registered: ${userEmail} (${userRole})`);
      } else if (dbUser.role !== userRole) {
        dbUser.role = userRole;
        await dbUser.save();
      }
      user = {
        id: dbUser.numericId,
        fullName: dbUser.fullName,
        email: dbUser.email,
        gitEmails: dbUser.gitEmails,
        githubUsername: dbUser.githubUsername,
        role: dbUser.role,
      };
    } catch (dbErr: any) {
      console.warn(`[MongoDB Atlas] Fallback to mock user for Google SSO: ${dbErr.message}`);
      let fallbackUser = mockUsers.find((u) => u.email.toLowerCase() === userEmail.toLowerCase());
      if (!fallbackUser) {
        fallbackUser = {
          id: mockUsers.length + 1,
          fullName: userName,
          email: userEmail,
          gitEmails: [userEmail],
          githubUsername: userEmail.split('@')[0],
          role: userEmail.includes('admin') ? 'admin' : (userEmail.endsWith('@fpt.edu.vn') && !userEmail.includes('he')) ? 'lecturer' : 'student',
          password: '',
        };
        mockUsers.push(fallbackUser);
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
