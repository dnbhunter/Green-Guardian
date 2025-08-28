import React, { useEffect } from 'react';
import { useDataStore } from '../state/datasetsSlice';
import { useTelemetry } from '../hooks/useTelemetry';
import LoadingSpinner from '../components/LoadingSpinner';

const Datasets: React.FC = () => {
  const { datasets, loadDatasets, isLoading, error } = useDataStore();
  const { trackNavigation } = useTelemetry();

  useEffect(() => {
    trackNavigation('datasets');
    loadDatasets().catch(console.error);
  }, [trackNavigation, loadDatasets]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Data Sources
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Manage and explore sustainability datasets
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md">
          <p className="text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {datasets.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No datasets available
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Connect data sources to start analyzing sustainability metrics
            </p>
          </div>
        ) : (
          datasets.map((dataset) => (
            <div
              key={dataset.id}
              className="card p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {dataset.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {dataset.description}
                  </p>
                </div>
                <div className={`px-2 py-1 text-xs rounded-full ${
                  dataset.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {dataset.status}
                </div>
              </div>
              
              <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div>Source: {dataset.source}</div>
                <div>Records: {dataset.records_count.toLocaleString()}</div>
                <div>Last updated: {new Date(dataset.last_updated).toLocaleDateString()}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Datasets;
