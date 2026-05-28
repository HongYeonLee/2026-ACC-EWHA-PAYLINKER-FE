import { StrictMode, Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from 'react-oidc-context';
import './index.css';
import App from './App';
import { installMockServer } from './shared/api/mock-server';
import { USE_MOCK, USE_COGNITO, cognitoConfig } from './shared/config/cognito';
import { CognitoBridge } from './features/auth/CognitoBridge';

if (USE_MOCK) {
  installMockServer();
}

class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div style={{ fontFamily: 'ui-monospace, monospace', padding: 32, maxWidth: 560, margin: '60px auto' }}>
          <div style={{ color: '#b72a30', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>앱 오류가 발생했습니다</div>
          <pre style={{ background: '#fdecec', border: '1px solid #f8d2d3', borderRadius: 6, padding: '10px 14px', fontSize: 11.5, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#7f1d1d' }}>
            {error.message}
          </pre>
          <div style={{ marginTop: 8, fontSize: 11, color: '#67748d' }}>
            redirect_uri: {window.location.origin}/auth/callback
          </div>
          <button
            onClick={() => { this.setState({ error: null }); window.location.href = '/login'; }}
            style={{ marginTop: 16, padding: '6px 16px', background: '#009478', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}
          >
            로그인으로 이동
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const tree = USE_COGNITO ? (
  <AuthProvider {...cognitoConfig}>
    <CognitoBridge />
    <App />
  </AuthProvider>
) : (
  <App />
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      {tree}
    </RootErrorBoundary>
  </StrictMode>
);
