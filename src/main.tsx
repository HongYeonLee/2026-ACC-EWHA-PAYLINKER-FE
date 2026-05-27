import { StrictMode } from 'react';
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

const tree = USE_COGNITO ? (
  <AuthProvider {...cognitoConfig}>
    <CognitoBridge />
    <App />
  </AuthProvider>
) : (
  <App />
);

createRoot(document.getElementById('root')!).render(<StrictMode>{tree}</StrictMode>);
