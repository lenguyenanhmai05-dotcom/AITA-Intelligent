import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GitAuthContextType {
  patToken: string | null;
  setPatToken: (token: string | null) => void;
  clearToken: () => void;
}

const GitAuthContext = createContext<GitAuthContextType | undefined>(undefined);

export const GitAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patToken, setPatToken] = useState<string | null>(null);

  const clearToken = () => {
    setPatToken(null);
  };

  return (
    <GitAuthContext.Provider value={{ patToken, setPatToken, clearToken }}>
      {children}
    </GitAuthContext.Provider>
  );
};

export const useGitAuth = (): GitAuthContextType => {
  const context = useContext(GitAuthContext);
  if (context === undefined) {
    throw new Error('useGitAuth must be used within a GitAuthProvider');
  }
  return context;
};
