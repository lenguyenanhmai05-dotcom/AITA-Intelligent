import React from 'react';

export interface MemberContribution {
  id: string;
  name: string;
  role: string;
  locShare: number;
  commitShare: number;
  prShare: number;
  totalContribution: number;
  isFreeRiding: boolean;
}

export interface TeamReportProps {
  members: MemberContribution[];
  onSelectMember: (memberId: string) => void;
  onViewFlaggedCommits: () => void;
}

export const TeamContributionReport: React.FC<TeamReportProps> = ({
  members,
  onSelectMember,
  onViewFlaggedCommits,
}) => {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '24px', border: '1px solid rgba(120, 132, 23, 0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Báo Cáo Đóng Góp Nhóm (Team Contribution Report)</h2>
        <button onClick={onViewFlaggedCommits} style={{ padding: '10px 16px', background: '#FEF2F2', color: '#B91C1C', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          🚨 Xem Commits Bất Thường / Gian Lận
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
        <thead style={{ background: '#FAF9F1' }}>
          <tr>
            <th style={{ padding: '12px 18px', borderBottom: '2px solid #E5E7EB' }}>Thành viên</th>
            <th style={{ padding: '12px 18px', borderBottom: '2px solid #E5E7EB' }}>Tỷ lệ LOC (40%)</th>
            <th style={{ padding: '12px 18px', borderBottom: '2px solid #E5E7EB' }}>Commit (40%)</th>
            <th style={{ padding: '12px 18px', borderBottom: '2px solid #E5E7EB' }}>PR (20%)</th>
            <th style={{ padding: '12px 18px', borderBottom: '2px solid #E5E7EB' }}>Tổng Đóng Góp</th>
            <th style={{ padding: '12px 18px', borderBottom: '2px solid #E5E7EB' }}>Trạng thái</th>
            <th style={{ padding: '12px 18px', borderBottom: '2px solid #E5E7EB' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
              <td style={{ padding: '14px 18px', fontWeight: 700 }}>{member.name}</td>
              <td style={{ padding: '14px 18px' }}>{member.locShare}%</td>
              <td style={{ padding: '14px 18px' }}>{member.commitShare}%</td>
              <td style={{ padding: '14px 18px' }}>{member.prShare}%</td>
              <td style={{ padding: '14px 18px', fontWeight: 800, color: '#EA580C' }}>{member.totalContribution}%</td>
              <td style={{ padding: '14px 18px' }}>
                {member.isFreeRiding ? (
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#FEE2E2', color: '#B91C1C', padding: '4px 10px', borderRadius: '6px' }}>
                    ⚠️ Free-riding
                  </span>
                ) : (
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#EDF6E8', color: '#166534', padding: '4px 10px', borderRadius: '6px' }}>
                    Đạt yêu cầu
                  </span>
                )}
              </td>
              <td style={{ padding: '14px 18px' }}>
                <button onClick={() => onSelectMember(member.id)} style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                  Chi tiết
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
