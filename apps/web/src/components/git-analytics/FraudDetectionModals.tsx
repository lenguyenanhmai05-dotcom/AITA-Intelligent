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
        <div style={{ background: '#FFFFFF', borderRadius: '22px', maxWidth: '680px', width: '100%', padding: '30px', boxShadow: '0 25px 50px -12px rgba(122, 62, 46, 0.25)', border: '1.5px solid var(--color-terracotta-200, #F7DBCC)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-terracotta-900, #7A3E2E)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span>
            <span>Danh Sách Commits Bất Thường / Gian Lận</span>
          </h3>
          <button onClick={onCloseFlaggedModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#8C5E51', padding: '4px' }}>✕</button>
        </div>
        
        <p style={{ fontSize: '0.85rem', color: '#8C5E51', marginBottom: '20px', lineHeight: '1.5' }}>
          Hệ thống phát hiện các hành vi gian lận tiềm ẩn như chỉ sửa khoảng trắng (whitespace-only) hoặc tự hoàn tác commit trước đó (self-revert).
        </p>

        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--color-terracotta-200, #F7DBCC)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead style={{ background: 'var(--color-terracotta-100, #FBEEE6)', textAlign: 'left', fontSize: '0.74rem', color: 'var(--color-terracotta-900, #7A3E2E)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <tr>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-terracotta-200, #F7DBCC)', fontWeight: 800 }}>Tác Giả</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-terracotta-200, #F7DBCC)', fontWeight: 800 }}>Mã Commit</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-terracotta-200, #F7DBCC)', fontWeight: 800 }}>Nội Dung</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-terracotta-200, #F7DBCC)', fontWeight: 800 }}>Lý Do Cảnh Báo</th>
              </tr>
            </thead>
            <tbody>
              {flaggedCommits.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: idx === flaggedCommits.length - 1 ? 'none' : '1px solid var(--color-terracotta-200, #F7DBCC)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--color-terracotta-900, #7A3E2E)' }}>{item.author}</td>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: 'var(--color-terracotta-700, #B5523A)', fontWeight: 700 }}>{item.commitHash}</td>
                  <td style={{ padding: '14px 16px', color: '#8C5E51' }}>{item.message}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--color-terracotta-700, #B5523A)', fontWeight: 800 }}>{item.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ marginTop: '22px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onCloseFlaggedModal} style={{ padding: '10px 22px', borderRadius: '10px', background: 'var(--color-terracotta-100, #FBEEE6)', color: 'var(--color-terracotta-900, #7A3E2E)', border: '1px solid var(--color-terracotta-300, #F1C2A7)', cursor: 'pointer', fontWeight: 800, fontSize: '0.84rem', transition: 'background 0.2s' }}>
            Đóng bảng
          </button>
        </div>
      </div>
    </div>
  );
};
