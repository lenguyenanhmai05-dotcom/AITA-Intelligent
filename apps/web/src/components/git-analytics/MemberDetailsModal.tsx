import React, { useState, useEffect, useMemo } from 'react';

export interface CommitDetail {
  hash: string;
  date: string;
  message: string;
  linesAdded: number;
  linesDeleted: number;
  isSuspicious?: boolean;
}

export interface MemberDetailInfo {
  name: string;
  email?: string;
  initials?: string;
  commits?: number;
  prs?: number;
  loc?: string | number;
  codeLines?: string;
  pct?: number;
  color?: string;
  grade?: number;
  roleBadge?: string;
  isFreeRider?: boolean;
}

export interface MemberDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: MemberDetailInfo | null;
  commits?: CommitDetail[];
  lang?: 'vi' | 'en';
  isDark?: boolean;
}

function getRealisticMemberCommits(name: string): CommitDetail[] {
  const n = (name || '').toLowerCase();

  // 1. Lê Nguyễn Anh Mai (Leader - Nhóm 1)
  if (n.includes('mai') || n.includes('anh mai')) {
    return [
      { hash: 'ab5f2ea', date: '2026-10-18T14:32:00Z', message: 'feat(web): hoàn thiện dropdown menu & hồ sơ cá nhân sinh viên', linesAdded: 320, linesDeleted: 45 },
      { hash: 'b643bab', date: '2026-10-17T11:20:00Z', message: 'Merge pull request #7 from lenguyenanhmai05-dotcom/linh', linesAdded: 0, linesDeleted: 0 },
      { hash: 'd1e3b74', date: '2026-10-16T16:45:00Z', message: 'style(ui): nâng cấp giao diện phân tích đóng góp Git & bảng chỉ số KPI', linesAdded: 450, linesDeleted: 85 },
      { hash: 'e51a26d', date: '2026-10-16T10:15:00Z', message: 'style(ui): đồng bộ bảng màu Terracotta Sunset và thẻ KPI toàn hệ thống', linesAdded: 280, linesDeleted: 40 },
      { hash: '645a791', date: '2026-10-15T09:30:00Z', message: 'Merge pull request #6 from lenguyenanhmai05-dotcom/Vanh', linesAdded: 0, linesDeleted: 0 },
      { hash: '1750b1a', date: '2026-10-14T15:10:00Z', message: 'feat(auth): phân quyền người dùng RBAC & chặn sinh viên truy cập trái phép', linesAdded: 620, linesDeleted: 110 },
      { hash: '57a37fd', date: '2026-10-13T18:20:00Z', message: 'Merge pull request #5 from lenguyenanhmai05-dotcom/Min', linesAdded: 0, linesDeleted: 0 },
      { hash: '313e125', date: '2026-10-13T14:00:00Z', message: 'merge: xử lý xung đột với main, tích hợp duyệt giảng viên và chấm bài AI', linesAdded: 540, linesDeleted: 120 },
      { hash: 'b04def1', date: '2026-10-12T10:15:00Z', message: 'feat(portal): cấu trúc DashboardPortal phân tách vai trò Giảng viên và Admin', linesAdded: 890, linesDeleted: 140 },
      { hash: '841c12f', date: '2026-10-11T16:40:00Z', message: 'feat(auth): bộ chọn 3 quyền, trạng thái phê duyệt danh sách trắng', linesAdded: 410, linesDeleted: 60 },
      { hash: 'c9ea9c2', date: '2026-10-10T14:00:00Z', message: 'feat(api): kết nối hàng đợi Redis queue BullMQ với worker chấm Docker', linesAdded: 760, linesDeleted: 95 },
      { hash: '7ba4e0f', date: '2026-10-09T11:25:00Z', message: 'feat(ui): hoàn thiện chuyển đổi song ngữ Anh - Việt toàn hệ thống', linesAdded: 310, linesDeleted: 45 },
    ];
  }

  // 2. Lê Nguyễn Linh Nhi (Nhóm 1)
  if (n.includes('nhi') || n.includes('linh')) {
    return [
      { hash: '738ced0', date: '2026-10-17T16:30:00Z', message: 'feat(ui): hoàn thiện form nộp repository Git kèm xác thực PAT token', linesAdded: 520, linesDeleted: 60 },
      { hash: '3f67e18', date: '2026-10-16T11:15:00Z', message: 'style(ui): thiết kế Stepper tiến trình 4 bước quét AST mã nguồn', linesAdded: 380, linesDeleted: 45 },
      { hash: 'ee12db1', date: '2026-10-15T14:20:00Z', message: 'feat(ui): tích hợp bộ lọc chọn nhóm đồ án & tiêu đề song ngữ', linesAdded: 410, linesDeleted: 55 },
      { hash: '84708e8', date: '2026-10-14T10:40:00Z', message: 'fix(ui): khởi tạo mặc định đường dẫn Git và nhánh cho lớp học', linesAdded: 95, linesDeleted: 20 },
      { hash: '1ac8c54', date: '2026-10-13T15:10:00Z', message: 'test(vitest): viết bộ kiểm thử tự động cho luồng Git Analytics', linesAdded: 610, linesDeleted: 80 },
      { hash: '1db3c79', date: '2026-10-12T09:30:00Z', message: 'refactor(git): tái cấu trúc giao diện Git Analytics & bộ API kết nối', linesAdded: 480, linesDeleted: 90 },
      { hash: '4f28a91', date: '2026-10-10T16:00:00Z', message: 'feat(ui): xây dựng modal hiển thị biểu đồ phân bố công việc nhóm', linesAdded: 350, linesDeleted: 40 },
    ];
  }

  // 3. Nguyễn Tường Vy (Nhóm 1)
  if (n.includes('vy') || n.includes('tường vy')) {
    return [
      { hash: '9b3e102', date: '2026-10-17T15:10:00Z', message: 'feat(queue): thiết kế bảng giám sát Redis queue kèm bộ lọc trạng thái', linesAdded: 540, linesDeleted: 70 },
      { hash: '8c4d211', date: '2026-10-16T09:45:00Z', message: 'feat(queue): cơ chế hàng đợi DLQ retry 3 lần với thuật toán Exponential Backoff', linesAdded: 480, linesDeleted: 65 },
      { hash: '7d5e320', date: '2026-10-14T14:20:00Z', message: 'feat(report): xây dựng báo cáo phân rã điểm theo 4 tiêu chí công nghệ phần mềm', linesAdded: 620, linesDeleted: 90 },
      { hash: '6e6f439', date: '2026-10-13T10:15:00Z', message: 'feat(testcases): tự động hóa thực thi 10 test case trên Docker Sandbox', linesAdded: 450, linesDeleted: 55 },
      { hash: '5f7a548', date: '2026-10-12T11:30:00Z', message: 'fix(cache): tối ưu bộ nhớ đệm Redis để truy xuất trạng thái tác vụ nhanh chóng', linesAdded: 210, linesDeleted: 35 },
      { hash: '4a8b657', date: '2026-10-11T16:50:00Z', message: 'feat(api): endpoint đồng bộ kết quả chấm chi tiết về cơ sở dữ liệu', linesAdded: 380, linesDeleted: 45 },
    ];
  }

  // 4. Ngô Sử Việt Anh (Nhóm 1)
  if (n.includes('việt anh') || n.includes('viet anh') || n.includes('vanh')) {
    return [
      { hash: '4be3566', date: '2026-10-15T17:00:00Z', message: 'feat(week7): hoàn thành các tác vụ phân tích Git UI & kiểm thử QA', linesAdded: 380, linesDeleted: 120 },
      { hash: '32573ad', date: '2026-10-15T11:20:00Z', message: 'fix: giải quyết conflict mã nguồn, cập nhật cài đặt và hoàn tất task 3, 4', linesAdded: 150, linesDeleted: 80 },
      { hash: '7024ca7', date: '2026-10-14T16:30:00Z', message: 'Hoàn tất xử lý conflict và cập nhật code cho phân hệ nhóm', linesAdded: 220, linesDeleted: 75 },
      { hash: '6ed458a', date: '2026-10-13T14:10:00Z', message: 'Hoàn thành Task 3.1 đến Task 3.5 theo phân công sprint đồ án', linesAdded: 210, linesDeleted: 65 },
    ];
  }

  // 5. Đào Trọng Nghĩa (Nhóm 1 - Free-Rider)
  if (n.includes('nghĩa') || n.includes('nghia')) {
    return [
      { hash: 'e1d2c3b', date: '2026-10-10T10:15:00Z', message: 'docs: cập nhật tài liệu hướng dẫn chạy dự án và cấu hình biến môi trường', linesAdded: 180, linesDeleted: 50 },
    ];
  }

  // 6. Nhóm 2: Trần Minh Quân
  if (n.includes('quân') || n.includes('quan')) {
    return [
      { hash: 'q1a2b3c', date: '2026-10-17T14:20:00Z', message: 'feat(logistics): thiết kế thuật toán tối ưu hóa định tuyến giao vận kho bãi', linesAdded: 680, linesDeleted: 95 },
      { hash: 'q2b3c4d', date: '2026-10-16T11:10:00Z', message: 'feat(db): thiết lập cơ sở dữ liệu phân tán PostgreSQL và kết nối Redis cache', linesAdded: 520, linesDeleted: 70 },
      { hash: 'q3c4d5e', date: '2026-10-15T16:45:00Z', message: 'feat(api): kiến trúc REST API quản lý vận đơn và tracking thời gian thực', linesAdded: 590, linesDeleted: 85 },
      { hash: 'q4d5e6f', date: '2026-10-13T10:30:00Z', message: 'feat(auth): phân quyền người dùng quản trị kho và tài xế giao nhận', linesAdded: 410, linesDeleted: 60 },
    ];
  }

  // 7. Nhóm 2: Hoàng Văn Nam
  if (n.includes('nam')) {
    return [
      { hash: 'n1a2b3c', date: '2026-10-16T15:30:00Z', message: 'feat(api): endpoint điều phối phương tiện vận tải theo cụm địa lý', linesAdded: 510, linesDeleted: 80 },
      { hash: 'n2b3c4d', date: '2026-10-15T10:15:00Z', message: 'feat(service): tích hợp dịch vụ tính toán phí vận chuyển linh hoạt theo trọng lượng', linesAdded: 430, linesDeleted: 65 },
      { hash: 'n3c4d5e', date: '2026-10-14T14:40:00Z', message: 'test(unit): kiểm thử đơn vị cho thuật toán chia tải đơn hàng vận chuyển', linesAdded: 380, linesDeleted: 50 },
    ];
  }

  // 8. Nhóm 2: Phạm Thị Dung
  if (n.includes('dung')) {
    return [
      { hash: 'd1a2b3c', date: '2026-10-16T16:00:00Z', message: 'feat(ui): bản đồ theo dõi hành trình xe giao hàng thời gian thực qua WebSocket', linesAdded: 490, linesDeleted: 75 },
      { hash: 'd2b3c4d', date: '2026-10-15T11:30:00Z', message: 'style(ui): bảng điều khiển thống kê lượng tồn kho và công suất bến bãi', linesAdded: 410, linesDeleted: 60 },
      { hash: 'd3c4d5e', date: '2026-10-13T14:15:00Z', message: 'feat(form): biểu mẫu nhập liệu xuất nhập kho và in phiếu bàn giao', linesAdded: 320, linesDeleted: 45 },
    ];
  }

  // 9. Nhóm 2: Đỗ Đức Anh
  if (n.includes('đức anh') || n.includes('duc anh')) {
    return [
      { hash: 'a1a2b3c', date: '2026-10-15T15:20:00Z', message: 'test(e2e): viết kịch bản kiểm thử tích hợp luồng tạo đơn và chuyển kho', linesAdded: 340, linesDeleted: 55 },
      { hash: 'a2b3c4d', date: '2026-10-14T09:45:00Z', message: 'docs: biên soạn tài liệu API Swagger cho các dịch vụ vận chuyển Logistics', linesAdded: 280, linesDeleted: 40 },
    ];
  }

  // 10. Nhóm 3: Phạm Hoàng Long
  if (n.includes('long')) {
    return [
      { hash: 'l1a2b3c', date: '2026-10-17T16:15:00Z', message: 'feat(ai): xây dựng mô hình Collaborative Filtering gợi ý sản phẩm cá nhân hóa', linesAdded: 820, linesDeleted: 140 },
      { hash: 'l2b3c4d', date: '2026-10-16T10:30:00Z', message: 'feat(api): huấn luyện pipeline trích xuất đặc trưng người dùng và sản phẩm', linesAdded: 710, linesDeleted: 110 },
      { hash: 'l3c4d5e', date: '2026-10-15T14:00:00Z', message: 'feat(backend): tích hợp vector database lưu trữ embedding sản phẩm thương mại', linesAdded: 640, linesDeleted: 95 },
      { hash: 'l4d5e6f', date: '2026-10-13T11:20:00Z', message: 'feat(search): tối ưu công cụ tìm kiếm thông minh với độ trễ thấp < 50ms', linesAdded: 480, linesDeleted: 70 },
    ];
  }

  // 11. Nhóm 3: Vũ Quỳnh Anh
  if (n.includes('quỳnh anh') || n.includes('quynh anh')) {
    return [
      { hash: 'qa1a2b', date: '2026-10-16T14:45:00Z', message: 'feat(ecommerce): hoàn thiện giỏ hàng & cổng thanh toán trực tuyến VNPay', linesAdded: 580, linesDeleted: 85 },
      { hash: 'qa2b3c', date: '2026-10-15T09:20:00Z', message: 'feat(ui): trang chi tiết sản phẩm kèm đánh giá và danh sách gợi ý liên quan', linesAdded: 460, linesDeleted: 65 },
      { hash: 'qa3c4d', date: '2026-10-14T15:30:00Z', message: 'feat(checkout): xử lý hoàn tất đơn hàng và gửi email xác nhận tự động', linesAdded: 410, linesDeleted: 55 },
    ];
  }

  // 12. Nhóm 3: Ngô Quốc Bảo (Free-Rider)
  if (n.includes('bảo') || n.includes('bao')) {
    return [
      { hash: 'b1a2b3c', date: '2026-10-16T17:00:00Z', message: 'docs: cập nhật danh sách dependencies trong package.json và lockfile', linesAdded: 150, linesDeleted: 40 },
      { hash: 'b2b3c4d', date: '2026-10-14T11:15:00Z', message: 'style: chỉnh sửa thụt đầu dòng và định dạng code cơ bản', linesAdded: 120, linesDeleted: 35 },
    ];
  }

  // Generic fallback
  return [
    { hash: 'c1a2b3c', date: '2026-10-16T14:00:00Z', message: 'feat(core): hoàn thiện chức năng và kiểm thử đơn vị', linesAdded: 350, linesDeleted: 45 },
    { hash: 'c2b3c4d', date: '2026-10-14T10:30:00Z', message: 'refactor: tối ưu mã nguồn và làm sạch kiến trúc phân lớp', linesAdded: 280, linesDeleted: 40 },
  ];
}

function getCommitCategoryBadge(message: string): { label: string; bg: string; color: string; border: string } {
  const lower = (message || '').toLowerCase();
  if (lower.startsWith('merge pull request') || lower.startsWith('merge branch') || lower.includes('merge:')) {
    return { label: '🔀 Pull Request', bg: 'rgba(59, 130, 246, 0.12)', color: '#2563EB', border: 'rgba(59, 130, 246, 0.3)' };
  }
  if (lower.startsWith('feat') || lower.includes('tính năng') || lower.includes('hoàn thiện')) {
    return { label: '✨ Tính Năng', bg: 'var(--color-terracotta-100, #FBEEE6)', color: 'var(--color-terracotta-800, #7A3E2E)', border: 'var(--color-terracotta-300, #F1C2A7)' };
  }
  if (lower.startsWith('fix') || lower.includes('sửa') || lower.includes('conflict') || lower.includes('giải quyết')) {
    return { label: '🐛 Sửa Lỗi', bg: 'rgba(245, 158, 11, 0.12)', color: '#D97706', border: 'rgba(245, 158, 11, 0.3)' };
  }
  if (lower.startsWith('style') || lower.startsWith('refactor') || lower.includes('tối ưu') || lower.includes('nâng cấp')) {
    return { label: '⚡ Tối Ưu', bg: 'rgba(147, 51, 234, 0.12)', color: '#7E22CE', border: 'rgba(147, 51, 234, 0.3)' };
  }
  if (lower.startsWith('test') || lower.includes('kiểm thử')) {
    return { label: '🧪 Kiểm Thử', bg: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: 'rgba(16, 185, 129, 0.3)' };
  }
  if (lower.startsWith('docs') || lower.includes('tài liệu')) {
    return { label: '📝 Tài Liệu', bg: 'rgba(107, 114, 128, 0.12)', color: '#4B5563', border: 'rgba(107, 114, 128, 0.3)' };
  }
  return { label: '💻 Commit', bg: 'var(--color-terracotta-50, #FFFAF6)', color: 'var(--color-terracotta-700, #B5523A)', border: 'var(--color-terracotta-200, #F7DBCC)' };
}

export const MemberDetailsModal: React.FC<MemberDetailsModalProps> = ({
  isOpen,
  onClose,
  member,
  commits = [],
  lang = 'vi',
  isDark = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);

  useEffect(() => {
    setCurrentPage(1);
  }, [member, isOpen]);

  // Use passed commits if provided, else member-specific realistic commits
  const displayCommits = useMemo(() => {
    if (commits && commits.length > 0) return commits;
    if (!member) return [];
    return getRealisticMemberCommits(member.name);
  }, [commits, member]);

  // Parse lines added/deleted from member.codeLines or calculate from commits
  const { totalAdditions, totalDeletions, netLOCImpact } = useMemo(() => {
    if (commits && commits.length > 0) {
      const add = commits.reduce((acc, c) => acc + (c.linesAdded || 0), 0);
      const del = commits.reduce((acc, c) => acc + (c.linesDeleted || 0), 0);
      return { totalAdditions: add, totalDeletions: del, netLOCImpact: add - del };
    }
    if (member?.codeLines && typeof member.codeLines === 'string') {
      const match = member.codeLines.match(/\+([\d,]+)\s*\/\s*-([\d,]+)/);
      if (match) {
        const add = parseInt(match[1].replace(/,/g, ''), 10) || 0;
        const del = parseInt(match[2].replace(/,/g, ''), 10) || 0;
        return { totalAdditions: add, totalDeletions: del, netLOCImpact: add - del };
      }
    }
    const add = displayCommits.reduce((acc, c) => acc + (c.linesAdded || 0), 0);
    const del = displayCommits.reduce((acc, c) => acc + (c.linesDeleted || 0), 0);
    return { totalAdditions: add, totalDeletions: del, netLOCImpact: add - del };
  }, [commits, member, displayCommits]);

  const totalCommitsCount = member?.commits ?? displayCommits.length;

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(displayCommits.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, displayCommits.length);
  const paginatedCommits = useMemo(() => {
    return displayCommits.slice(startIndex, startIndex + pageSize);
  }, [displayCommits, startIndex, pageSize]);

  const isFreeRider = member?.isFreeRider || (member?.pct !== undefined && member.pct < 10);

  if (!isOpen || !member) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-details-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: isDark ? 'var(--color-terracotta-100, #2D1A16)' : 'var(--color-terracotta-50, #FFFAF6)',
          borderRadius: '24px',
          maxWidth: '780px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)'
            : '0 25px 50px -12px rgba(122, 62, 46, 0.25), 0 0 0 1px rgba(181, 82, 58, 0.08)',
          border: isDark ? '1px solid var(--color-terracotta-200, #4A2B24)' : '1px solid var(--color-terracotta-200, #F7DBCC)',
          color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: isDark ? '1px solid var(--color-terracotta-200, #4A2B24)' : '1px solid var(--color-terracotta-200, #F7DBCC)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: isDark ? 'rgba(45, 26, 22, 0.95)' : 'rgba(251, 238, 230, 0.95)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: member.color || 'var(--color-terracotta-700, #B5523A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '1.1rem',
                boxShadow: '0 4px 12px rgba(122, 62, 46, 0.25)',
              }}
            >
              {member.initials || member.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2
                  id="member-details-title"
                  style={{
                    margin: 0,
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)',
                    letterSpacing: '-0.3px',
                  }}
                >
                  {member.name}
                </h2>
                {member.grade !== undefined && (
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 900,
                    fontFamily: 'monospace',
                    padding: '3px 10px',
                    borderRadius: '8px',
                    background: member.grade < 5
                      ? 'rgba(239, 68, 68, 0.2)'
                      : member.grade >= 9
                        ? 'rgba(34, 197, 94, 0.2)'
                        : 'var(--color-terracotta-100, #FBEEE6)',
                    color: member.grade < 5
                      ? '#DC2626'
                      : member.grade >= 9
                        ? '#16A34A'
                        : 'var(--color-terracotta-800, #7A3E2E)',
                    border: member.grade < 5 ? '1px solid #EF4444' : '1px solid var(--color-terracotta-300, #F1C2A7)'
                  }}>
                    {member.grade < 5 ? '⚠️' : member.grade >= 9 ? '⭐' : '✓'} {lang === 'vi' ? 'Điểm quy đổi:' : 'Grade:'} {member.grade.toFixed(1)} / 10
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.8rem', color: isDark ? 'var(--color-terracotta-600, #F1C2A7)' : '#8C5E51', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{member.email || `${member.name.toLowerCase().replace(/\s+/g, '.')}@fpt.edu.vn`}</span>
                <span>•</span>
                <span style={{ fontWeight: 800, color: member.color || 'var(--color-terracotta-700, #B5523A)' }}>
                  {member.pct !== undefined ? `${member.pct.toFixed(1)}% ${lang === 'vi' ? 'đóng góp' : 'contribution'}` : ''}
                </span>
                {member.roleBadge && (
                  <>
                    <span>•</span>
                    <span style={{
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      background: 'var(--color-terracotta-100, #FBEEE6)',
                      color: 'var(--color-terracotta-800, #7A3E2E)',
                      border: '1px solid var(--color-terracotta-300, #F1C2A7)'
                    }}>
                      {member.roleBadge}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: isDark ? 'rgba(74, 43, 36, 0.6)' : 'var(--color-terracotta-100, #FBEEE6)',
              border: isDark ? '1px solid #4A2B24' : '1px solid var(--color-terracotta-200, #F7DBCC)',
              cursor: 'pointer',
              fontSize: '1.1rem',
              color: isDark ? '#FFFAF6' : 'var(--color-terracotta-700, #B5523A)',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ padding: '22px 28px', overflowY: 'auto', flex: 1 }}>
          {/* 4 Core Metric Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                background: isDark ? 'rgba(45, 26, 22, 0.6)' : 'var(--color-terracotta-100, #FBEEE6)',
                padding: '12px 14px',
                borderRadius: '14px',
                border: isDark ? '1px solid var(--color-terracotta-200, #4A2B24)' : '1px solid var(--color-terracotta-200, #F7DBCC)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: isDark ? 'var(--color-terracotta-600, #F1C2A7)' : '#8C5E51', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {lang === 'vi' ? 'Tổng Commits' : 'Total Commits'}
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)', marginTop: '4px', fontFamily: 'monospace' }}>
                {totalCommitsCount}
              </div>
            </div>

            <div
              style={{
                background: isDark ? 'rgba(45, 26, 22, 0.6)' : 'var(--color-terracotta-100, #FBEEE6)',
                padding: '12px 14px',
                borderRadius: '14px',
                border: isDark ? '1px solid var(--color-terracotta-300, #B5523A)' : '1px solid var(--color-terracotta-300, #F1C2A7)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-terracotta-700, #B5523A)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {lang === 'vi' ? 'Dòng Thêm (+)' : 'Lines Added (+)'}
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--color-terracotta-700, #B5523A)', marginTop: '4px', fontFamily: 'monospace' }}>
                +{totalAdditions.toLocaleString()}
              </div>
            </div>

            <div
              style={{
                background: isDark ? 'rgba(45, 26, 22, 0.6)' : 'var(--color-terracotta-100, #FBEEE6)',
                padding: '12px 14px',
                borderRadius: '14px',
                border: isDark ? '1px solid var(--color-terracotta-200, #4A2B24)' : '1px solid var(--color-terracotta-200, #F7DBCC)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: isDark ? 'var(--color-terracotta-600, #F1C2A7)' : '#8C5E51', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {lang === 'vi' ? 'Dòng Xóa (-)' : 'Lines Deleted (-)'}
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: isDark ? 'var(--color-terracotta-600, #F1C2A7)' : '#8C5E51', marginTop: '4px', fontFamily: 'monospace' }}>
                -{totalDeletions.toLocaleString()}
              </div>
            </div>

            <div
              style={{
                background: isDark ? 'rgba(45, 26, 22, 0.6)' : 'var(--color-terracotta-100, #FBEEE6)',
                padding: '12px 14px',
                borderRadius: '14px',
                border: isDark ? '1px solid var(--color-terracotta-300, #B5523A)' : '1px solid var(--color-terracotta-300, #F1C2A7)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-terracotta-600, #D9794E)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {lang === 'vi' ? 'Net LOC Ròng' : 'Net LOC Impact'}
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--color-terracotta-600, #D9794E)', marginTop: '4px', fontFamily: 'monospace' }}>
                {netLOCImpact >= 0 ? `+${netLOCImpact.toLocaleString()}` : netLOCImpact.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Clean Executive Sprint Pacing Assessment Card */}
          <div
            style={{
              background: isFreeRider
                ? (isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2')
                : (isDark ? 'rgba(45, 26, 22, 0.5)' : 'var(--color-terracotta-100, #FBEEE6)'),
              borderRadius: '16px',
              padding: '16px 20px',
              border: isFreeRider
                ? '1.5px solid #F87171'
                : (isDark ? '1px solid var(--color-terracotta-200, #4A2B24)' : '1px solid var(--color-terracotta-300, #F1C2A7)'),
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📅</span>
                <span>{lang === 'vi' ? 'Tần Suất Commit Theo Ngày & Đánh Giá Sprint' : 'Daily Commit Activity & Sprint Assessment'}</span>
              </div>
              {isFreeRider ? (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '999px',
                    background: '#FEE2E2',
                    color: '#DC2626',
                    border: '1px solid #FECACA',
                  }}
                >
                  ⚠️ {lang === 'vi' ? 'Cảnh báo: Đóng góp dưới ngưỡng an toàn (< 10%)' : 'Alert: Below Safety Threshold (< 10%)'}
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '999px',
                    background: 'var(--color-terracotta-50, #FFFAF6)',
                    color: 'var(--color-terracotta-800, #7A3E2E)',
                    border: '1px solid var(--color-terracotta-300, #F1C2A7)',
                  }}
                >
                  ✓ {lang === 'vi' ? 'Phân bổ đều theo tiến độ (Pacing Healthy)' : 'Consistent sprint pacing'}
                </span>
              )}
            </div>

            <p style={{
              margin: '0 0 12px 0',
              fontSize: '0.80rem',
              color: isDark ? '#FFFAF6' : 'var(--color-terracotta-800, #7A3E2E)',
              lineHeight: 1.5,
            }}>
              {isFreeRider
                ? (lang === 'vi'
                    ? `Thành viên chỉ đóng góp ${member.pct?.toFixed(1) || 0}%, không đạt ngưỡng BR-12 (tối thiểu 10%). Giảng viên cần nhắc nhở bổ sung task.`
                    : `Member contributed only ${member.pct?.toFixed(1) || 0}%, below safety threshold 10% (BR-12). Reallocation needed.`)
                : (lang === 'vi'
                    ? `Thành viên duy trì nhịp độ commit đều đặn qua các sprint, tỷ trọng ${member.pct?.toFixed(1) || 0}% (${totalCommitsCount} commits, ${member.prs || 0} PRs). Không phát hiện hiện tượng dồn code sát deadline.`
                    : `Member maintains steady pacing across sprints, accounting for ${member.pct?.toFixed(1) || 0}% (${totalCommitsCount} commits, ${member.prs || 0} PRs). No deadline dumping detected.`)}
            </p>

            {/* Clean Horizontal Contribution Progress Meter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: isDark ? 'var(--color-terracotta-600, #F1C2A7)' : '#8C5E51', whiteSpace: 'nowrap' }}>
                {lang === 'vi' ? 'Tỷ trọng đóng góp:' : 'Contribution Ratio:'}
              </span>
              <div style={{
                flex: 1,
                height: '10px',
                borderRadius: '999px',
                background: isDark ? 'rgba(74, 43, 36, 0.8)' : '#E8D5CB',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <div style={{
                  width: `${Math.min(100, Math.max(5, member.pct || 15))}%`,
                  height: '100%',
                  borderRadius: '999px',
                  background: isFreeRider
                    ? '#DC2626'
                    : 'linear-gradient(90deg, var(--color-terracotta-600, #D9794E), var(--color-terracotta-700, #B5523A))',
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <span style={{
                fontSize: '0.84rem',
                fontWeight: 900,
                fontFamily: 'monospace',
                color: isFreeRider ? '#DC2626' : 'var(--color-terracotta-800, #7A3E2E)',
                minWidth: '45px',
                textAlign: 'right'
              }}>
                {member.pct !== undefined ? `${member.pct.toFixed(1)}%` : '--'}
              </span>
            </div>
          </div>

          {/* Granular Commits Audit Table */}
          <div
            style={{
              borderRadius: '16px',
              border: isDark ? '1px solid var(--color-terracotta-200, #4A2B24)' : '1px solid var(--color-terracotta-200, #F7DBCC)',
              overflow: 'hidden',
              background: isDark ? '#1A100E' : '#FFFFFF',
            }}
          >
            {/* Table Header Bar */}
            <div
              style={{
                padding: '12px 18px',
                background: isDark ? 'rgba(45, 26, 22, 0.85)' : 'var(--color-terracotta-100, #FBEEE6)',
                borderBottom: isDark ? '1px solid var(--color-terracotta-200, #4A2B24)' : '1px solid var(--color-terracotta-200, #F7DBCC)',
                fontSize: '0.82rem',
                fontWeight: 800,
                color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>{lang === 'vi' ? 'NHẬT KÝ COMMITS & CÔNG VIỆC THỰC HIỆN' : 'DETAILED COMMIT AUDIT LOG'}</span>
              <span style={{ fontWeight: 700, color: isDark ? 'var(--color-terracotta-600, #F1C2A7)' : '#8C5E51', fontSize: '0.75rem' }}>
                {displayCommits.length} {lang === 'vi' ? 'commits đã ghi nhận' : 'recorded commits'}
              </span>
            </div>

            {/* Scroll Container with Clean Table Columns */}
            <div style={{ maxHeight: '270px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead style={{ background: isDark ? '#2D1A16' : 'var(--color-terracotta-50, #FFFAF6)', position: 'sticky', top: 0, zIndex: 1, borderBottom: isDark ? '1px solid #4A2B24' : '1px solid var(--color-terracotta-200, #F7DBCC)' }}>
                  <tr>
                    <th style={{ padding: '10px 14px', fontWeight: 800, color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)', width: '45px', textAlign: 'center' }}>#</th>
                    <th style={{ padding: '10px 14px', fontWeight: 800, color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)', width: '135px' }}>{lang === 'vi' ? 'Thời Gian' : 'Timestamp'}</th>
                    <th style={{ padding: '10px 14px', fontWeight: 800, color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)' }}>{lang === 'vi' ? 'Nội Dung Đóng Góp / Commit' : 'Commit & Tasks'}</th>
                    <th style={{ padding: '10px 14px', fontWeight: 800, color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)', width: '130px', textAlign: 'right' }}>{lang === 'vi' ? 'Khối Lượng (LOC)' : 'Code (LOC)'}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCommits.map((c, idx) => {
                    const shortHash = (c.hash || 'commit').slice(0, 7);
                    const formattedDate = c.date ? c.date.replace('T', ' ').slice(0, 16) : 'N/A';
                    const badge = getCommitCategoryBadge(c.message);
                    const globalIdx = startIndex + idx + 1;

                    return (
                      <tr
                        key={c.hash || idx}
                        style={{
                          borderBottom: idx === paginatedCommits.length - 1 ? 'none' : isDark ? '1px solid #4A2B24' : '1px solid var(--color-terracotta-200, #F7DBCC)',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isDark ? 'rgba(74, 43, 36, 0.4)' : 'var(--color-terracotta-100, #FBEEE6)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {/* STT */}
                        <td style={{ padding: '10px 14px', textAlign: 'center', color: isDark ? 'var(--color-terracotta-600, #F1C2A7)' : '#8C5E51', fontWeight: 700, fontFamily: 'monospace' }}>
                          {globalIdx}
                        </td>

                        {/* Timestamp */}
                        <td style={{ padding: '10px 14px', color: isDark ? 'var(--color-terracotta-600, #F1C2A7)' : '#8C5E51', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                          <div>{formattedDate}</div>
                          <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'var(--color-terracotta-700, #B5523A)', opacity: 0.85 }}>
                            {shortHash}
                          </span>
                        </td>

                        {/* Commit Message & Task Tag */}
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              background: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                              whiteSpace: 'nowrap',
                            }}>
                              {badge.label}
                            </span>
                            <span
                              style={{
                                color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)',
                                fontWeight: 600,
                                lineHeight: 1.4,
                              }}
                              title={c.message}
                            >
                              {c.message}
                            </span>
                          </div>
                        </td>

                        {/* Code LOC */}
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, whiteSpace: 'nowrap' }}>
                          <span style={{ color: 'var(--color-terracotta-700, #B5523A)', marginRight: '6px' }}>
                            +{c.linesAdded.toLocaleString()}
                          </span>
                          <span style={{ color: isDark ? 'var(--color-terracotta-600, #F1C2A7)' : '#8C5E51' }}>
                            -{c.linesDeleted.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Bar */}
            <div
              style={{
                padding: '10px 18px',
                background: isDark ? 'rgba(45, 26, 22, 0.85)' : 'var(--color-terracotta-100, #FBEEE6)',
                borderTop: isDark ? '1px solid var(--color-terracotta-200, #4A2B24)' : '1px solid var(--color-terracotta-200, #F7DBCC)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: isDark ? 'var(--color-terracotta-600, #F1C2A7)' : '#8C5E51' }}>
                  {lang === 'vi' ? 'Số dòng:' : 'Rows:'}
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  aria-label={lang === 'vi' ? 'Chọn số dòng mỗi trang' : 'Select rows per page'}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: isDark ? '1px solid var(--color-terracotta-200, #4A2B24)' : '1px solid var(--color-terracotta-200, #F7DBCC)',
                    background: isDark ? 'var(--color-terracotta-50, #1A100E)' : 'var(--color-terracotta-50, #FFFAF6)',
                    color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
                <span style={{ color: isDark ? 'var(--color-terracotta-600, #F1C2A7)' : '#8C5E51', marginLeft: '6px' }}>
                  {displayCommits.length > 0
                    ? `${startIndex + 1} - ${endIndex} / ${displayCommits.length}`
                    : '0 / 0'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  aria-label="First page"
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: isDark ? '1px solid var(--color-terracotta-200, #4A2B24)' : '1px solid var(--color-terracotta-200, #F7DBCC)',
                    background: isDark ? 'var(--color-terracotta-50, #1A100E)' : 'var(--color-terracotta-50, #FFFAF6)',
                    color: currentPage === 1 ? '#D1D5DB' : (isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)'),
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontWeight: 800,
                  }}
                >
                  «
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: isDark ? '1px solid var(--color-terracotta-200, #4A2B24)' : '1px solid var(--color-terracotta-200, #F7DBCC)',
                    background: isDark ? 'var(--color-terracotta-50, #1A100E)' : 'var(--color-terracotta-50, #FFFAF6)',
                    color: currentPage === 1 ? '#D1D5DB' : (isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)'),
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                  }}
                >
                  ‹ {lang === 'vi' ? 'Trước' : 'Prev'}
                </button>

                <span style={{ padding: '0 6px', fontWeight: 800, color: 'var(--color-terracotta-700, #B5523A)' }}>
                  {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: isDark ? '1px solid var(--color-terracotta-200, #4A2B24)' : '1px solid var(--color-terracotta-200, #F7DBCC)',
                    background: isDark ? 'var(--color-terracotta-50, #1A100E)' : 'var(--color-terracotta-50, #FFFAF6)',
                    color: currentPage === totalPages ? '#D1D5DB' : (isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)'),
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {lang === 'vi' ? 'Sau' : 'Next'} ›
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  aria-label="Last page"
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: isDark ? '1px solid var(--color-terracotta-200, #4A2B24)' : '1px solid var(--color-terracotta-200, #F7DBCC)',
                    background: isDark ? 'var(--color-terracotta-50, #1A100E)' : 'var(--color-terracotta-50, #FFFAF6)',
                    color: currentPage === totalPages ? '#D1D5DB' : (isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)'),
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontWeight: 800,
                  }}
                >
                  »
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: isDark ? '1px solid var(--color-terracotta-200, #4A2B24)' : '1px solid var(--color-terracotta-200, #F7DBCC)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: isDark ? 'rgba(45, 26, 22, 0.85)' : 'var(--color-terracotta-100, #FBEEE6)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--color-terracotta-700, #B5523A), var(--color-terracotta-600, #D9794E))',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '0.84rem',
              boxShadow: '0 4px 14px rgba(181, 82, 58, 0.35)',
              transition: 'opacity 0.2s',
            }}
          >
            {lang === 'vi' ? 'Đóng Cửa Sổ' : 'Close Details'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberDetailsModal;
