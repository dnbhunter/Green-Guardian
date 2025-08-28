import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const SignIn: React.FC = () => {
  const { isAuthenticated, isLoading, signIn, error } = useAuth();

  useEffect(() => {
    // Auto-trigger sign in on component mount for demo purposes
    // In production, this would be triggered by user action
    if (!isAuthenticated && !isLoading) {
      signIn().catch(console.error);
    }
  }, [isAuthenticated, isLoading, signIn]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Signing you in...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (err) {
      console.error('Sign in failed:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-dnb-green-500 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🌱</span>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Welcome to Green Guardian
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            DNB's AI Sustainability Copilot
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
              <p className="text-sm text-red-700 dark:text-red-200">
                {error}
              </p>
            </div>
          )}

          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Sign in with your DNB Microsoft account to access AI-powered sustainability insights
              </p>
              
              <button
                onClick={handleSignIn}
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-dnb-green-600 hover:bg-dnb-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dnb-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 21 21" fill="currentColor">
                    <path d="M10.5 0h9.75A.75.75 0 0121 .75v9.75h-10.5V0zM10.5 11.25H21v9A.75.75 0 0120.25 21h-9.75V11.25zM0 20.25A.75.75 0 00.75 21h9.75V11.25H0v9zM0 .75A.75.75 0 01.75 0h9.75v10.5H0V.75z"/>
                  </svg>
                )}
                Sign in with Microsoft
              </button>
            </div>

            <div className="mt-6 text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-2">
                <p>🌍 Analyze portfolio sustainability risks</p>
                <p>📊 Get AI-powered ESG insights</p>
                <p>🤖 Chat with your sustainability copilot</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p>By signing in, you agree to DNB's terms of service and privacy policy.</p>
          <p className="mt-1">Green Guardian v1.0 - Built with ❤️ for DNB Hackathon</p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
