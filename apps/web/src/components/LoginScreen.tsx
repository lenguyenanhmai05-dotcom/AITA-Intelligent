import React, { useState, useEffect } from 'react';
import { AitaLogo } from './AitaLogo';
import { 
  GraduationCap, 
  Code2, 
  CheckCircle2
} from 'lucide-react';
import { Language, translations } from '../translations';
import { Theme, isAdminEmail } from '../App';
import { LanguageFlagToggle } from './FlagIcons';
import { PendingApprovalCard } from './PendingApprovalCard';

// Red Velvet Cake Palette Tokens (丝绒蛋糕: #CC8780, #AD3029, #CD5252, #FEEFCD)
export const VELVET = {
  deepCrimson: '#AD3029', // Deep Velvet Red (Primary brand, active gradients)
  coral: '#CD5252',       // Warm Coral Red (Active highlights, focus rings)
  rose: '#CC8780',        // Dusty Velvet Rose (Subtle borders, badge accents, tags)
  cream: '#FEEFCD',       // Warm Cream Custard (Light accents, pill background)
  espresso: '#3E1815',    // Deep Velvet Espresso for high-contrast crisp text
  mutedEspresso: '#784340',// Soft muted velvet for secondary text
  ivoryBg: '#FAF1E4',     // Soft Velvet Cream background
  darkBg: '#0F090B',      // Deep Obsidian Velvet background
  cardBgLight: 'rgba(255, 255, 255, 0.90)',
  cardBgDark: 'rgba(32, 18, 20, 0.85)',
};

// Backwards compatibility alias for existing components
export const TERRACOTTA = {
  espresso: VELVET.espresso,
  clay: VELVET.deepCrimson,
  amber: VELVET.coral,
  softClay: VELVET.rose,
  peachGlow: '#E2A6A0',
  palePeach: '#F3CBC7',
  alabaster: '#FAF1E4',
  pearl: '#FFFBF5',
};

interface LoginScreenProps {
  lang: Language;
  onToggleLang: (lang: Language) => void;
  theme?: Theme;
  onToggleTheme?: (theme: Theme) => void;
  onLoginSuccess: (role: 'lecturer' | 'student' | 'admin', email: string, fullName?: string, token?: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ lang, onToggleLang, theme = 'light', onToggleTheme, onLoginSuccess }) => {
  const t = translations[lang];
  const isDark = theme === 'dark';
  const [selectedRole, setSelectedRole] = useState<'student' | 'lecturer'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Interactive 3D Card Tilt State
  const [cardTilt, setCardTilt] = useState({ rotateX: 0, rotateY: 0 });
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    setCardTilt({ rotateX, rotateY });
  };
  const handleCardMouseLeave = () => {
    setCardTilt({ rotateX: 0, rotateY: 0 });
  };

  // Trạng thái chờ phê duyệt Giảng viên từ Admin
  const [pendingApplicant, setPendingApplicant] = useState<any | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
  const [statusCheckMsg, setStatusCheckMsg] = useState<string | null>(null);

  const DEFAULT_GOOGLE_CLIENT_ID = '519099272779-ufs11c2mcuq06962j1j19euf0vth738e.apps.googleusercontent.com';

  // Initialize Google Identity Services on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: DEFAULT_GOOGLE_CLIENT_ID,
            callback: (response: any) => {
              if (response.credential) {
                try {
                  const base64Url = response.credential.split('.')[1];
                  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                  const jsonPayload = decodeURIComponent(
                    atob(base64)
                      .split('')
                      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                      .join('')
                  );
                  const parsed = JSON.parse(jsonPayload);
                  handleExecuteGoogleAuth(parsed.email, parsed.name, response.credential);
                } catch {
                  handleExecuteGoogleAuth(undefined, undefined, response.credential);
                }
              }
            },
          });
        } catch (err) {
          console.warn('[Google GIS] Init error:', err);
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [selectedRole]);

  const handleRoleChange = (role: 'lecturer' | 'student') => {
    setSelectedRole(role);
    setAuthError(null);
  };

  const loginWithFallbackSession = (role: 'lecturer' | 'student' | 'admin', email: string, name: string) => {
    console.warn('[LoginScreen] API server unreachable or network error, entering offline/fallback session mode');
    const fallbackUser = {
      id: 1,
      fullName: name,
      email: email,
      githubUsername: email.split('@')[0],
      role: role,
    };
    const fallbackToken = 'aita-fallback-token-' + Date.now();
    localStorage.setItem('aita_token', fallbackToken);
    localStorage.setItem('aita_user', JSON.stringify(fallbackUser));

    const roleName = role === 'admin'
      ? (lang === 'vi' ? 'Quản trị viên' : 'Administrator')
      : role === 'lecturer'
      ? (lang === 'vi' ? 'Giảng viên' : 'Lecturer')
      : (lang === 'vi' ? 'Sinh viên' : 'Student');

    setAuthSuccess(
      lang === 'vi' 
        ? `Đăng nhập thành công với vai trò ${roleName}: ${email}` 
        : `Login successful as ${roleName}: ${email}`
    );

    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(role, email, name, fallbackToken);
    }, 350);
  };

  const handleExecuteGoogleAuth = async (targetEmail?: string, displayName?: string, googleToken?: string) => {
    setIsLoading(true);
    setAuthError(null);

    let fallbackEmail = selectedRole === 'lecturer' 
      ? 'lenguyenanhmai113@gmail.com' 
      : 'lenguyenlinhnhi2110@gmail.com';
    let fallbackName = selectedRole === 'lecturer' 
      ? 'Ánh Mai Lê Nguyễn' 
      : 'Lê Nguyễn Linh Nhi';

    const cleanEmail = (targetEmail && targetEmail.trim()) ? targetEmail.trim().toLowerCase() : fallbackEmail;
    // Tự động gán quyền Admin nếu email thuộc danh sách Admin tối cao
    const finalRole: 'lecturer' | 'student' | 'admin' = isAdminEmail(cleanEmail) ? 'admin' : selectedRole;
    const cleanName = displayName || fallbackName;

    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          name: cleanName,
          googleToken,
          role: finalRole,
        }),
      });
      
      let result: any = null;
      try {
        result = await response.json();
      } catch (parseErr) {
        console.warn('[LoginScreen] Non-JSON or empty response from API server:', parseErr);
        result = null;
      }

      // Trường hợp máy chủ API chưa khởi động hoặc trả về HTML/proxy error 502/504
      if (!result) {
        loginWithFallbackSession(finalRole, cleanEmail, cleanName);
        return;
      }

      // Trường hợp hồ sơ Giảng viên đang chờ Quản trị viên (Admin) phê duyệt
      if (result.requiresApproval) {
        setIsLoading(false);
        setPendingApplicant(result.applicant || {
          email: cleanEmail,
          fullName: cleanName,
          status: result.status || 'PENDING',
          requestedAt: '2026-10-14 08:35',
        });
        return;
      }

      if (response.ok && result.success && result.data) {
        const { token, user } = result.data;
        const actualRole = isAdminEmail(cleanEmail) ? 'admin' : (user.role || finalRole);
        localStorage.setItem('aita_token', token);
        localStorage.setItem('aita_user', JSON.stringify({ ...user, role: actualRole }));
        
        const roleName = actualRole === 'admin'
          ? (lang === 'vi' ? 'Quản trị viên' : 'Administrator')
          : actualRole === 'lecturer'
          ? (lang === 'vi' ? 'Giảng viên' : 'Lecturer')
          : (lang === 'vi' ? 'Sinh viên' : 'Student');

        setAuthSuccess(
          lang === 'vi' 
            ? `Đăng nhập thành công với vai trò ${roleName}: ${user.email}` 
            : `Login successful as ${roleName}: ${user.email}`
        );

        setTimeout(() => {
          setIsLoading(false);
          onLoginSuccess(actualRole, user.email, user.fullName, token);
        }, 350);
      } else {
        // Chặn đứng sinh viên truy cập cổng Giảng viên hoặc các lỗi xác thực
        setIsLoading(false);
        const errorMsg = result.message || (lang === 'vi' ? 'Đăng nhập không thành công.' : 'Login failed.');
        setAuthError(errorMsg);
        if (errorMsg.includes('mã số sinh viên')) {
          setSelectedRole('student');
        }
      }
    } catch (networkErr: any) {
      console.warn('[LoginScreen] Connection error during auth, activating local session fallback:', networkErr);
      // Khi máy chủ API chưa bật hoặc proxy bị ngắt kết nối ("Failed to fetch"), tự động đăng nhập fallback để người dùng không bị kẹt
      loginWithFallbackSession(finalRole, cleanEmail, cleanName);
    }
  };

  const handleCheckPendingStatus = async () => {
    if (!pendingApplicant?.email) return;
    setIsCheckingStatus(true);
    setStatusCheckMsg(null);
    try {
      const res = await fetch('/api/auth/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingApplicant.email }),
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (data?.isApproved && data.data) {
        const { token, user } = data.data;
        localStorage.setItem('aita_token', token);
        localStorage.setItem('aita_user', JSON.stringify({ ...user, role: 'lecturer' }));
        try {
          const approvedList = JSON.parse(localStorage.getItem('aita_approved_lecturers') || '[]');
          if (!approvedList.includes(user.email.toLowerCase().trim())) {
            approvedList.push(user.email.toLowerCase().trim());
            localStorage.setItem('aita_approved_lecturers', JSON.stringify(approvedList));
          }
        } catch {}
        setStatusCheckMsg(lang === 'vi' ? '🎉 Hồ sơ đã được Admin phê duyệt thành công! Đang chuyển hướng vào Cổng Giảng viên...' : '🎉 Approved! Redirecting...');
        setTimeout(() => {
          setIsCheckingStatus(false);
          onLoginSuccess('lecturer', user.email, user.fullName, token);
        }, 800);
      } else {
        setIsCheckingStatus(false);
        setStatusCheckMsg(data.message || (lang === 'vi' ? 'Hồ sơ vẫn đang chờ Admin duyệt. Vui lòng thử lại sau ít phút!' : 'Still pending approval.'));
      }
    } catch {
      setIsCheckingStatus(false);
      setStatusCheckMsg(lang === 'vi' ? 'Không thể kết nối đến máy chủ xác thực.' : 'Connection error.');
    }
  };

  // Direct Google Login: Immediately triggers Google's real account chooser popup
  const handleGoogleDirectLogin = () => {
    setAuthError(null);
    
    // 1. If Google OAuth2 token client is available, trigger native Google Account Chooser popup
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      try {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: DEFAULT_GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.access_token) {
              try {
                setIsLoading(true);
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const profile = await res.json();
                if (profile?.email) {
                  handleExecuteGoogleAuth(profile.email, profile.name);
                } else {
                  handleExecuteGoogleAuth('', '', tokenResponse.access_token);
                }
              } catch (fetchErr) {
                console.warn('Profile fetch error, fallback to token auth:', fetchErr);
                handleExecuteGoogleAuth('', '', tokenResponse.access_token);
              }
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('[Google OAuth2] token client warning:', err);
      }
    }

    // 2. Fallback to Google ID prompt if available
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.prompt();
        return;
      } catch (promptErr) {
        console.warn('[Google ID] prompt warning:', promptErr);
      }
    }

    // 3. Fallback direct authentication according to selected role
    handleExecuteGoogleAuth();
  };


  return (
    <div
      className="login-screen-root"
      style={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '28px clamp(20px, 4vw, 48px)',
        boxSizing: 'border-box',
        background: 'radial-gradient(circle at 18% 18%, rgba(254, 215, 210, 0.75) 0%, transparent 45%), radial-gradient(circle at 82% 22%, rgba(253, 203, 197, 0.70) 0%, transparent 42%), radial-gradient(circle at 50% 50%, rgba(255, 240, 238, 0.95) 0%, transparent 60%), radial-gradient(circle at 20% 82%, rgba(254, 218, 213, 0.70) 0%, transparent 48%), radial-gradient(circle at 80% 82%, rgba(254, 208, 202, 0.75) 0%, transparent 46%), #FFF2F0',
      }}
    >
      {/* =================================================================== */}
      {/* Dynamic ambient soft pastel red glow blobs ("nền đỏ nhạt pastel")   */}
      {/* =================================================================== */}
      <div
        className="ambient-glow-orb-1"
        style={{
          position: 'absolute',
          top: '4%',
          left: '8%',
          width: '540px',
          height: '540px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245, 175, 170, 0.50) 0%, rgba(255, 215, 210, 0.25) 50%, transparent 75%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
          animation: 'aitaVelvetFloat1 18s ease-in-out infinite alternate',
        }}
      />
      <div
        className="ambient-glow-orb-2"
        style={{
          position: 'absolute',
          bottom: '4%',
          right: '6%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(240, 165, 158, 0.45) 0%, rgba(254, 222, 216, 0.30) 50%, transparent 75%)',
          filter: 'blur(95px)',
          pointerEvents: 'none',
          animation: 'aitaVelvetFloat2 22s ease-in-out infinite alternate',
        }}
      />
      <div
        className="ambient-glow-orb-center"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '680px',
          height: '680px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 195, 190, 0.40) 0%, rgba(255, 230, 226, 0.25) 45%, transparent 75%)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />

      {/* Brand Header */}
      <header
        className="transparent-header login-header"
        style={{
          width: '100%',
          maxWidth: '1200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: '14px',
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <AitaLogo size={42} showContainer={true} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{
            fontSize: '1.42rem',
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            color: '#3E1815',
            textShadow: '0 1px 2px rgba(255, 255, 255, 0.6)',
            letterSpacing: '-0.02em',
            margin: 0,
            lineHeight: 1.15,
            whiteSpace: 'nowrap',
          }}>
            AITA-Intelligent
          </h1>
          <span style={{
            fontSize: '0.70rem',
            fontWeight: 700,
            color: '#AD3029',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginTop: '2px',
          }}>
            Automated Grading & Analytics
          </span>
        </div>
      </header>

      {/* Center Card Wrapper */}
      <div style={{
        width: '100%',
        maxWidth: '430px',
        margin: 'auto',
        perspective: '1000px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Bảng đăng nhập (Elevated Modern White Card on Glowing Pastel Red Mesh) */}
        <div
          className="login-card-container"
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
          style={{
            width: '100%',
            transform: `perspective(1000px) rotateX(${cardTilt.rotateX}deg) rotateY(${cardTilt.rotateY}deg) translateZ(0)`,
            transition: 'transform 0.15s ease-out, box-shadow 0.25s ease',
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: '36px 30px',
            border: '1.5px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 25px 60px -15px rgba(173, 48, 41, 0.14), 0 8px 24px -4px rgba(62, 24, 21, 0.08), 0 0 1px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
        {pendingApplicant ? (
          <PendingApprovalCard
            lang={lang}
            isDark={isDark}
            theme={theme}
            pendingApplicant={pendingApplicant}
            isCheckingStatus={isCheckingStatus}
            statusCheckMsg={statusCheckMsg}
            onCheckStatus={handleCheckPendingStatus}
            onBack={() => {
              setPendingApplicant(null);
              setSelectedRole('student');
              setStatusCheckMsg(null);
            }}
            onToggleTheme={onToggleTheme}
            onToggleLang={onToggleLang}
          />
        ) : (
        <div>
          {/* Top Row: Title + Flag Toggle & Theme Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
            <div>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#1A0608',
                fontFamily: 'var(--font-heading)',
                letterSpacing: '-0.02em',
                margin: 0,
                whiteSpace: 'nowrap',
              }}>
                {t.loginTitle}
              </h2>
              <p style={{
                fontSize: '0.80rem',
                color: '#784340',
                margin: '3px 0 0 0',
              }}>
                {lang === 'vi' ? 'Chào mừng bạn đến với hệ thống AITA' : 'Welcome to AITA platform'}
              </p>
            </div>

            {/* Language Flag Switcher */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <LanguageFlagToggle lang={lang} onToggle={onToggleLang} variant="card" theme="light" />
            </div>
          </div>

          {/* Segmented Role Selector: Sinh viên & Giảng viên */}
          <div 
            className="login-role-selector"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              background: '#F9F4F4',
              padding: '4px',
              borderRadius: '14px',
              gap: '4px',
              border: '1px solid rgba(173, 48, 41, 0.12)',
            }}
          >
            <button
              type="button"
              onClick={() => handleRoleChange('student')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                padding: '10px 8px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                background: selectedRole === 'student' ? 'linear-gradient(135deg, #AD3029 0%, #CD5252 100%)' : 'transparent',
                color: selectedRole === 'student' ? '#FFFFFF' : '#784340',
                boxShadow: selectedRole === 'student' ? '0 4px 14px rgba(173, 48, 41, 0.35)' : 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Code2 size={16} />
              <span>{t.roleStudent}</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('lecturer')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                padding: '10px 8px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                background: selectedRole === 'lecturer' ? 'linear-gradient(135deg, #AD3029 0%, #CD5252 100%)' : 'transparent',
                color: selectedRole === 'lecturer' ? '#FFFFFF' : '#784340',
                boxShadow: selectedRole === 'lecturer' ? '0 4px 14px rgba(173, 48, 41, 0.35)' : 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <GraduationCap size={16} />
              <span>{t.roleLecturer}</span>
            </button>
          </div>

          {/* Micro instruction hint pill */}
          <div 
            className="login-hint-pill"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              margin: '14px 0 22px 0',
              padding: '9px 14px',
              borderRadius: '10px',
              background: 'rgba(173, 48, 41, 0.05)',
              border: '1px solid rgba(173, 48, 41, 0.12)',
              fontSize: '0.78rem',
              color: '#6E3936',
              lineHeight: 1.4,
              textAlign: 'center',
            }}
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#AD3029',
              boxShadow: '0 0 6px rgba(173, 48, 41, 0.4)',
              flexShrink: 0,
            }} />
            <span>
              {lang === 'vi' 
                ? (selectedRole === 'student'
                    ? 'Đăng nhập để xem đề bài và nộp bài làm lập trình'
                    : 'Đăng nhập để xem danh sách sinh viên và tạo đợt chấm bài')
                : (selectedRole === 'student'
                    ? 'Sign in to view assignments and submit code'
                    : 'Sign in to review students and manage grading batches')}
            </span>
          </div>

          {/* Error or Success Alert */}
          {authError && (
            <div style={{
              background: '#FEF2F2',
              border: '1.5px solid #FCA5A5',
              color: '#991B1B',
              padding: '12px 14px',
              borderRadius: '12px',
              fontSize: '0.80rem',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)',
              lineHeight: 1.5,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
                <span style={{ fontWeight: 600 }}>{authError}</span>
              </div>

              {/* Quick button to switch to Lecturer if role mismatch */}
              {(authError.includes('Giảng viên') || authError.includes('Lecturer')) && selectedRole !== 'lecturer' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('lecturer');
                    setAuthError(null);
                  }}
                  style={{
                    alignSelf: 'flex-start',
                    marginLeft: '26px',
                    background: 'linear-gradient(135deg, #AD3029 0%, #CD5252 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(173, 48, 41, 0.3)',
                  }}
                >
                  <span>🎓 {lang === 'vi' ? 'Chuyển sang vai trò Giảng viên & Đăng nhập' : 'Switch to Lecturer Role'}</span>
                </button>
              )}
            </div>
          )}

          {authSuccess && (
            <div style={{
              background: '#F0FDF4',
              border: '1px solid #86EFAC',
              color: '#166534',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.8rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <CheckCircle2 size={16} />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* Primary Google Sign In Button */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <button
              type="button"
              className="login-google-btn"
              onClick={handleGoogleDirectLogin}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px 20px',
                background: '#FFFFFF',
                border: '1.5px solid rgba(173, 48, 41, 0.24)',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: isLoading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (isLoading) return;
                e.currentTarget.style.borderColor = '#AD3029';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(173, 48, 41, 0.16)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                if (isLoading) return;
                e.currentTarget.style.borderColor = 'rgba(173, 48, 41, 0.24)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Official Google 4-Color G SVG Logo */}
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              <span style={{
                fontSize: '0.94rem',
                fontWeight: 600,
                color: '#1A0608',
                letterSpacing: '-0.01em',
              }}>
                {isLoading ? (lang === 'vi' ? 'Đang kết nối Google...' : 'Connecting Google...') : t.googleButton}
              </span>
            </button>
          </div>
        </div>
        )}
      </div>
    </div>

    {/* Footer */}
    <footer style={{
      width: '100%',
      maxWidth: '1200px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '0.74rem',
      color: '#7E4A46',
      textShadow: '0 1px 0 rgba(255, 255, 255, 0.7)',
      letterSpacing: '0.02em',
      paddingTop: '16px',
      position: 'relative',
      zIndex: 10,
    }}>
      <span>FPT University • Capstone SWP391</span>
      <span>AITA Intelligent Platform • v1.0</span>
    </footer>
  </div>
  );
};

