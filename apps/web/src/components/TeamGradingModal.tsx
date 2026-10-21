import React, { useState } from 'react';
import {
  X,
  FolderGit2,
  GitBranch,
  Play,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { TeamGroupItem } from './GroupAssignmentModal';

interface TeamGradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClassCode: string;
  classesList: string[];
  teamsList: TeamGroupItem[];
  classTeamsMap?: Record<string, TeamGroupItem[]>;
  gradedTeamNames?: string[];
  onResetGradedTeams?: (classCode: string) => void;
  onStartGrading: (selectedTeamNames: string[], classCode?: string) => void;
  onViewTeamReport: (teamName: string) => void;
  lang: 'vi' | 'en';
  isDark: boolean;
}

export const TeamGradingModal: React.FC<TeamGradingModalProps> = ({
  isOpen,
  onClose,
  selectedClassCode,
  classesList,
  teamsList,
  classTeamsMap,
  gradedTeamNames = [],
  onResetGradedTeams,
  onStartGrading,
  onViewTeamReport,
  lang,
  isDark
}) => {
  const [targetClass, setTargetClass] = useState<string>(selectedClassCode || 'SWP391-SE1801');
  
  React.useEffect(() => {
    if (selectedClassCode && selectedClassCode !== 'all') {
      setTargetClass(selectedClassCode);
    }
  }, [selectedClassCode, isOpen]);

  // Retrieve teams for current class (respects class switch within modal)
  const currentClassTeams = React.useMemo(() => {
    if (classTeamsMap && classTeamsMap[targetClass]) {
      return classTeamsMap[targetClass];
    }
    return teamsList;
  }, [classTeamsMap, targetClass, teamsList]);

  // Only show teams that have NOT been graded yet
  const pendingTeams = React.useMemo(() => {
    return currentClassTeams.filter(t => !gradedTeamNames.includes(t.teamName));
  }, [currentClassTeams, gradedTeamNames]);

  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>('');

  React.useEffect(() => {
    if (isOpen) {
      setSelectedTeams(pendingTeams.map(t => t.teamName));
    }
  }, [isOpen, pendingTeams]);

  if (!isOpen) return null;

  const handleToggleSelectTeam = (name: string) => {
    if (selectedTeams.includes(name)) {
      setSelectedTeams(selectedTeams.filter(t => t !== name));
    } else {
      setSelectedTeams([...selectedTeams, name]);
    }
  };

  const handleSelectAll = () => {
    if (selectedTeams.length === pendingTeams.length) {
      setSelectedTeams([]);
    } else {
      setSelectedTeams(pendingTeams.map(t => t.teamName));
    }
  };

  const handleStartAnalysis = () => {
    if (selectedTeams.length === 0) return;
    setIsScanning(true);
    setScanStep(lang === 'vi' ? 'Đang tạo tác vụ & Đẩy vào Hàng đợi Redis Queue (BullMQ)...' : 'Creating jobs & Enqueuing into Redis Queue (BullMQ)...');
    setTimeout(() => {
      setScanStep(lang === 'vi' ? 'Workers đang clone Git & Phân tích AST...' : 'Workers cloning Git & Analyzing AST...');
      setTimeout(() => {
        setIsScanning(false);
        onStartGrading(selectedTeams, targetClass);
        onClose();
      }, 700);
    }, 700);
  };

  // Stats for display (3 groups)
  const getTeamStats = (teamName: string) => {
    if (teamName.includes('1')) {
      return { commits: 104, loc: 8360, prs: 15, freeRiders: 1, freeRiderStatus: 'warning' as const };
    }
    if (teamName.includes('2')) {
      return { commits: 88, loc: 6420, prs: 12, freeRiders: 0, freeRiderStatus: 'safe' as const };
    }
    return { commits: 72, loc: 5110, prs: 9, freeRiders: 1, freeRiderStatus: 'warning' as const };
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.68)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 130,
      padding: '16px'
    }}>
      <div style={{
        background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
        borderRadius: '24px',
        maxWidth: '1080px',
        width: '95vw',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        border: isDark ? '1px solid var(--border-light)' : '1.5px solid #F1C2A7',
        boxShadow: '0 25px 60px rgba(122, 62, 46, 0.35)',
        color: 'var(--text-main)',
        overflow: 'hidden'
      }}>
        {/* MODAL HEADER */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 28px',
          borderBottom: isDark ? '1px solid var(--border-light)' : '1px solid #FBEEE6',
          background: isDark ? 'rgba(45, 26, 22, 0.6)' : 'linear-gradient(90deg, #FFFAF6 0%, #FBEEE6 100%)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--color-terracotta-600, #D9794E), var(--color-terracotta-800, #7A3E2E))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              boxShadow: '0 4px 14px rgba(181, 82, 58, 0.35)'
            }}>
              <FolderGit2 size={22} />
            </div>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.70rem',
                fontWeight: 800,
                color: 'var(--color-terracotta-700, #B5523A)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '2px'
              }}>
                <ShieldCheck size={13} />
                <span>{lang === 'vi' ? 'CHẤM ĐỘC LẬP THEO LINK GITHUB REPO • KHÔNG NHẦM VỚI BÀI CÁ NHÂN' : 'GIT REPO ANALYTICS • SEPARATE FROM INDIVIDUAL GRADING'}</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)' }}>
                {lang === 'vi' ? 'Chấm Điểm Đồ Án Nhóm (Git Forensics & Free-Rider)' : 'Team Projects Grading & Git Analytics'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isScanning}
            style={{
              background: isDark ? 'var(--bg-surface-subtle)' : '#F3F4F6',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: isScanning ? 'not-allowed' : 'pointer',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Explanation Banner */}
          <div style={{
            background: isDark ? 'rgba(45, 26, 22, 0.4)' : '#FBEEE6',
            borderRadius: '16px',
            padding: '16px 20px',
            border: isDark ? '1px solid var(--color-terracotta-200, #4A2B24)' : '1px solid #F7DBCC',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px'
          }}>
            <Activity size={22} color="var(--color-terracotta-700, #B5523A)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-terracotta-800, #7A3E2E)', marginBottom: '4px' }}>
                {lang === 'vi' ? 'Tiêu Chí Chấm Đồ Án Nhóm Tự Động (AITA Git Forensics)' : 'Automated Team Project Evaluation Rules'}
              </div>
              <p style={{ fontSize: '0.82rem', color: isDark ? 'var(--color-terracotta-600, #F1C2A7)' : '#8C5E51', margin: 0, lineHeight: 1.5 }}>
                {lang === 'vi'
                  ? 'Chấm đồ án nhóm không dùng file ZIP cá nhân mà bóc tách trực tiếp từ GitHub Repository chung: Tính Net LOC thực chất (loại bỏ padding/khoảng trắng), đếm Commits & Pull Requests theo từng thành viên, tự động gắn cờ cảnh báo Free-Rider nếu tỷ lệ đóng góp < 10%.'
                  : 'Team projects are evaluated independently from individual submissions via GitHub repos: Computes Net LOC (AST stripped of padding), counts Commits & PRs per member, and triggers Free-Rider flags if contribution < 10%.'}
              </p>
            </div>
          </div>

          {/* If all teams have been graded, show clean completion state */}
          {pendingTeams.length === 0 ? (
            <div style={{
              padding: '44px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              background: isDark ? 'rgba(45, 26, 22, 0.35)' : '#FFFBF8',
              borderRadius: '20px',
              border: isDark ? '1px solid var(--border-light)' : '1.5px solid #F1C2A7'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16A34A'
              }}>
                <CheckCircle size={36} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0 0 6px 0', color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)' }}>
                  {lang === 'vi' ? `Tất Cả ${currentClassTeams.length} Nhóm Của Lớp Đã Được Chấm Xong!` : `All ${currentClassTeams.length} Teams in Class Have Been Graded!`}
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, maxWidth: '500px', lineHeight: 1.5 }}>
                  {lang === 'vi'
                    ? 'Các nhóm đã chấm điểm thành công và lưu kết quả vào Giám Sát Queue và Báo Cáo Git. Các nhóm này sẽ không còn xuất hiện trong danh sách chờ chấm.'
                    : 'All team projects have been graded and recorded in Queue Monitor and Git Reports. Graded teams are hidden from pending list.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewTeamReport('Nhóm 1');
                  }}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, var(--color-terracotta-600, #D9794E), var(--color-terracotta-800, #7A3E2E))',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(181, 82, 58, 0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Activity size={16} />
                  <span>{lang === 'vi' ? 'Xem Báo Cáo Đóng Góp Git ➔' : 'View Git Contributions ➔'}</span>
                </button>

                {onResetGradedTeams && (
                  <button
                    type="button"
                    onClick={() => onResetGradedTeams(targetClass)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      background: 'transparent',
                      color: 'var(--color-terracotta-700, #B5523A)',
                      border: '1.5px solid var(--color-terracotta-400, #E7A27A)',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {lang === 'vi' ? '🔄 Chấm lại các nhóm này' : '🔄 Re-grade teams'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Filter and Select All Row */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.80rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                    {lang === 'vi' ? 'LỚP HỌC:' : 'CLASS:'}
                  </span>
                  <select
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '10px',
                      border: isDark ? '1px solid var(--border-light)' : '1.5px solid #F1C2A7',
                      background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                      color: 'var(--text-main)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  >
                    {Array.from(new Set([...classesList, 'SWP391-SE1801', 'PRN231-SE1803', 'PRJ301-IS1702', 'MMA301'])).map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-terracotta-700, #B5523A)',
                      fontWeight: 800,
                      fontSize: '0.80rem',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {selectedTeams.length === pendingTeams.length
                      ? (lang === 'vi' ? 'Bỏ Chọn Tất Cả' : 'Deselect All')
                      : (lang === 'vi' ? 'Chọn Tất Cả Nhóm' : 'Select All Teams')}
                  </button>

                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: 'rgba(181, 82, 58, 0.12)',
                    color: 'var(--color-terracotta-800, #7A3E2E)'
                  }}>
                    {lang === 'vi' ? `Chờ chấm: ${selectedTeams.length}/${pendingTeams.length} nhóm` : `Pending: ${selectedTeams.length}/${pendingTeams.length} teams`}
                  </span>
                </div>
              </div>

              {/* Table of Team Submissions */}
              <div style={{
                borderRadius: '16px',
                border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0',
                overflow: 'hidden',
                background: isDark ? 'var(--bg-surface)' : '#FFFFFF'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ background: isDark ? 'var(--bg-surface-subtle)' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ width: '40px', padding: '12px 14px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedTeams.length === pendingTeams.length && pendingTeams.length > 0}
                          onChange={handleSelectAll}
                          style={{ cursor: 'pointer' }}
                        />
                      </th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-muted)' }}>NHÓM & ĐỀ TÀI ĐỒ ÁN</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-muted)' }}>THÀNH VIÊN</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-muted)' }}>GIT REPO</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-muted)' }}>CHỈ SỐ GIT</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-muted)' }}>FREE-RIDER</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'right' }}>THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingTeams.map((team, idx) => {
                      const isChecked = selectedTeams.includes(team.teamName);
                      const stats = getTeamStats(team.teamName);
                      return (
                        <tr
                          key={team.id}
                          style={{
                            background: isChecked ? (isDark ? 'rgba(181, 82, 58, 0.08)' : 'rgba(251, 238, 230, 0.4)') : 'transparent',
                            borderBottom: idx !== pendingTeams.length - 1 ? (isDark ? '1px solid var(--border-light)' : '1px solid #F1F5F9') : 'none'
                          }}
                        >
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSelectTeam(team.teamName)}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 800, color: 'var(--color-terracotta-700, #B5523A)', fontSize: '0.88rem' }}>
                              {team.teamName}
                            </div>
                            <div style={{ fontSize: '0.80rem', fontWeight: 600, color: isDark ? '#FFFAF6' : 'var(--text-main)', marginTop: '2px' }}>
                              {team.projectTopic}
                            </div>
                          </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.78rem' }}>
                        <div style={{ fontWeight: 800 }}>👑 {team.leader}</div>
                        <div style={{ color: 'var(--text-muted)' }}>
                          {team.members.filter(m => m !== team.leader).join(', ') || 'Chưa thêm'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <a
                          href={team.gitUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--color-terracotta-700, #B5523A)',
                            fontWeight: 700,
                            textDecoration: 'none',
                            fontSize: '0.76rem'
                          }}
                        >
                          <GitBranch size={13} />
                          <span>{team.gitUrl.replace('https://github.com/', '')}</span>
                        </a>
                        <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Nhánh: <span style={{ fontWeight: 800 }}>{team.branch}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.78rem' }}>
                        <div><span style={{ fontWeight: 800, color: 'var(--color-terracotta-800, #7A3E2E)' }}>{stats.commits}</span> commits</div>
                        <div style={{ color: 'var(--text-muted)' }}>+{stats.loc.toLocaleString()} LOC</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {stats.freeRiderStatus === 'warning' ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 9px',
                            borderRadius: '8px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: '#DC2626',
                            fontWeight: 800,
                            fontSize: '0.72rem'
                          }}>
                            <AlertTriangle size={12} />
                            <span>1 Free-Rider</span>
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 9px',
                            borderRadius: '8px',
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#059669',
                            fontWeight: 800,
                            fontSize: '0.72rem'
                          }}>
                            <CheckCircle size={12} />
                            <span>An Toàn</span>
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => {
                            onViewTeamReport(team.teamName);
                            onClose();
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: isDark ? 'var(--color-terracotta-100, #2D1A16)' : 'var(--color-terracotta-100, #FBEEE6)',
                            border: '1px solid #F1C2A7',
                            color: 'var(--color-terracotta-700, #B5523A)',
                            fontWeight: 800,
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <span>{lang === 'vi' ? 'Xem Báo Cáo AST' : 'View AST Report'}</span>
                          <ExternalLink size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>

        {/* FOOTER */}
        <div style={{
          padding: '16px 28px',
          borderTop: isDark ? '1px solid var(--border-light)' : '1px solid #FBEEE6',
          background: isDark ? 'var(--bg-surface-subtle)' : '#FAFAFA',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.80rem', color: 'var(--text-muted)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            <span>Git Engine Telemetry: Sẵn sàng kết nối GitHub API & Docker Sandbox</span>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isScanning}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0',
                background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                color: 'var(--text-body)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: isScanning ? 'not-allowed' : 'pointer'
              }}
            >
              {lang === 'vi' ? 'Đóng' : 'Close'}
            </button>

            <button
              type="button"
              disabled={selectedTeams.length === 0 || isScanning}
              onClick={handleStartAnalysis}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '10px',
                border: pendingTeams.length === 0 ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
                background: selectedTeams.length === 0 || isScanning
                  ? (pendingTeams.length === 0 ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5') : '#94A3B8')
                  : 'linear-gradient(135deg, var(--color-terracotta-600, #D9794E), var(--color-terracotta-800, #7A3E2E))',
                color: pendingTeams.length === 0 ? '#059669' : '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.86rem',
                cursor: selectedTeams.length === 0 || isScanning ? 'not-allowed' : 'pointer',
                boxShadow: selectedTeams.length === 0 || isScanning ? 'none' : '0 4px 14px rgba(181, 82, 58, 0.35)'
              }}
            >
              {isScanning ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{scanStep || (lang === 'vi' ? 'Đang chấm điểm Git...' : 'Grading Git...')}</span>
                </>
              ) : pendingTeams.length === 0 ? (
                <>
                  <CheckCircle size={16} />
                  <span>{lang === 'vi' ? `✓ Đã Hoàn Tất Chấm (${currentClassTeams.length} Nhóm)` : `✓ All Graded (${currentClassTeams.length} Teams)`}</span>
                </>
              ) : (
                <>
                  <Play size={16} fill="#FFFFFF" />
                  <span>{lang === 'vi' ? `Bắt Đầu Chấm Git (${selectedTeams.length} Nhóm)` : `Start Git Grading (${selectedTeams.length} Teams)`}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
