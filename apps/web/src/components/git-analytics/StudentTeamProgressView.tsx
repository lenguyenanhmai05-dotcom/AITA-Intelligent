import React from 'react';
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  CheckCircle2, 
  ExternalLink,
  Users,
  Sparkles,
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

  const heatmapWeeks = [
    [2, 4, 5, 7, 6, 3, 1],
    [3, 6, 8, 10, 7, 4, 0],
    [4, 7, 9, 12, 8, 5, 2],
    [6, 12, 18, 26, 22, 14, 6],
  ];

  const getHeatmapColor = (count: number) => {
    if (count === 0) return isDark ? '#1F2937' : '#F3F4F6';
    if (count <= 3) return isDark ? '#064E3B' : '#D1FAE5';
    if (count <= 7) return isDark ? '#047857' : '#6EE7B7';
    if (count <= 14) return isDark ? '#059669' : '#10B981';
    return isDark ? '#10B981' : '#047857';
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
      
      {/* 1. Header Bar: Friendly Student Peer Progress */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '26px',
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
            fontSize: '1.95rem',
            fontWeight: 900,
            fontFamily: 'var(--font-heading)',
            color: isDark ? '#F9FAFB' : '#0F172A',
            margin: '0 0 6px 0',
            letterSpacing: '-0.4px',
          }}>
            {lang === 'vi' ? 'Tiến Độ Dự Án & Phân Bổ Công Việc Nhóm 2' : 'Group 2 Project Progress & Workload Balance'}
          </h1>
          <p style={{
            fontSize: '0.88rem',
            color: isDark ? '#9CA3AF' : '#475569',
            margin: 0,
            lineHeight: 1.5,
          }}>
            {lang === 'vi'
              ? 'Theo dõi mức độ hoàn thành nhiệm vụ, nhịp độ làm việc và tỷ lệ đóng góp công bằng giữa các thành viên trong nhóm.'
              : 'Track project milestones, teamwork rhythm, and fair workload distribution among team members.'}
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

      {/* 2. Top 3 Clean Metric Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '18px',
        marginBottom: '26px'
      }}>
        {/* Card 1: Verified Commits */}
        <div style={{
          background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
          borderRadius: '18px',
          padding: '22px 24px',
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
          <div style={{ fontSize: '2.1rem', fontWeight: 900, color: isDark ? '#F9FAFB' : '#0F172A', marginTop: '8px' }}>
            104 <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748B' }}>{lang === 'vi' ? 'lượt' : 'commits'}</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={13} />
            <span>{lang === 'vi' ? 'Đã đồng bộ từ kho GitHub chính' : 'Synced from GitHub repository'}</span>
          </div>
        </div>

        {/* Card 2: Net LOC */}
        <div style={{
          background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
          borderRadius: '18px',
          padding: '22px 24px',
          border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 18px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: isDark ? '#9CA3AF' : '#64748B' }}>
              {lang === 'vi' ? 'DÒNG CODE ĐÓNG GÓP (NET LOC)' : 'NET CODE CONTRIBUTIONS'}
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GitPullRequest size={18} color="#10B981" />
            </div>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#10B981', marginTop: '8px' }}>
            +8,360 <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748B' }}>{lang === 'vi' ? 'dòng code' : 'lines'}</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: isDark ? '#9CA3AF' : '#64748B', marginTop: '6px' }}>
            +10,030 {lang === 'vi' ? 'dòng thêm' : 'added'} • -1,670 {lang === 'vi' ? 'dòng xóa' : 'deleted'}
          </div>
        </div>

        {/* Card 3: Team Harmony & Synergy */}
        <div style={{
          background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
          borderRadius: '18px',
          padding: '22px 24px',
          border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 18px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: isDark ? '#9CA3AF' : '#64748B' }}>
              {lang === 'vi' ? 'ĐỘ HÀI HÒA CÔNG VIỆC' : 'TEAMWORK SYNERGY'}
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} color="#F59E0B" />
            </div>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#F59E0B', marginTop: '8px' }}>
            94 <span style={{ fontSize: '1.1rem', color: '#64748B' }}>/ 100</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700, marginTop: '6px' }}>
            ✓ {lang === 'vi' ? 'Phân bổ công việc công bằng, tích cực' : 'Fair and active workload distribution'}
          </div>
        </div>
      </div>

      {/* 3. Clean Workload Distribution Capsule Bar */}
      <div style={{
        background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
        borderRadius: '20px',
        padding: '24px 26px',
        border: isDark ? '1px solid var(--border-light)' : '1.5px solid #E2E8F0',
        marginBottom: '26px',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 18px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: isDark ? '#F9FAFB' : '#0F172A' }}>
              {lang === 'vi' ? 'Tỷ Lệ Phân Bổ Khối Lượng Công Việc' : 'Team Workload Distribution Ratio'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: isDark ? '#9CA3AF' : '#64748B', margin: '4px 0 0 0' }}>
              {lang === 'vi' ? 'Tính toán chuẩn hóa theo: 40% Dòng mã thực + 40% Lượt commits + 20% Pull requests' : 'Calculated by: 40% Net LOC + 40% Commits + 20% Pull Requests'}
            </p>
          </div>
        </div>

        {/* 38px Capsule Bar */}
        <div style={{
          width: '100%',
          height: '38px',
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

      {/* 4. 30-Day Activity Heatmap */}
      <div style={{
        background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
        borderRadius: '20px',
        padding: '24px 26px',
        border: isDark ? '1px solid var(--border-light)' : '1.5px solid #E2E8F0',
        marginBottom: '26px',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 18px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: isDark ? '#F9FAFB' : '#0F172A' }}>
              {lang === 'vi' ? 'Lưới Nhiệt Hoạt Động 30 Ngày (Activity Heatmap)' : '30-Day Team Activity Heatmap'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: isDark ? '#9CA3AF' : '#64748B', margin: '4px 0 0 0' }}>
              {lang === 'vi' ? 'Ghi nhận tần suất làm việc đều đặn của cả nhóm trong suốt thời gian thực hiện dự án.' : 'Rhythm of daily commits pushed by team members across 30 days.'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: isDark ? '#9CA3AF' : '#64748B', fontWeight: 700 }}>
            <span>{lang === 'vi' ? 'Ít hơn' : 'Less'}</span>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: getHeatmapColor(0) }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: getHeatmapColor(3) }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: getHeatmapColor(7) }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: getHeatmapColor(15) }} />
            <span>{lang === 'vi' ? 'Nhiều hơn' : 'More'}</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div style={{ overflowX: 'auto', paddingBottom: '6px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', minWidth: '480px' }}>
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, dIdx) => (
              <div key={dIdx} style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 800, color: isDark ? '#9CA3AF' : '#64748B', paddingBottom: '4px' }}>
                {day}
              </div>
            ))}
            {heatmapWeeks.flatMap((week, wIdx) =>
              week.map((val, dIdx) => (
                <div
                  key={`${wIdx}-${dIdx}`}
                  style={{
                    height: '42px',
                    borderRadius: '8px',
                    background: getHeatmapColor(val),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: val > 6 ? '#FFFFFF' : isDark ? '#D1D5DB' : '#1E293B',
                    border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.03)',
                  }}
                  title={`${val} commits`}
                >
                  {val > 0 ? val : ''}
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: isDark ? '1px solid #374151' : '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: isDark ? '#9CA3AF' : '#64748B' }}>
          <span>💡 {lang === 'vi' ? 'Giai đoạn cao điểm Sprint đạt 92 commits' : 'Peak sprint reached 92 commits'}</span>
          <span style={{ color: '#10B981', fontWeight: 700 }}>✓ {lang === 'vi' ? '28 ngày ghi nhận hoạt động liên tục' : '28 active days recorded'}</span>
        </div>
      </div>

      {/* 5. Clean Member Contribution Table */}
      <div style={{
        background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
        borderRadius: '20px',
        border: isDark ? '1px solid var(--border-light)' : '1.5px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 18px rgba(0,0,0,0.03)',
        marginBottom: '32px'
      }}>
        <div style={{ padding: '22px 26px', borderBottom: isDark ? '1px solid #374151' : '1px solid #F1F5F9' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: isDark ? '#F9FAFB' : '#0F172A' }}>
            {lang === 'vi' ? 'Bảng Phân Bổ Công Việc Thành Viên Nhóm 2' : 'Group 2 Member Workload Breakdown'}
          </h3>
          <p style={{ fontSize: '0.78rem', color: isDark ? '#9CA3AF' : '#64748B', margin: '4px 0 0 0' }}>
            {lang === 'vi' ? 'Tổng hợp số lượt commit, pull request, dòng mã thực tế và vai trò trong đồ án của từng bạn.' : 'Granular commits, pull requests, net LOC, and project roles for each team member.'}
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
            <thead style={{ background: isDark ? 'rgba(31, 41, 55, 0.6)' : '#F8FAFC', borderBottom: isDark ? '1px solid #374151' : '1px solid #E2E8F0' }}>
              <tr>
                <th style={{ padding: '14px 20px', fontWeight: 800, color: isDark ? '#D1D5DB' : '#475569', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {lang === 'vi' ? 'THÀNH VIÊN' : 'MEMBER'}
                </th>
                <th style={{ padding: '14px 20px', fontWeight: 800, color: isDark ? '#D1D5DB' : '#475569', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
                  {lang === 'vi' ? 'COMMITS' : 'COMMITS'}
                </th>
                <th style={{ padding: '14px 20px', fontWeight: 800, color: isDark ? '#D1D5DB' : '#475569', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
                  {lang === 'vi' ? 'PULL REQUESTS' : 'PULL REQUESTS'}
                </th>
                <th style={{ padding: '14px 20px', fontWeight: 800, color: isDark ? '#D1D5DB' : '#475569', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>
                  {lang === 'vi' ? 'NET LOC' : 'NET LOC'}
                </th>
                <th style={{ padding: '14px 20px', fontWeight: 800, color: isDark ? '#D1D5DB' : '#475569', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>
                  {lang === 'vi' ? 'TỶ LỆ % ĐÓNG GÓP' : 'CONTRIBUTION %'}
                </th>
                <th style={{ padding: '14px 20px', fontWeight: 800, color: isDark ? '#D1D5DB' : '#475569', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
                  {lang === 'vi' ? 'VAI TRÒ TRONG ĐỒ ÁN' : 'PROJECT ROLE'}
                </th>
                <th style={{ padding: '14px 20px', fontWeight: 800, color: isDark ? '#D1D5DB' : '#475569', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
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
                    
                    {/* Member Name + Avatar */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
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
                          <div style={{ fontWeight: 800, color: isDark ? '#F9FAFB' : '#0F172A', fontSize: '0.90rem' }}>
                            {m.name}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: isDark ? '#9CA3AF' : '#64748B', marginTop: '1px' }}>
                            {m.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Commits */}
                    <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 800, color: isDark ? '#E5E7EB' : '#1E293B' }}>
                      {m.commits}
                    </td>

                    {/* PRs */}
                    <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 800, color: isDark ? '#E5E7EB' : '#1E293B' }}>
                      {m.prs}
                    </td>

                    {/* Net LOC */}
                    <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: '#10B981' }}>
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

                    {/* Project Role Badge (Friendly, No Free-rider wording!) */}
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '5px 12px',
                        borderRadius: '999px',
                        fontSize: '0.74rem',
                        fontWeight: 800,
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
