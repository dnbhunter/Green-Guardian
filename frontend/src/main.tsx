import React from 'react';
import ReactDOM from 'react-dom/client';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './services/auth';
import { AppInsightsProvider } from './services/telemetry';
import App from './App';
import './assets/styles.css';

const msalInstance = new PublicClientApplication(msalConfig);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MsalProvider instance={msalInstance}>
      <AppInsightsProvider>
        <App />
      </AppInsightsProvider>
    </MsalProvider>
  </React.StrictMode>,
);
