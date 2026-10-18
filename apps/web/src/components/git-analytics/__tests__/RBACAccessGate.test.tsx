import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React, { useState } from 'react';
import { FreeRidingThresholdModal } from '../FreeRidingThresholdModal';
import { isAdminEmail, ADMIN_EMAILS } from '../../../../src/App';

// Mock component mô phỏng thanh công cụ Git Analytics có phân quyền RBAC
interface GitAnalyticsToolbarProps {
  userRole: 'student' | 'lecturer' | 'admin';
  userEmail: string;
  freeRidingThreshold: number;
  onUpdateThreshold: (newVal: number) => void;
  lang?: 'vi' | 'en';
}

const GitAnalyticsRBACBar: React.FC<GitAnalyticsToolbarProps> = ({
  userRole,
  userEmail,
  freeRidingThreshold,
  onUpdateThreshold,
  lang = 'vi',
}) => {
  const [showModal, setShowModal] = useState(false);
  const isAdmin = isAdminEmail(userEmail) || userRole === 'admin';
  const isLecturerOrAdmin = userRole === 'lecturer' || isAdmin;

  return (
    <div>
      <div data-testid="user-badge">
        Vai trò hiện tại: {userRole} ({userEmail})
      </div>

      {/* Nút cấu hình ngưỡng Free-Rider: CHỈ DÀNH CHO GIẢNG VIÊN VÀ ADMIN */}
      {isLecturerOrAdmin ? (
        <button
          onClick={() => setShowModal(true)}
          data-testid="threshold-config-btn"
          style={{ padding: '8px 16px', background: '#EF4444', color: '#FFF' }}
        >
          ⚙️ {lang === 'vi' ? 'Cấu Hình Ngưỡng Free-Rider' : 'Free-Rider Threshold'}
        </button>
      ) : (
        <div data-testid="student-readonly-notice">
          🔒 Sinh viên chỉ có quyền xem báo cáo (Read-Only)
        </div>
      )}

      {/* Nút phê duyệt đặc quyền: CHỈ DÀNH CHO ADMIN */}
      {isAdmin && (
        <button data-testid="admin-approval-btn">
          👑 Phê duyệt Giảng viên (Admin Only)
        </button>
      )}

      <FreeRidingThresholdModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentThreshold={freeRidingThreshold}
        onSave={onUpdateThreshold}
        lang={lang}
      />
    </div>
  );
};

describe('Task 23: Role-Based Access Control (RBAC) UI Gate Testing', () => {
  it('xác thực danh sách quản trị viên ADMIN_EMAILS và hàm isAdminEmail', () => {
    expect(ADMIN_EMAILS).toContain('lenguyenanhmai05@gmail.com');
    expect(ADMIN_EMAILS).toContain('admin@fpt.edu.vn');
    expect(isAdminEmail('lenguyenanhmai05@gmail.com')).toBe(true);
    expect(isAdminEmail('admin@fpt.edu.vn')).toBe(true);
    expect(isAdminEmail('student123@fpt.edu.vn')).toBe(false);
    expect(isAdminEmail('')).toBe(false);
  });

  describe('Phân quyền vai trò Sinh viên (Student Role - Read Only)', () => {
    it('ẨN hoàn toàn nút cấu hình ngưỡng Free-Rider đối với tài khoản sinh viên', () => {
      render(
        <GitAnalyticsRBACBar
          userRole="student"
          userEmail="linh.nck@fpt.edu.vn"
          freeRidingThreshold={5}
          onUpdateThreshold={() => {}}
        />
      );

      // Nút cấu hình không tồn tại trên DOM của sinh viên
      expect(screen.queryByTestId('threshold-config-btn')).not.toBeInTheDocument();
      expect(screen.queryByText(/Cấu Hình Ngưỡng Free-Rider/i)).not.toBeInTheDocument();

      // Hiển thị thông báo chỉ đọc
      expect(screen.getByTestId('student-readonly-notice')).toBeInTheDocument();
      expect(screen.getByText(/Sinh viên chỉ có quyền xem báo cáo/i)).toBeInTheDocument();

      // Nút Admin cũng bị ẩn
      expect(screen.queryByTestId('admin-approval-btn')).not.toBeInTheDocument();
    });
  });

  describe('Phân quyền vai trò Giảng viên (Lecturer Role)', () => {
    it('HIỂN THỊ nút cấu hình ngưỡng và cho phép Giảng viên mở modal điều chỉnh BR-12', () => {
      const handleUpdate = vi.fn();

      render(
        <GitAnalyticsRBACBar
          userRole="lecturer"
          userEmail="giangnv@fpt.edu.vn"
          freeRidingThreshold={5}
          onUpdateThreshold={handleUpdate}
        />
      );

      // Giảng viên thấy nút cấu hình
      const configBtn = screen.getByTestId('threshold-config-btn');
      expect(configBtn).toBeInTheDocument();
      expect(screen.queryByTestId('student-readonly-notice')).not.toBeInTheDocument();

      // Giảng viên bấm nút -> Modal cấu hình BR-12 xuất hiện
      fireEvent.click(configBtn);
      expect(screen.getByText('Cấu Hình Ngưỡng Cảnh Báo Free-Rider')).toBeInTheDocument();
      expect(screen.getByText('BR-12')).toBeInTheDocument();

      // Giảng viên đổi ngưỡng lên 10% và Lưu
      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '10' } });

      const saveBtn = screen.getByText('Lưu Ngưỡng BR-12');
      fireEvent.click(saveBtn);

      expect(handleUpdate).toHaveBeenCalledWith(10);
    });

    it('giảng viên thông thường không thấy nút đặc quyền phê duyệt của Admin', () => {
      render(
        <GitAnalyticsRBACBar
          userRole="lecturer"
          userEmail="giangnv@fpt.edu.vn"
          freeRidingThreshold={5}
          onUpdateThreshold={() => {}}
        />
      );

      expect(screen.queryByTestId('admin-approval-btn')).not.toBeInTheDocument();
    });
  });

  describe('Phân quyền vai trò Quản trị viên (Admin Role)', () => {
    it('quản trị viên có toàn quyền truy cập cả chức năng cấu hình ngưỡng lẫn phê duyệt', () => {
      render(
        <GitAnalyticsRBACBar
          userRole="admin"
          userEmail="admin@fpt.edu.vn"
          freeRidingThreshold={5}
          onUpdateThreshold={() => {}}
        />
      );

      // Thấy nút cấu hình ngưỡng
      expect(screen.getByTestId('threshold-config-btn')).toBeInTheDocument();
      // Thấy nút quản trị đặc quyền
      expect(screen.getByTestId('admin-approval-btn')).toBeInTheDocument();
    });
  });
});
