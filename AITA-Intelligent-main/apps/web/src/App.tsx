import { useState, useEffect } from 'react';

export default function App() {
  const [healthStatus, setHealthStatus] = useState<string>('Connecting to API...');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealthStatus(data.subsystem || 'Connected'))
      .catch(() => setHealthStatus('API Server is offline'));
  }, []);

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AITA-INTELLIGENT
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Subsystem 5: Redis Queue (BullMQ) & Git Teamwork Analytics Platform
        </p>
      </header>

      <main>
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Môi Trường Dự Án (Monorepo Scaffolding)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Trạng thái kết nối API: <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{healthStatus}</span>
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ color: 'var(--accent-blue)', marginBottom: '8px' }}>1. Batch Grading (BullMQ)</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Điều phối hàng đợi Redis phân loại Exam (100) &gt; Assignment (50) &gt; Practice (10). Tự động retry 3 lần và quản lý Dead-Letter Queue.
              </p>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ color: 'var(--accent-purple)', marginBottom: '8px' }}>2. Git Analytics Engine</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Bare clone vào sandbox, bóc tách diff commits, lọc rác node_modules, bắt gian lận whitespace-only &amp; self-revert.
              </p>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ color: 'var(--accent-green)', marginBottom: '8px' }}>3. Anti Free-Riding</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Tính điểm đóng góp công bằng: 40% LOC + 40% Commits + 20% PRs. Hỗ trợ nhiều email sinh viên (@gmail, @fpt) và cảnh báo lười biếng.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
