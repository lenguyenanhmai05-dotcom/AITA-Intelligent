import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React, { useState } from 'react';
import { ProgressStepper } from '../ProgressStepper';
import { MemberDetailsModal, MemberDetailInfo, CommitDetail } from '../MemberDetailsModal';
import { FreeRidingThresholdModal } from '../FreeRidingThresholdModal';

// Mock component tích hợp mô phỏng toàn bộ quy trình Git Analytics E2E
interface MockTeamMember extends MemberDetailInfo {
  isFreeRider?: boolean;
}

const GitAnalyticsE2EFlowView: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('https://github.com/lenguyenanhmai05/AITA-Intelligent.git');
  const [branch, setBranch] = useState('main');
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [threshold, setThreshold] = useState(5);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberDetailInfo | null>(null);

  const [members, setMembers] = useState<MockTeamMember[]>([
    { name: 'Nguyễn Châu Khánh Linh', email: 'linh.nck@fpt.edu.vn', initials: 'KL', commits: 28, prs: 5, loc: 2450, pct: 36.5, color: '#2563EB' },
    { name: 'Lê Nguyễn Anh Mai', email: 'mai.lna@fpt.edu.vn', initials: 'AM', commits: 24, prs: 4, loc: 2100, pct: 32.0, color: '#0EA5E9' },
    { name: 'Trần Quốc Bảo', email: 'bao.tq@fpt.edu.vn', initials: 'QB', commits: 18, prs: 3, loc: 1600, pct: 25.5, color: '#10B981' },
    { name: 'Võ Minh Trí', email: 'tri.vm@fpt.edu.vn', initials: 'MT', commits: 3, prs: 0, loc: 220, pct: 6.0, color: '#F59E0B' },
  ]);

  const mockCommits: CommitDetail[] = [
    { hash: 'e4cb94a', date: '2026-10-12T14:32:00Z', message: 'feat(core): implement robust error boundary', linesAdded: 142, linesDeleted: 18 },
    { hash: '3f67e18', date: '2026-10-10T09:15:00Z', message: 'feat(ui): add Git analytics stepper', linesAdded: 298, linesDeleted: 45 },
  ];

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    setActiveStep(1); // Cloning
    setTimeout(() => {
      setActiveStep(2); // Parsing
      setTimeout(() => {
        setActiveStep(3); // Scoring
        setTimeout(() => {
          setActiveStep(4); // Done
          setIsAnalyzing(false);
          setReportReady(true);
        }, 10);
      }, 10);
    }, 10);
  };

  const handleSaveThreshold = (newVal: number) => {
    setThreshold(newVal);
    // Cập nhật lại trạng thái Free-Rider theo ngưỡng mới (BR-12)
    setMembers(prev =>
      prev.map(m => ({
        ...m,
        isFreeRider: (m.pct || 0) < newVal,
      }))
    );
  };

  return (
    <div>
      <h1>AITA Git Teamwork Analytics</h1>

      {/* Bước 1: Form nộp Repo */}
      <div data-testid="submission-section">
        <input
          data-testid="repo-url-input"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
        />
        <input
          data-testid="branch-input"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
        />
        <button
          data-testid="submit-btn"
          onClick={handleStartAnalysis}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? 'Đang phân tích...' : 'Tiến Hành Phân Tích Git'}
        </button>
      </div>

      {/* Bước 2: Thanh tiến trình Stepper */}
      {isAnalyzing && (
        <div data-testid="stepper-section">
          <ProgressStepper currentStep={activeStep} lang="vi" />
        </div>
      )}

      {/* Bước 3: Bảng báo cáo phân tích */}
      {reportReady && (
        <div data-testid="report-section">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h2>Báo Cáo Đóng Góp Thành Viên</h2>
            <button
              data-testid="open-threshold-btn"
              onClick={() => setShowThresholdModal(true)}
            >
              ⚙️ Ngưỡng Free-Rider ({threshold}%)
            </button>
          </div>

          <table data-testid="contribution-table">
            <thead>
              <tr>
                <th>Thành Viên</th>
                <th>Tỷ Lệ Đóng Góp</th>
                <th>Đánh Giá</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.email} data-testid={`row-${m.email}`}>
                  <td>{m.name}</td>
                  <td>{m.pct}%</td>
                  <td>
                    {m.pct! < threshold ? (
                      <span data-testid={`badge-freerider-${m.email}`}>⚠️ Free-Rider</span>
                    ) : (
                      <span data-testid={`badge-valid-${m.email}`}>✓ Đạt chuẩn</span>
                    )}
                  </td>
                  <td>
                    <button
                      data-testid={`btn-view-${m.email}`}
                      onClick={() => setSelectedMember(m)}
                    >
                      🔍 Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bước 4: Modal chi tiết thành viên (Task 15, 17, 18) */}
      <MemberDetailsModal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
        commits={mockCommits}
        lang="vi"
      />

      {/* Bước 5: Modal cấu hình ngưỡng (Task 16 - BR-12) */}
      <FreeRidingThresholdModal
        isOpen={showThresholdModal}
        onClose={() => setShowThresholdModal(false)}
        currentThreshold={threshold}
        onSave={handleSaveThreshold}
        lang="vi"
      />
    </div>
  );
};

describe('Task 24: End-to-End (E2E) Integration Flow Testing', () => {
  it('thực thi hoàn chỉnh luồng E2E: Submit Form -> Stepper -> Báo cáo -> Xem Chi Tiết -> Cấu hình ngưỡng Free-Rider', async () => {
    render(<GitAnalyticsE2EFlowView />);

    // 1. Kiểm tra ban đầu: Form nộp repo hiển thị sẵn
    expect(screen.getByTestId('submission-section')).toBeInTheDocument();
    expect(screen.queryByTestId('report-section')).not.toBeInTheDocument();

    // 2. Click nút nộp repo
    const submitBtn = screen.getByTestId('submit-btn');
    fireEvent.click(submitBtn);

    // 3. Chờ quá trình phân tích hoàn tất qua Stepper và xuất hiện báo cáo
    await waitFor(() => {
      expect(screen.getByTestId('report-section')).toBeInTheDocument();
    });

    // 4. Kiểm tra danh sách thành viên trong bảng báo cáo
    expect(screen.getByText('Nguyễn Châu Khánh Linh')).toBeInTheDocument();
    expect(screen.getByText('36.5%')).toBeInTheDocument();
    expect(screen.getByText('Võ Minh Trí')).toBeInTheDocument();
    expect(screen.getByText('6%')).toBeInTheDocument();

    // Với ngưỡng 5%, Võ Minh Trí (6%) vẫn Đạt chuẩn
    expect(screen.getByTestId('badge-valid-tri.vm@fpt.edu.vn')).toBeInTheDocument();

    // 5. Mở MemberDetailsModal xem chi tiết của Nguyễn Châu Khánh Linh
    const viewLinhBtn = screen.getByTestId('btn-view-linh.nck@fpt.edu.vn');
    fireEvent.click(viewLinhBtn);

    // Modal chi tiết mở lên với 4 metric cards và nhật ký commit
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Tổng Commits')).toBeInTheDocument();
    expect(screen.getByText('Net LOC Ròng')).toBeInTheDocument();
    expect(screen.getByText('NHẬT KÝ COMMITS CHI TIẾT')).toBeInTheDocument();

    // Đóng Modal chi tiết
    const closeBtn = screen.getByText('Đóng Cửa Sổ');
    fireEvent.click(closeBtn);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // 6. Giảng viên mở Modal Cấu hình ngưỡng Free-Rider và nâng ngưỡng từ 5% lên 8%
    const openThresholdBtn = screen.getByTestId('open-threshold-btn');
    fireEvent.click(openThresholdBtn);

    expect(screen.getByText('Cấu Hình Ngưỡng Cảnh Báo Free-Rider')).toBeInTheDocument();
    const thresholdInput = screen.getByRole('spinbutton');
    fireEvent.change(thresholdInput, { target: { value: '8' } });

    const saveThresholdBtn = screen.getByText('Lưu Ngưỡng BR-12');
    fireEvent.click(saveThresholdBtn);

    // 7. Xác nhận giao diện cập nhật ngay lập tức: Võ Minh Trí (6% < 8%) chuyển sang cờ đỏ "⚠️ Free-Rider"
    await waitFor(() => {
      expect(screen.getByTestId('badge-freerider-tri.vm@fpt.edu.vn')).toBeInTheDocument();
    });
    expect(screen.getByText('⚙️ Ngưỡng Free-Rider (8%)')).toBeInTheDocument();
  });
});
