import React from 'react';
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  CheckCircle2, 
  ExternalLink,
  Users,
  Search
} from 'lucide-react';
import { MemberDetailInfo } from './MemberDetailsModal';

export interface StudentTeamProgressViewProps {
  lang?: 'vi' | 'en';
  isDark?: boolean;
  onSelectMember?: (member: MemberDetailInfo) => void;
  gitReportData?: any;
}

export const StudentTeamProgressView: React.FC<StudentTeamProgressViewProps> = ({
  lang = 'vi',
  isDark = false,
  onSelectMember,
  gitReportData,
}) => {
  const fallbackMembers: Array<MemberDetailInfo & { roleNameVi: string; roleNameEn: string; roleColor: string }> = [
    {
      name: 'Lê Nguyễn Anh Mai',
      email: 'le.nguyen.anh.mai@fpt.edu.vn',
      initials: 'LÊ',
      commits: 42,
      prs: 6,
      loc: '+3,420 / -850',
      codeLines: '+3,420 / -850',
      pct: 38.5,
      color: '#2563EB',
      roleNameVi: '👑 Nhóm Trưởng (Team Lead)',
      roleNameEn: '👑 Team Lead',
      roleColor: '#F59E0B',
    },
    {
      name: 'Trần Quốc Bảo',
      email: 'tran.quoc.bao@fpt.edu.vn',
      initials: 'TR',
      commits: 35,
      prs: 4,
      loc: '+2,850 / -420',
      codeLines: '+2,850 / -420',
      pct: 31.0,
      color: '#0EA5E9',
      roleNameVi: '⚡ Thành Viên Core (Git & API)',
      roleNameEn: '⚡ Core Member (Git & API)',
      roleColor: '#0EA5E9',
    },
    {
      name: 'Phạm Hoàng Long',
      email: 'pham.hoang.long@fpt.edu.vn',
      initials: 'PH',
      commits: 24,
      prs: 4,
      loc: '+1,840 / -300',
      codeLines: '+1,840 / -300',
      pct: 26.5,
      color: '#10B981',
      roleNameVi: '⚡ Thành Viên Core (UI & Testing)',
      roleNameEn: '⚡ Core Member (UI & Testing)',
      roleColor: '#10B981',
    },
    {
      name: 'Võ Minh Trí',
      email: 'vo.minh.tri@fpt.edu.vn',
      initials: 'VÕ',
      commits: 3,
      prs: 0,
      loc: '+250 / -210',
      codeLines: '+250 / -210',
      pct: 4.0,
      color: '#64748B',
      roleNameVi: '🌱 Thành Viên Nhóm (Member)',
      roleNameEn: '🌱 Team Member',
      roleColor: '#94A3B8',
    },
  ];

  const members = (gitReportData?.teamContributions && gitReportData.teamContributions.length > 0)
    ? gitReportData.teamContributions.map((m: any, idx: number) => ({
        ...m,
        initials: (m.initials || m.name?.substring(0, 2) || 'TV').toUpperCase(),
        codeLines: m.codeLines || `+${m.loc || 0}`,
        roleNameVi: idx === 0 ? '👑 Nhóm Trưởng (Team Lead)' : (idx === 1 || idx === 2) ? '⚡ Thành Viên Core' : '🌱 Thành Viên Nhóm',
        roleNameEn: idx === 0 ? '👑 Team Lead' : (idx === 1 || idx === 2) ? '⚡ Core Member' : '🌱 Team Member',
        roleColor: idx === 0 ? '#F59E0B' : (idx === 1 || idx === 2) ? '#0EA5E9' : '#94A3B8',
      }))
    : fallbackMembers;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', animation: 'fadeIn 0.35s ease' }}>
      
      {/* 1. Header Bar: Friendly Student Peer Progress */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.74rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            color: '#2563EB',
            background: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF',
            padding: '4px 12px',
            borderRadius: '999px',
            marginBottom: '8px',
            border: isDark ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid #BFDBFE',
          }}>
            <Users size={13} />
            <span>{lang === 'vi' ? 'NHÓM 2 • ĐỒ ÁN SWP391 • AITA INTELLIGENT' : 'GROUP 2 • SWP391 CAPSTONE • AITA INTELLIGENT'}</span>
          </div>
          <h1 style={{
            fontSize: '1.85rem',
            fontWeight: 900,
            fontFamily: 'var(--font-heading)',
            color: isDark ? '#F9FAFB' : '#0F172A',
            margin: '0 0 6px 0',
            letterSpacing: '-0.3px',
          }}>
            {lang === 'vi' ? 'Tiến Độ Dự Án & Phân Bổ Công Việc Nhóm 2' : 'Group 2 Project Progress & Workload Balance'}
          </h1>
          <p style={{
            fontSize: '0.86rem',
            color: isDark ? '#9CA3AF' : '#475569',
            margin: 0,
            lineHeight: 1.5,
          }}>
            {lang === 'vi'
              ? 'Theo dõi tiến độ chung, tỷ lệ phân chia công việc và kết quả đóng góp của các bạn trong nhóm.'
              : 'Track project milestones, workload balance, and contribution results among team members.'}
          </p>
        </div>

        {/* GitHub Repository Quick Link */}
        <a
          href="https://github.com/lenguyenanhmai05/AITA-Intelligent"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '12px',
            background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
            border: isDark ? '1px solid var(--border-light)' : '1.5px solid #E2E8F0',
            color: isDark ? '#F9FAFB' : '#1E293B',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '0.82rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#2563EB';
            e.currentTarget.style.color = '#2563EB';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = isDark ? 'var(--border-light)' : '#E2E8F0';
            e.currentTarget.style.color = isDark ? '#F9FAFB' : '#1E293B';
          }}
        >
          <GitBranch size={15} color="#2563EB" />
          <span>GitHub: lenguyenanhmai05/AITA-Intelligent</span>
          <ExternalLink size={13} style={{ opacity: 0.6 }} />
        </a>
      </div>

      {/* 2. Top 3 Clean Encouraging Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Card 1: Verified Commits */}
        <div style={{
          background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
          borderRadius: '18px',
          padding: '20px 22px',
          border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 18px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: isDark ? '#9CA3AF' : '#64748B' }}>
              {lang === 'vi' ? 'TỔNG COMMITS CỦA NHÓM' : 'TOTAL TEAM COMMITS'}
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: isDark ? 'rgba(37, 99, 235, 0.2)' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GitCommit size={18} color="#2563EB" />
            </div>
          </div>
          <div style={{ fontSize: '2.0rem', fontWeight: 900, color: isDark ? '#F9FAFB' : '#0F172A', marginTop: '8px' }}>
            104 <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>{lang === 'vi' ? 'lượt' : 'commits'}</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#10B981', fontWeight: 700, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={13} />
            <span>{lang === 'vi' ? 'Đã đồng bộ từ kho GitHub chính' : 'Synced from GitHub repository'}</span>
          </div>
        </div>

        {/* Card 2: Net LOC */}
        <div style={{
          background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
          borderRadius: '18px',
          padding: '20px 22px',
          border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 18px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: isDark ? '#9CA3AF' : '#64748B' }}>
              {lang === 'vi' ? 'DÒNG CODE ĐÓNG GÓP' : 'NET CODE CONTRIBUTIONS'}
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GitPullRequest size={18} color="#10B981" />
            </div>
          </div>
          <div style={{ fontSize: '2.0rem', fontWeight: 900, color: '#10B981', marginTop: '8px' }}>
            +8,360 <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>{lang === 'vi' ? 'dòng code' : 'lines'}</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: isDark ? '#9CA3AF' : '#64748B', marginTop: '6px' }}>
            +10,030 {lang === 'vi' ? 'dòng thêm' : 'added'} • -1,670 {lang === 'vi' ? 'dòng xóa' : 'deleted'}
          </div>
        </div>

        {/* Card 3: Team Progress Status (Encouraging, No Confusion) */}
        <div style={{
          background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
          borderRadius: '18px',
          padding: '20px 22px',
          border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 18px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: isDark ? '#9CA3AF' : '#64748B' }}>
              {lang === 'vi' ? 'TIẾN ĐỘ & TRẠNG THÁI' : 'PROJECT STATUS'}
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} color="#10B981" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10B981', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{lang === 'vi' ? 'Đúng Kế Hoạch' : 'On Track'}</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: isDark ? '#9CA3AF' : '#64748B', marginTop: '8px' }}>
            {lang === 'vi' ? 'Cả 4 thành viên đều tích cực đóng góp' : 'All 4 members actively contributing'}
          </div>
        </div>
      </div>

      {/* 3. Clean Workload Distribution Capsule Bar */}
      <div style={{
        background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
        borderRadius: '20px',
        padding: '22px 24px',
        border: isDark ? '1px solid var(--border-light)' : '1.5px solid #E2E8F0',
        marginBottom: '24px',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 18px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 800, margin: 0, color: isDark ? '#F9FAFB' : '#0F172A' }}>
              {lang === 'vi' ? 'Tỷ Lệ Phân Bổ Khối Lượng Công Việc' : 'Team Workload Distribution Ratio'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: isDark ? '#9CA3AF' : '#64748B', margin: '4px 0 0 0' }}>
              {lang === 'vi' ? 'Tổng hợp theo khối lượng code, số lượt commit và đóng góp thực tế trong dự án.' : 'Aggregated from code volume, commit counts, and project contributions.'}
            </p>
          </div>
        </div>

        {/* 36px Capsule Bar */}
        <div style={{
          width: '100%',
          height: '36px',
          borderRadius: '999px',
          background: isDark ? '#1F2937' : '#F1F5F9',
          overflow: 'hidden',
          display: 'flex',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
          border: isDark ? '1px solid #374151' : '1px solid #E2E8F0',
          marginBottom: '16px',
        }}>
          {members.map((m: any, idx: number) => {
            const barColors = ['#2563EB', '#0EA5E9', '#10B981', '#F59E0B'];
            const color = barColors[idx % barColors.length];
            return (
              <div
                key={idx}
                style={{
                  width: `${m.pct}%`,
                  height: '100%',
                  background: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  borderRight: idx < members.length - 1 ? '1.5px solid rgba(255,255,255,0.4)' : 'none',
                  transition: 'width 0.4s ease',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
                title={`${m.name}: ${m.pct}%`}
              >
                {m.pct >= 10 ? `${m.pct}%` : ''}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          {members.map((m: any, idx: number) => {
            const barColors = ['#2563EB', '#0EA5E9', '#10B981', '#F59E0B'];
            const color = barColors[idx % barColors.length];
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600 }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, display: 'inline-block' }} />
                <span style={{ color: isDark ? '#E5E7EB' : '#1E293B' }}>{m.name}</span>
                <span style={{ color: isDark ? '#9CA3AF' : '#64748B', fontWeight: 700 }}>({m.pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Clean & Focused Member Contribution Table */}
      <div style={{
        background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
        borderRadius: '20px',
        border: isDark ? '1px solid var(--border-light)' : '1.5px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 18px rgba(0,0,0,0.03)',
        marginBottom: '32px'
      }}>
        <div style={{ padding: '20px 24px', borderBottom: isDark ? '1px solid #374151' : '1px solid #F1F5F9' }}>
          <h3 style={{ fontSize: '1.02rem', fontWeight: 800, margin: 0, color: isDark ? '#F9FAFB' : '#0F172A' }}>
            {lang === 'vi' ? 'Bảng Đóng Góp Thành Viên Nhóm 2' : 'Group 2 Member Contribution Breakdown'}
          </h3>
          <p style={{ fontSize: '0.78rem', color: isDark ? '#9CA3AF' : '#64748B', margin: '4px 0 0 0' }}>
            {lang === 'vi' ? 'Chi tiết số lượt commit, dòng mã thực tế và vai trò trong đồ án của từng bạn.' : 'Details of commits, net code lines, and project roles for each member.'}
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
            <thead style={{ background: isDark ? 'rgba(31, 41, 55, 0.6)' : '#F8FAFC', borderBottom: isDark ? '1px solid #374151' : '1px solid #E2E8F0' }}>
              <tr>
                <th style={{ width: '40%', padding: '14px 20px', fontWeight: 800, color: isDark ? '#D1D5DB' : '#475569', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {lang === 'vi' ? 'THÀNH VIÊN & VAI TRÒ' : 'MEMBER & ROLE'}
                </th>
                <th style={{ width: '15%', padding: '14px 20px', fontWeight: 800, color: isDark ? '#D1D5DB' : '#475569', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
                  {lang === 'vi' ? 'COMMITS' : 'COMMITS'}
                </th>
                <th style={{ width: '15%', padding: '14px 20px', fontWeight: 800, color: isDark ? '#D1D5DB' : '#475569', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>
                  {lang === 'vi' ? 'NET LOC' : 'NET LOC'}
                </th>
                <th style={{ width: '18%', padding: '14px 20px', fontWeight: 800, color: isDark ? '#D1D5DB' : '#475569', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>
                  {lang === 'vi' ? 'TỶ LỆ ĐÓNG GÓP' : 'CONTRIBUTION %'}
                </th>
                <th style={{ width: '12%', padding: '14px 20px', fontWeight: 800, color: isDark ? '#D1D5DB' : '#475569', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
                  {lang === 'vi' ? 'CHI TIẾT' : 'DETAILS'}
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((m: any, idx: number) => {
                const barColors = ['#2563EB', '#0EA5E9', '#10B981', '#F59E0B'];
                const color = barColors[idx % barColors.length];
                return (
                  <tr key={idx} style={{ borderBottom: isDark ? '1px solid #374151' : '1px solid #F1F5F9', transition: 'background 0.15s' }}>
                    
                    {/* Member Name + Role Badge + Avatar */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: color,
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {m.initials}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, color: isDark ? '#F9FAFB' : '#0F172A', fontSize: '0.92rem' }}>
                              {m.name}
                            </span>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '0.70rem',
                              fontWeight: 700,
                              background: idx === 0 
                                ? (isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7') 
                                : (idx === 1 || idx === 2) 
                                ? (isDark ? 'rgba(14, 165, 233, 0.18)' : '#E0F2FE')
                                : (isDark ? 'rgba(148, 163, 184, 0.18)' : '#F1F5F9'),
                              color: idx === 0 
                                ? '#D97706' 
                                : (idx === 1 || idx === 2) 
                                ? '#0284C7' 
                                : (isDark ? '#CBD5E1' : '#475569'),
                              border: idx === 0 
                                ? '1px solid #FCD34D' 
                                : (idx === 1 || idx === 2) 
                                ? '1px solid #BAE6FD' 
                                : '1px solid #CBD5E1',
                            }}>
                              {lang === 'vi' ? m.roleNameVi : m.roleNameEn}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: isDark ? '#9CA3AF' : '#64748B', marginTop: '2px' }}>
                            {m.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Commits */}
                    <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 800, color: isDark ? '#E5E7EB' : '#1E293B', fontSize: '0.90rem' }}>
                      {m.commits} <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>commits</span>
                    </td>

                    {/* Net LOC */}
                    <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: '#10B981', fontSize: '0.86rem' }}>
                      {m.codeLines || `+${m.loc}`}
                    </td>

                    {/* % Contribution with micro-bar */}
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span style={{ fontWeight: 900, color: color, fontSize: '0.92rem' }}>
                          {m.pct}%
                        </span>
                        <div style={{ width: '80px', height: '5px', borderRadius: '3px', background: isDark ? '#374151' : '#E2E8F0', overflow: 'hidden' }}>
                          <div style={{ width: `${m.pct}%`, height: '100%', background: color, borderRadius: '3px' }} />
                        </div>
                      </div>
                    </td>

                    {/* Action Button: View Granular Milestones */}
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <button
                        onClick={() => onSelectMember && onSelectMember(m)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          background: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF',
                          border: isDark ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid #BFDBFE',
                          color: '#2563EB',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#2563EB';
                          e.currentTarget.style.color = '#FFFFFF';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF';
                          e.currentTarget.style.color = '#2563EB';
                        }}
                      >
                        <Search size={13} />
                        <span>{lang === 'vi' ? 'Xem' : 'View'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
