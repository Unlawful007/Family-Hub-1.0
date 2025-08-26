import React from 'react';
import SmartSuggestionsWidget from './widgets/SmartSuggestionsWidget';
import VoiceMessageBoardWidget from './widgets/VoiceMessageBoardWidget';
import LocationMapWidget from './widgets/LocationMapWidget';
import SevereWeatherWidget from './widgets/SevereWeatherWidget';
import AQIWidget from './widgets/AQIWidget';
import SunriseSunsetWidget from './widgets/SunriseSunsetWidget';
// import IRobotWidget from './widgets/iRobotWidget'; // Removed iRobot integration

interface SmartHubPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SmartHubPanel: React.FC<SmartHubPanelProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/30 z-30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>
      
      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[420px] max-w-[90vw] bg-gray-200/80 dark:bg-gray-900/80 backdrop-blur-lg border-l border-gray-300 dark:border-white/20 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="h-full flex flex-col">
            <header className="p-4 flex justify-between items-center border-b border-gray-300 dark:border-white/20 flex-shrink-0">
                <h2 className="text-xl font-bold">Smart Hub</h2>
                <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-1 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
            </header>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <SmartSuggestionsWidget />
                <VoiceMessageBoardWidget />
                <LocationMapWidget />
                <SevereWeatherWidget />
                <div className="grid grid-cols-2 gap-4">
                    <AQIWidget />
                    <SunriseSunsetWidget />
                </div>
                {/* <IRobotWidget /> // Removed iRobot integration */}
            </div>
        </div>
      </div>
    </>
  );
};

export default SmartHubPanel;