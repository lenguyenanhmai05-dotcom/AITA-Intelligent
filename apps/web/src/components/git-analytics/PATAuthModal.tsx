import React, { useState } from 'react';
import { useGitAuth } from '../../contexts/GitAuthContext';

interface PATAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PATAuthModal: React.FC<PATAuthModalProps> = ({ isOpen, onClose }) => {
  const { setPatToken, patToken } = useGitAuth();
  const [tokenInput, setTokenInput] = useState(patToken || '');
  const [showToken, setShowToken] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setPatToken(tokenInput);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.55)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--bg-surface, #FFFFFF)',
        borderRadius: '20px',
        padding: '28px 32px',
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.25)',
        maxWidth: '440px',
        width: '100%',
        position: 'relative',
        border: '1px solid var(--border-light, #E5E8D6)',
        boxSizing: 'border-box'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'transparent',
            border: 'none',
            fontSize: '1.2rem',
            color: 'var(--text-muted, #6B7280)',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          ✕
        </button>
        <h3 style={{
          fontSize: '1.2rem',
          fontWeight: 800,
          marginBottom: '8px',
          color: 'var(--text-main, #1F2937)',
          fontFamily: 'var(--font-heading, inherit)'
        }}>
          Private Repository Access
        </h3>
        <p style={{
          fontSize: '0.84rem',
          color: 'var(--text-body, #4B5563)',
          marginBottom: '20px',
          lineHeight: '1.5'
        }}>
          Please provide a GitHub Personal Access Token (PAT) to analyze this private repository. The token is securely stored in memory and cleared on reload.
        </p>

        <div style={{ position: 'relative', marginBottom: '22px' }}>
          <input
            type={showToken ? 'text' : 'password'}
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 68px 11px 14px',
              borderRadius: '11px',
              border: '1.5px solid var(--border-light, #E5E8D6)',
              background: 'var(--bg-surface-input, #FFFFFF)',
              color: 'var(--text-main, #1F2937)',
              fontSize: '0.88rem',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s'
            }}
            placeholder="ghp_..."
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--color-orange-zest, #D9641F)',
              padding: '4px 6px'
            }}
          >
            {showToken ? 'Hide' : 'Show'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: '1.5px solid var(--border-light, #E5E8D6)',
              background: 'var(--bg-surface-subtle, #FAF9F1)',
              color: 'var(--text-main, #374151)',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!tokenInput.trim()}
            style={{
              padding: '10px 22px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--color-kumquat, #F5A623), var(--color-orange-zest, #D9641F))',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.84rem',
              cursor: !tokenInput.trim() ? 'not-allowed' : 'pointer',
              opacity: !tokenInput.trim() ? 0.5 : 1,
              boxShadow: '0 3px 10px rgba(217, 100, 31, 0.25)',
              transition: 'opacity 0.2s'
            }}
          >
            Save Token
          </button>
        </div>
      </div>
    </div>
  );
};

export default PATAuthModal;
