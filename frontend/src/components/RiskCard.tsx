import React from 'react';
import { RiskScores } from '../types/data';

interface RiskCardProps {
  title: string;
  riskScores: RiskScores;
  className?: string;
}

const getRiskColor = (score: number) => {
  if (score >= 8) return 'bg-red-500';
  if (score >= 6) return 'bg-yellow-500';
  if (score >= 4) return 'bg-blue-500';
  return 'bg-green-500';
};

const getRiskLabel = (score: number) => {
  if (score >= 8) return 'High Risk';
  if (score >= 6) return 'Medium Risk';
  if (score >= 4) return 'Low Risk';
  return 'Very Low Risk';
};

const RiskCard: React.FC<RiskCardProps> = ({ title, riskScores, className = '' }) => {
  const riskCategories = [
    { label: 'Climate', value: riskScores.climate, icon: '🌡️' },
    { label: 'Biodiversity', value: riskScores.biodiversity, icon: '🦋' },
    { label: 'Deforestation', value: riskScores.deforestation, icon: '🌳' },
    { label: 'Water Stress', value: riskScores.water_stress, icon: '💧' },
    { label: 'Social', value: riskScores.social, icon: '👥' },
    { label: 'Governance', value: riskScores.governance, icon: '⚖️' },
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      
      {/* Overall Risk Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Overall Risk Score
          </span>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {riskScores.overall.toFixed(1)}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full ${getRiskColor(riskScores.overall)} transition-all duration-300`}
            style={{ width: `${(riskScores.overall / 10) * 100}%` }}
          />
        </div>
        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {getRiskLabel(riskScores.overall)}
        </div>
      </div>

      {/* Risk Categories */}
      <div className="space-y-4">
        {riskCategories.map((category) => (
          <div key={category.label} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{category.icon}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {category.label}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getRiskColor(category.value)} transition-all duration-300`}
                  style={{ width: `${(category.value / 10) * 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white w-8 text-right">
                {category.value.toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Last updated: {new Date(riskScores.last_calculated).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default RiskCard;
