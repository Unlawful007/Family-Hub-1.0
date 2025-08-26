import React from 'react';
import { CalendarViewType } from '../types';
import { Sun, Moon } from './icons/LucideIcons';
import useClock from '../hooks/useClock';

interface TopBarProps {
  currentView: CalendarViewType;
  theme: 'light' | 'dark';
  activeScreen: 0 | 1;
  onViewChange: (view: CalendarViewType) => void;
  onToggleTheme: () => void;
  onScreenChange: (screen: 0 | 1) => void;
}

const TopBar: React.FC<TopBarProps> = ({ 
  currentView, theme, activeScreen,
  onViewChange, onToggleTheme, onScreenChange
}) => {
  const viewOptions: CalendarViewType[] = [CalendarViewType.Day, CalendarViewType.Week, CalendarViewType.Month, CalendarViewType.Agenda];
  const { fullDate } = useClock('Europe/Amsterdam');

  return (
    <header className="grid grid-cols-3 items-center px-6 pt-6 flex-shrink-0">
      {/* Left Section */}
      <div className="flex items-center space-x-4 justify-start">
        {activeScreen === 0 ? (
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        ) : (
          <h1 className="text-3xl font-bold tracking-tight">{fullDate}</h1>
        )}
      </div>

      {/* Center Section: Page Indicators */}
      <div className="flex items-center justify-center space-x-3">
        <button onClick={() => onScreenChange(0)} aria-label="Go to Dashboard">
          <div className={`h-2.5 w-2.5 rounded-full transition-colors ${activeScreen === 0 ? 'bg-gray-800 dark:bg-white' : 'bg-gray-400 dark:bg-white/40'}`} />
        </button>
        <button onClick={() => onScreenChange(1)} aria-label="Go to Smart Screen">
          <div className={`h-2.5 w-2.5 rounded-full transition-colors ${activeScreen === 1 ? 'bg-gray-800 dark:bg-white' : 'bg-gray-400 dark:bg-white/40'}`} />
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4 justify-end">
        {activeScreen === 0 && (
            <div className="flex items-center bg-black/5 dark:bg-white/10 backdrop-blur-md rounded-full p-1">
            {viewOptions.map((view) => (
                <button
                key={view}
                onClick={() => onViewChange(view)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    currentView === view
                    ? 'bg-white text-gray-900 shadow-sm dark:text-gray-900'
                    : 'text-gray-600 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
                >
                {view}
                </button>
            ))}
            </div>
        )}
        <button 
            onClick={onToggleTheme}
            className="h-10 w-10 rounded-full bg-black/5 dark:bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
};

export default TopBar;