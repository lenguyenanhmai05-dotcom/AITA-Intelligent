import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemberDetailsModal } from '../MemberDetailsModal';

describe('MemberDetailsModal Component (Week 7 - Task 15)', () => {
  const mockMember = {
    name: 'Nguyễn Châu Khánh Linh',
    email: 'linh.nck@fpt.edu.vn',
    initials: 'KL',
    commits: 28,
    prs: 5,
    loc: 2450,
    codeLines: '+2,450 / -320',
    pct: 32.5,
    color: '#2563EB',
  };

  const mockCommits = [
    {
      hash: '3f67e18a9b',
      date: '2026-10-10T09:15:00Z',
      message: 'feat(ui): add Git analytics stepper and update DashboardPortal',
      linesAdded: 298,
      linesDeleted: 45,
      isSuspicious: false,
    },
    {
      hash: '738ced0b1c',
      date: '2026-10-05T10:38:00Z',
      message: 'feat(ui): complete git repo submission form and PAT auth',
      linesAdded: 159,
      linesDeleted: 12,
      isSuspicious: false,
    },
  ];

  it('không render khi isOpen = false', () => {
    const { container } = render(
      <MemberDetailsModal
        isOpen={false}
        onClose={() => {}}
        member={mockMember}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('hiển thị đầy đủ thông tin thành viên và 4 metric cards khi isOpen = true', () => {
    render(
      <MemberDetailsModal
        isOpen={true}
        onClose={() => {}}
        member={mockMember}
        commits={mockCommits}
        lang="vi"
      />
    );

    // Kiểm tra tên thành viên và email
    expect(screen.getByText('Nguyễn Châu Khánh Linh')).toBeInTheDocument();
    expect(screen.getByText(/linh.nck@fpt.edu.vn/i)).toBeInTheDocument();

    // Kiểm tra 4 Metric Cards
    expect(screen.getByText('Tổng Commits')).toBeInTheDocument();
    expect(screen.getByText('Dòng Thêm (+)')).toBeInTheDocument();
    expect(screen.getByText('Dòng Xóa (-)')).toBeInTheDocument();
    expect(screen.getByText('Net LOC Ròng')).toBeInTheDocument();

    // Kiểm tra tính toán tổng additions (+457) và deletions (-57)
    expect(screen.getByText('+457')).toBeInTheDocument();
    expect(screen.getByText('-57')).toBeInTheDocument();
  });

  it('hiển thị biểu đồ timeline và bảng commit log chi tiết với mã hash rút gọn', () => {
    render(
      <MemberDetailsModal
        isOpen={true}
        onClose={() => {}}
        member={mockMember}
        commits={mockCommits}
      />
    );

    // Kiểm tra tiêu đề Timeline
    expect(screen.getByText(/Tần Suất Commit Theo Ngày/i)).toBeInTheDocument();

    // Kiểm tra mã SHA-1 rút gọn (7 ký tự)
    expect(screen.getByText('3f67e18')).toBeInTheDocument();
    expect(screen.getByText('738ced0')).toBeInTheDocument();

    // Kiểm tra commit message
    expect(screen.getByText('feat(ui): add Git analytics stepper and update DashboardPortal')).toBeInTheDocument();
  });

  it('gọi hàm onClose khi bấm nút đóng hoặc nút Đóng Cửa Sổ', () => {
    const handleClose = vi.fn();
    render(
      <MemberDetailsModal
        isOpen={true}
        onClose={handleClose}
        member={mockMember}
        commits={mockCommits}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /close modal/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    const bottomCloseBtn = screen.getByText('Đóng Cửa Sổ');
    fireEvent.click(bottomCloseBtn);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('đóng modal khi nhấn phím Escape trên bàn phím', () => {
    const handleClose = vi.fn();
    render(
      <MemberDetailsModal
        isOpen={true}
        onClose={handleClose}
        member={mockMember}
        commits={mockCommits}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('hỗ trợ phân trang nhật ký commit log (Task 17)', () => {
    const mockManyCommits = Array.from({ length: 12 }, (_, i) => ({
      hash: `commit${i.toString().padStart(4, '0')}`,
      date: `2026-10-${(10 + Math.floor(i / 2)).toString().padStart(2, '0')}T10:00:00Z`,
      message: `feat(core): test commit number ${i + 1}`,
      linesAdded: 10 * (i + 1),
      linesDeleted: 2 * (i + 1),
      isSuspicious: false,
    }));

    render(
      <MemberDetailsModal
        isOpen={true}
        onClose={() => {}}
        member={mockMember}
        commits={mockManyCommits}
        lang="vi"
      />
    );

    // Mặc định pageSize = 5, hiển thị trang 1 (1 - 5 / 12)
    expect(screen.getByText('1 - 5 / 12')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByText('feat(core): test commit number 1')).toBeInTheDocument();
    expect(screen.getByText('feat(core): test commit number 5')).toBeInTheDocument();
    expect(screen.queryByText('feat(core): test commit number 6')).not.toBeInTheDocument();

    // Chuyển sang trang tiếp theo (Sau ›)
    const nextBtn = screen.getByLabelText('Next page');
    fireEvent.click(nextBtn);

    expect(screen.getByText('6 - 10 / 12')).toBeInTheDocument();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(screen.getByText('feat(core): test commit number 6')).toBeInTheDocument();
    expect(screen.getByText('feat(core): test commit number 10')).toBeInTheDocument();
    expect(screen.queryByText('feat(core): test commit number 1')).not.toBeInTheDocument();

    // Chuyển sang trang cuối (»)
    const lastBtn = screen.getByLabelText('Last page');
    fireEvent.click(lastBtn);

    expect(screen.getByText('11 - 12 / 12')).toBeInTheDocument();
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(screen.getByText('feat(core): test commit number 11')).toBeInTheDocument();
    expect(screen.getByText('feat(core): test commit number 12')).toBeInTheDocument();
    expect(screen.getByLabelText('Next page')).toBeDisabled();
    expect(screen.getByLabelText('Last page')).toBeDisabled();

    // Chuyển về trang đầu («)
    const firstBtn = screen.getByLabelText('First page');
    fireEvent.click(firstBtn);
    expect(screen.getByText('1 - 5 / 12')).toBeInTheDocument();
    expect(screen.getByLabelText('First page')).toBeDisabled();
    expect(screen.getByLabelText('Previous page')).toBeDisabled();

    // Thay đổi số dòng trên trang thành 10
    const pageSizeSelect = screen.getByLabelText('Chọn số dòng mỗi trang');
    fireEvent.change(pageSizeSelect, { target: { value: '10' } });

    expect(screen.getByText('1 - 10 / 12')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByText('feat(core): test commit number 10')).toBeInTheDocument();
  });

  it('hiển thị cảnh báo sprint-dumping khi dồn hơn 70% commit vào ngày cuối', () => {
    const sprintDumpingCommits = [
      { hash: 'dump001', date: '2026-10-10T08:00:00Z', message: 'init', linesAdded: 10, linesDeleted: 1 },
      { hash: 'dump002', date: '2026-10-15T09:00:00Z', message: 'last minute 1', linesAdded: 100, linesDeleted: 5 },
      { hash: 'dump003', date: '2026-10-15T10:00:00Z', message: 'last minute 2', linesAdded: 120, linesDeleted: 8 },
      { hash: 'dump004', date: '2026-10-15T11:00:00Z', message: 'last minute 3', linesAdded: 130, linesDeleted: 10 },
      { hash: 'dump005', date: '2026-10-15T12:00:00Z', message: 'last minute 4', linesAdded: 140, linesDeleted: 12 },
    ];

    render(
      <MemberDetailsModal
        isOpen={true}
        onClose={() => {}}
        member={mockMember}
        commits={sprintDumpingCommits}
      />
    );

    expect(screen.getByText(/Cảnh báo: Dồn commit sát deadline/i)).toBeInTheDocument();
  });

  it('hỗ trợ giao diện Dark Mode và đa ngôn ngữ tiếng Anh (Task 18)', () => {
    render(
      <MemberDetailsModal
        isOpen={true}
        onClose={() => {}}
        member={mockMember}
        commits={mockCommits}
        isDark={true}
        lang="en"
      />
    );

    expect(screen.getByText('Total Commits')).toBeInTheDocument();
    expect(screen.getByText('Lines Added (+)')).toBeInTheDocument();
    expect(screen.getByText('Lines Deleted (-)')).toBeInTheDocument();
    expect(screen.getByText('Net LOC Impact')).toBeInTheDocument();
    expect(screen.getByText('GRANULAR COMMIT AUDIT LOG')).toBeInTheDocument();
    expect(screen.getByText('Close Details')).toBeInTheDocument();
    expect(screen.getByText(/Consistent sprint pacing/i)).toBeInTheDocument();
  });
});
