import React from 'react';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';

const reactPlugin = new ReactPlugin();

const appInsights = new ApplicationInsights({
  config: {
    connectionString: import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING || '',
    enableAutoRouteTracking: true,
    enableCorsCorrelation: true,
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true,
    extensions: [reactPlugin],
    extensionConfig: {
      [reactPlugin.identifier]: {
        history: null, // Will be set in the provider
      }
    }
  }
});

if (import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING) {
  appInsights.loadAppInsights();
}

export { appInsights, reactPlugin };

export interface TelemetryService {
  trackEvent: (name: string, properties?: Record<string, any>, measurements?: Record<string, number>) => void;
  trackException: (error: Error, severityLevel?: number, properties?: Record<string, any>) => void;
  trackPageView: (name: string, url?: string, properties?: Record<string, any>) => void;
  trackMetric: (name: string, average: number, sampleCount?: number, min?: number, max?: number, properties?: Record<string, any>) => void;
  startTrackPage: (name?: string) => void;
  stopTrackPage: (name?: string, url?: string, properties?: Record<string, any>, measurements?: Record<string, number>) => void;
  flush: () => void;
}

export const createTelemetryService = (): TelemetryService => ({
  trackEvent: (name: string, properties?: Record<string, any>, measurements?: Record<string, number>) => {
    appInsights.trackEvent({ name }, properties, measurements);
  },
  
  trackException: (error: Error, severityLevel?: number, properties?: Record<string, any>) => {
    appInsights.trackException({ error, severityLevel }, properties);
  },
  
  trackPageView: (name: string, url?: string, properties?: Record<string, any>) => {
    appInsights.trackPageView({ name, uri: url }, properties);
  },
  
  trackMetric: (name: string, average: number, sampleCount?: number, min?: number, max?: number, properties?: Record<string, any>) => {
    appInsights.trackMetric({ name, average, sampleCount, min, max }, properties);
  },
  
  startTrackPage: (name?: string) => {
    appInsights.startTrackPage(name);
  },
  
  stopTrackPage: (name?: string, url?: string, properties?: Record<string, any>, measurements?: Record<string, number>) => {
    appInsights.stopTrackPage(name, url, properties, measurements);
  },
  
  flush: () => {
    appInsights.flush();
  }
});

export const AppInsightsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div>
      {children}
    </div>
  );
};
