import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './hooks/useAuth';
import { useTelemetry } from './hooks/useTelemetry';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { isLoading } = useAuth();
  const telemetry = useTelemetry();

  React.useEffect(() => {
    telemetry.trackEvent('app_start', {
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
    });
  }, [telemetry]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <RouterProvider router={router} />
      </div>
    </ErrorBoundary>
  );
}

export default App;
