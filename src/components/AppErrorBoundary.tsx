import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level error boundary. Catches any render-time JavaScript error and
 * shows a recovery screen instead of a blank page. Without this, any
 * unhandled throw during render silently unmounts the entire React tree.
 */
export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[AppErrorBoundary] Render error caught:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#080d14',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          fontFamily: 'system-ui, sans-serif',
          padding: '24px',
        }}
      >
        <div
          style={{
            height: 56,
            width: 56,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #00d4ff, #0077ff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" width={28} height={28} stroke="white" strokeWidth={2.5}>
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        </div>

        <div style={{ textAlign: 'center', maxWidth: 320 }}>
          <p style={{ color: 'white', fontWeight: 900, fontSize: 18, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
            Something went wrong
          </p>
          <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 24px', lineHeight: 1.5 }}>
            The app hit an unexpected error. A refresh usually fixes it.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#00d4ff',
              color: '#080d14',
              border: 'none',
              borderRadius: 12,
              padding: '12px 32px',
              fontWeight: 900,
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              cursor: 'pointer',
            }}
          >
            Refresh App
          </button>
        </div>

        {this.state.error && (
          <p style={{ color: '#334155', fontSize: 11, maxWidth: 320, textAlign: 'center', fontFamily: 'monospace' }}>
            {this.state.error.message}
          </p>
        )}
      </div>
    );
  }
}
