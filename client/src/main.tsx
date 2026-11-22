import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './styles.css';

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_RELEASE,
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p className="fatal-error">Интерфейс временно недоступен.</p>}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
