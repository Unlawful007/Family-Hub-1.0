
import React, { useEffect } from 'react';

interface OAuthPopupProps {
  serviceName: string;
  onSuccess: () => void;
  onClose: () => void;
}

const OAuthPopup: React.FC<OAuthPopupProps> = ({ serviceName, onSuccess, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onSuccess();
      onClose();
    }, 3000); // Simulate 3 seconds for connection

    return () => clearTimeout(timer);
  }, [onSuccess, onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl text-center w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Connecting to {serviceName}</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Please follow the instructions in the authorization window to complete the connection.</p>
        <div className="flex justify-center items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            <span className="text-gray-700 dark:text-gray-200">Waiting for authorization...</span>
        </div>
        <p className="text-xs text-gray-500 mt-8">(This is a simulated connection.)</p>
      </div>
    </div>
  );
};

export default OAuthPopup;
