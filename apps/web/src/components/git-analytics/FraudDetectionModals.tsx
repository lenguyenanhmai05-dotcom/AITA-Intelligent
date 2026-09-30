import React from 'react';

export interface FlaggedCommit {
  id: string;
  author: string;
  commitHash: string;
  message: string;
  reason: string;
  date: string;
}

export interface ModalsProps {
  showFlaggedModal: boolean;
  onCloseFlaggedModal: () => void;
  flaggedCommits: FlaggedCommit[];
}

export const FraudDetectionModals: React.FC<ModalsProps> = ({
  showFlaggedModal,
  onCloseFlaggedModal,
  flaggedCommits,
}) => {
  if (!showFlaggedModal) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px'
    }}>
      <div style={{ background: '#FFFFFF', borderRadius: '20px', maxWidth: '680px', width: '100%', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#EA580C', margin: 0 }}>Danh Sách Commits Bất Thường / Gian Lận</h3>
          <button onClick={onCloseFlaggedModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#6B7280' }}>✕</button>
        </div>
        
        <p style={{ fontSize: '0.9rem', color: '#4B5563', marginBottom: '24px', lineHeight: '1.5' }}>
          Hệ thống phát hiện các hành vi gian lận tiềm ẩn như chỉ sửa khoảng trắng (whitespace-only) hoặc tự hoàn tác commit trước đó (self-revert).
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead style={{ background: '#F9FAFB', textAlign: 'left', fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase' }}>
              <tr>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>Tác Giả</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>Mã Commit</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>Nội Dung</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>Lý Do Cảnh Báo</th>
              </tr>
            </thead>
            <tbody>
              {flaggedCommits.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>{item.author}</td>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#374151' }}>{item.commitHash}</td>
                  <td style={{ padding: '14px 16px', color: '#4B5563' }}>{item.message}</td>
                  <td style={{ padding: '14px 16px', color: '#B91C1C', fontWeight: 700 }}>{item.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onCloseFlaggedModal} style={{ padding: '12px 24px', borderRadius: '10px', background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', cursor: 'pointer', fontWeight: 700, transition: 'background 0.2s' }}>
            Đóng bảng
          </button>
        </div>
      </div>
    </div>
  );
};
