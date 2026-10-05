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
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-2xl mx-auto mt-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Submit Repository for Analysis</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            GitHub Repository URL <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={url}
            onChange={handleUrlChange}
            placeholder="https://github.com/owner/repo"
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error && error.includes('URL') ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Branch <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={branch}
            onChange={(e) => {
              setBranch(e.target.value);
              if (error) setError(null);
            }}
            placeholder="main"
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error && error.includes('Branch') ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>

        <div className="flex items-center justify-between py-2 border-t border-b border-gray-100">
          <div>
            <span className="block text-sm font-medium text-gray-700">Private Repository</span>
            <span className="text-xs text-gray-500">Requires a Personal Access Token</span>
          </div>
          <button
            type="button"
            onClick={handleTogglePrivate}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isPrivate ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={isPrivate}
            aria-label="Private Repository"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isPrivate ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {error && (
          <div className="text-red-500 text-sm mt-2">
            {error}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
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
