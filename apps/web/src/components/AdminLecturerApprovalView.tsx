import React, { useState } from 'react';
import { UserCheck, UserX, RefreshCw, Clock, CheckCircle2, XCircle, Search, ShieldCheck } from 'lucide-react';
import { Language } from '../translations';

interface AdminLecturerApprovalViewProps {
  lang: Language;
  isDark: boolean;
  adminEmail: string;
  requests: any[];
  isLoading?: boolean;
  actionLoadingEmail: string | null;
  onRefresh: () => void;
  onApprove: (email: string) => void;
  onReject: (email: string) => void;
  isCompact?: boolean;
  onOpenFullView?: () => void;
}

export const AdminLecturerApprovalView: React.FC<AdminLecturerApprovalViewProps> = ({
  lang,
  isDark,
  adminEmail,
  requests,
  isLoading = false,
  actionLoadingEmail,
  onRefresh,
  onApprove,
  onReject,
  isCompact = false,
  onOpenFullView,
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const approvedRequests = requests.filter((r) => r.status === 'APPROVED');
  const rejectedRequests = requests.filter((r) => r.status === 'REJECTED');

  const filteredRequests = requests.filter((r) => {
    const matchesFilter = filterStatus === 'ALL' || r.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      r.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.department?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{
      background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
      borderRadius: '20px',
      border: isDark ? '1px solid var(--border-light)' : '1px solid rgba(16, 185, 129, 0.25)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
      marginBottom: '24px',
    }}>
      {/* Header bar */}
      <div style={{
        padding: isCompact ? '18px 24px' : '24px 28px',
        borderBottom: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0',
        background: isDark
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.05) 100%)'
          : 'linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
            flexShrink: 0,
          }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{
                fontSize: isCompact ? '1.10rem' : '1.25rem',
                fontWeight: 800,
                margin: 0,
                color: 'var(--text-main)',
                fontFamily: 'var(--font-heading)',
              }}>
                {lang === 'vi' ? 'Phê Duyệt Tài Khoản Giảng Viên' : 'Lecturer Account Approvals'}
              </h3>
              {pendingRequests.length > 0 && (
                <span style={{
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '0.70rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.35)',
                }}>
                  {pendingRequests.length} {lang === 'vi' ? 'chờ duyệt' : 'pending'}
                </span>
              )}
            </div>
            <p style={{
              margin: '3px 0 0 0',
              fontSize: '0.80rem',
              color: 'var(--text-body)',
            }}>
              {lang === 'vi'
                ? `Quản trị viên (${adminEmail}) xem xét & phê duyệt lần đầu cho Giảng viên tham gia chấm bài.`
                : `Administrator (${adminEmail}) reviews and authorizes lecturer access.`}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              background: isDark ? 'var(--bg-surface-subtle)' : '#FFFFFF',
              border: isDark ? '1px solid var(--border-light)' : '1px solid #CBD5E1',
              borderRadius: '9px',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title={lang === 'vi' ? 'Tải lại danh sách mới nhất' : 'Refresh requests'}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>{lang === 'vi' ? 'Làm mới' : 'Refresh'}</span>
          </button>

          {isCompact && onOpenFullView && (
            <button
              type="button"
              onClick={onOpenFullView}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                border: 'none',
                borderRadius: '9px',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#FFFFFF',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
              }}
            >
              <span>{lang === 'vi' ? 'Xem toàn bộ' : 'View all'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Counter Bar (when not compact) */}
      {!isCompact && (
        <div style={{
          padding: '16px 28px',
          background: isDark ? 'var(--bg-surface-subtle)' : '#F8FAFC',
          borderBottom: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
        }}>
          <div style={{
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            padding: '12px 16px',
            borderRadius: '12px',
            border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0',
          }}>
            <span style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {lang === 'vi' ? 'TỔNG SỐ HỒ SƠ' : 'TOTAL APPLICANTS'}
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '2px' }}>
              {requests.length}
            </div>
          </div>

          <div style={{
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            padding: '12px 16px',
            borderRadius: '12px',
            border: isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #FECACA',
          }}>
            <span style={{ fontSize: '0.70rem', fontWeight: 700, color: '#EF4444' }}>
              {lang === 'vi' ? 'ĐANG CHỜ PHÊ DUYỆT' : 'PENDING APPROVAL'}
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#EF4444', marginTop: '2px' }}>
              {pendingRequests.length}
            </div>
          </div>

          <div style={{
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            padding: '12px 16px',
            borderRadius: '12px',
            border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #A7F3D0',
          }}>
            <span style={{ fontSize: '0.70rem', fontWeight: 700, color: '#059669' }}>
              {lang === 'vi' ? 'ĐÃ PHÊ DUYỆT (GIẢNG VIÊN)' : 'APPROVED LECTURERS'}
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#059669', marginTop: '2px' }}>
              {approvedRequests.length}
            </div>
          </div>

          <div style={{
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            padding: '12px 16px',
            borderRadius: '12px',
            border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0',
          }}>
            <span style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {lang === 'vi' ? 'ĐÃ TỪ CHỐI' : 'REJECTED'}
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-muted)', marginTop: '2px' }}>
              {rejectedRequests.length}
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      {!isCompact && (
        <div style={{
          padding: '14px 28px',
          borderBottom: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: filterStatus === st
                    ? (st === 'PENDING' ? '#EF4444' : st === 'APPROVED' ? '#10B981' : 'var(--color-orange-zest)')
                    : (isDark ? 'var(--bg-surface-subtle)' : '#F1F5F9'),
                  color: filterStatus === st ? '#FFFFFF' : 'var(--text-body)',
                  transition: 'all 0.15s ease',
                }}
              >
                {st === 'ALL'
                  ? (lang === 'vi' ? 'Tất cả' : 'All')
                  : st === 'PENDING'
                  ? (lang === 'vi' ? `Chờ duyệt (${pendingRequests.length})` : `Pending (${pendingRequests.length})`)
                  : st === 'APPROVED'
                  ? (lang === 'vi' ? 'Đã duyệt' : 'Approved')
                  : (lang === 'vi' ? 'Đã từ chối' : 'Rejected')}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'vi' ? 'Tìm theo email, tên...' : 'Search by email, name...'}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                borderRadius: '8px',
                border: isDark ? '1px solid var(--border-light)' : '1px solid #CBD5E1',
                background: isDark ? 'var(--bg-surface-subtle)' : '#FFFFFF',
                color: 'var(--text-main)',
                fontSize: '0.78rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      )}

      {/* Content: List of applicants */}
      <div style={{ padding: isCompact ? '16px 20px' : '20px 28px' }}>
        {filteredRequests.length === 0 ? (
          <div style={{
            padding: '36px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
          }}>
            <ShieldCheck size={36} style={{ margin: '0 auto 10px', opacity: 0.5, color: '#10B981' }} />
            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
              {lang === 'vi' ? 'Không có yêu cầu phê duyệt nào phù hợp.' : 'No matching requests found.'}
            </div>
            <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
              {lang === 'vi'
                ? 'Khi có giảng viên đăng ký lần đầu (ví dụ: lenguyenanhmai113@gmail.com), yêu cầu sẽ xuất hiện tại đây để Admin duyệt.'
                : 'When new lecturers register, their approval requests will appear here.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredRequests.map((req) => {
              const isPending = req.status === 'PENDING';
              const isApproved = req.status === 'APPROVED';
              const isActionLoading = actionLoadingEmail === req.email;

              return (
                <div
                  key={req.id || req.email}
                  style={{
                    background: isDark ? 'var(--bg-surface-subtle)' : '#FAF9F6',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    border: isPending
                      ? (isDark ? '1.5px solid rgba(239, 68, 68, 0.4)' : '1.5px solid #FCA5A5')
                      : (isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0'),
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Left: Applicant details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '280px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: isApproved
                        ? 'linear-gradient(135deg, #10B981, #059669)'
                        : isPending
                        ? 'linear-gradient(135deg, var(--color-kumquat), var(--color-orange-zest))'
                        : '#94A3B8',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      flexShrink: 0,
                    }}>
                      {req.fullName ? req.fullName.split(' ').map((n: string) => n[0]).slice(-2).join('').toUpperCase() : 'GV'}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.90rem', color: 'var(--text-main)' }}>
                          {req.fullName || req.email.split('@')[0]}
                        </span>
                        {/* Status Badge */}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          background: isApproved
                            ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7')
                            : isPending
                            ? (isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2')
                            : (isDark ? 'rgba(148, 163, 184, 0.2)' : '#F1F5F9'),
                          color: isApproved ? '#059669' : isPending ? '#DC2626' : '#64748B',
                          border: isApproved
                            ? '1px solid #86EFAC'
                            : isPending
                            ? '1px solid #FCA5A5'
                            : '1px solid #CBD5E1',
                        }}>
                          {isApproved && <CheckCircle2 size={11} />}
                          {isPending && <Clock size={11} />}
                          {req.status === 'REJECTED' && <XCircle size={11} />}
                          <span>
                            {isApproved
                              ? (lang === 'vi' ? 'ĐÃ DUYỆT (GIẢNG VIÊN)' : 'APPROVED')
                              : isPending
                              ? (lang === 'vi' ? 'CHỜ ADMIN DUYỆT' : 'PENDING')
                              : (lang === 'vi' ? 'TỪ CHỐI' : 'REJECTED')}
                          </span>
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-body)', marginTop: '3px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'monospace', color: 'var(--color-orange-zest)', fontWeight: 700 }}>
                          {req.email}
                        </span>
                        <span>•</span>
                        <span>{req.department || 'Bộ môn Kỹ thuật phần mềm (SE)'}</span>
                      </div>

                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                        ⏰ {lang === 'vi' ? 'Yêu cầu lúc:' : 'Requested at:'} {req.requestedAt}
                        {req.reviewedBy && (
                          <span style={{ marginLeft: '10px', color: '#059669', fontWeight: 600 }}>
                            ✓ {lang === 'vi' ? `Admin (${req.reviewedBy}) duyệt lúc:` : `Approved by ${req.reviewedBy} at:`} {req.reviewedAt}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onApprove(req.email)}
                          disabled={isActionLoading}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            background: 'linear-gradient(135deg, #10B981, #059669)',
                            border: 'none',
                            borderRadius: '9px',
                            color: '#FFFFFF',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            cursor: isActionLoading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 3px 10px rgba(16, 185, 129, 0.35)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <UserCheck size={14} />
                          <span>{isActionLoading ? 'Đang xử lý...' : (lang === 'vi' ? 'Phê Duyệt Cấp Quyền' : 'Approve')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onReject(req.email)}
                          disabled={isActionLoading}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '8px 14px',
                            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                            border: '1px solid #EF4444',
                            borderRadius: '9px',
                            color: '#DC2626',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: isActionLoading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <UserX size={14} />
                          <span>{lang === 'vi' ? 'Từ chối' : 'Reject'}</span>
                        </button>
                      </>
                    ) : isApproved ? (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 14px',
                        borderRadius: '9px',
                        background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
                        color: '#059669',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                      }}>
                        <CheckCircle2 size={14} />
                        <span>{lang === 'vi' ? 'Tài khoản Giảng viên đã kích hoạt' : 'Active Lecturer'}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onApprove(req.email)}
                        disabled={isActionLoading}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: isDark ? 'var(--bg-surface-subtle)' : '#FFFFFF',
                          border: isDark ? '1px solid var(--border-light)' : '1px solid #CBD5E1',
                          borderRadius: '8px',
                          color: 'var(--text-main)',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <RefreshCw size={12} />
                        <span>{lang === 'vi' ? 'Phê duyệt lại' : 'Re-approve'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
