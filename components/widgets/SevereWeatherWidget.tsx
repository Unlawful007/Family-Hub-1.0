import React from 'react';
import { AlertTriangle } from '../icons/LucideIcons';

const SevereWeatherWidget: React.FC = () => {
  // This is a mock component. In a real app, this data would come from an API.
  const hasAlert = true; 
  
  if (!hasAlert) {
    return null;
  }

  return (
    <div className="bg-yellow-500/80 dark:bg-yellow-600/80 border border-yellow-600 dark:border-yellow-500 rounded-2xl p-4 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-6 h-6" />
          <h3 className="font-bold text-lg">Severe Weather Alert</h3>
        </div>
        <button className="text-xs font-semibold opacity-80 hover:opacity-100">Dismiss</button>
      </div>
      <div className="mt-2 pl-8">
        <p className="font-semibold">High Wind Warning</p>
        <p className="text-sm">In effect until 8:00 PM tonight. Gusts up to 60 mph expected. Secure loose outdoor objects.</p>
      </div>
    </div>
  );
};

export default SevereWeatherWidget;