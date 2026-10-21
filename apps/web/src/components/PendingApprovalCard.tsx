import React from 'react';
import { Clock, RefreshCw, ArrowLeft } from 'lucide-react';
import { Language } from '../translations';
import { Theme } from '../App';
import { LanguageFlagToggle } from './FlagIcons';
import { ThemeToggle } from './ThemeToggle';

interface PendingApprovalCardProps {
  lang: Language;
  isDark: boolean;
  theme?: Theme;
  pendingApplicant: {
    fullName: string;
    email: string;
    status: string;
    requestedAt?: string;
    department?: string;
  };
  isCheckingStatus: boolean;
  statusCheckMsg: string | null;
  onCheckStatus: () => void;
  onBack: () => void;
  onToggleTheme?: (theme: Theme) => void;
  onToggleLang?: (lang: Language) => void;
}

export const PendingApprovalCard: React.FC<PendingApprovalCardProps> = ({
  lang,
  isDark,
  theme,
  pendingApplicant,
  isCheckingStatus,
  statusCheckMsg,
  onCheckStatus,
  onBack,
  onToggleTheme,
  onToggleLang,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Top Header of Pending Screen */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '9px',
            background: 'rgba(217, 100, 31, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-orange-zest)',
          }}>
            <Clock size={19} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
              {lang === 'vi' ? 'Xét Duyệt Hồ Sơ Giảng Viên' : 'Lecturer Account Approval'}
            </h3>
            <span style={{ fontSize: '0.66rem', color: 'var(--color-orange-zest)', fontWeight: 700 }}>
              {lang === 'vi' ? 'BẢO MẬT PHÂN QUYỀN AITA' : 'AITA RBAC SECURITY'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onToggleTheme && <ThemeToggle theme={theme || (isDark ? 'dark' : 'light')} onToggle={onToggleTheme} variant="card" />}
          {onToggleLang && <LanguageFlagToggle lang={lang} onToggle={onToggleLang} variant="card" theme={theme || (isDark ? 'dark' : 'light')} />}
        </div>
      </div>

      {/* Status Stepper Tracker */}
      <div style={{
        background: isDark ? 'var(--bg-surface-subtle)' : '#F8FAFC',
        borderRadius: '14px',
        padding: '14px 16px',
        marginBottom: '18px',
        border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0',
      }}>
        <div style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px' }}>
          {lang === 'vi' ? 'TIẾN TRÌNH KÍCH HOẠT VAI TRÒ' : 'ROLE ACTIVATION PROGRESS'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          {/* Step 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: '#10B981',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 800,
            }}>
              ✓
            </div>
            <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#10B981', marginTop: '4px' }}>
              {lang === 'vi' ? '1. Đăng ký' : '1. Register'}
            </span>
          </div>

          <div style={{ flex: 1, height: '2px', background: 'var(--color-orange-zest)', margin: '0 6px', marginTop: '-14px' }} />

          {/* Step 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-kumquat), var(--color-orange-zest))',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 800,
              boxShadow: '0 0 10px rgba(217, 100, 31, 0.4)',
            }}>
              ⏳
            </div>
            <span style={{ fontSize: '0.66rem', fontWeight: 800, color: 'var(--color-orange-zest)', marginTop: '4px' }}>
              {lang === 'vi' ? '2. Admin Duyệt' : '2. Approval'}
            </span>
          </div>

          <div style={{ flex: 1, height: '2px', background: isDark ? '#334155' : '#CBD5E1', margin: '0 6px', marginTop: '-14px' }} />

          {/* Step 3 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: isDark ? '#334155' : '#E2E8F0',
              color: isDark ? '#94A3B8' : '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.72rem',
              fontWeight: 700,
            }}>
              🔒
            </div>
            <span style={{ fontSize: '0.66rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '4px' }}>
              {lang === 'vi' ? '3. Kích hoạt' : '3. Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Applicant Details Box */}
      <div style={{
        background: isDark ? 'rgba(217, 100, 31, 0.08)' : '#FFFBEB',
        border: isDark ? '1px solid rgba(217, 100, 31, 0.25)' : '1.5px solid #FDE68A',
        borderRadius: '12px',
        padding: '14px 16px',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{lang === 'vi' ? 'Họ và tên:' : 'Full Name:'}</span>
          <span style={{ fontSize: '0.80rem', fontWeight: 800, color: 'var(--text-main)' }}>{pendingApplicant.fullName}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Email:</span>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-orange-zest)' }}>{pendingApplicant.email}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{lang === 'vi' ? 'Vai trò yêu cầu:' : 'Requested Role:'}</span>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#D97706' }}>🎓 {lang === 'vi' ? 'Giảng viên (Lecturer)' : 'Lecturer'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{lang === 'vi' ? 'Trạng thái:' : 'Status:'}</span>
          <span style={{
            fontSize: '0.70rem',
            fontWeight: 800,
            background: '#FEF3C7',
            color: '#B45309',
            padding: '2px 8px',
            borderRadius: '6px',
            border: '1px solid #FCD34D',
          }}>
            ⏳ {lang === 'vi' ? 'ĐANG CHỜ ADMIN DUYỆT' : 'PENDING APPROVAL'}
          </span>
        </div>
      </div>

      {/* Notice message */}
      <p style={{
        fontSize: '0.73rem',
        color: isDark ? 'var(--text-muted)' : '#64748B',
        textAlign: 'center',
        lineHeight: 1.45,
        margin: '0 0 16px 0',
      }}>
        {lang === 'vi'
          ? 'Hồ sơ đã được gửi đến Quản trị viên (lenguyenanhmai05@gmail.com). Sau khi Admin phê duyệt 1 lần duy nhất, bạn sẽ có quyền truy cập vĩnh viễn vào Cổng Giảng viên!'
          : 'Request submitted to Admin. Once approved, you will have permanent access to the Lecturer Portal.'}
      </p>

      {/* Status Message feedback if any */}
      {statusCheckMsg && (
        <div style={{
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '0.76rem',
          marginBottom: '14px',
          background: statusCheckMsg.includes('phê duyệt') || statusCheckMsg.includes('Approved') ? '#ECFDF5' : (isDark ? '#334155' : '#F1F5F9'),
          color: statusCheckMsg.includes('phê duyệt') || statusCheckMsg.includes('Approved') ? '#059669' : 'var(--text-main)',
          border: statusCheckMsg.includes('phê duyệt') || statusCheckMsg.includes('Approved') ? '1px solid #A7F3D0' : '1px solid #CBD5E1',
          textAlign: 'center',
          fontWeight: 600,
        }}>
          {statusCheckMsg}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          type="button"
          onClick={onCheckStatus}
          disabled={isCheckingStatus}
          style={{
            width: '100%',
            padding: '12px',
            background: 'linear-gradient(135deg, var(--color-kumquat), var(--color-orange-zest))',
            color: '#FFFFFF',
            borderRadius: '11px',
            border: 'none',
            fontSize: '0.84rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 3px 10px rgba(217, 100, 31, 0.3)',
          }}
        >
          <RefreshCw size={15} />
          <span>{isCheckingStatus ? (lang === 'vi' ? 'Đang kiểm tra...' : 'Checking...') : (lang === 'vi' ? 'Kiểm Tra Trạng Thái Duyệt' : 'Check Approval Status')}</span>
        </button>

        <button
          type="button"
          onClick={onBack}
          style={{
            width: '100%',
            padding: '10px',
            background: 'transparent',
            color: isDark ? 'var(--text-muted)' : '#64748B',
            borderRadius: '10px',
            border: isDark ? '1px solid var(--border-light)' : '1px solid #CBD5E1',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <ArrowLeft size={14} />
          <span>{lang === 'vi' ? 'Quay lại màn hình đăng nhập' : 'Back to Login'}</span>
        </button>
      </div>
    </div>
  );
};
