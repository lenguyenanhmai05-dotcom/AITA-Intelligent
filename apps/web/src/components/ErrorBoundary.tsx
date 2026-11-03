import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleResetStorage = () => {
    try {
      localStorage.removeItem('aita_all_classes_deleted');
      localStorage.removeItem('aita_deleted_classes');
      localStorage.removeItem('deleted_classes');
      sessionStorage.clear();
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FAF8F5',
            padding: '24px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '36px 32px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
              border: '1px solid #FEE2E2',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <AlertTriangle size={30} />
            </div>

            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#1F2937',
                margin: '0 0 10px 0',
              }}
            >
              Đã xảy ra sự cố hiển thị
            </h2>

            <p
              style={{
                fontSize: '0.88rem',
                color: '#6B7280',
                lineHeight: 1.6,
                margin: '0 0 24px 0',
              }}
            >
              Hệ thống vừa khôi phục từ trạng thái lỗi giao diện. Bạn có thể nhấn <strong>Tải lại trang</strong> để tiếp tục làm việc.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '24px',
                  textAlign: 'left',
                  fontSize: '0.78rem',
                  color: '#64748B',
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                  border: '1px solid #E2E8F0',
                }}
              >
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 22px',
                  background: '#9B1B1B',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(155, 27, 27, 0.25)',
                }}
              >
                <RotateCcw size={16} /> Tải lại trang
              </button>

              <button
                onClick={this.handleResetStorage}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 22px',
                  background: '#F3F4F6',
                  color: '#4B5563',
                  border: '1px solid #D1D5DB',
                  borderRadius: '12px',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Xóa Cache & Khôi phục
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
