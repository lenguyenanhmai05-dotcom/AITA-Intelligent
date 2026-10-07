import React, { useState } from 'react';
import { useGitAuth } from '../../contexts/GitAuthContext';
import PATAuthModal from './PATAuthModal';

const GITHUB_URL_REGEX = /^https:\/\/github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)$/;

interface GitRepoSubmissionFormProps {
  onSubmit?: (url: string, branch: string, pat?: string) => void;
}

export const GitRepoSubmissionForm: React.FC<GitRepoSubmissionFormProps> = ({ onSubmit }) => {
  const { patToken, clearToken } = useGitAuth();
  
  const [url, setUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const match = url.match(GITHUB_URL_REGEX);
      if (match) {
        const [, owner, repo] = match;
        console.log('Submitting:', { owner, repo, branch, isPrivate, hasToken: !!patToken });
        if (onSubmit) {
          onSubmit(url, branch, patToken || undefined);
        }
      }
    }
  };

  return (
    <div style={{
      background: 'var(--bg-surface, #FFFFFF)',
      borderRadius: '20px',
      padding: '28px 32px',
      border: '1px solid var(--border-light, #E5E8D6)',
      boxShadow: 'var(--shadow-card, 0 4px 16px rgba(0, 0, 0, 0.05))',
      maxWidth: '680px',
      margin: '16px auto',
      boxSizing: 'border-box'
    }}>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: 800,
        color: 'var(--text-main, #1F2937)',
        marginBottom: '20px',
        fontFamily: 'var(--font-heading, inherit)'
      }}>
        Submit Repository for Analysis
      </h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.76rem',
            fontWeight: 800,
            color: 'var(--text-muted, #6B7280)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '6px'
          }}>
            GitHub Repository URL <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input
            type="text"
            value={url}
            onChange={handleUrlChange}
            placeholder="https://github.com/owner/repo"
            style={{
              width: '100%',
              padding: '11px 14px',
              borderRadius: '11px',
              border: error && error.includes('URL') ? '1.5px solid #EF4444' : '1.5px solid var(--border-light, #E5E8D6)',
              background: 'var(--bg-surface-input, #FFFFFF)',
              color: 'var(--text-main, #1F2937)',
              fontSize: '0.88rem',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s'
            }}
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: '0.76rem',
            fontWeight: 800,
            color: 'var(--text-muted, #6B7280)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '6px'
          }}>
            Branch <span style={{ color: '#EF4444' }}>*</span>
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
              padding: '11px 14px',
              borderRadius: '11px',
              border: error && error.includes('Branch') ? '1.5px solid #EF4444' : '1.5px solid var(--border-light, #E5E8D6)',
              background: 'var(--bg-surface-input, #FFFFFF)',
              color: 'var(--text-main, #1F2937)',
              fontSize: '0.88rem',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s'
            }}
          />
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'var(--bg-surface-subtle, #FAF9F1)',
          borderRadius: '12px',
          border: '1px solid var(--border-light, #E5E8D6)'
        }}>
          <div>
            <span style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main, #1F2937)' }}>
              Private Repository
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6B7280)' }}>
              Requires a Personal Access Token
            </span>
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
              background: isPrivate ? 'var(--color-orange-zest, #D9641F)' : '#D1D5DB',
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
            color: '#B91C1C',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '10px',
            padding: '10px 14px',
            fontSize: '0.82rem',
            fontWeight: 600
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--color-kumquat, #F5A623), var(--color-orange-zest, #D9641F))',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.92rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(217, 100, 31, 0.3)',
              transition: 'opacity 0.2s, transform 0.15s'
            }}
          >
            Start Analysis
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
