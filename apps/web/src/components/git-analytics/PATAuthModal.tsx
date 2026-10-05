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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <h3 className="text-lg font-semibold mb-2">Private Repository Access</h3>
        <p className="text-sm text-gray-600 mb-4">
          Please provide a GitHub Personal Access Token (PAT) to analyze this private repository. The token is securely stored in memory and cleared on reload.
        </p>

        <div className="relative mb-4">
          <input
            type={showToken ? 'text' : 'password'}
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ghp_..."
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700"
          >
            {showToken ? 'Hide' : 'Show'}
          </button>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={!tokenInput.trim()}
          >
            Save Token
          </button>
        </div>
      </div>
    </div>
  );
};

export default PATAuthModal;
