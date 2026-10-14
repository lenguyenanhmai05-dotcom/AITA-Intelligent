import React from 'react';

/**
 * Skeleton Loader Component (Week 6 - Task 15)
 * Preserves the page layout and prevents content flickering during asynchronous data transitions.
 */
export const ReportSkeleton: React.FC = () => {
  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '8px 0',
      }}
      data-testid="report-skeleton"
    >
      {/* 1. Header & Title Skeleton */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div>
          <div
            className="skeleton-pulse"
            style={{
              width: '320px',
              height: '32px',
              borderRadius: '8px',
              marginBottom: '10px',
            }}
          />
          <div
            className="skeleton-pulse"
            style={{
              width: '450px',
              height: '16px',
              borderRadius: '6px',
            }}
          />
        </div>
        <div
          className="skeleton-pulse"
          style={{
            width: '220px',
            height: '42px',
            borderRadius: '10px',
          }}
        />
      </div>

      {/* 2. Contribution Percentage Bars Card Skeleton */}
      <div
        style={{
          background: 'var(--bg-surface, #FFFFFF)',
          borderRadius: '18px',
          padding: '24px',
          border: '1px solid var(--border-light, #E5E8D6)',
          boxShadow: 'var(--shadow-card, 0 4px 16px rgba(0, 0, 0, 0.05))',
          marginBottom: '24px',
        }}
      >
        <div
          className="skeleton-pulse"
          style={{
            width: '200px',
            height: '20px',
            borderRadius: '6px',
            marginBottom: '20px',
          }}
        />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}
            >
              <div
                className="skeleton-pulse"
                style={{ width: `${100 + i * 20}px`, height: '14px', borderRadius: '4px' }}
              />
              <div
                className="skeleton-pulse"
                style={{ width: '40px', height: '14px', borderRadius: '4px' }}
              />
            </div>
            <div
              className="skeleton-pulse"
              style={{
                width: '100%',
                height: '10px',
                borderRadius: '999px',
              }}
            />
          </div>
        ))}
      </div>

      {/* 3. Detailed Table Card Skeleton */}
      <div
        style={{
          background: 'var(--bg-surface, #FFFFFF)',
          borderRadius: '18px',
          border: '1px solid var(--border-light, #E5E8D6)',
          boxShadow: 'var(--shadow-card, 0 4px 16px rgba(0, 0, 0, 0.05))',
          overflow: 'hidden',
          padding: '20px',
        }}
      >
        <div
          className="skeleton-pulse"
          style={{
            width: '100%',
            height: '44px',
            borderRadius: '8px',
            marginBottom: '14px',
          }}
        />
        {[1, 2, 3, 4].map((row) => (
          <div
            key={row}
            className="skeleton-pulse"
            style={{
              width: '100%',
              height: '52px',
              borderRadius: '8px',
              marginBottom: '10px',
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            background-color: #F3F4F6;
          }
          50% {
            background-color: #E5E7EB;
          }
          100% {
            background-color: #F3F4F6;
          }
        }
        .skeleton-pulse {
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ReportSkeleton;
