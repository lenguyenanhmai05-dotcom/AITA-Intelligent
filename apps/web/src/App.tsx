import React from 'react';
import DashboardPortal from './components/DashboardPortal';
import { GitAuthProvider } from './contexts/GitAuthContext';

function App() {
  return (
    <GitAuthProvider>
      <div className="min-h-screen bg-slate-50">
        <DashboardPortal />
      </div>
    </GitAuthProvider>
  );
}

export default App;
