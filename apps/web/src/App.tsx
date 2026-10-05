import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { DashboardPortal } from './components/DashboardPortal';
import { Language } from './translations';

export const ADMIN_EMAILS = [
  'lenguyenanhmai05@gmail.com',
  'n133vy@gmail.com',
  'khanhlinh9a4tqd@gmail.com',
  'admin@aita.fpt.edu.vn',
  'admin@fpt.edu.vn',
];
export const isAdminEmail = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
};

export type Theme = 'light' | 'dark';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'lecturer' | 'student' | 'admin'>('student');
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
          setUserEmail(parsed.email);
          setUserFullName(parsed.fullName || parsed.name || 'Người dùng AITA');
          const isAdm = isAdminEmail(parsed.email);
          setUserRole(isAdm ? 'admin' : (parsed.role || 'student'));
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.warn('Could not parse saved session', e);
      }
    }
  }, []);

  const handleLoginSuccess = (role: 'lecturer' | 'student' | 'admin', email: string, fullName?: string) => {
    // Only designated admin emails can have role 'admin'
    const finalRole = isAdminEmail(email) ? 'admin' : (role === 'admin' ? 'student' : role);
    setUserRole(finalRole);
    setUserEmail(email);
    if (fullName) setUserFullName(fullName);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('aita_token');
    localStorage.removeItem('aita_user');
    setIsLoggedIn(false);
  };

  return (
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
  );
}

