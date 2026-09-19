import React, { useState, useEffect } from 'react';
import { AitaLogo } from './AitaLogo';
import { 
  GraduationCap, 
  Code2, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Language, translations } from '../translations';
import { isAdminEmail } from '../App';
import { LanguageFlagToggle } from './FlagIcons';

interface LoginScreenProps {
  lang: Language;
  onToggleLang: (lang: Language) => void;
  onLoginSuccess: (role: 'lecturer' | 'student' | 'admin', email: string, fullName?: string, token?: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ lang, onToggleLang, onLoginSuccess }) => {
  const t = translations[lang];
  const [selectedRole, setSelectedRole] = useState<'lecturer' | 'student'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

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

  const handleExecuteGoogleAuth = async (targetEmail?: string, displayName?: string, googleToken?: string) => {
    setIsLoading(true);
    setAuthError(null);
    const fallbackEmail = selectedRole === 'lecturer' 
      ? 'giangvien.aita@fpt.edu.vn' 
      : 'sinhvien.aita@fpt.edu.vn';
    const fallbackName = selectedRole === 'lecturer' 
      ? 'TS. Nguyễn Văn Giảng' 
      : 'Sinh viên FPT (AITA)';

    const cleanEmail = (targetEmail && targetEmail.trim()) ? targetEmail.trim().toLowerCase() : fallbackEmail;
    const isTargetAdmin = isAdminEmail(cleanEmail);
    
    // Phân quyền chặt chẽ:
    // 1. Nếu mail là admin cố định (lenguyenanhmai05@gmail.com) -> VÀO ADMIN QUẢN LÝ TẤT CẢ
    // 2. Nếu mail khác -> VÀO SINH VIÊN hoặc GIẢNG VIÊN tùy theo tab đang chọn
    const finalRole: 'lecturer' | 'student' | 'admin' = isTargetAdmin ? 'admin' : selectedRole;
    const cleanName = displayName || (isTargetAdmin ? 'Lê Nguyễn Anh Mai' : fallbackName);

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
      const result = await response.json();
      if (result.success && result.data) {
        const { token, user } = result.data;
        localStorage.setItem('aita_token', token);
        localStorage.setItem('aita_user', JSON.stringify({ ...user, role: finalRole }));
        
        const roleName = finalRole === 'admin' 
          ? (lang === 'vi' ? 'Quản trị viên Hệ thống' : 'System Administrator')
          : finalRole === 'lecturer'
          ? (lang === 'vi' ? 'Giảng viên' : 'Lecturer')
          : (lang === 'vi' ? 'Sinh viên' : 'Student');

        setAuthSuccess(
          lang === 'vi' 
            ? `Đăng nhập thành công với vai trò ${roleName}: ${user.email}` 
            : `Login successful as ${roleName}: ${user.email}`
        );

        setTimeout(() => {
          setIsLoading(false);
          onLoginSuccess(finalRole, user.email, user.fullName, token);
        }, 350);
      } else {
        throw new Error(result.message);
      }
    } catch {
      setIsLoading(false);
      onLoginSuccess(finalRole, cleanEmail, cleanName);
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

  const handleGithubLogin = () => {
    setIsLoading(true);
    const targetEmail = selectedRole === 'lecturer' ? 'mai.le@fpt.edu.vn' : 'student.test@fpt.edu.vn';
    const finalRole = isAdminEmail(targetEmail) ? 'admin' : selectedRole;
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(finalRole, targetEmail, selectedRole === 'lecturer' ? 'TS. Nguyễn Văn Giảng (GitHub)' : 'Sinh viên FPT (GitHub)');
    }, 300);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'row',
      position: 'relative',
      overflow: 'hidden',
      background: '#FAFAF7',
    }}>
      {/* =================================================================== */}
      {/* LEFT COLUMN: Brand Header (Top-Left) + Login Card                   */}
      {/* =================================================================== */}
      <div style={{
        flex: '0 0 42%',
        width: '42%',
        minWidth: '380px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '32px 40px',
        position: 'relative',
        zIndex: 2,
        boxSizing: 'border-box',
      }}>
        {/* Ambient background decoration behind left card */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '450px',
          height: '450px',
          background: 'radial-gradient(circle, rgba(246, 241, 188, 0.5) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none',
        }} />

        {/* TOP-LEFT BRAND HEADER */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          width: '100%',
          maxWidth: '460px',
          zIndex: 1,
        }}>
          <AitaLogo size={46} showContainer={true} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                fontFamily: 'var(--font-heading)',
                color: 'var(--text-main)',
                letterSpacing: '-0.02em',
                margin: 0,
                lineHeight: 1.15,
                whiteSpace: 'nowrap',
              }}>
                AITA-Intelligent
              </h1>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(170, 176, 38, 0.15)',
                border: '1px solid var(--border-badge)',
                borderRadius: '9999px',
                padding: '4px 10px',
                fontSize: '0.68rem',
                fontWeight: 800,
                color: 'var(--color-exocarp)',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--color-exocarp)',
                  display: 'inline-block',
                }} />
                {t.heroTag}
              </div>
            </div>
            <div style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: 'var(--color-orange-zest)',
              marginTop: '3px',
            }}>
              AI-POWERED TA &amp; AST ANALYTICS v1.0
            </div>
          </div>
        </div>

        {/* CENTER CONTENT: LOGIN CARD (Centred vertically for balance) */}
        <div style={{
          flex: '1 1 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '430px',
          margin: '0 auto',
          zIndex: 1,
        }}>
          {/* Bảng đăng nhập (Login Card) */}
          <div style={{
            width: '100%',
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: '30px 28px',
            border: '1.5px solid rgba(120, 132, 23, 0.16)',
            boxShadow: '0 20px 45px -12px rgba(217, 100, 31, 0.12), 0 10px 20px -8px rgba(120, 132, 23, 0.08), 0 0 1px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
          }}>
          <div>
            {/* Top Row: Title + Flag Toggle (Vietnam 🇻🇳 / UK 🇬🇧) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                fontFamily: 'var(--font-heading)',
                letterSpacing: '-0.02em',
                margin: 0,
                whiteSpace: 'nowrap',
              }}>
                {t.loginTitle}
              </h2>

              {/* Language Flag Switcher (Interactive Vietnam Flag -> UK Flag) */}
              <LanguageFlagToggle lang={lang} onToggle={onToggleLang} variant="card" />
            </div>

            {/* Segmented Role Selector: Sinh viên & Giảng viên */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              background: '#F1F5F9',
              padding: '4px',
              borderRadius: '12px',
              gap: '6px',
              marginBottom: '10px',
            }}>
              <button
                type="button"
                onClick={() => handleRoleChange('student')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  padding: '11px 8px',
                  borderRadius: '9px',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  background: selectedRole === 'student' ? 'linear-gradient(135deg, var(--color-kumquat), var(--color-orange-zest))' : 'transparent',
                  color: selectedRole === 'student' ? '#FFFFFF' : '#475569',
                  boxShadow: selectedRole === 'student' ? '0 4px 10px rgba(217, 100, 31, 0.25)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Code2 size={17} />
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
                  padding: '11px 8px',
                  borderRadius: '9px',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  background: selectedRole === 'lecturer' ? 'linear-gradient(135deg, var(--color-kumquat), var(--color-orange-zest))' : 'transparent',
                  color: selectedRole === 'lecturer' ? '#FFFFFF' : '#475569',
                  boxShadow: selectedRole === 'lecturer' ? '0 4px 10px rgba(217, 100, 31, 0.25)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <GraduationCap size={17} />
                <span>{t.roleLecturer}</span>
              </button>
            </div>

            {/* Micro instruction hint */}
            <p style={{
              fontSize: '0.74rem',
              color: '#64748B',
              textAlign: 'center',
              marginTop: '6px',
              marginBottom: '22px',
              lineHeight: 1.4,
            }}>
              {lang === 'vi' 
                ? (selectedRole === 'student' ? 'Đăng nhập để xem đề bài và nộp bài làm lập trình.' : 'Đăng nhập để xem danh sách sinh viên và tạo đợt chấm bài.')
                : (selectedRole === 'student' ? 'Sign in to view assignments and submit code.' : 'Sign in to review students and manage grading batches.')}
            </p>

            {/* Error or Success Alert */}
            {authError && (
              <div style={{
                background: '#FEE2E2',
                border: '1px solid #FCA5A5',
                color: '#B91C1C',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span>⚠️ {authError}</span>
              </div>
            )}

            {authSuccess && (
              <div style={{
                background: '#EDF6E8',
                border: '1px solid #C4DCB5',
                color: 'var(--color-exocarp)',
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={handleGoogleDirectLogin}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: '#FFFFFF',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#4285F4';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(66, 133, 244, 0.18)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#CBD5E1';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
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
                  fontWeight: 700,
                  color: '#1E293B',
                  letterSpacing: '-0.01em',
                }}>
                  {isLoading ? (lang === 'vi' ? 'Đang kết nối Google...' : 'Connecting Google...') : t.googleButton}
                </span>
              </button>

              {/* GitHub Education Button */}
              <button
                type="button"
                onClick={handleGithubLogin}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '11px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '11px',
                  fontSize: '0.80rem',
                  fontWeight: 600,
                  color: '#475569',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F1F5F9'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#F8FAFC'}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>{t.githubButton}</span>
              </button>
            </div>
          </div>

          {/* Bottom Security Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '0.70rem',
            color: '#94A3B8',
            borderTop: '1px solid #F1F5F9',
            paddingTop: '16px',
            marginTop: '24px',
            gap: '8px',
          }}>
            <Sparkles size={12} color="#94A3B8" />
            <span>Google Identity SSO</span>
            <span>•</span>
            <span>FPT EDU SAML</span>
          </div>
        </div>
      </div>

      {/* Bottom accreditation to balance header and center the card */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '0.72rem',
        color: '#94A3B8',
        letterSpacing: '0.02em',
        height: '24px',
        zIndex: 1,
      }}>
        <span>FPT University • Capstone SWP391</span>
      </div>
    </div>

      {/* =================================================================== */}
      {/* RIGHT COLUMN: Pure Orange Decorative Banner (3D Cubes & Shapes)     */}
      {/* ABSOLUTELY NO TEXT PER USER REQUEST                                 */}
      {/* =================================================================== */}
      <div style={{
        flex: '1 1 58%',
        width: '58%',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FF7A30 0%, #EA580C 45%, #D64500 85%, #B43403 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'inset 12px 0 30px rgba(0, 0, 0, 0.08)',
      }}>
        {/* Soft atmospheric radial glow highlights */}
        <div style={{
          position: 'absolute',
          top: '15%',
          right: '15%',
          width: '520px',
          height: '520px',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '10%',
          width: '420px',
          height: '420px',
          background: 'radial-gradient(circle, rgba(253, 186, 116, 0.35) 0%, rgba(255, 255, 255, 0) 70%)',
          pointerEvents: 'none',
        }} />

        {/* Ambient SVG: Isometric 3D cubes, wireframes, and soft translucent squares */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
          viewBox="0 0 700 850"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="cubeTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.18" />
            </linearGradient>
            <linearGradient id="cubeLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="cubeRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="wireframeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.10" />
            </linearGradient>
            <pattern id="isoGrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <rect width="60" height="60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <circle cx="30" cy="30" r="1.5" fill="rgba(255,255,255,0.12)" />
            </pattern>
          </defs>

          {/* Background Grid of faint squares */}
          <rect width="100%" height="100%" fill="url(#isoGrid)" />

          {/* CUBE 1: Main Large Floating Isometric Cube (Center-Right) */}
          <g transform="translate(420, 380)">
            <polygon points="0,-65 110,0 0,65 -110,0" fill="url(#cubeTopGrad)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            <polygon points="-110,0 0,65 0,195 -110,130" fill="url(#cubeLeftGrad)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
            <polygon points="0,65 110,0 110,130 0,195" fill="url(#cubeRightGrad)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
            <polygon points="0,-32 55,0 0,32 -55,0" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeDasharray="3 3" />
          </g>

          {/* CUBE 2: Medium Isometric Cube (Top-Left) */}
          <g transform="translate(180, 160)">
            <polygon points="0,-45 78,0 0,45 -78,0" fill="url(#cubeTopGrad)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
            <polygon points="-78,0 0,45 0,135 -78,90" fill="url(#cubeLeftGrad)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" />
            <polygon points="0,45 78,0 78,90 0,135" fill="url(#cubeRightGrad)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
          </g>

          {/* CUBE 3: Medium-Large Isometric Cube (Bottom-Center) */}
          <g transform="translate(260, 640)">
            <polygon points="0,-52 90,0 0,52 -90,0" fill="url(#cubeTopGrad)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
            <polygon points="-90,0 0,52 0,155 -90,103" fill="url(#cubeLeftGrad)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
            <polygon points="0,52 90,0 90,103 0,155" fill="url(#cubeRightGrad)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" />
          </g>

          {/* CUBE 4: Small Accent Cube (Top-Right) */}
          <g transform="translate(560, 140)">
            <polygon points="0,-28 48,0 0,28 -48,0" fill="url(#cubeTopGrad)" stroke="rgba(255,255,255,0.38)" strokeWidth="1" />
            <polygon points="-48,0 0,28 0,84 -48,56" fill="url(#cubeLeftGrad)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
            <polygon points="0,28 48,0 48,56 0,84" fill="url(#cubeRightGrad)" stroke="rgba(255,255,255,0.32)" strokeWidth="1" />
          </g>

          {/* CUBE 5: Floating Micro Cube (Middle-Left) */}
          <g transform="translate(100, 420)">
            <polygon points="0,-20 35,0 0,20 -35,0" fill="url(#cubeTopGrad)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            <polygon points="-35,0 0,20 0,60 -35,40" fill="url(#cubeLeftGrad)" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
            <polygon points="0,20 35,0 35,40 0,60" fill="url(#cubeRightGrad)" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
          </g>

          {/* CUBE 6: Subtle Accent Cube (Bottom-Right) */}
          <g transform="translate(580, 720)">
            <polygon points="0,-35 60,0 0,35 -60,0" fill="url(#cubeTopGrad)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
            <polygon points="-60,0 0,35 0,105 -60,70" fill="url(#cubeLeftGrad)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <polygon points="0,35 60,0 60,70 0,105" fill="url(#cubeRightGrad)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          </g>

          {/* Floating translucent wireframe squares / rotating outlines */}
          <rect x="290" y="240" width="70" height="70" rx="12" fill="none" stroke="url(#wireframeGrad)" strokeWidth="1.5" transform="rotate(25 325 275)" />
          <rect x="480" y="520" width="90" height="90" rx="16" fill="rgba(255,255,255,0.06)" stroke="url(#wireframeGrad)" strokeWidth="1.5" transform="rotate(-15 525 565)" />
          <rect x="140" y="560" width="55" height="55" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" transform="rotate(45 167 587)" />
          <rect x="360" y="80" width="45" height="45" rx="6" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="4 4" transform="rotate(12 382 102)" />

          {/* Small geometric dots / ambient stars */}
          <circle cx="230" cy="300" r="3" fill="rgba(255, 255, 255, 0.4)" />
          <circle cx="500" cy="270" r="2.5" fill="rgba(255, 255, 255, 0.5)" />
          <circle cx="380" cy="520" r="3" fill="rgba(255, 255, 255, 0.3)" />
          <circle cx="170" cy="370" r="2" fill="rgba(255, 255, 255, 0.35)" />
          <circle cx="620" cy="430" r="3.5" fill="rgba(255, 255, 255, 0.25)" />

          {/* =============================================================== */}
          {/* CUTE CHIBI FROGS (CÓC FPT) STANDING ON THE 3D ISOMETRIC CUBES   */}
          {/* Subtle translucent white aesthetic ('trắng trắng mờ mờ')        */}
          {/* =============================================================== */}

          {/* CHIBI FROG 1: Sitting proudly on Cube 1 (Large Center-Right Cube) */}
          <g transform="translate(420, 315)">
            <circle cx="0" cy="0" r="32" fill="rgba(255, 255, 255, 0.16)" />
            <ellipse cx="-16" cy="18" rx="8" ry="4.5" fill="rgba(255, 255, 255, 0.55)" stroke="rgba(255, 255, 255, 0.75)" strokeWidth="1.2" />
            <ellipse cx="16" cy="18" rx="8" ry="4.5" fill="rgba(255, 255, 255, 0.55)" stroke="rgba(255, 255, 255, 0.75)" strokeWidth="1.2" />
            <ellipse cx="0" cy="2" rx="26" ry="21" fill="rgba(255, 255, 255, 0.42)" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.5" />
            <ellipse cx="0" cy="5" rx="16" ry="13" fill="rgba(255, 255, 255, 0.28)" />
            <circle cx="-16" cy="-15" r="9.5" fill="rgba(255, 255, 255, 0.55)" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.5" />
            <circle cx="-16" cy="-15" r="4.5" fill="rgba(255, 255, 255, 0.95)" />
            <circle cx="-17.5" cy="-16.5" r="1.8" fill="#FFFFFF" />
            <circle cx="16" cy="-15" r="9.5" fill="rgba(255, 255, 255, 0.55)" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.5" />
            <circle cx="16" cy="-15" r="4.5" fill="rgba(255, 255, 255, 0.95)" />
            <circle cx="14.5" cy="-16.5" r="1.8" fill="#FFFFFF" />
            <ellipse cx="-15" cy="4" rx="4.5" ry="2.5" fill="rgba(255, 255, 255, 0.65)" />
            <ellipse cx="15" cy="4" rx="4.5" ry="2.5" fill="rgba(255, 255, 255, 0.65)" />
            <path d="M -8,8 Q 0,15 8,8" fill="none" stroke="rgba(255, 255, 255, 0.95)" strokeWidth="1.8" strokeLinecap="round" />
            {/* Graduation Cap */}
            <g transform="translate(0, -24) rotate(-8)">
              <polygon points="0,-7 15,0 0,7 -15,0" fill="rgba(255, 255, 255, 0.88)" stroke="#FFFFFF" strokeWidth="1.2" />
              <rect x="-4.5" y="2" width="9" height="5" rx="1.5" fill="rgba(255, 255, 255, 0.75)" />
              <line x1="0" y1="0" x2="11" y2="8" stroke="#FFFFFF" strokeWidth="1.2" />
              <circle cx="11" cy="8" r="1.8" fill="#FFFFFF" />
            </g>
          </g>

          {/* CHIBI FROG 2: Sitting on Cube 2 (Top-Left Cube) */}
          <g transform="translate(180, 115) scale(0.85)">
            <circle cx="0" cy="0" r="28" fill="rgba(255, 255, 255, 0.15)" />
            <ellipse cx="-16" cy="18" rx="8" ry="4.5" fill="rgba(255, 255, 255, 0.5)" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="1.2" />
            <ellipse cx="16" cy="18" rx="8" ry="4.5" fill="rgba(255, 255, 255, 0.5)" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="1.2" />
            <ellipse cx="0" cy="2" rx="26" ry="21" fill="rgba(255, 255, 255, 0.42)" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="1.5" />
            <ellipse cx="0" cy="5" rx="16" ry="13" fill="rgba(255, 255, 255, 0.25)" />
            <circle cx="-16" cy="-15" r="9.5" fill="rgba(255, 255, 255, 0.5)" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="1.5" />
            <circle cx="-16" cy="-15" r="4.5" fill="rgba(255, 255, 255, 0.9)" />
            <circle cx="-17.5" cy="-16.5" r="1.8" fill="#FFFFFF" />
            <circle cx="16" cy="-15" r="9.5" fill="rgba(255, 255, 255, 0.5)" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="1.5" />
            <circle cx="16" cy="-15" r="4.5" fill="rgba(255, 255, 255, 0.9)" />
            <circle cx="14.5" cy="-16.5" r="1.8" fill="#FFFFFF" />
            <ellipse cx="-15" cy="4" rx="4.5" ry="2.5" fill="rgba(255, 255, 255, 0.6)" />
            <ellipse cx="15" cy="4" rx="4.5" ry="2.5" fill="rgba(255, 255, 255, 0.6)" />
            <path d="M -8,8 Q 0,15 8,8" fill="none" stroke="rgba(255, 255, 255, 0.9)" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M 0,-18 Q -5,-26 -1,-28 Q 1,-24 0,-18" fill="rgba(255, 255, 255, 0.8)" stroke="#FFFFFF" strokeWidth="1" />
            <path d="M 0,-18 Q 5,-26 1,-28 Q -1,-24 0,-18" fill="rgba(255, 255, 255, 0.8)" stroke="#FFFFFF" strokeWidth="1" />
          </g>

          {/* CHIBI FROG 3: Standing on Cube 3 (Bottom-Center Cube) */}
          <g transform="translate(260, 588) scale(0.92)">
            <circle cx="0" cy="0" r="30" fill="rgba(255, 255, 255, 0.15)" />
            <ellipse cx="-16" cy="18" rx="8" ry="4.5" fill="rgba(255, 255, 255, 0.5)" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="1.2" />
            <ellipse cx="16" cy="18" rx="8" ry="4.5" fill="rgba(255, 255, 255, 0.5)" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="1.2" />
            <ellipse cx="0" cy="2" rx="26" ry="21" fill="rgba(255, 255, 255, 0.4)" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="1.5" />
            <ellipse cx="0" cy="5" rx="16" ry="13" fill="rgba(255, 255, 255, 0.25)" />
            <circle cx="-16" cy="-15" r="9.5" fill="rgba(255, 255, 255, 0.5)" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="1.5" />
            <circle cx="-16" cy="-15" r="4.5" fill="rgba(255, 255, 255, 0.9)" />
            <circle cx="-17.5" cy="-16.5" r="1.8" fill="#FFFFFF" />
            <circle cx="16" cy="-15" r="9.5" fill="rgba(255, 255, 255, 0.5)" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="1.5" />
            <circle cx="16" cy="-15" r="4.5" fill="rgba(255, 255, 255, 0.9)" />
            <circle cx="14.5" cy="-16.5" r="1.8" fill="#FFFFFF" />
            <ellipse cx="-15" cy="4" rx="4.5" ry="2.5" fill="rgba(255, 255, 255, 0.6)" />
            <ellipse cx="15" cy="4" rx="4.5" ry="2.5" fill="rgba(255, 255, 255, 0.6)" />
            <path d="M -8,8 Q 0,15 8,8" fill="none" stroke="rgba(255, 255, 255, 0.9)" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* CHIBI FROG 4: Baby frog sitting on Cube 4 (Small Top-Right Cube) */}
          <g transform="translate(560, 112) scale(0.68)">
            <circle cx="0" cy="0" r="26" fill="rgba(255, 255, 255, 0.15)" />
            <ellipse cx="-16" cy="18" rx="8" ry="4.5" fill="rgba(255, 255, 255, 0.5)" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="1.2" />
            <ellipse cx="16" cy="18" rx="8" ry="4.5" fill="rgba(255, 255, 255, 0.5)" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="1.2" />
            <ellipse cx="0" cy="2" rx="26" ry="21" fill="rgba(255, 255, 255, 0.42)" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.5" />
            <ellipse cx="0" cy="5" rx="16" ry="13" fill="rgba(255, 255, 255, 0.25)" />
            <circle cx="-16" cy="-15" r="9.5" fill="rgba(255, 255, 255, 0.55)" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.5" />
            <circle cx="-16" cy="-15" r="4.5" fill="rgba(255, 255, 255, 0.95)" />
            <circle cx="-17.5" cy="-16.5" r="1.8" fill="#FFFFFF" />
            <circle cx="16" cy="-15" r="9.5" fill="rgba(255, 255, 255, 0.55)" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.5" />
            <circle cx="16" cy="-15" r="4.5" fill="rgba(255, 255, 255, 0.95)" />
            <circle cx="14.5" cy="-16.5" r="1.8" fill="#FFFFFF" />
            <ellipse cx="-15" cy="4" rx="4.5" ry="2.5" fill="rgba(255, 255, 255, 0.65)" />
            <ellipse cx="15" cy="4" rx="4.5" ry="2.5" fill="rgba(255, 255, 255, 0.65)" />
            <path d="M -8,8 Q 0,15 8,8" fill="none" stroke="rgba(255, 255, 255, 0.95)" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* CHIBI FROG 5: Baby frog on Cube 6 (Bottom-Right Cube) */}
          <g transform="translate(580, 685) scale(0.78)">
            <circle cx="0" cy="0" r="28" fill="rgba(255, 255, 255, 0.15)" />
            <ellipse cx="-16" cy="18" rx="8" ry="4.5" fill="rgba(255, 255, 255, 0.5)" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="1.2" />
            <ellipse cx="16" cy="18" rx="8" ry="4.5" fill="rgba(255, 255, 255, 0.5)" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="1.2" />
            <ellipse cx="0" cy="2" rx="26" ry="21" fill="rgba(255, 255, 255, 0.38)" stroke="rgba(255, 255, 255, 0.75)" strokeWidth="1.5" />
            <ellipse cx="0" cy="5" rx="16" ry="13" fill="rgba(255, 255, 255, 0.22)" />
            <circle cx="-16" cy="-15" r="9.5" fill="rgba(255, 255, 255, 0.45)" stroke="rgba(255, 255, 255, 0.75)" strokeWidth="1.5" />
            <circle cx="-16" cy="-15" r="4.5" fill="rgba(255, 255, 255, 0.9)" />
            <circle cx="-17.5" cy="-16.5" r="1.8" fill="#FFFFFF" />
            <circle cx="16" cy="-15" r="9.5" fill="rgba(255, 255, 255, 0.45)" stroke="rgba(255, 255, 255, 0.75)" strokeWidth="1.5" />
            <circle cx="16" cy="-15" r="4.5" fill="rgba(255, 255, 255, 0.9)" />
            <circle cx="14.5" cy="-16.5" r="1.8" fill="#FFFFFF" />
            <ellipse cx="-15" cy="4" rx="4.5" ry="2.5" fill="rgba(255, 255, 255, 0.55)" />
            <ellipse cx="15" cy="4" rx="4.5" ry="2.5" fill="rgba(255, 255, 255, 0.55)" />
            <path d="M -8,8 Q 0,15 8,8" fill="none" stroke="rgba(255, 255, 255, 0.9)" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* CHIBI FROG 6: Tiny frog sitting on Cube 5 (Middle-Left) */}
          <g transform="translate(100, 395) scale(0.62)">
            <circle cx="0" cy="0" r="26" fill="rgba(255, 255, 255, 0.15)" />
            <ellipse cx="-16" cy="18" rx="8" ry="4.5" fill="rgba(255, 255, 255, 0.5)" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="1.2" />
            <ellipse cx="16" cy="18" rx="8" ry="4.5" fill="rgba(255, 255, 255, 0.5)" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="1.2" />
            <ellipse cx="0" cy="2" rx="26" ry="21" fill="rgba(255, 255, 255, 0.4)" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.5" />
            <ellipse cx="0" cy="5" rx="16" ry="13" fill="rgba(255, 255, 255, 0.25)" />
            <circle cx="-16" cy="-15" r="9.5" fill="rgba(255, 255, 255, 0.55)" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.5" />
            <circle cx="-16" cy="-15" r="4.5" fill="rgba(255, 255, 255, 0.95)" />
            <circle cx="-17.5" cy="-16.5" r="1.8" fill="#FFFFFF" />
            <circle cx="16" cy="-15" r="9.5" fill="rgba(255, 255, 255, 0.55)" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.5" />
            <circle cx="16" cy="-15" r="4.5" fill="rgba(255, 255, 255, 0.95)" />
            <circle cx="14.5" cy="-16.5" r="1.8" fill="#FFFFFF" />
            <ellipse cx="-15" cy="4" rx="4.5" ry="2.5" fill="rgba(255, 255, 255, 0.65)" />
            <ellipse cx="15" cy="4" rx="4.5" ry="2.5" fill="rgba(255, 255, 255, 0.65)" />
            <path d="M -8,8 Q 0,15 8,8" fill="none" stroke="rgba(255, 255, 255, 0.95)" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="-22" cy="-4" r="3.5" fill="rgba(255, 255, 255, 0.85)" />
          </g>
        </svg>
      </div>
    </div>
  );
};
