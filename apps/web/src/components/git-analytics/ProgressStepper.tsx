import React from 'react';

export interface StepItem {
  id: number;
  title: string;
  desc: string;
}

export interface ProgressStepperProps {
  currentStep: number; // 1 to 4
  isAnalyzing: boolean;
  statusText?: string;
}

const STEPS: StepItem[] = [
  {
    id: 1,
    title: '1. Khởi Tạo Môi Trường & Tải Kho Git',
    desc: 'Đang khởi tạo thư mục tạm biệt lập và clone repository với cấu hình bare an toàn...',
  },
  {
    id: 2,
    title: '2. Trích Xuất Lịch Sử Commit & Tác Giả',
    desc: 'Đang thực thi git log, rev-list để trích xuất danh sách commits, email tác giả và timestamp...',
  },
  {
    id: 3,
    title: '3. Lọc Bỏ Tệp Tin Rác & Thư Viện Tự Sinh',
    desc: 'Đang loại trừ các file tự sinh, lockfiles, node_modules để chỉ giữ lại Net Lines of Code thật...',
  },
  {
    id: 4,
    title: '4. Tính Điểm Đóng Góp & Quét Gian Lận',
    desc: 'Đang tính điểm tỷ lệ 40% LOC + 40% Commit + 20% PR và quét hành vi whitespace-only, self-revert...',
  },
];

// Clean native SVGs to ensure 100% React version compatibility in test environments
const CheckIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SpinnerIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'stepperSpin 1.2s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const GitBranchIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="3" x2="6" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </svg>
);

const FileCodeIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <polyline points="10 13 8 15 10 17" />
    <polyline points="14 13 16 15 14 17" />
  </svg>
);

const FilterIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const AwardIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);

const renderStepIcon = (id: number) => {
  switch (id) {
    case 1: return <GitBranchIcon />;
    case 2: return <FileCodeIcon />;
    case 3: return <FilterIcon />;
    case 4: return <AwardIcon />;
    default: return null;
  }
};

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  currentStep,
  isAnalyzing,
  statusText,
}) => {
  const progressPercent = Math.min(Math.max((currentStep / 4) * 100, 10), 100);

  return (
    <div
      style={{
        background: 'radial-gradient(circle at 50% 0%, rgba(217, 121, 78, 0.15) 0%, transparent 65%), var(--color-terracotta-50, #FFFAF6)',
        borderRadius: '24px',
        padding: '36px 40px',
        border: '1px solid var(--color-terracotta-200, #F7DBCC)',
        boxShadow: '0 20px 45px -10px rgba(122, 62, 46, 0.12), 0 4px 12px rgba(181, 82, 58, 0.05)',
        maxWidth: '700px',
        margin: '16px auto',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative top ambient bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #7A3E2E 0%, #B5523A 35%, #D9794E 70%, #E7A27A 100%)',
      }} />

      <div style={{ marginBottom: '28px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '999px',
          background: 'var(--color-terracotta-100, #FBEEE6)',
          border: '1px solid var(--color-terracotta-300, #F1C2A7)',
          color: 'var(--color-terracotta-700, #B5523A)',
          fontSize: '0.72rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '10px'
        }}>
          ⚡ Realtime Analysis Pipeline
        </div>
        <h2
          style={{
            fontSize: '1.45rem',
            fontWeight: 900,
            color: 'var(--color-terracotta-900, #7A3E2E)',
            marginBottom: '8px',
            fontFamily: 'var(--font-heading, inherit)',
            letterSpacing: '-0.3px'
          }}
        >
          Tiến Trình Phân Tích Kho Git (Analysis Progress)
        </h2>
        <p style={{ fontSize: '0.86rem', color: '#8C5E51', margin: 0, fontWeight: 500 }}>
          {statusText ||
            (isAnalyzing
              ? `Hệ thống đang xử lý tác vụ ngầm theo quy chuẩn SRS... (Bước ${currentStep}/4)`
              : 'Đã hoàn tất bóc tách dữ liệu kho Git.')}
        </p>
      </div>

      {/* Progress Bar Container with Shimmer Effect */}
      <div style={{ marginBottom: '32px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
            fontWeight: 800,
            marginBottom: '8px',
            color: 'var(--color-terracotta-700, #B5523A)',
          }}
        >
          <span style={{ letterSpacing: '0.5px' }}>TIẾN ĐỘ TỔNG THỂ</span>
          <span style={{
            background: 'var(--color-terracotta-100, #FBEEE6)',
            padding: '2px 8px',
            borderRadius: '6px',
            border: '1px solid var(--color-terracotta-300, #F1C2A7)',
            fontFamily: 'monospace'
          }}>{progressPercent}%</span>
        </div>
        <div
          style={{
            width: '100%',
            height: '12px',
            background: 'var(--color-terracotta-100, #FBEEE6)',
            borderRadius: '999px',
            overflow: 'hidden',
            padding: '2px',
            boxSizing: 'border-box',
            border: '1px solid var(--color-terracotta-200, #F7DBCC)'
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              background:
                'linear-gradient(90deg, var(--color-terracotta-500, #E7A27A), var(--color-terracotta-600, #D9794E), var(--color-terracotta-700, #B5523A))',
              borderRadius: '999px',
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 0 12px rgba(181, 82, 58, 0.45)'
            }}
          />
        </div>
      </div>

      {/* 4 Steps List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {STEPS.map((step) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          let badgeBg = 'var(--color-terracotta-50, #FFFAF6)';
          let badgeColor = 'var(--color-terracotta-600, #D9794E)';
          let borderStyle = '1px solid var(--color-terracotta-200, #F7DBCC)';
          let cardBg = '#FFFFFF';

          if (isCompleted) {
            badgeBg = 'var(--color-terracotta-100, #FBEEE6)';
            badgeColor = 'var(--color-terracotta-700, #B5523A)';
            borderStyle = '1.5px solid var(--color-terracotta-300, #F1C2A7)';
            cardBg = 'rgba(255, 250, 246, 0.85)';
          } else if (isActive) {
            badgeBg = 'var(--color-terracotta-300, #F1C2A7)';
            badgeColor = 'var(--color-terracotta-700, #B5523A)';
            borderStyle = '2px solid var(--color-terracotta-700, #B5523A)';
            cardBg = 'var(--color-terracotta-100, #FBEEE6)';
          }

          return (
            <div
              key={step.id}
              data-testid={`step-item-${step.id}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                padding: '18px 20px',
                borderRadius: '16px',
                background: cardBg,
                border: borderStyle,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isActive
                  ? '0 8px 24px rgba(181, 82, 58, 0.22), 0 0 0 1px rgba(181, 82, 58, 0.15)'
                  : '0 2px 6px rgba(122, 62, 46, 0.03)',
                transform: isActive ? 'scale(1.01)' : 'none',
              }}
            >
              {/* Step Icon Badge */}
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: badgeBg,
                  color: badgeColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '1px',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  boxShadow: isActive ? '0 4px 10px rgba(181, 82, 58, 0.25)' : 'none'
                }}
              >
                {isCompleted ? (
                  <CheckIcon />
                ) : isActive ? (
                  <SpinnerIcon />
                ) : (
                  renderStepIcon(step.id)
                )}
              </div>

              {/* Step Info */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                  }}
                >
                  <h4
                    style={{
                      fontSize: '0.94rem',
                      fontWeight: isActive ? 900 : 700,
                      color: isActive
                        ? 'var(--color-terracotta-700, #B5523A)'
                        : isCompleted
                        ? 'var(--color-terracotta-900, #7A3E2E)'
                        : 'var(--color-terracotta-900, #7A3E2E)',
                      margin: 0,
                    }}
                  >
                    {step.title}
                  </h4>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '8px',
                      background: isCompleted ? 'var(--color-terracotta-100, #FBEEE6)' : isActive ? 'var(--color-terracotta-700, #B5523A)' : 'var(--color-terracotta-100, #FBEEE6)',
                      color: isCompleted ? 'var(--color-terracotta-700, #B5523A)' : isActive ? '#FFFFFF' : '#8C5E51',
                      border: isCompleted ? '1px solid var(--color-terracotta-300, #F1C2A7)' : 'none',
                      boxShadow: isActive ? '0 2px 6px rgba(181, 82, 58, 0.3)' : 'none'
                    }}
                  >
                    {isCompleted ? 'Hoàn tất' : isActive ? 'Đang chạy' : 'Chờ xử lý'}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '0.82rem',
                    color: isActive ? '#7A3E2E' : '#8C5E51',
                    margin: 0,
                    lineHeight: '1.5',
                  }}
                >
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes stepperSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProgressStepper;
