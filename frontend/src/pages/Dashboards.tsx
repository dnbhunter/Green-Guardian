import React, { useEffect } from 'react';
import { useDataStore } from '../state/datasetsSlice';
import { useTelemetry } from '../hooks/useTelemetry';
import RiskCard from '../components/RiskCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboards: React.FC = () => {
  const { companies, portfolios, loadAll, isLoading, error } = useDataStore();
  const { trackNavigation } = useTelemetry();

  useEffect(() => {
    trackNavigation('dashboards');
    loadAll().catch(console.error);
  }, [trackNavigation, loadAll]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-xl mb-2">⚠️</div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Error loading data</h2>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Sustainability Dashboards
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Monitor ESG risks and sustainability metrics across your portfolio
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{companies.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Companies Tracked</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{portfolios.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active Portfolios</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600">92%</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">ESG Coverage</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-yellow-600">6.8</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Avg Risk Score</div>
        </div>
      </div>

      {/* Risk Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskCard
          title="Portfolio Risk Overview"
          riskScores={{
            overall: 6.8,
            climate: 7.2,
            biodiversity: 5.9,
            deforestation: 8.1,
            water_stress: 6.3,
            social: 5.7,
            governance: 6.9,
            last_calculated: new Date(),
          }}
        />
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Insights
          </h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-gray-900 dark:text-white font-medium">High deforestation risk detected</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">3 companies in Brazil operations</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-gray-900 dark:text-white font-medium">Renewable energy investments up</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">15% increase in clean energy portfolio</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-gray-900 dark:text-white font-medium">Water stress assessment required</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">2 assets in high-risk regions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboards;
