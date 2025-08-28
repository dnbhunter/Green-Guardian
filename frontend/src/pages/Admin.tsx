import React, { useEffect } from 'react';
import { useTelemetry } from '../hooks/useTelemetry';

const Admin: React.FC = () => {
  const { trackNavigation } = useTelemetry();

  useEffect(() => {
    trackNavigation('admin');
  }, [trackNavigation]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          System Administration
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Monitor system performance and manage users
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            System Metrics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Active Users</span>
              <span className="font-medium text-gray-900 dark:text-white">142</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">API Calls Today</span>
              <span className="font-medium text-gray-900 dark:text-white">1,247</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Token Usage</span>
              <span className="font-medium text-gray-900 dark:text-white">89.2K</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Data Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">ESG Data</span>
              <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Forest IQ</span>
              <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Spatial Finance</span>
              <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                Syncing
              </span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full btn-primary px-4 py-2 rounded-md text-sm">
              Refresh Data Sources
            </button>
            <button className="w-full btn-secondary px-4 py-2 rounded-md text-sm">
              View Logs
            </button>
            <button className="w-full btn-secondary px-4 py-2 rounded-md text-sm">
              Export Metrics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
