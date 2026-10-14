import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, RefreshCw, UserCheck, Shield } from 'lucide-react';
import { Language } from '../translations';

interface LecturerApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  isDark: boolean;
  adminEmail: string;
}

export const LecturerApprovalModal: React.FC<LecturerApprovalModalProps> = ({
  isOpen,
  onClose,
  lang,
  isDark,
  adminEmail,
}) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingEmail, setActionLoadingEmail] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/lecturer-requests');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRequests(data.data);
      }
    } catch (e) {
      console.warn('Failed to fetch lecturer requests', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
      setToastMsg(null);
    }
  }, [isOpen]);

  const handleAction = async (email: string, action: 'approve' | 'reject') => {
    setActionLoadingEmail(email);
    setToastMsg(null);
    try {
      const res = await fetch('/api/auth/approve-lecturer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          action,
          reviewedBy: adminEmail,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToastMsg({ type: 'success', text: data.message });
        await fetchRequests();
      } else {
        setToastMsg({ type: 'error', text: data.message || 'Lỗi xử lý yêu cầu.' });
      }
    } catch {
      setToastMsg({ type: 'error', text: 'Lỗi kết nối đến máy chủ.' });
    } finally {
      setActionLoadingEmail(null);
    }
  };

  if (!isOpen) return null;

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.55)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
    }}>
      <div style={{
        background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '720px',
        maxHeight: '85vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
        border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: isDark ? '1px solid var(--border-light)' : '1px solid #F1F5F9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F5',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--color-kumquat), var(--color-orange-zest))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(217, 100, 31, 0.3)',
            }}>
              <Shield size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                  {lang === 'vi' ? 'Quản Lý & Duyệt Cấp Quyền Giảng Viên' : 'Lecturer Approvals & RBAC'}
                </h3>
                {pendingCount > 0 && (
                  <span style={{
                    background: '#EF4444',
                    color: '#FFF',
                    borderRadius: '20px',
                    padding: '2px 8px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                  }}>
                    {pendingCount} {lang === 'vi' ? 'chờ duyệt' : 'pending'}
                  </span>
                )}
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {lang === 'vi' 
                  ? 'Phê duyệt 1 lần duy nhất cho tài khoản Gmail được phép truy cập Cổng Giảng viên' 
                  : 'Approve authorized lecturer accounts for permanent portal access'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={fetchRequests}
              disabled={isLoading}
              title={lang === 'vi' ? 'Làm mới' : 'Refresh'}
              style={{
                background: 'transparent',
                border: isDark ? '1px solid var(--border-light)' : '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '7px',
                cursor: 'pointer',
                color: 'var(--text-body)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RefreshCw size={15} className={isLoading ? 'spin-anim' : ''} />
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                borderRadius: '8px',
                padding: '6px',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div style={{
            margin: '14px 24px 0 24px',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '0.80rem',
            fontWeight: 600,
            background: toastMsg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: toastMsg.type === 'success' ? '#059669' : '#DC2626',
            border: toastMsg.type === 'success' ? '1px solid #A7F3D0' : '1px solid #FECACA',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            {toastMsg.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
            <span>{toastMsg.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {isLoading && requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="spin-anim" style={{ margin: '0 auto 10px auto' }} />
              <p style={{ fontSize: '0.82rem' }}>{lang === 'vi' ? 'Đang tải danh sách hồ sơ...' : 'Loading requests...'}</p>
            </div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <UserCheck size={36} color="#10B981" style={{ margin: '0 auto 10px auto' }} />
              <p style={{ fontSize: '0.86rem', fontWeight: 700, margin: '0 0 4px 0' }}>
                {lang === 'vi' ? 'Không có hồ sơ nào đang chờ duyệt' : 'No pending requests'}
              </p>
              <p style={{ fontSize: '0.74rem', margin: 0 }}>
                {lang === 'vi' ? 'Tất cả các tài khoản giảng viên đã được phê duyệt đầy đủ.' : 'All lecturer accounts are approved.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {requests.map((req) => {
                const isPending = req.status === 'PENDING';
                const isApproved = req.status === 'APPROVED';
                const isActionLoading = actionLoadingEmail === req.email;

                return (
                  <div
                    key={req.id || req.email}
                    style={{
                      background: isDark ? 'var(--bg-surface-subtle)' : '#FFFFFF',
                      borderRadius: '14px',
                      padding: '16px',
                      border: isPending
                        ? (isDark ? '1.5px solid rgba(217, 100, 31, 0.4)' : '1.5px solid #FCD34D')
                        : (isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0'),
                      boxShadow: isPending ? '0 4px 14px rgba(217, 100, 31, 0.08)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            {req.fullName}
                          </span>
                          <span style={{
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: isApproved ? '#DCFCE7' : isPending ? '#FEF3C7' : '#FEE2E2',
                            color: isApproved ? '#166534' : isPending ? '#B45309' : '#991B1B',
                            border: isApproved ? '1px solid #BBF7D0' : isPending ? '1px solid #FDE68A' : '1px solid #FECACA',
                          }}>
                            {isApproved ? '✓ ĐÃ PHÊ DUYỆT' : isPending ? '⏳ CHỜ DUYỆT' : '✕ ĐÃ TỪ CHỐI'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-orange-zest)', marginTop: '2px' }}>
                          {req.email}
                        </div>
                      </div>

                      <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                        <div>{req.requestedAt || 'Hôm nay'}</div>
                        <div style={{ fontWeight: 600, color: 'var(--text-body)', marginTop: '2px' }}>
                          {req.department || 'Bộ môn Kỹ thuật phần mềm'}
                        </div>
                      </div>
                    </div>

                    {req.reason && (
                      <div style={{
                        fontSize: '0.74rem',
                        color: 'var(--text-muted)',
                        background: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontStyle: 'italic',
                      }}>
                        "{req.reason}"
                      </div>
                    )}

                    {/* Action Bar for Pending Requests */}
                    {isPending && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px', paddingTop: '10px', borderTop: isDark ? '1px solid var(--border-light)' : '1px solid #F1F5F9' }}>
                        <button
                          onClick={() => handleAction(req.email, 'reject')}
                          disabled={isActionLoading}
                          style={{
                            padding: '7px 14px',
                            borderRadius: '8px',
                            background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                            color: '#DC2626',
                            border: '1px solid #FCA5A5',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <XCircle size={14} />
                          <span>{lang === 'vi' ? 'Từ chối' : 'Reject'}</span>
                        </button>

                        <button
                          onClick={() => handleAction(req.email, 'approve')}
                          disabled={isActionLoading}
                          style={{
                            padding: '7px 16px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #10B981, #059669)',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: '0.76rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                          }}
                        >
                          <CheckCircle size={14} />
                          <span>{isActionLoading ? (lang === 'vi' ? 'Đang duyệt...' : 'Approving...') : (lang === 'vi' ? '✓ Phê Duyệt Cấp Quyền' : '✓ Approve Lecturer')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: isDark ? '1px solid var(--border-light)' : '1px solid #F1F5F9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: isDark ? 'var(--bg-surface-subtle)' : '#FCFBF7',
        }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {lang === 'vi' 
              ? 'Tài khoản sau khi duyệt sẽ được cập nhật quyền trong PostgreSQL và vào thẳng portal.' 
              : 'Approved accounts are updated in PostgreSQL and gain immediate access.'}
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '9px',
              background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
              border: isDark ? '1px solid var(--border-light)' : '1px solid #CBD5E1',
              color: 'var(--text-main)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {lang === 'vi' ? 'Đóng' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
