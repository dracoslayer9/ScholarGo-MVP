import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import posthog from 'posthog-js'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import App from './App.jsx'

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Root element 'root' not found in document.");
}

// Initialize PostHog
if (typeof window !== 'undefined' && import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    autocapture: true,
    capture_pageview: false // We capture this manually in App.jsx
  });
}

try {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
        <Analytics />
      </ErrorBoundary>
    </StrictMode>,
  )
} catch (err) {
  console.error("Failed to mount app:", err);
  document.body.innerHTML += `<div style="color:red; padding:20px;"><h1>Failed to mount app</h1><pre>${err.toString()}</pre></div>`;
}
