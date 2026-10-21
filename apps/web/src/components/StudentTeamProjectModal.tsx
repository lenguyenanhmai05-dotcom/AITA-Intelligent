import React, { useState, useMemo } from 'react';
import {
  X,
  Users,
  FolderGit2,
  GitBranch,
  ExternalLink,
  Crown,
  Mail,
  CheckCircle,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  School,
  AlertCircle
} from 'lucide-react';
import { TeamGroupItem } from './GroupAssignmentModal';

interface StudentTeamProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  classTeamsMap: Record<string, TeamGroupItem[]>;
  selectedClassCode: string;
  userFullName: string;
  userEmail: string;
  onGoToTeamSubmission: (team?: TeamGroupItem) => void;
  lang: 'vi' | 'en';
  isDark: boolean;
}

export const StudentTeamProjectModal: React.FC<StudentTeamProjectModalProps> = ({
  isOpen,
  onClose,
  classTeamsMap,
  selectedClassCode,
  userFullName,
  userEmail,
  onGoToTeamSubmission,
  lang,
  isDark
}) => {
  const [copiedGit, setCopiedGit] = useState<boolean>(false);

  // Available classes list
  const availableClasses = useMemo(() => {
    const fromMap = Object.keys(classTeamsMap);
    const defaults = ['SWP391-SE1801', 'PRN231-SE1803', 'PRJ301-IS1702', 'MMA301', 'SE19B'];
    return Array.from(new Set([...fromMap, ...defaults])).filter(Boolean);
  }, [classTeamsMap]);

  // Selected class state
  const [selectedClass, setSelectedClass] = useState<string>(
    selectedClassCode && selectedClassCode !== 'all' ? selectedClassCode : 'SWP391-SE1801'
  );

  const teamsInClass: TeamGroupItem[] = useMemo(() => {
    try {
      const saved = localStorage.getItem('aita_class_teams_map');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed[selectedClass] && parsed[selectedClass].length > 0) {
          return parsed[selectedClass];
        }
      }
    } catch {}
    return classTeamsMap[selectedClass] || (selectedClass === 'SWP391-SE1801' ? classTeamsMap['SWP391-SE1801'] || [] : []);
  }, [classTeamsMap, selectedClass, isOpen]);

  // Find strictly the student's assigned team in selectedClass (student CANNOT view other teams)
  const currentTeam: TeamGroupItem | null = useMemo(() => {
    if (teamsInClass.length === 0) return null;
    const cleanName = userFullName.trim().toLowerCase();
    const cleanMail = userEmail.trim().toLowerCase();

    const found = teamsInClass.find(t => {
      const inMembers = t.members.some(m => m.toLowerCase().includes(cleanName) || cleanName.includes(m.toLowerCase()));
      const inMemberDetails = t.memberDetails?.some(m =>
        m.name.toLowerCase().includes(cleanName) ||
        cleanName.includes(m.name.toLowerCase()) ||
        (cleanMail && m.email && m.email.toLowerCase() === cleanMail)
      );
      return inMembers || inMemberDetails;
    });

    return found || (selectedClass === 'SWP391-SE1801' ? teamsInClass[0] : null);
  }, [teamsInClass, userFullName, userEmail, selectedClass]);

  if (!isOpen) return null;

  const handleCopyGit = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedGit(true);
    setTimeout(() => setCopiedGit(false), 2500);
  };

  const isMyTeam = !!currentTeam;

  const membersList = currentTeam
    ? (currentTeam.memberDetails && currentTeam.memberDetails.length > 0
        ? currentTeam.memberDetails
        : currentTeam.members.map((m, idx) => ({
            mssv: currentTeam.leaderMssv && idx === 0 ? currentTeam.leaderMssv : `SE180${idx + 1}01`,
            name: m,
            email: `${m.toLowerCase().replace(/\s+/g, '')}.se180${idx + 1}01@fpt.edu.vn`,
            role: m === currentTeam.leader || idx === 0 ? 'Leader' : 'Member'
          })))
    : [];

  const leaderInfo = membersList.find(m => m.role === 'Leader') || membersList[0];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 130,
      padding: '16px'
    }}>
      <div style={{
        background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
        borderRadius: '24px',
        maxWidth: '1000px',
        width: '95vw',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        border: isDark ? '1px solid var(--border-light)' : '1.5px solid #F1C2A7',
        boxShadow: '0 25px 65px rgba(122, 62, 46, 0.4)',
        color: 'var(--text-main)',
        overflow: 'hidden'
      }}>
        {/* MODAL HEADER */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 24px',
          borderBottom: isDark ? '1px solid var(--border-light)' : '1px solid #FBEEE6',
          background: isDark ? 'rgba(45, 26, 22, 0.65)' : 'linear-gradient(90deg, #FFFAF6 0%, #FBEEE6 100%)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--color-kumquat, #EA6D35), var(--color-orange-zest, #D95328))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              boxShadow: '0 4px 14px rgba(217, 83, 40, 0.35)'
            }}>
              <FolderGit2 size={24} />
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
                letterSpacing: '0.6px',
                marginBottom: '2px'
              }}>
                <Sparkles size={12} />
                <span>{lang === 'vi' ? 'ĐỀ BÀI ĐỒ ÁN NHÓM • PHÂN CÔNG TỪ GIẢNG VIÊN' : 'ASSIGNED TEAM CAPSTONE PROJECT'}</span>
              </div>
              <h3 style={{ fontSize: '1.20rem', fontWeight: 800, margin: 0, color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)' }}>
                {lang === 'vi' ? 'Đề Bài Đồ Án Nhóm Của Bạn' : 'Your Assigned Team Project'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: isDark ? 'var(--bg-surface-subtle)' : '#F3F4F6',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* CLASS SELECTOR BAR (Select class to view your assigned team in that class) */}
        <div style={{
          padding: '12px 24px',
          background: isDark ? 'rgba(40, 22, 18, 0.5)' : '#FFFBF8',
          borderBottom: isDark ? '1px solid var(--border-light)' : '1px solid #FBEEE6',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          overflowX: 'auto',
          flexShrink: 0
        }}>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            color: 'var(--color-terracotta-700, #B5523A)',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <School size={15} />
            <span>{lang === 'vi' ? 'Chọn lớp học:' : 'Select Class:'}</span>
          </span>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            padding: '2px 0'
          }}>
            {availableClasses.map((cCode) => {
              const isSelected = selectedClass === cCode;
              return (
                <button
                  key={cCode}
                  type="button"
                  onClick={() => setSelectedClass(cCode)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '10px',
                    fontSize: '0.80rem',
                    fontWeight: 800,
                    lineHeight: 1.3,
                    cursor: 'pointer',
                    border: isSelected
                      ? '1.5px solid var(--color-terracotta-600, #D9794E)'
                      : (isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0'),
                    background: isSelected
                      ? (isDark ? 'rgba(217, 121, 78, 0.25)' : 'var(--color-terracotta-100, #FBEEE6)')
                      : (isDark ? 'var(--bg-surface)' : '#FFFFFF'),
                    color: isSelected ? 'var(--color-terracotta-800, #7A3E2E)' : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    boxShadow: isSelected ? '0 2px 8px rgba(217, 121, 78, 0.15)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{cCode}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MODAL BODY */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 26px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>

          {!currentTeam ? (
            <div style={{
              padding: '44px 24px',
              textAlign: 'center',
              background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F9FAFB',
              borderRadius: '16px',
              border: '1.5px dashed #CBD5E1'
            }}>
              <AlertCircle size={36} color="#D97706" style={{ margin: '0 auto 10px auto' }} />
              <div style={{ fontSize: '0.96rem', fontWeight: 800, color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)' }}>
                {lang === 'vi' ? `Bạn chưa có nhóm đồ án trong lớp ${selectedClass}` : `No team assigned for you in ${selectedClass}`}
              </div>
              <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '460px', marginInline: 'auto' }}>
                {lang === 'vi'
                  ? `Giảng viên phụ trách lớp ${selectedClass} chưa phân công nhóm cho bạn. Vui lòng chọn lớp SWP391-SE1801 để xem nhóm của mình hoặc liên hệ giảng viên.`
                  : `Your instructor hasn't published team assignments for ${selectedClass} yet. Please switch to SWP391-SE1801 or check back later.`}
              </div>
            </div>
          ) : (
            <>
              {/* HERO PROJECT BANNER */}
              <div style={{
                borderRadius: '18px',
                padding: '20px 24px',
                background: isDark
                  ? 'linear-gradient(135deg, rgba(45, 26, 22, 0.8) 0%, rgba(30, 16, 13, 0.9) 100%)'
                  : 'linear-gradient(135deg, #FFF9F5 0%, #FBEEE6 100%)',
                border: isDark ? '1.5px solid #683B2E' : '1.5px solid #F1C2A7',
                boxShadow: '0 6px 18px rgba(122, 62, 46, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    padding: '3px 9px',
                    borderRadius: '6px',
                    background: '#EFF6FF',
                    color: '#2563EB',
                    border: '1px solid #BFDBFE'
                  }}>
                    {currentTeam.classCode || selectedClass}
                  </span>

                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, var(--color-terracotta-600, #D9794E), var(--color-terracotta-800, #7A3E2E))',
                    color: '#FFF'
                  }}>
                    {currentTeam.teamName} (Nhóm của bạn)
                  </span>

                  {isMyTeam && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '3px 9px',
                      borderRadius: '6px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#059669',
                      border: '1px solid #10B981'
                    }}>
                      <CheckCircle size={12} />
                      <span>{lang === 'vi' ? 'DỰ ÁN NHÓM CỦA BẠN' : 'YOUR ASSIGNED PROJECT'}</span>
                    </span>
                  )}

                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(217, 121, 78, 0.12)',
                    color: 'var(--color-terracotta-800, #7A3E2E)'
                  }}>
                    {currentTeam.status === 'approved' ? (lang === 'vi' ? '✓ Đề tài đã duyệt' : '✓ Approved Topic') : (lang === 'vi' ? '⏳ Chờ duyệt' : '⏳ Pending')}
                  </span>
                </div>

                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)',
                  margin: '6px 0 10px 0',
                  lineHeight: 1.35
                }}>
                  {currentTeam.projectTopic}
                </h2>

                <p style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  margin: 0,
                  lineHeight: 1.5
                }}>
                  {lang === 'vi'
                    ? `Đồ án nhóm môn học SWP391. Tất cả các thành viên (${membersList.length} sinh viên) cùng hợp tác và đẩy commit lên 1 Git Repository chung. Hệ thống AITA sẽ bóc tách AST, đếm commits, Net LOC, PRs và phát hiện Free-Rider (< 10%).`
                    : `Team Capstone Project. All members commit to one common Git Repository. AITA tracks commits, Net LOC, PRs, and detects free-riders.`}
                </p>
              </div>

              {/* GIT REPOSITORY CARD */}
              <div style={{
                borderRadius: '14px',
                padding: '14px 18px',
                background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F9FAFB',
                border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(217, 121, 78, 0.15)',
                    color: 'var(--color-terracotta-700, #B5523A)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <GitBranch size={20} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.70rem', fontWeight: 800, color: 'var(--color-terracotta-800, #7A3E2E)', textTransform: 'uppercase' }}>
                      🐙 Git Repository Chung Của Nhóm (Nhánh {currentTeam.branch || 'main'})
                    </div>
                    <a
                      href={currentTeam.gitUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        color: 'var(--color-terracotta-700, #B5523A)',
                        textDecoration: 'none',
                        wordBreak: 'break-all',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '2px'
                      }}
                    >
                      <span>{currentTeam.gitUrl}</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleCopyGit(currentTeam.gitUrl)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      color: 'var(--text-body)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {copiedGit ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                    <span>{copiedGit ? (lang === 'vi' ? 'Đã Copy!' : 'Copied!') : (lang === 'vi' ? 'Copy Link' : 'Copy')}</span>
                  </button>

                  <a
                    href={currentTeam.gitUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      background: 'var(--color-terracotta-700, #B5523A)',
                      color: '#FFF',
                      textDecoration: 'none',
                      fontSize: '0.76rem',
                      fontWeight: 800
                    }}
                  >
                    <span>Mở GitHub</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* LEADER HERO BADGE */}
              <div style={{
                padding: '12px 18px',
                borderRadius: '14px',
                background: isDark ? 'rgba(217, 119, 6, 0.12)' : 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                border: '1.5px solid #F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#D97706',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(217, 119, 6, 0.4)'
                  }}>
                    <Crown size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      👑 Trưởng Nhóm (Leader)
                    </div>
                    <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#78350F' }}>
                      {leaderInfo?.name || currentTeam.leader}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    color: '#78350F',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    border: '1px solid #FCD34D'
                  }}>
                    MSSV: {leaderInfo?.mssv || currentTeam.leaderMssv || 'Chưa cập nhật'}
                  </span>

                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    color: '#78350F',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    border: '1px solid #FCD34D'
                  }}>
                    <Mail size={12} color="#D97706" />
                    <span>{leaderInfo?.email || `${(leaderInfo?.mssv || 'leader').toLowerCase()}@fpt.edu.vn`}</span>
                  </span>

                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: '#D97706',
                    color: '#FFFFFF',
                    fontSize: '0.72rem',
                    fontWeight: 800
                  }}>
                    Leader
                  </span>
                </div>
              </div>

              {/* MEMBERS LIST & ROLES TABLE */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={16} color="var(--color-terracotta-700, #B5523A)" />
                    <span style={{ fontSize: '0.80rem', fontWeight: 800, color: 'var(--color-terracotta-800, #7A3E2E)', textTransform: 'uppercase' }}>
                      Danh Sách Các Thành Viên Nhóm Của Bạn ({membersList.length} Sinh Viên)
                    </span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {lang === 'vi' ? 'Tất cả thành viên cần commit trên link Git chung' : 'All members must commit to the team Git'}
                  </span>
                </div>

                <div style={{
                  borderRadius: '14px',
                  border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0',
                  overflow: 'hidden'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: isDark ? 'var(--bg-surface-subtle)' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ padding: '9px 14px', fontWeight: 800, color: 'var(--text-muted)', width: '36px' }}>#</th>
                        <th style={{ padding: '9px 14px', fontWeight: 800, color: 'var(--text-muted)', width: '110px' }}>MSSV</th>
                        <th style={{ padding: '9px 14px', fontWeight: 800, color: 'var(--text-muted)' }}>HỌ VÀ TÊN</th>
                        <th style={{ padding: '9px 14px', fontWeight: 800, color: 'var(--text-muted)' }}>EMAIL / GMAIL</th>
                        <th style={{ padding: '9px 14px', fontWeight: 800, color: 'var(--text-muted)', width: '140px' }}>VAI TRÒ (ROLE)</th>
                        <th style={{ padding: '9px 14px', fontWeight: 800, color: 'var(--text-muted)', width: '130px' }}>TRẠNG THÁI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {membersList.map((m, mIdx) => {
                        const isRowLeader = m.role === 'Leader' || m.name === currentTeam.leader;
                        const isCurrentUser = userFullName.toLowerCase().includes(m.name.toLowerCase()) ||
                          m.name.toLowerCase().includes(userFullName.toLowerCase()) ||
                          (userEmail && m.email && m.email.toLowerCase() === userEmail.toLowerCase());

                        return (
                          <tr
                            key={mIdx}
                            style={{
                              borderBottom: mIdx !== membersList.length - 1 ? (isDark ? '1px solid var(--border-light)' : '1px solid #F1F5F9') : 'none',
                              background: isCurrentUser
                                ? (isDark ? 'rgba(217, 121, 78, 0.12)' : '#FFF3EB')
                                : isRowLeader
                                  ? (isDark ? 'rgba(217, 119, 6, 0.05)' : '#FFFBEB')
                                  : 'transparent'
                            }}
                          >
                            <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 700 }}>
                              {mIdx + 1}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F3F4F6',
                                fontWeight: 800,
                                fontSize: '0.76rem',
                                color: 'var(--text-main)',
                                border: '1px solid #E2E8F0'
                              }}>
                                {m.mssv}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 700, color: isDark ? '#FFFAF6' : 'var(--text-main)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {isRowLeader && <Crown size={13} color="#D97706" />}
                                <span>{m.name}</span>
                                {isCurrentUser && (
                                  <span style={{
                                    fontSize: '0.64rem',
                                    fontWeight: 800,
                                    padding: '1px 6px',
                                    borderRadius: '5px',
                                    background: 'var(--color-terracotta-700, #B5523A)',
                                    color: '#FFF'
                                  }}>
                                    {lang === 'vi' ? 'Bạn' : 'You'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <a
                                href={`mailto:${m.email}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  color: 'var(--color-terracotta-700, #B5523A)',
                                  textDecoration: 'none',
                                  fontWeight: 600,
                                  fontSize: '0.78rem'
                                }}
                              >
                                <Mail size={12} color="var(--color-terracotta-600, #D9794E)" />
                                <span>{m.email}</span>
                              </a>
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{
                                padding: '3px 10px',
                                borderRadius: '12px',
                                fontSize: '0.70rem',
                                fontWeight: 800,
                                background: isRowLeader ? '#FEF3C7' : 'rgba(217, 121, 78, 0.1)',
                                color: isRowLeader ? '#92400E' : 'var(--color-terracotta-700, #B5523A)',
                                border: isRowLeader ? '1px solid #FCD34D' : '1px solid rgba(217, 121, 78, 0.2)'
                              }}>
                                {isRowLeader ? '👑 Leader (Trưởng Nhóm)' : 'Thành Viên (Member)'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{
                                fontSize: '0.70rem',
                                fontWeight: 700,
                                color: '#059669',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <Check size={11} />
                                <span>Sẵn sàng commit</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div style={{
          padding: '14px 24px',
          borderTop: isDark ? '1px solid var(--border-light)' : '1px solid #FBEEE6',
          background: isDark ? 'var(--bg-surface-subtle)' : '#FAFAFA',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {currentTeam
              ? (lang === 'vi' ? `Nhóm: ${currentTeam.teamName} • Đề tài: ${currentTeam.projectTopic}` : `Team: ${currentTeam.teamName}`)
              : ''}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: isDark ? '1px solid var(--border-light)' : '1px solid #E2E8F0',
                background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                color: 'var(--text-body)',
                fontWeight: 700,
                fontSize: '0.80rem',
                cursor: 'pointer'
              }}
            >
              {lang === 'vi' ? 'Đóng' : 'Close'}
            </button>

            {currentTeam && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (typeof onGoToTeamSubmission === 'function') {
                    onGoToTeamSubmission(currentTeam);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--color-kumquat, #EA6D35), var(--color-orange-zest, #D95328))',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(217, 83, 40, 0.35)'
                }}
              >
                <span>{lang === 'vi' ? 'Đi Tới Nộp Bài Nhóm (Git)' : 'Go To Team Submission'}</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
