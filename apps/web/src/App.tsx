import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { DashboardPortal } from './components/DashboardPortal';
import { Language } from './translations';
import { GitAuthProvider } from './contexts/GitAuthContext';

export const ADMIN_EMAILS = [
  'lenguyenanhmai05@gmail.com',
  'tuongvy22102004@gmail.com',
  'n133vy@gmail.com',
  'khanhlinh9a4tqd@gmail.com',
  'admin@aita.fpt.edu.vn',
  'admin@fpt.edu.vn',
];
export const isAdminEmail = (email: string): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
};

export const resolveUserDisplayName = (email?: string, rawName?: string): string => {
  const cleanEmail = (email || '').toLowerCase().trim();
  if (cleanEmail === 'lenguyenlinhnhi2110@gmail.com' || cleanEmail.includes('linhnhi') || cleanEmail.includes('khanhlinh')) {
    return 'Lê Nguyễn Linh Nhi';
  }
  if (cleanEmail.includes('lenguyenanhmai') || cleanEmail.includes('anhmai')) {
    return 'Lê Nguyễn Anh Mai';
  }
  if (cleanEmail.includes('tuongvy') || cleanEmail.includes('n133vy')) {
    return 'Nguyễn Tường Vy';
  }
  if (cleanEmail.includes('ngosuvietanh')) {
    return 'Ngô Sử Việt Anh';
  }
  if (cleanEmail.includes('nghiadao')) {
    return 'Đào Trọng Nghĩa';
  }
  if (cleanEmail.includes('giangnv')) {
    return 'TS. Nguyễn Văn Giảng';
  }
  if (rawName && !rawName.includes('?') && !rawName.includes('\uFFFD') && rawName.trim().length > 1) {
    return rawName.trim();
  }
  if (cleanEmail) {
    const prefix = cleanEmail.split('@')[0];
    return prefix
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  return 'Sinh viên';
};

export type Theme = 'light' | 'dark';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<'lecturer' | 'student' | 'admin'>('admin');
  const [userEmail, setUserEmail] = useState<string>('lenguyenanhmai05@gmail.com');
  const [userFullName, setUserFullName] = useState<string>('Lê Nguyễn Anh Mai');
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('aita_lang') as Language) || 'vi';
  });
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('aita_theme') as Theme) || 'light';
  });

  const handleToggleLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('aita_lang', newLang);
  };

  const handleToggleTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('aita_theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    // Check saved session on load
    const savedUser = localStorage.getItem('aita_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.email) {
          const email = parsed.email.trim().toLowerCase();
          const role = isAdminEmail(email) ? 'admin' : (parsed.role || 'student');
          setUserEmail(parsed.email);
          const cleanName = resolveUserDisplayName(email, parsed.fullName || parsed.name);
          parsed.fullName = cleanName;
          try {
            localStorage.setItem('aita_user', JSON.stringify(parsed));
          } catch {}
          setUserFullName(cleanName);
          setUserRole(role);
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.warn('Could not parse saved session', e);
      }
    } else {
      // Default initial session: lenguyenanhmai05@gmail.com is ADMIN!
      setUserEmail('lenguyenanhmai05@gmail.com');
      setUserFullName('Lê Nguyễn Anh Mai');
      setUserRole('admin');
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = (role: 'lecturer' | 'student' | 'admin', email: string, fullName?: string) => {
    const finalRole = isAdminEmail(email) ? 'admin' : role;
    const cleanName = resolveUserDisplayName(email, fullName);
    setUserRole(finalRole);
    setUserEmail(email);
    setUserFullName(cleanName);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('aita_token');
    localStorage.removeItem('aita_user');
    setIsLoggedIn(false);
  };

  return (
    <GitAuthProvider>
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        {isLoggedIn ? (
          <DashboardPortal
            role={userRole}
            userEmail={userEmail}
            userFullName={userFullName}
            lang={lang}
            onToggleLang={handleToggleLang}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onLogout={handleLogout}
          />
        ) : (
          <LoginScreen
            lang={lang}
            onToggleLang={handleToggleLang}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </div>
    </GitAuthProvider>
  );
}
