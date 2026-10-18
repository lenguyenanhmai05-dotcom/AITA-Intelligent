import React, { useState, useEffect } from 'react';

export interface FreeRidingThresholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThreshold: number;
  onSave: (newThreshold: number) => void;
  lang?: 'vi' | 'en';
  isDark?: boolean;
}

export const FreeRidingThresholdModal: React.FC<FreeRidingThresholdModalProps> = ({
  isOpen,
  onClose,
  currentThreshold,
  onSave,
  lang = 'vi',
  isDark = false,
}) => {
  const [val, setVal] = useState<number>(currentThreshold || 5);
  const [error, setError] = useState<string | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setVal(currentThreshold || 5);
      setError(null);
    }
  }, [isOpen, currentThreshold]);

  // Keyboard accessibility: Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleChange = (num: number) => {
    setVal(num);
    if (num < 1 || num > 20 || isNaN(num)) {
      setError(
        lang === 'vi'
          ? 'Quy tắc BR-12: Ngưỡng cảnh báo chỉ được phép từ 1% đến 20%.'
          : 'Rule BR-12: Free-riding threshold must strictly be between 1% and 20%.'
      );
    } else {
      setError(null);
    }
  };

  const handleConfirm = () => {
    if (val < 1 || val > 20 || isNaN(val)) return;
    onSave(val);
    onClose();
  };

  if (!isOpen) return null;

  const isValid = !error && val >= 1 && val <= 20;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="threshold-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: isDark ? 'var(--bg-surface, #1E293B)' : '#FFFFFF',
          borderRadius: '22px',
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: isDark ? '1px solid var(--border-light, #334155)' : '1px solid #E2E8F0',
          color: 'var(--text-main, #0F172A)',
          padding: '28px',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                fontWeight: 900,
              }}
            >
              ⚙️
            </div>
            <div>
              <h3
                id="threshold-modal-title"
                style={{
                  margin: 0,
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: isDark ? '#F8FAFC' : '#0F172A',
                }}
              >
                {lang === 'vi' ? 'Cấu Hình Ngưỡng Cảnh Báo Free-Rider' : 'Free-Riding Threshold Settings'}
              </h3>
              <div style={{ fontSize: '0.75rem', color: isDark ? '#94A3B8' : '#64748B', marginTop: '2px' }}>
                Business Rule: <span style={{ fontWeight: 700, color: '#EF4444' }}>BR-12</span> (Threshold Constraint 1% - 20%)
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.2rem',
              color: isDark ? '#94A3B8' : '#64748B',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Description Banner */}
        <div
          style={{
            background: isDark ? 'rgba(51, 65, 85, 0.4)' : '#F8FAFC',
            borderRadius: '12px',
            padding: '14px 16px',
            border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
            fontSize: '0.82rem',
            lineHeight: 1.5,
            color: isDark ? '#CBD5E1' : '#475569',
            marginBottom: '22px',
          }}
        >
          {lang === 'vi'
            ? 'Hệ thống sẽ tự động quét tỷ lệ phần trăm đóng góp của từng thành viên. Bất kỳ sinh viên nào có mức đóng góp dưới ngưỡng này sẽ bị gắn cờ đỏ "⚠️ Free-Rider" trên báo cáo chính thức.'
            : 'Any team member whose total weighted contribution falls below this threshold will be flagged with a red "⚠️ Free-Rider" badge.'}
        </div>

        {/* Input Controls: Slider & Number Input */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 700, color: isDark ? '#E2E8F0' : '#1E293B' }}>
              {lang === 'vi' ? 'Ngưỡng Tối Thiểu (% Đóng Góp):' : 'Minimum Contribution Threshold (%):'}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="number"
                min="1"
                max="20"
                value={isNaN(val) ? '' : val}
                onChange={(e) => handleChange(Number(e.target.value))}
                style={{
                  width: '68px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: error ? '2px solid #EF4444' : isDark ? '1px solid #475569' : '1px solid #CBD5E1',
                  background: isDark ? '#0F172A' : '#FFFFFF',
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  textAlign: 'center',
                }}
              />
              <span style={{ fontWeight: 800, color: '#EF4444' }}>%</span>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <input
            type="range"
            min="1"
            max="20"
            value={isNaN(val) ? 5 : val}
            onChange={(e) => handleChange(Number(e.target.value))}
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '999px',
              accentColor: '#EF4444',
              cursor: 'pointer',
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.72rem',
              color: isDark ? '#94A3B8' : '#64748B',
              marginTop: '6px',
            }}
          >
            <span>Min: 1%</span>
            <span style={{ fontWeight: 700, color: isDark ? '#CBD5E1' : '#334155' }}>
              {lang === 'vi' ? 'Mặc định: 5%' : 'Default: 5%'}
            </span>
            <span>Max: 20%</span>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                marginTop: '10px',
                fontSize: '0.75rem',
                color: '#EF4444',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: isDark ? '#334155' : '#F1F5F9',
              color: isDark ? '#E2E8F0' : '#475569',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
            }}
          >
            {lang === 'vi' ? 'Hủy Bỏ' : 'Cancel'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            style={{
              padding: '10px 22px',
              borderRadius: '10px',
              background: isValid ? '#EF4444' : '#94A3B8',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.84rem',
              cursor: isValid ? 'pointer' : 'not-allowed',
              boxShadow: isValid ? '0 4px 12px rgba(239, 68, 68, 0.3)' : 'none',
              transition: 'background 0.2s',
            }}
          >
            {lang === 'vi' ? 'Lưu Ngưỡng BR-12' : 'Save Threshold'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FreeRidingThresholdModal;
