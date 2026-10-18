import React, { useState } from 'react';
import { useGitAuth } from '../../contexts/GitAuthContext';
import PATAuthModal from './PATAuthModal';

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
}

export const GitRepoSubmissionForm: React.FC<GitRepoSubmissionFormProps> = ({ 
  onSubmit, 
  lang = 'en', 
  isDark = false,
  defaultUrl,
  defaultBranch
}) => {
  const { patToken, clearToken } = useGitAuth();
  
  const [selectedGroup, setSelectedGroup] = useState('2');
  const [url, setUrl] = useState(defaultUrl !== undefined ? defaultUrl : GROUP_REPOS['2'].url);
  const [branch, setBranch] = useState(defaultBranch !== undefined ? defaultBranch : GROUP_REPOS['2'].branch);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleTogglePrivate = () => {
    const newIsPrivate = !isPrivate;
    setIsPrivate(newIsPrivate);
    if (newIsPrivate) {
      setIsModalOpen(true);
    } else {
      clearToken();
    }
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

    if (isPrivate && !patToken) {
      setError('A Personal Access Token is required for private repositories.');
      setIsModalOpen(true);
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
        console.log('Submitting:', { owner, repo, branch, isPrivate, hasToken: !!patToken });
        if (onSubmit) {
          onSubmit(url.trim(), branch.trim(), patToken || undefined);
        }
      }
    }
  };

  return (
    <div style={{
      background: isDark ? 'var(--color-terracotta-100, #2D1A16)' : 'var(--color-terracotta-50, #FFFAF6)',
      borderRadius: '24px',
      padding: '36px 40px',
      border: isDark ? '1px solid var(--color-terracotta-200, #4A2B24)' : '1px solid var(--color-terracotta-200, #F7DBCC)',
      boxShadow: isDark
        ? '0 16px 40px rgba(0, 0, 0, 0.45)'
        : '0 16px 40px rgba(122, 62, 46, 0.08), 0 2px 6px rgba(181, 82, 58, 0.04)',
      maxWidth: '720px',
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

      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: 800,
        color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)',
        marginBottom: '24px',
        fontFamily: 'var(--font-heading, inherit)'
      }}>
        {lang === 'vi' ? 'Thông Tin Khởi Động Phân Tích Git' : 'Submit Repository for Analysis'}
      </h2>
      
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

        {/* Private Repository Toggle (BR-08 / Week 5 feature) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          background: isDark ? 'var(--color-terracotta-50, #1A100E)' : 'var(--color-terracotta-100, #FBEEE6)',
          borderRadius: '14px',
          border: isDark ? '1px solid var(--color-terracotta-200, #4A2B24)' : '1.5px solid var(--color-terracotta-200, #F7DBCC)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-terracotta-700, #B5523A)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <div>
              <span style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: isDark ? '#FFFAF6' : 'var(--color-terracotta-900, #7A3E2E)' }}>
                {lang === 'vi' ? 'Kho Lưu Trữ Riêng Tư (Private Repo)' : 'Private Repository'}
              </span>
              <span style={{ fontSize: '0.76rem', color: isDark ? 'var(--color-terracotta-700, #E7A27A)' : '#8C5E51' }}>
                {lang === 'vi' 
                  ? (patToken ? '✓ Đã lưu token PAT an toàn trong RAM' : 'Yêu cầu Personal Access Token (PAT) để truy cập') 
                  : (patToken ? '✓ Personal Access Token configured' : 'Requires a Personal Access Token')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleTogglePrivate}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              width: '46px',
              height: '26px',
              borderRadius: '999px',
              background: isPrivate ? 'var(--color-terracotta-700, #B5523A)' : (isDark ? '#4A2B24' : '#D1D5DB'),
              border: 'none',
              cursor: 'pointer',
              padding: '3px',
              transition: 'background 0.2s ease',
              outline: 'none'
            }}
            role="switch"
            aria-checked={isPrivate}
            aria-label="Private Repository"
          >
            <span
              style={{
                display: 'inline-block',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#FFFFFF',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transform: isPrivate ? 'translateX(20px)' : 'translateX(0px)',
                transition: 'transform 0.2s ease'
              }}
            />
          </button>
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

        {/* Submit Button with Play icon */}
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            <span>{lang === 'vi' ? 'Khởi Động Engine Phân Tích' : 'Start Analysis'}</span>
          </button>
        </div>
      </form>

      <PATAuthModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default GitRepoSubmissionForm;
