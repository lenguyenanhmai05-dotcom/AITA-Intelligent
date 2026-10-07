import React, { useState, useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProgressStepper from '../ProgressStepper';

// Helper component to simulate async step progression (Week 6 - Task 17)
const AsyncStepperHarness: React.FC = () => {
  const [step, setStep] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStep(2);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return <ProgressStepper currentStep={step} isAnalyzing={true} />;
};

describe('ProgressStepper Component (Week 6 - Task 13 & Task 17)', () => {
  it('renders all 4 processing stages correctly', () => {
    render(<ProgressStepper currentStep={1} isAnalyzing={true} />);

    expect(screen.getByText('Tiến Trình Phân Tích Kho Git (Analysis Progress)')).toBeInTheDocument();
    expect(screen.getByText('1. Khởi Tạo Môi Trường & Tải Kho Git')).toBeInTheDocument();
    expect(screen.getByText('2. Trích Xuất Lịch Sử Commit & Tác Giả')).toBeInTheDocument();
    expect(screen.getByText('3. Lọc Bỏ Tệp Tin Rác & Thư Viện Tự Sinh')).toBeInTheDocument();
    expect(screen.getByText('4. Tính Điểm Đóng Góp & Quét Gian Lận')).toBeInTheDocument();
  });

  it('renders active stage and pending stage badges appropriately', () => {
    render(<ProgressStepper currentStep={2} isAnalyzing={true} />);

    // Step 1 should be completed
    const step1 = screen.getByTestId('step-item-1');
    expect(step1).toHaveTextContent('Hoàn tất');

    // Step 2 should be currently active
    const step2 = screen.getByTestId('step-item-2');
    expect(step2).toHaveTextContent('Đang chạy');

    // Step 3 should be pending
    const step3 = screen.getByTestId('step-item-3');
    expect(step3).toHaveTextContent('Chờ xử lý');
  });

  it('handles asynchronous step transitions accurately using waitFor', async () => {
    render(<AsyncStepperHarness />);

    // Initially at Step 1
    const step1 = screen.getByTestId('step-item-1');
    expect(step1).toHaveTextContent('Đang chạy');

    // Asynchronously transitions to Step 2
    await waitFor(() => {
      expect(step1).toHaveTextContent('Hoàn tất');
      const step2 = screen.getByTestId('step-item-2');
      expect(step2).toHaveTextContent('Đang chạy');
    });
  });
});
