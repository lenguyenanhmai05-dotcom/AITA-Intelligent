import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { FreeRidingThresholdModal } from '../FreeRidingThresholdModal';

describe('FreeRidingThresholdModal Component (Week 7 - Task 16 & BR-12)', () => {
  it('không render khi isOpen = false', () => {
    const { container } = render(
      <FreeRidingThresholdModal
        isOpen={false}
        onClose={() => {}}
        currentThreshold={5}
        onSave={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('hiển thị đầy đủ thông tin cấu hình và quy tắc BR-12 khi isOpen = true', () => {
    render(
      <FreeRidingThresholdModal
        isOpen={true}
        onClose={() => {}}
        currentThreshold={5}
        onSave={() => {}}
        lang="vi"
      />
    );

    expect(screen.getByText('Cấu Hình Ngưỡng Cảnh Báo Free-Rider')).toBeInTheDocument();
    expect(screen.getByText('BR-12')).toBeInTheDocument();
    expect(screen.getByText(/Ngưỡng Tối Thiểu/i)).toBeInTheDocument();

    const numberInput = screen.getByRole('spinbutton');
    expect(numberInput).toHaveValue(5);
  });

  it('bật thông báo lỗi và vô hiệu hóa nút Lưu khi nhập giá trị ngoài khoảng [1, 20]', () => {
    render(
      <FreeRidingThresholdModal
        isOpen={true}
        onClose={() => {}}
        currentThreshold={5}
        onSave={() => {}}
        lang="vi"
      />
    );

    const numberInput = screen.getByRole('spinbutton');
    const saveBtn = screen.getByText('Lưu Ngưỡng BR-12');

    // Nhập giá trị 25 (> 20)
    fireEvent.change(numberInput, { target: { value: '25' } });
    expect(screen.getByText(/Quy tắc BR-12: Ngưỡng cảnh báo chỉ được phép từ 1% đến 20%/i)).toBeInTheDocument();
    expect(saveBtn).toBeDisabled();

    // Nhập giá trị 0 (< 1)
    fireEvent.change(numberInput, { target: { value: '0' } });
    expect(screen.getByText(/Quy tắc BR-12: Ngưỡng cảnh báo chỉ được phép từ 1% đến 20%/i)).toBeInTheDocument();
    expect(saveBtn).toBeDisabled();
  });

  it('gọi hàm onSave với giá trị hợp lệ khi bấm nút Lưu', () => {
    const handleSave = vi.fn();
    const handleClose = vi.fn();

    render(
      <FreeRidingThresholdModal
        isOpen={true}
        onClose={handleClose}
        currentThreshold={5}
        onSave={handleSave}
        lang="vi"
      />
    );

    const numberInput = screen.getByRole('spinbutton');
    fireEvent.change(numberInput, { target: { value: '12' } });

    const saveBtn = screen.getByText('Lưu Ngưỡng BR-12');
    expect(saveBtn).not.toBeDisabled();
    fireEvent.click(saveBtn);

    expect(handleSave).toHaveBeenCalledWith(12);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('đóng modal khi bấm phím Escape', () => {
    const handleClose = vi.fn();

    render(
      <FreeRidingThresholdModal
        isOpen={true}
        onClose={handleClose}
        currentThreshold={5}
        onSave={() => {}}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
