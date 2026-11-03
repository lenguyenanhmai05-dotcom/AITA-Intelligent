import React, { useState, useEffect } from 'react';

const GITHUB_URL_REGEX = /^https:\/\/github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?$/;

export interface GitRepoSubmissionFormProps {
  onSubmit?: (url: string, branch: string, pat?: string) => void;
  lang?: 'vi' | 'en';
  isDark?: boolean;
  defaultUrl?: string;
  defaultBranch?: string;
  role?: 'student' | 'lecturer' | 'admin';
  hasSubmitted?: boolean;
  submittedAt?: string;
  onViewReport?: () => void;
  assignedTeam?: {
    id?: string;
    teamName: string;
    projectTopic?: string;
    leader?: string;
    members?: string[];
    gitUrl?: string;
    branch?: string;
    classCode?: string;
    topicType?: string;
  } | null;
  classTeams?: Array<{
    id?: string;
    teamName: string;
    projectTopic?: string;
    leader?: string;
    members?: string[];
    gitUrl?: string;
    branch?: string;
    classCode?: string;
    topicType?: string;
  }>;
  onOpenTeamDetails?: () => void;
  selectedClassCode?: string;
  classesList?: string[];
  availableClasses?: string[];
  onClassChange?: (newClass: string) => void;
}

export const GitRepoSubmissionForm: React.FC<GitRepoSubmissionFormProps> = ({ 
  onSubmit, 
  lang = 'vi', 
  isDark = false,
  defaultUrl,
  defaultBranch,
  role = 'student',
  hasSubmitted: initialHasSubmitted = false,
  submittedAt,
  onViewReport,
  assignedTeam,
  classTeams = [],
  onOpenTeamDetails,
  selectedClassCode: propClassCode = '',
  classesList = [],
  availableClasses,
  onClassChange
}) => {
  const isStudent = role === 'student';
  const rawList = availableClasses !== undefined ? availableClasses : classesList;
  const displayClassesList = (rawList && rawList.length > 0)
    ? Array.from(new Set(rawList.filter(c => Boolean(c) && !c.includes('—'))))
    : ['SWP391-SE1801', 'MMA301-SE19B', 'PRN231-SE1803', 'PRJ301-IS1702'];
  const selectedClassCode = propClassCode || (displayClassesList.length > 0 ? displayClassesList[0] : 'SWP391-SE1801');

  // Fallback default teams if classTeams is empty so dropdown 2 always has valid teams
  const effectiveClassTeams = (classTeams && classTeams.length > 0)
    ? classTeams
    : [
        {
          id: 'TG-1',
          teamName: 'Nhóm 1',
          projectTopic: 'AITA Intelligent - Hệ Thống Chấm Bài & Phân Tích Đóng Góp Git Tự Động',
          leader: 'Lê Nguyễn Anh Mai',
          members: ['Lê Nguyễn Anh Mai', 'Lê Nguyễn Linh Nhi', 'Nguyễn Tường Vy', 'Ngô Sử Việt Anh', 'Đào Trọng Nghĩa'],
          gitUrl: 'https://github.com/lenguyenanhmai05-dotcom/AITA-Intelligent',
          branch: 'main'
        },
        {
          id: 'TG-2',
          teamName: 'Nhóm 2',
          projectTopic: 'Smart Logistics - Hệ Thống Quản Lý Kho Vận & Vận Chuyển',
          leader: 'Trần Minh Quân',
          members: ['Trần Minh Quân', 'Hoàng Văn Nam', 'Phạm Thị Dung', 'Đỗ Đức Anh'],
          gitUrl: 'https://github.com/smart-lms/smart-lms-platform',
          branch: 'main'
        },
        {
          id: 'TG-3',
          teamName: 'Nhóm 3',
          projectTopic: 'E-Commerce AI - Sàn Thương Mại Điện Tử & Gợi Ý AI',
          leader: 'Phạm Hoàng Long',
          members: ['Phạm Hoàng Long', 'Vũ Quỳnh Anh', 'Ngô Quốc Bảo'],
          gitUrl: 'https://github.com/ecommerce-ai/platform',
          branch: 'main'
        }
      ];

  // Determine initial team object
  const initialTeam = isStudent 
    ? assignedTeam 
    : (effectiveClassTeams.find(t => t.gitUrl === defaultUrl) || effectiveClassTeams[0] || null);

  const [selectedTeamKey, setSelectedTeamKey] = useState<string>(
    initialTeam ? (initialTeam.id || initialTeam.teamName) : (effectiveClassTeams[0]?.teamName || 'Nhóm 1')
  );

  const [url, setUrl] = useState<string>(() => {
    if (defaultUrl !== undefined && defaultUrl.trim() !== '') return defaultUrl;
    if (assignedTeam?.gitUrl) return assignedTeam.gitUrl;
    if (initialTeam?.gitUrl) return initialTeam.gitUrl;
    return 'https://github.com/lenguyenanhmai05-dotcom/AITA-Intelligent';
  });

  const [branch, setBranch] = useState<string>(() => {
    if (defaultBranch !== undefined && defaultBranch.trim() !== '') return defaultBranch;
    if (assignedTeam?.branch) return assignedTeam.branch;
    if (initialTeam?.branch) return initialTeam.branch;
    return 'main';
  });

  const [error, setError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(!initialHasSubmitted);

  // Sync if assignedTeam or defaultUrl changes externally
  useEffect(() => {
    if (isStudent && assignedTeam) {
      if (assignedTeam.gitUrl && (!url || url.includes('smart-lms'))) {
        setUrl(assignedTeam.gitUrl);
      }
      if (assignedTeam.branch) {
        setBranch(assignedTeam.branch);
      }
    }
  }, [assignedTeam, isStudent]);

  // Lecturer: Sync team selection and repo URL when class or classTeams change
  const prevClassRef = React.useRef(selectedClassCode);
  useEffect(() => {
    if (!isStudent) {
      if (prevClassRef.current !== selectedClassCode) {
        prevClassRef.current = selectedClassCode;
        if (effectiveClassTeams && effectiveClassTeams.length > 0) {
          const firstTeam = effectiveClassTeams[0];
          setSelectedTeamKey(firstTeam.id || firstTeam.teamName);
          if (firstTeam.gitUrl) setUrl(firstTeam.gitUrl);
          if (firstTeam.branch) setBranch(firstTeam.branch || 'main');
        } else {
          setSelectedTeamKey('custom');
        }
      } else {
        const stillExists = effectiveClassTeams.some(t => (t.id || t.teamName) === selectedTeamKey);
        if (!stillExists && selectedTeamKey !== 'custom' && effectiveClassTeams.length > 0) {
          const firstTeam = effectiveClassTeams[0];
          setSelectedTeamKey(firstTeam.id || firstTeam.teamName);
          if (firstTeam.gitUrl) setUrl(firstTeam.gitUrl);
          if (firstTeam.branch) setBranch(firstTeam.branch || 'main');
        }
      }
    }
  }, [selectedClassCode, effectiveClassTeams, isStudent, selectedTeamKey]);

  const handleLecturerTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedTeamKey(val);
    if (val === 'custom') {
      // Keep existing URL so lecturer can type
    } else {
      const found = effectiveClassTeams.find(t => (t.id || t.teamName) === val);
      if (found) {
        if (found.gitUrl) setUrl(found.gitUrl);
        if (found.branch) setBranch(found.branch || 'main');
      }
    }
    if (error) setError(null);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (error) setError(null);
  };

  const validateForm = () => {
    if (!url.trim()) {
      setError(lang === 'vi' ? 'Vui lòng nhập đường dẫn GitHub Repository.' : 'GitHub URL is required.');
      return false;
    }
    
    if (!GITHUB_URL_REGEX.test(url.trim())) {
      setError(
        lang === 'vi' 
          ? 'Đường dẫn GitHub không hợp lệ. Định dạng chuẩn: https://github.com/owner/repository' 
          : 'Invalid GitHub URL. Must be formatted as https://github.com/owner/repo'
      );
      return false;
    }

    if (!branch.trim()) {
      setError(lang === 'vi' ? 'Vui lòng nhập tên nhánh phân tích (Branch).' : 'Branch name is required.');
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const match = url.trim().match(GITHUB_URL_REGEX);
      if (match) {
        const [, owner, repo] = match;
        console.log('Submitting repo:', { owner, repo, branch: branch.trim() });
        if (onSubmit) {
          onSubmit(url.trim(), branch.trim(), undefined);
        }
      }
    }
  };

  return (
    <div style={{
      background: isDark ? 'var(--color-terracotta-100, #2D1A16)' : 'var(--color-terracotta-50, #FFFAF6)',
      borderRadius: '24px',
      padding: '28px 36px',
      border: isDark ? '1px solid var(--color-terracotta-200, #4A2B24)' : '1px solid var(--color-terracotta-200, #F7DBCC)',
      boxShadow: isDark
        ? '0 16px 40px rgba(0, 0, 0, 0.45)'
        : '0 16px 40px rgba(122, 62, 46, 0.08), 0 2px 6px rgba(181, 82, 58, 0.04)',
      maxWidth: '100%',
      margin: '0 auto',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* Terracotta Sunset decorative gradient top border */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #7A3E2E 0%, #B5523A 35%, #D9794E 70%, #E7A27A 100%)'
      }} />

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{
          fontSize: '1.15rem',
          fontWeight: 800,
          color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)',
          margin: 0,
          fontFamily: 'var(--font-heading, inherit)'
        }}>
          {isStudent
            ? (lang === 'vi' ? 'Thông Tin Repository Nộp Bài' : 'Repository Submission Details')
            : (lang === 'vi' ? 'Cấu Hình Phân Tích Git AST Cho Lớp Học' : 'Git Analysis Configuration')}
        </h2>
      </div>

      {/* Submission Success Alert for Students */}
      {isStudent && initialHasSubmitted && !showEditForm && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '16px',
          background: isDark ? 'rgba(34, 197, 94, 0.12)' : '#ECFDF5',
          border: '1.5px solid #10B981',
          marginBottom: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontWeight: 800, fontSize: '0.90rem' }}>
              <span>✓ Đã nộp Git Repository thành công cho Giảng viên</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Thời gian nộp: <strong>{submittedAt || 'Hôm nay'}</strong> • Repository: <strong>{url}</strong> (Nhánh: <strong>{branch}</strong>)
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {onViewReport && (
              <button
                type="button"
                onClick={onViewReport}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  background: 'var(--color-terracotta-700, #B5523A)',
                  color: '#FFF',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                📊 Xem Đóng Góp Git
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowEditForm(true)}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                background: isDark ? 'var(--bg-surface)' : '#FFFFFF',
                color: 'var(--text-main)',
                border: isDark ? '1px solid var(--border-light)' : '1px solid #CBD5E1',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              ✏️ Cập Nhật Link Nộp (Re-submit)
            </button>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        
        {/* ============================================================== */}
        {/* ROLE-AWARE PROJECT GROUP SECTION                               */}
        {/* ============================================================== */}
        {isStudent ? (
          /* STUDENT VIEW: Clean assigned team display (NO confusing other group options) */
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: isDark ? 'var(--color-terracotta-700, #E7A27A)' : 'var(--color-terracotta-900, #7A3E2E)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-terracotta-700, #B5523A)' }}>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              {lang === 'vi' ? 'Nhóm Đồ Án Của Bạn (Project Group)' : 'Your Assigned Team'} <span style={{ color: '#B5523A' }}>*</span>
            </label>

            <div style={{
              padding: '14px 18px',
              borderRadius: '14px',
              background: isDark ? 'rgba(217, 121, 78, 0.12)' : 'linear-gradient(135deg, #FFF9F5 0%, #FBEEE6 100%)',
              border: isDark ? '1px solid rgba(217, 121, 78, 0.3)' : '1.5px solid #F1C2A7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  padding: '5px 14px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #AD3029 0%, #CD5252 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  letterSpacing: '0.3px',
                  boxShadow: '0 2px 8px rgba(173, 48, 41, 0.3)'
                }}>
                  {assignedTeam?.teamName || 'Nhóm 1'}
                </div>
                <div>
                  <div style={{
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)'
                  }}>
                    {assignedTeam?.projectTopic || 'AITA Intelligent - Hệ Thống Chấm Bài & Phân Tích Đóng Góp Git Tự Động'}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Lớp: <strong>{selectedClassCode || assignedTeam?.classCode || ''}</strong> • Trưởng nhóm: <strong>{assignedTeam?.leader || 'Lê Nguyễn Anh Mai'}</strong>
                  </div>
                </div>
              </div>

              {onOpenTeamDetails && (
                <button
                  type="button"
                  onClick={onOpenTeamDetails}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    background: isDark ? 'rgba(217, 121, 78, 0.25)' : '#FFFFFF',
                    border: '1.5px solid var(--color-terracotta-500, #B5523A)',
                    color: 'var(--color-terracotta-700, #B5523A)',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(181, 82, 58, 0.1)'
                  }}
                >
                  <span>📖 Xem Đề Bài & Rubric</span>
                </button>
              )}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              💡 <em>Lưu ý: Bạn đang nộp bài đại diện cho <strong>{assignedTeam?.teamName || 'Nhóm 1'}</strong>. Chỉ cần một thành viên trong nhóm nộp link GitHub, toàn bộ nhóm đều sẽ được hệ thống tự động bóc tách commit và chấm điểm.</em>
            </div>
          </div>
        ) : (
          /* LECTURER VIEW: Stacked rows for Class and Team */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            {/* 1. Chọn Lớp Học */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: isDark ? 'var(--color-terracotta-700, #E7A27A)' : 'var(--color-terracotta-900, #7A3E2E)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-terracotta-700, #B5523A)' }}>
                  <path d="M3 21h18M3 7v14M21 7v14M6 11h2M6 15h2M16 11h2M16 15h2M10 21V3h4v18"/>
                </svg>
                {lang === 'vi' ? '1. Chọn Lớp Học (Course / Class)' : '1. Select Course / Class'} <span style={{ color: '#B5523A' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedClassCode}
                  onChange={(e) => {
                    if (onClassChange) {
                      onClassChange(e.target.value);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '13px 16px',
                    borderRadius: '12px',
                    border: isDark ? '1px solid var(--color-terracotta-200, #4A2B24)' : '1.5px solid var(--color-terracotta-200, #F7DBCC)',
                    background: isDark ? 'var(--color-terracotta-50, #1A100E)' : 'var(--color-terracotta-100, #FBEEE6)',
                    color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    outline: 'none',
                    appearance: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                >
                  {displayClassesList && displayClassesList.length > 0 ? (
                    displayClassesList.map(code => (
                      <option key={code} value={code}>
                        🏫 Lớp: {code}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>-- {lang === 'vi' ? 'Chưa có lớp học nào' : 'No classes available'} --</option>
                  )}
                </select>
                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-terracotta-600, #D9794E)', pointerEvents: 'none', display: 'flex' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                {lang === 'vi' 
                  ? 'Chọn lớp để tải danh sách nhóm đồ án tương ứng.'
                  : 'Select course to load corresponding project teams.'}
              </div>
            </div>

            {/* 2. Chọn Nhóm Đồ Án */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: isDark ? 'var(--color-terracotta-700, #E7A27A)' : 'var(--color-terracotta-900, #7A3E2E)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-terracotta-700, #B5523A)' }}>
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                {lang === 'vi' ? `2. Chọn Nhóm Đồ Án Lớp ${selectedClassCode}` : `2. Select Team (${selectedClassCode})`} <span style={{ color: '#B5523A' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedTeamKey}
                  onChange={handleLecturerTeamChange}
                  style={{
                    width: '100%',
                    padding: '13px 16px',
                    borderRadius: '12px',
                    border: isDark ? '1px solid var(--color-terracotta-200, #4A2B24)' : '1.5px solid var(--color-terracotta-200, #F7DBCC)',
                    background: isDark ? 'var(--color-terracotta-50, #1A100E)' : 'var(--color-terracotta-100, #FBEEE6)',
                    color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    outline: 'none',
                    appearance: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                >
                  {effectiveClassTeams && effectiveClassTeams.length > 0 ? (
                    effectiveClassTeams.map((team, idx) => (
                      <option key={team.id || team.teamName || idx} value={team.id || team.teamName}>
                        {team.teamName}: {team.projectTopic || 'Đề án'} {team.leader ? `(Trưởng nhóm: ${team.leader})` : ''}
                      </option>
                    ))
                  ) : (
                    <option value="none">-- {lang === 'vi' ? 'Không có nhóm nào trong lớp này' : 'No teams in this class'} --</option>
                  )}
                  <option value="custom">-- 🔗 {lang === 'vi' ? 'Nhập link Git Repository tùy chỉnh khác...' : 'Enter custom Git Repository...'} --</option>
                </select>
                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-terracotta-600, #D9794E)', pointerEvents: 'none', display: 'flex' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                {lang === 'vi' 
                  ? 'Chọn trực tiếp nhóm đồ án hoặc chọn nhập link Git tùy ý.'
                  : 'Select team from roster or enter custom Git URL.'}
              </div>
            </div>
          </div>
        )}

        {/* Repository URL */}
        <div>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            fontWeight: 800,
            color: isDark ? 'var(--color-terracotta-700, #E7A27A)' : 'var(--color-terracotta-900, #7A3E2E)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '8px'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-terracotta-700, #B5523A)' }}>
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>
            </svg>
            {lang === 'vi' ? 'Git Repository URL' : 'GitHub Repository URL'} <span style={{ color: '#B5523A' }}>*</span>
          </label>
          <input
            type="text"
            value={url}
            onChange={handleUrlChange}
            placeholder="https://github.com/owner/repo"
            style={{
              width: '100%',
              padding: '13px 16px',
              borderRadius: '12px',
              border: error && error.includes('URL') ? '1.5px solid #B5523A' : (isDark ? '1px solid var(--color-terracotta-200, #4A2B24)' : '1.5px solid var(--color-terracotta-200, #F7DBCC)'),
              background: isDark ? 'var(--color-terracotta-50, #1A100E)' : 'var(--color-terracotta-100, #FBEEE6)',
              color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)',
              fontSize: '0.92rem',
              fontFamily: 'monospace',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
          />
        </div>

        {/* Analysis Branch */}
        <div>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            fontWeight: 800,
            color: isDark ? 'var(--color-terracotta-700, #E7A27A)' : 'var(--color-terracotta-900, #7A3E2E)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '8px'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-terracotta-700, #B5523A)' }}>
              <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>
            </svg>
            {lang === 'vi' ? 'Nhánh Phân Tích (Branch)' : 'Branch'} <span style={{ color: '#B5523A' }}>*</span>
          </label>
          <input
            type="text"
            value={branch}
            onChange={(e) => {
              setBranch(e.target.value);
              if (error) setError(null);
            }}
            placeholder="main"
            style={{
              width: '100%',
              padding: '13px 16px',
              borderRadius: '12px',
              border: error && error.includes('Branch') ? '1.5px solid #B5523A' : (isDark ? '1px solid var(--color-terracotta-200, #4A2B24)' : '1.5px solid var(--color-terracotta-200, #F7DBCC)'),
              background: isDark ? 'var(--color-terracotta-50, #1A100E)' : 'var(--color-terracotta-100, #FBEEE6)',
              color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)',
              fontSize: '0.92rem',
              fontFamily: 'monospace',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
          />
        </div>

        {error && (
          <div style={{
            color: 'var(--color-terracotta-900, #7A3E2E)',
            background: 'var(--color-terracotta-100, #FBEEE6)',
            border: '1.5px solid var(--color-terracotta-700, #B5523A)',
            borderRadius: '10px',
            padding: '10px 14px',
            fontSize: '0.82rem',
            fontWeight: 700
          }}>
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div style={{ marginTop: '8px' }}>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #AD3029 0%, #CD5252 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '1rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(173, 48, 41, 0.32)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'transform 0.15s, opacity 0.2s, box-shadow 0.2s'
            }}
          >
            {isStudent ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
                <path d="M12 12v9"/>
                <path d="m16 16-4-4-4 4"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            )}
            <span>
              {isStudent
                ? (initialHasSubmitted
                    ? (lang === 'vi' ? '📤 Cập Nhật & Nộp Lại Link Git' : '📤 Update & Re-submit Git Repo')
                    : (lang === 'vi' ? '📤 Nộp Link Git Cho Giảng Viên' : '📤 Submit Git Repo to Lecturer'))
                : (lang === 'vi' ? '⚡ Khởi Động Engine Phân Tích Git AST' : '⚡ Start Git AST Analysis')}
            </span>
          </button>
        </div>
      </form>

    </div>
  );
};

export default GitRepoSubmissionForm;
