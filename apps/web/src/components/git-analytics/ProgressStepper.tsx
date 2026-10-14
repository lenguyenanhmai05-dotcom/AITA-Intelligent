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
        background: 'var(--bg-surface, #FFFFFF)',
        borderRadius: '20px',
        padding: '32px 36px',
        border: '1px solid var(--border-light, #E5E8D6)',
        boxShadow: 'var(--shadow-card, 0 4px 16px rgba(0, 0, 0, 0.05))',
        maxWidth: '680px',
        margin: '16px auto',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h2
          style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            color: 'var(--text-main, #1F2937)',
            marginBottom: '8px',
            fontFamily: 'var(--font-heading, inherit)',
          }}
        >
          Tiến Trình Phân Tích Kho Git (Analysis Progress)
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #6B7280)', margin: 0 }}>
          {statusText ||
            (isAnalyzing
              ? `Hệ thống đang xử lý tác vụ ngầm theo quy chuẩn SRS... (Bước ${currentStep}/4)`
              : 'Đã hoàn tất bóc tách dữ liệu kho Git.')}
        </p>
      </div>

      {/* Progress Bar Container */}
      <div style={{ marginBottom: '28px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.78rem',
            fontWeight: 700,
            marginBottom: '6px',
            color: 'var(--color-orange-zest, #D9641F)',
          }}
        >
          <span>TIẾN ĐỘ TỔNG THỂ</span>
          <span>{progressPercent}%</span>
        </div>
        <div
          style={{
            width: '100%',
            height: '10px',
            background: '#F3F4F6',
            borderRadius: '999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              background:
                'linear-gradient(90deg, var(--color-kumquat, #F5A623), var(--color-orange-zest, #D9641F))',
              borderRadius: '999px',
              transition: 'width 0.4s ease-in-out',
            }}
          />
        </div>
      </div>

      {/* 4 Steps List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {STEPS.map((step) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          let badgeBg = '#F3F4F6';
          let badgeColor = '#9CA3AF';
          let borderStyle = '1px solid #E5E7EB';
          let cardBg = '#FAFAFA';

          if (isCompleted) {
            badgeBg = '#ECFDF5';
            badgeColor = '#10B981';
            borderStyle = '1.5px solid #A7F3D0';
            cardBg = '#F0FDF4';
          } else if (isActive) {
            badgeBg = 'rgba(217, 100, 31, 0.12)';
            badgeColor = 'var(--color-orange-zest, #D9641F)';
            borderStyle = '1.5px solid var(--color-orange-zest, #D9641F)';
            cardBg = 'var(--bg-surface-subtle, #FAF9F1)';
          }

          return (
            <div
              key={step.id}
              data-testid={`step-item-${step.id}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '16px 18px',
                borderRadius: '14px',
                background: cardBg,
                border: borderStyle,
                transition: 'all 0.25s ease',
                boxShadow: isActive ? '0 4px 12px rgba(217, 100, 31, 0.12)' : 'none',
              }}
            >
              {/* Step Icon Badge */}
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: badgeBg,
                  color: badgeColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
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
                      fontSize: '0.92rem',
                      fontWeight: isActive ? 800 : 700,
                      color: isActive
                        ? 'var(--color-orange-zest, #D9641F)'
                        : isCompleted
                        ? '#065F46'
                        : 'var(--text-main, #374151)',
                      margin: 0,
                    }}
                  >
                    {step.title}
                  </h4>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: isCompleted ? '#D1FAE5' : isActive ? '#FFEDD5' : '#E5E7EB',
                      color: isCompleted ? '#047857' : isActive ? '#C2410C' : '#6B7280',
                    }}
                  >
                    {isCompleted ? 'Hoàn tất' : isActive ? 'Đang chạy' : 'Chờ xử lý'}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '0.80rem',
                    color: isActive ? 'var(--text-body, #4B5563)' : '#6B7280',
                    margin: 0,
                    lineHeight: '1.45',
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
