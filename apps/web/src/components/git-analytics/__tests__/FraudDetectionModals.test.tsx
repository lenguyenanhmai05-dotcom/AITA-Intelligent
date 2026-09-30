import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest'; // Fix TS Error: toBeInTheDocument for Vitest
import { FraudDetectionModals } from '../FraudDetectionModals';
import React from 'react';

describe('FraudDetectionModals Component', () => {
  const mockCommits = [
    {
      id: '1',
      author: 'Test User',
      commitHash: 'abcdef12',
      message: 'Empty space',
      reason: 'Whitespace-only commit (Farm LOC)',
      date: '2026-09-30'
    }
  ];

  it('không render khi showFlaggedModal = false', () => {
    const { container } = render(
      <FraudDetectionModals 
        showFlaggedModal={false} 
        onCloseFlaggedModal={() => {}} 
        flaggedCommits={mockCommits} 
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('hiển thị bảng commit gian lận khi showFlaggedModal = true', () => {
    render(
      <FraudDetectionModals 
        showFlaggedModal={true} 
        onCloseFlaggedModal={() => {}} 
        flaggedCommits={mockCommits} 
      />
    );
    
    // Kiểm tra tiêu đề Modal có xuất hiện không
    expect(screen.getByText('Danh Sách Commits Bất Thường / Gian Lận')).toBeInTheDocument();
    
    // Kiểm tra xem dữ liệu mock có được render ra table không
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('abcdef12')).toBeInTheDocument();
    expect(screen.getByText('Whitespace-only commit (Farm LOC)')).toBeInTheDocument();
  });

  it('gọi hàm onCloseFlaggedModal khi ấn nút Đóng', () => {
    const handleClose = vi.fn();
    render(
      <FraudDetectionModals 
        showFlaggedModal={true} 
        onCloseFlaggedModal={handleClose} 
        flaggedCommits={mockCommits} 
      />
    );
    
    // Tìm nút Đóng bằng nội dung text và click
    const closeButton = screen.getByText('Đóng bảng');
    fireEvent.click(closeButton);
    
    // Đảm bảo hàm handleClose đã được trigger 1 lần
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
