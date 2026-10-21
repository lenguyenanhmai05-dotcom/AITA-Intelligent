import React, { useState } from 'react';

const GITHUB_URL_REGEX = /^https:\/\/github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?$/;

const GROUP_REPOS: Record<string, { url: string; branch: string }> = {
  '2': {
    url: 'https://github.com/lenguyenanhmai05/AITA-Intelligent',
    branch: 'main',
  },
  '1': {
    url: 'https://github.com/smart-lms/smart-lms-platform',
    branch: 'main',
  },
};

interface GitRepoSubmissionFormProps {
  onSubmit?: (url: string, branch: string, pat?: string) => void;
  lang?: 'vi' | 'en';
  isDark?: boolean;
  defaultUrl?: string;
  defaultBranch?: string;
  role?: 'student' | 'lecturer' | 'admin';
  hasSubmitted?: boolean;
  submittedAt?: string;
  onViewReport?: () => void;
}

export const GitRepoSubmissionForm: React.FC<GitRepoSubmissionFormProps> = ({ 
  onSubmit, 
  lang = 'en', 
  isDark = false,
  defaultUrl,
  defaultBranch,
  role = 'student',
  hasSubmitted: initialHasSubmitted = false,
  submittedAt,
  onViewReport
}) => {
  const isStudent = role === 'student';
  const [selectedGroup, setSelectedGroup] = useState('2');
  const [url, setUrl] = useState(defaultUrl !== undefined ? defaultUrl : GROUP_REPOS['2'].url);
  const [branch, setBranch] = useState(defaultBranch !== undefined ? defaultBranch : GROUP_REPOS['2'].branch);
  const [error, setError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(!initialHasSubmitted);

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const groupVal = e.target.value;
    setSelectedGroup(groupVal);
    if (GROUP_REPOS[groupVal]) {
      setUrl(GROUP_REPOS[groupVal].url);
      setBranch(GROUP_REPOS[groupVal].branch);
    }
    if (error) setError(null);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (error) setError(null);
  };

  const validateForm = () => {
    if (!url.trim()) {
      setError('GitHub URL is required.');
      return false;
    }
    
    if (!GITHUB_URL_REGEX.test(url.trim())) {
      setError('Invalid GitHub URL. Must be formatted as https://github.com/owner/repo');
      return false;
    }

    if (!branch.trim()) {
      setError('Branch name is required.');
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
        console.log('Submitting:', { owner, repo, branch });
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
            : (lang === 'vi' ? 'Cấu Hình Phân Tích Git' : 'Git Analysis Configuration')}
        </h2>
      </div>

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
              Thời gian nộp: <strong>{submittedAt || 'Hôm nay'}</strong> • Repository: <strong>{url}</strong> ({branch})
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
              ✏️ Cập Nhật Link
            </button>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {/* Project Group Selector (from main) */}
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
            {lang === 'vi' ? 'Nhóm Đồ Án (Project Group)' : 'Project Group'} <span style={{ color: '#B5523A' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedGroup}
              onChange={handleGroupChange}
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
                boxSizing: 'border-box'
              }}
            >
              <option value="2">Group 2 - AITA Intelligent (SWP391)</option>
              <option value="1">Group 1 - Smart LMS Platform</option>
            </select>
            <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-terracotta-600, #D9794E)', pointerEvents: 'none', display: 'flex' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>
        </div>

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
              background: 'linear-gradient(135deg, var(--color-terracotta-700, #B5523A) 0%, var(--color-terracotta-600, #D9794E) 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '1rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(181, 82, 58, 0.35)',
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
                ? (lang === 'vi' ? '📤 Nộp Link Git Cho Giảng Viên' : '📤 Submit Git Repo to Lecturer')
                : (lang === 'vi' ? '⚡ Khởi Động Engine Phân Tích Git AST' : '⚡ Start Git AST Analysis')}
            </span>
          </button>
        </div>
      </form>

    </div>
  );
};

export default GitRepoSubmissionForm;
