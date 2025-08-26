import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CalendarViewType, CalendarItem } from './types';
import { db, seedDatabase, setPreference, refreshAlliCalSources, deleteEvent, deleteTask } from './services/db';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import CalendarView from './components/CalendarView';
import SettingsModal from './components/modals/SettingsModal';
import AddEventModal from './components/modals/AddEventModal';
import EventDetailsModal from './components/modals/EventDetailsModal';
import SmartScreen from './components/SmartScreen';
import useNotifications from './hooks/useNotifications';
import useClock from './hooks/useClock';
import { Settings, Plus, ChevronLeft, ChevronRight, ChevronDown } from './components/icons/LucideIcons';

export default function App(): React.ReactNode {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('dark');
  const [calendarView, setCalendarView] = useState<CalendarViewType>(CalendarViewType.Month);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isDataSeeded, setIsDataSeeded] = useState(false);
  const [preselectedEventDate, setPreselectedEventDate] = useState<Date | undefined>();
  const [viewDate, setViewDate] = useState(new Date());
  const [memberFilterId, setMemberFilterId] = useState<number | null>(null);

  // New state for swipeable screens
  const [activeScreen, setActiveScreen] = useState<0 | 1>(0); // 0: Dashboard, 1: Smart Screen

  // State for event details modal
  const [selectedCalendarItem, setSelectedCalendarItem] = useState<CalendarItem | null>(null);
  const [isEventDetailsModalOpen, setIsEventDetailsModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // State for Jump to Month popover
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(viewDate.getFullYear());
  const [pickerMonth, setPickerMonth] = useState(viewDate.getMonth());

  // State for calendar animation
  const [calendarAnimationKey, setCalendarAnimationKey] = useState(0);

  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const minSwipeDistance = 75;

  const preferences = useLiveQuery(() => db.preferences.toArray(), []);
  const { fullDate } = useClock('Europe/Amsterdam');
  const monthYearFormat = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
  const isCurrentMonthView = viewDate.getMonth() === new Date().getMonth() && viewDate.getFullYear() === new Date().getFullYear();

  // Initialize Notification hook
  useNotifications();

  useEffect(() => {
    const seed = async () => {
      await seedDatabase();
      setIsDataSeeded(true);
    };
    seed();
  }, []);
  
  // Auto-refresh iCal sources
  useEffect(() => {
    if (isDataSeeded) {
      console.log('Performing initial iCal sync...');
      refreshAlliCalSources(); // Initial sync on app load
      const intervalId = setInterval(() => {
        console.log('Performing periodic iCal sync...');
        refreshAlliCalSources();
      }, 5 * 60 * 1000); // Refresh every 5 minutes
      
      return () => clearInterval(intervalId); // Cleanup on unmount
    }
  }, [isDataSeeded]);

  useEffect(() => {
    // Load preferences once they are available from the database
    if (preferences) {
      const themePref = preferences.find(p => p.key === 'theme')?.value || 'system';
      const viewPref = preferences.find(p => p.key === 'defaultView')?.value || CalendarViewType.Month;
      setTheme(themePref);
      setCalendarView(viewPref);
    }
  }, [preferences]);
  
  useEffect(() => {
    let currentTheme = theme;

    const updateTheme = () => {
        if (currentTheme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            setEffectiveTheme(systemTheme);
        } else {
            setEffectiveTheme(currentTheme);
        }
    };

    updateTheme();
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (currentTheme === 'system') {
        updateTheme();
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(effectiveTheme === 'light' ? 'dark' : 'light');
    root.classList.add(effectiveTheme);
    root.style.colorScheme = effectiveTheme;
  }, [effectiveTheme]);

  // Keyboard navigation for screens
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'ArrowRight') handleNextScreen();
          if (e.key === 'ArrowLeft') handlePrevScreen();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeScreen]);


  const handleDayClick = useCallback((date: Date) => {
    setPreselectedEventDate(date);
    setIsAddEventOpen(true);
  }, []);

  const handleAddEventModalClose = () => {
    setIsAddEventOpen(false);
    setPreselectedEventDate(undefined);
  };
  
  const handleOpenAddEventModal = () => {
    setPreselectedEventDate(undefined);
    setIsAddEventOpen(true);
  };

  const handleThemeToggle = useCallback(() => {
    const newTheme = effectiveTheme === 'dark' ? 'light' : 'dark';
    setPreference('theme', newTheme);
  }, [effectiveTheme]);
  
  const triggerCalendarAnimation = () => {
    setCalendarAnimationKey(prev => prev + 1);
  };

  const handlePrevMonth = () => {
    setViewDate(current => new Date(current.getFullYear(), current.getMonth() - 1, 1));
    triggerCalendarAnimation();
  };

  const handleNextMonth = () => {
    setViewDate(current => new Date(current.getFullYear(), current.getMonth() + 1, 1));
    triggerCalendarAnimation();
  };

  const handleGoToToday = () => {
    setViewDate(new Date());
    triggerCalendarAnimation();
  };

  const handleJumpToMonth = () => {
    setViewDate(new Date(pickerYear, pickerMonth, 1));
    setIsMonthPickerOpen(false);
    triggerCalendarAnimation();
  };
  
  // Screen navigation handlers
  const handlePrevScreen = () => setActiveScreen(0);
  const handleNextScreen = () => setActiveScreen(1);

  // Event Details Modal Handlers
  const handleEventClick = useCallback((item: CalendarItem) => {
    setDeleteError(null);
    setSelectedCalendarItem(item);
    setIsEventDetailsModalOpen(true);
  }, []);

  const handleCloseEventDetailsModal = useCallback(() => {
    setIsEventDetailsModalOpen(false);
    setSelectedCalendarItem(null);
    setDeleteError(null);
  }, []);

  const handleDeleteCalendarItem = useCallback(async (itemToDelete: CalendarItem) => {
    if (!itemToDelete) {
      setDeleteError("Cannot delete: Invalid item provided.");
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to delete "${itemToDelete.data.title}"?`);
    if (confirmed) {
        try {
            setDeleteError(null);
            if (itemToDelete.type === 'event' && itemToDelete.data.id) {
                await deleteEvent(itemToDelete.data.id);
            } else if (itemToDelete.type === 'task' && itemToDelete.data.id) {
                await deleteTask(itemToDelete.data.id);
            }
            handleCloseEventDetailsModal();
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unexpected error occurred.";
            console.error("Failed to delete item:", error);
            setDeleteError(`Failed to delete: ${message}`);
        }
    }
  }, [handleCloseEventDetailsModal]);
  
  // Touch handlers for screen swiping
    const onTouchStart = (e: React.TouchEvent) => {
        touchEnd.current = null;
        touchStart.current = e.targetTouches[0].clientX;
    };
    const onTouchMove = (e: React.TouchEvent) => {
        touchEnd.current = e.targetTouches[0].clientX;
    };
    const onTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;
        const distance = touchStart.current - touchEnd.current;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && activeScreen === 0) {
            handleNextScreen();
        } else if (isRightSwipe && activeScreen === 1) {
            handlePrevScreen();
        }

        touchStart.current = null;
        touchEnd.current = null;
    };

  if (!isDataSeeded) {
    return (
        <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
            <p>Initializing Database...</p>
        </div>
    );
  }

  const MonthPicker = () => (
    <div className="absolute top-full right-0 mt-2 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg shadow-xl p-4 z-20 w-72">
        <div className="flex justify-between items-center mb-4">
            <button onClick={() => setPickerYear(y => y - 1)} className="px-2 font-bold text-lg">&lt;</button>
            <input type="number" value={pickerYear} onChange={e => setPickerYear(Number(e.target.value))} className="w-24 text-center font-semibold bg-transparent border-b-2 border-gray-400 dark:border-white/30 focus:outline-none focus:border-brand-primary" />
            <button onClick={() => setPickerYear(y => y + 1)} className="px-2 font-bold text-lg">&gt;</button>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
            {Array.from({length: 12}).map((_, i) => (
                <button 
                    key={i} 
                    onClick={() => setPickerMonth(i)}
                    className={`p-2 text-sm rounded-md ${pickerMonth === i ? 'bg-brand-primary text-white font-semibold' : 'hover:bg-black/10 dark:hover:bg-white/10'}`}
                >
                    {new Date(0, i).toLocaleString('en-US', { month: 'short' })}
                </button>
            ))}
        </div>
        <button onClick={handleJumpToMonth} className="w-full mt-4 px-4 py-2 bg-brand-primary text-white rounded-md text-sm font-semibold">
            Go to Date
        </button>
    </div>
  );

  return (
    <div className="h-screen w-screen font-sans text-gray-900 bg-gray-100 dark:text-white dark:bg-gradient-to-br dark:from-[#0f0c29] dark:via-[#302b63] dark:to-[#24243e] flex flex-col relative">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <AddEventModal isOpen={isAddEventOpen} onClose={handleAddEventModalClose} preselectedDate={preselectedEventDate} />
      <EventDetailsModal
        isOpen={isEventDetailsModalOpen}
        onClose={handleCloseEventDetailsModal}
        item={selectedCalendarItem}
        onDelete={handleDeleteCalendarItem}
        error={deleteError}
      />
      
       <TopBar
            currentView={calendarView}
            onViewChange={setCalendarView}
            onToggleTheme={handleThemeToggle}
            theme={effectiveTheme}
            activeScreen={activeScreen}
            onScreenChange={setActiveScreen}
        />
      
      <div 
        className="flex-1 w-full overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div 
          className="flex w-[200%] h-full transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${activeScreen * 50}%)` }}
        >
            {/* Screen 1: Dashboard */}
            <div className="w-1/2 h-full flex">
                <Sidebar selectedMemberId={memberFilterId} onSelectMember={setMemberFilterId} />
                <main className="flex-1 flex flex-col h-full p-6 pt-0">
                    <header className="flex justify-between items-center pt-6 mb-4 flex-shrink-0">
                        <div>
                           <h1 className="text-3xl font-bold tracking-tight">{fullDate}</h1>
                        </div>
                        <div className="flex items-center space-x-2 relative">
                           <button onClick={() => setIsMonthPickerOpen(p => !p)} className="flex items-center space-x-1 cursor-pointer p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10">
                             <h2 className="text-xl font-semibold w-36 text-right">{monthYearFormat.format(viewDate)}</h2>
                             <ChevronDown className="h-5 w-5 opacity-70" />
                           </button>
                           {isMonthPickerOpen && <MonthPicker />}
                           <button onClick={handlePrevMonth} aria-label="Previous month" className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                                <ChevronLeft className="h-6 w-6" />
                           </button>
                           <button onClick={handleNextMonth} aria-label="Next month" className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                                <ChevronRight className="h-6 w-6" />
                           </button>
                           {!isCurrentMonthView && (
                                <button onClick={handleGoToToday} className="ml-2 px-3 py-1.5 text-sm font-semibold rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
                                    Today
                                </button>
                           )}
                        </div>
                    </header>
                    <div key={calendarAnimationKey} className="flex-1 animate-fadeIn">
                        <CalendarView 
                            view={calendarView} 
                            onDayClick={handleDayClick} 
                            viewDate={viewDate} 
                            memberFilterId={memberFilterId}
                            onEventClick={handleEventClick}
                            onPrevMonth={handlePrevMonth}
                            onNextMonth={handleNextMonth}
                        />
                    </div>
                </main>
            </div>
            {/* Screen 2: Smart Screen */}
            <div className="w-1/2 h-full">
                <SmartScreen />
            </div>
        </div>
      </div>
      
       {/* Desktop Screen Navigation Arrows */}
       <button 
         onClick={handlePrevScreen} 
         className={`absolute top-1/2 left-4 -translate-y-1/2 h-10 w-10 rounded-full bg-black/20 dark:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-opacity duration-300 hover:bg-black/30 dark:hover:bg-white/30 z-20 ${activeScreen === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
         aria-label="Previous Screen"
        >
         <ChevronLeft className="h-6 w-6" />
       </button>
       <button 
         onClick={handleNextScreen} 
         className={`absolute top-1/2 right-4 -translate-y-1/2 h-10 w-10 rounded-full bg-black/20 dark:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-opacity duration-300 hover:bg-black/30 dark:hover:bg-white/30 z-20 ${activeScreen === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
         aria-label="Next Screen"
        >
         <ChevronRight className="h-6 w-6" />
       </button>

       <div className="absolute bottom-6 right-6 flex items-center space-x-4 z-20">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="h-14 w-14 rounded-full bg-black/5 dark:bg-white/10 backdrop-blur-md border border-black/10 dark:border-white/20 flex items-center justify-center text-gray-800 dark:text-white hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
          aria-label="Open Settings"
        >
          <Settings className="h-6 w-6" />
        </button>
        <button
          onClick={handleOpenAddEventModal}
          className="h-16 w-16 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white shadow-lg hover:opacity-90 transition-opacity"
          aria-label="Add Event"
        >
          <Plus className="h-8 w-8" />
        </button>
      </div>
    </div>
  );
}