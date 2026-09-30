import React, { useState } from 'react';
import { TeamContributionReport } from './git-analytics/TeamContributionReport';
import { FraudDetectionModals } from './git-analytics/FraudDetectionModals';

export const DashboardPortal = () => {
  const [step, setStep] = useState(1);
  const [showFlaggedModal, setShowFlaggedModal] = useState(false);

  // Dữ liệu mẫu (Mock data) cho báo cáo nhóm
  const mockMembers = [
    { id: '1', name: 'Nguyễn Châu Khánh Linh', role: 'Role 5', locShare: 40, commitShare: 45, prShare: 50, totalContribution: 43.5, isFreeRiding: false },
    { id: '2', name: 'Thành viên 2', role: 'Role 1', locShare: 35, commitShare: 30, prShare: 30, totalContribution: 32.5, isFreeRiding: false },
    { id: '3', name: 'Thành viên 3', role: 'Role 2', locShare: 5, commitShare: 5, prShare: 0, totalContribution: 4.0, isFreeRiding: true },
  ];

  const mockFlaggedCommits = [
    { id: 'c1', author: 'Thành viên 3', commitHash: 'a1b2c3d', message: 'Update whitespace formatting', reason: 'Whitespace-only commit (Farm LOC)', date: '2026-09-29' },
    { id: 'c2', author: 'Thành viên 3', commitHash: 'e5f6g7h', message: 'Revert previous changes', reason: 'Self-revert anomaly detected', date: '2026-09-30' },
  ];

  const handleStartAnalysis = (url: string, branch: string, pat?: string) => {
    console.log("Analyzing repo:", { url, branch, pat });
    setStep(2); // Giả lập tiến trình chạy
  };

  return (
    <div style={{ padding: '40px', background: '#F8FAFC', minHeight: '100vh', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '32px', color: '#1E293B', borderBottom: '2px solid #E2E8F0', paddingBottom: '16px' }}>
          Subsystem 5 - Git Analytics & Fraud Detection Dashboard
        </h1>
        
        {/* 1. Form nộp repo (Giữ chỗ) */}
        <div style={{ marginBottom: '24px', padding: '24px', background: '#FFFFFF', borderRadius: '16px', border: '1px dashed #CBD5E1', color: '#64748B' }}>
          <em>[Placeholder: GitSubmissionForm Component sẽ đặt ở đây]</em>
        </div>

        {/* 2. Stepper tiến trình (Giữ chỗ) */}
        <div style={{ marginBottom: '32px', padding: '24px', background: '#FFFFFF', borderRadius: '16px', border: '1px dashed #CBD5E1', color: '#64748B' }}>
          <em>[Placeholder: AnalysisProgressStepper Component - Hiện đang ở Step {step}]</em>
        </div>

        {/* 3. Bảng báo cáo đóng góp */}
        <TeamContributionReport
          members={mockMembers}
          onSelectMember={(id) => alert(`Đang mở chi tiết thành viên ID: ${id}`)}
          onViewFlaggedCommits={() => setShowFlaggedModal(true)}
        />

        {/* 4. Modal cảnh báo commit gian lận */}
        <FraudDetectionModals
          showFlaggedModal={showFlaggedModal}
          onCloseFlaggedModal={() => setShowFlaggedModal(false)}
          flaggedCommits={mockFlaggedCommits}
        />
      </div>
    </div>
  );
};

export default DashboardPortal;
