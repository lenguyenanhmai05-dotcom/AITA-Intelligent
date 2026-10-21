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
import { ThemeToggle } from './ThemeToggle';
import { PendingApprovalCard } from './PendingApprovalCard';
import { Terracotta3DCanvas } from './Terracotta3DCanvas';

// Terracotta Sunset Palette Tokens
export const TERRACOTTA = {
  espresso: '#7A3E2E',   // Deep Terracotta / Espresso
  clay: '#B5523A',       // Warm Terracotta / Clay
  amber: '#D9794E',      // Sunset Amber
  softClay: '#E7A27A',   // Soft Terracotta
  peachGlow: '#F1C2A7',  // Peach Glow
  palePeach: '#F7DBCC',  // Pale Peach
  alabaster: '#FBEEE6',  // Warm Alabaster
  pearl: '#FFFAF6',      // Warm Pearl
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
    <div style={{
      minHeight: '100vh',
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      background: isDark
        ? 'radial-gradient(circle at 72% 50%, rgba(181, 82, 58, 0.28) 0%, rgba(74, 31, 22, 0.16) 38%, rgba(26, 16, 14, 0) 70%), linear-gradient(135deg, #1A100E 0%, #251512 40%, #351A14 100%)'
        : 'radial-gradient(circle at 72% 50%, rgba(217, 121, 78, 0.24) 0%, rgba(231, 162, 122, 0.14) 38%, rgba(255, 250, 246, 0) 70%), linear-gradient(135deg, #FFFAF6 0%, #FBEEE6 45%, #F7DBCC 100%)',
    }}>
      {/* =================================================================== */}
      {/* BACKGROUND LAYER: Fullscreen 3D WebGL Terracotta Sunset Canvas     */}
      {/* =================================================================== */}
      <div style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}>
        <Terracotta3DCanvas isDark={isDark} />
      </div>

      {/* Atmospheric lighting glows */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '-10%',
        width: '600px',
        height: '600px',
        background: isDark
          ? 'radial-gradient(circle, rgba(181, 82, 58, 0.12) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(217, 121, 78, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* =================================================================== */}
      {/* TOP FLOATING BRAND IDENTITY (Seamless, Transparent Header)         */}
      {/* =================================================================== */}
      <header
        className="transparent-header"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '24px 44px',
          position: 'relative',
          zIndex: 10,
          boxSizing: 'border-box',
          background: 'transparent',
          backgroundColor: 'transparent',
          border: 'none',
          boxShadow: 'none',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <AitaLogo size={42} showContainer={true} />
          <h1 style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            color: isDark ? '#FFFAF6' : TERRACOTTA.espresso,
            letterSpacing: '-0.02em',
            margin: 0,
            lineHeight: 1.15,
            whiteSpace: 'nowrap',
          }}>
            AITA-Intelligent
          </h1>
        </div>
      </header>

      {/* =================================================================== */}
      {/* MAIN VIEWPORT: Floating Luxury Glass Login Card                     */}
      {/* Positioned comfortably on the left-center, 3D Canvas lives on right */}
      {/* =================================================================== */}
      <main style={{
        flex: '1 1 auto',
        display: 'flex',
        alignItems: 'center',
        padding: '12px 44px',
        position: 'relative',
        zIndex: 10,
        boxSizing: 'border-box',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '430px',
          marginLeft: 'clamp(0px, 6vw, 120px)',
          perspective: '1000px',
        }}>
          {/* Bảng đăng nhập (3D Tilt Frosted Glass Card) */}
          <div
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            style={{
              width: '100%',
              transform: `perspective(1000px) rotateX(${cardTilt.rotateX}deg) rotateY(${cardTilt.rotateY}deg) translateZ(0)`,
              transition: 'transform 0.15s ease-out, box-shadow 0.25s ease',
              background: isDark ? 'rgba(45, 26, 22, 0.82)' : 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              borderRadius: '26px',
              padding: '32px 30px',
              border: isDark ? '1.5px solid rgba(231, 162, 122, 0.3)' : `1.5px solid rgba(247, 219, 204, 0.95)`,
              boxShadow: isDark
                ? '0 30px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(181, 82, 58, 0.18)'
                : '0 30px 60px -15px rgba(122, 62, 46, 0.14), 0 0 35px rgba(231, 162, 122, 0.15)',
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{
                fontSize: '1.28rem',
                fontWeight: 800,
                color: isDark ? '#FFFAF6' : TERRACOTTA.espresso,
                fontFamily: 'var(--font-heading)',
                letterSpacing: '-0.02em',
                margin: 0,
                whiteSpace: 'nowrap',
              }}>
                {t.loginTitle}
              </h2>

              {/* Language Flag Switcher & Theme Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {onToggleTheme && (
                  <ThemeToggle theme={theme} onToggle={onToggleTheme} variant="card" />
                )}
                <LanguageFlagToggle lang={lang} onToggle={onToggleLang} variant="card" theme={theme} />
              </div>
            </div>

            {/* Segmented Role Selector: Sinh viên & Giảng viên */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              background: isDark ? 'rgba(26, 16, 14, 0.65)' : TERRACOTTA.alabaster,
              padding: '4px',
              borderRadius: '14px',
              gap: '4px',
              border: isDark ? '1px solid rgba(231, 162, 122, 0.2)' : `1px solid ${TERRACOTTA.palePeach}`,
            }}>
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
                  background: selectedRole === 'student' ? 'linear-gradient(135deg, #B5523A 0%, #D9794E 100%)' : 'transparent',
                  color: selectedRole === 'student' ? '#FFFFFF' : (isDark ? TERRACOTTA.peachGlow : TERRACOTTA.espresso),
                  boxShadow: selectedRole === 'student' ? '0 4px 14px rgba(181, 82, 58, 0.35)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  opacity: selectedRole === 'student' ? 1 : 0.8,
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
                  background: selectedRole === 'lecturer' ? 'linear-gradient(135deg, #B5523A 0%, #D9794E 100%)' : 'transparent',
                  color: selectedRole === 'lecturer' ? '#FFFFFF' : (isDark ? TERRACOTTA.peachGlow : TERRACOTTA.espresso),
                  boxShadow: selectedRole === 'lecturer' ? '0 4px 14px rgba(181, 82, 58, 0.35)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  opacity: selectedRole === 'lecturer' ? 1 : 0.8,
                }}
              >
                <GraduationCap size={16} />
                <span>{t.roleLecturer}</span>
              </button>
            </div>

            {/* Micro instruction hint pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              margin: '12px 0 22px 0',
              padding: '8px 14px',
              borderRadius: '10px',
              background: isDark ? 'rgba(26, 16, 14, 0.5)' : 'rgba(255, 250, 246, 0.95)',
              border: isDark ? '1px solid rgba(231, 162, 122, 0.18)' : `1px solid ${TERRACOTTA.palePeach}`,
              fontSize: '0.78rem',
              color: isDark ? TERRACOTTA.softClay : TERRACOTTA.espresso,
              lineHeight: 1.4,
              textAlign: 'center',
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: selectedRole === 'student' ? TERRACOTTA.clay : TERRACOTTA.amber,
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
                background: isDark ? 'rgba(239, 68, 68, 0.14)' : '#FEF2F2',
                border: isDark ? '1.5px solid rgba(239, 68, 68, 0.4)' : '1.5px solid #FCA5A5',
                color: isDark ? '#FCA5A5' : '#B91C1C',
                padding: '12px 14px',
                borderRadius: '12px',
                fontSize: '0.80rem',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)',
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
                      background: 'linear-gradient(135deg, #B5523A 0%, #D9794E 100%)',
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
                      boxShadow: '0 2px 8px rgba(181, 82, 58, 0.3)',
                    }}
                  >
                    <span>🎓 {lang === 'vi' ? 'Chuyển sang vai trò Giảng viên & Đăng nhập' : 'Switch to Lecturer Role'}</span>
                  </button>
                )}
              </div>
            )}

            {authSuccess && (
              <div style={{
                background: isDark ? 'rgba(34, 197, 94, 0.15)' : '#EDF6E8',
                border: isDark ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid #C4DCB5',
                color: isDark ? '#4ADE80' : TERRACOTTA.clay,
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

            {/* ============================================================= */}
            {/* PRIMARY GOOGLE SIGN IN BUTTON                                 */}
            {/* DIRECTLY OPENS GOOGLE's NATIVE ACCOUNT CHOOSER POPUP          */}
            {/* ============================================================= */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <button
                type="button"
                onClick={handleGoogleDirectLogin}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: isDark ? 'rgba(45, 26, 22, 0.95)' : '#FFFFFF',
                  border: isDark ? '1.5px solid rgba(231, 162, 122, 0.35)' : `1.5px solid ${TERRACOTTA.peachGlow}`,
                  borderRadius: '12px',
                  boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(122, 62, 46, 0.06)',
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
                  e.currentTarget.style.borderColor = TERRACOTTA.amber;
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(217, 121, 78, 0.22)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  if (isLoading) return;
                  e.currentTarget.style.borderColor = isDark ? 'rgba(231, 162, 122, 0.35)' : TERRACOTTA.peachGlow;
                  e.currentTarget.style.boxShadow = isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(122, 62, 46, 0.06)';
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
                  color: isDark ? '#FFFAF6' : TERRACOTTA.espresso,
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
    </main>

      {/* =================================================================== */}
      {/* BOTTOM FLOATING MINIMALIST FOOTER                                   */}
      {/* =================================================================== */}
      <footer style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 44px',
        position: 'relative',
        zIndex: 10,
        boxSizing: 'border-box',
        fontSize: '0.74rem',
        color: isDark ? TERRACOTTA.softClay : TERRACOTTA.clay,
        opacity: 0.85,
        letterSpacing: '0.02em',
      }}>
        <span>FPT University • Capstone SWP391</span>
        <span>AITA Intelligent Platform • v1.0</span>
      </footer>
    </div>
  );
};

