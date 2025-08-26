import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addMember, deleteMember, addCalendarSource, deleteCalendarSource, setPreference, getPreference } from '../../services/db';
import { Trash2 } from '../icons/LucideIcons';
import { CalendarViewType, CalendarSource, Member } from '../../types';
import OAuthPopup from './OAuthPopup';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('preferences');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      requestAnimationFrame(() => modalRef.current?.focus({ preventScroll: true }));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        ref={modalRef}
        tabIndex={-1}
        className="bg-gray-200/80 dark:bg-gray-900/80 border border-gray-300 dark:border-white/20 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col outline-none" 
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b border-gray-300 dark:border-white/20 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
           <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-1 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
           </button>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-48 border-r border-gray-300 dark:border-white/20 p-4">
            <nav className="flex flex-col space-y-2">
              <button onClick={() => setActiveTab('preferences')} className={`p-2 rounded-md text-left font-medium w-full ${activeTab === 'preferences' ? 'bg-brand-primary text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}>Preferences</button>
              <button onClick={() => setActiveTab('household')} className={`p-2 rounded-md text-left font-medium w-full ${activeTab === 'household' ? 'bg-brand-primary text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}>Household</button>
              <button onClick={() => setActiveTab('integrations')} className={`p-2 rounded-md text-left font-medium w-full ${activeTab === 'integrations' ? 'bg-brand-primary text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}>Integrations</button>
            </nav>
          </aside>
          <main className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'household' && <HouseholdSettings />}
            {activeTab === 'integrations' && <IntegrationsSettings />}
            {activeTab === 'preferences' && <PreferencesSettings />}
          </main>
        </div>
      </div>
    </div>
  );
};

// Household Settings Tab
const HouseholdSettings = () => {
    const members = useLiveQuery(() => db.members.toArray(), []);
    const [name, setName] = useState('');
    const [initials, setInitials] = useState('');
    const [color, setColor] = useState('#3b82f6');

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !initials.trim()) return;
        await addMember({ name, initials, color_hex: color });
        setName('');
        setInitials('');
        setColor('#3b82f6');
    }

    return (
        <div>
            <h3 className="text-lg font-bold mb-4">Manage Members</h3>
            <div className="space-y-2 mb-6">
                {members?.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-2 bg-black/5 dark:bg-white/10 rounded-md">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: member.color_hex }}>{member.initials}</div>
                            <span>{member.name}</span>
                        </div>
                        <button onClick={() => member.id && deleteMember(member.id)} className="text-gray-400 hover:text-red-500">
                           <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
            
            <h3 className="text-lg font-bold mb-4 border-t border-gray-300 dark:border-white/20 pt-4">Add New Member</h3>
            <form onSubmit={handleAddMember} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required className="col-span-1 bg-black/5 dark:bg-white/10 rounded-md px-3 py-2 text-base border-0 focus:ring-2 focus:ring-inset focus:ring-brand-primary" />
                    <input type="text" placeholder="Initials" value={initials} onChange={e => setInitials(e.target.value.toUpperCase())} maxLength={2} required className="col-span-1 bg-black/5 dark:bg-white/10 rounded-md px-3 py-2 text-base border-0 focus:ring-2 focus:ring-inset focus:ring-brand-primary" />
                    <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-10 w-full col-span-1 bg-transparent border-none rounded-md cursor-pointer" />
                 </div>
                 <button type="submit" className="px-4 py-2 rounded-md text-white bg-brand-primary hover:bg-brand-primary/90 transition-colors">Add Member</button>
            </form>
        </div>
    )
}

// Integrations Settings Tab
const IntegrationsSettings = () => {
    const calendarSources = useLiveQuery(() => db.calendar_sources.toArray(), []);
    const members = useLiveQuery(() => db.members.toArray(), []);
    
    return (
        <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Calendar Integrations</h3>
              <div className="p-4 bg-black/5 dark:bg-white/10 rounded-md space-y-4">
                <ICalSettings sources={calendarSources || []} members={members || []} />
              </div>
            </div>
        </div>
    )
}

const ICalSettings: React.FC<{ sources: CalendarSource[], members: Member[] }> = ({ sources, members }) => {
    const [iCalUrl, setICalUrl] = useState('');
    const [selectedMemberId, setSelectedMemberId] = useState<number | undefined>(undefined);
    const [syncStatus, setSyncStatus] = useState<{ status: 'idle' | 'loading' | 'success' | 'error', message: string }>({ status: 'idle', message: '' });

    useEffect(() => {
        if (!selectedMemberId && members.length > 0) {
            setSelectedMemberId(members[0].id);
        }
    }, [members, selectedMemberId]);

    const handleAddICal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!iCalUrl.trim() || selectedMemberId === undefined) return;
        setSyncStatus({ status: 'loading', message: 'Syncing calendar...' });
        try {
            await addCalendarSource({ type: 'ical', url: iCalUrl, member_id: selectedMemberId });
            setSyncStatus({ status: 'success', message: 'Calendar synced successfully!' });
            setICalUrl('');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            setSyncStatus({ status: 'error', message: `Sync failed: ${errorMessage}` });
        } finally {
            setTimeout(() => setSyncStatus({ status: 'idle', message: '' }), 5000);
        }
    };
    
    return (
        <div>
            <h4 className="font-semibold mb-2">iCal Links</h4>
             <p className="text-xs text-gray-500 dark:text-white/60 mb-4">Add calendar subscriptions via iCal URL. Calendars will automatically refresh in the background.</p>
            <div className="space-y-2 mb-4">
                {sources.filter(s => s.type === 'ical').map(source => (
                    <div key={source.id} className="flex items-center justify-between p-2 bg-black/5 dark:bg-white/5 rounded-md text-sm">
                        <div className="flex-1 truncate pr-4">
                           <p className="font-medium">{source.name || 'Unnamed Calendar'}</p>
                           <p className="text-xs text-gray-500 truncate">{source.url}</p>
                        </div>
                        <button onClick={() => source.id && deleteCalendarSource(source.id)} className="text-gray-400 hover:text-red-500"> <Trash2 className="w-4 h-4" /> </button>
                    </div>
                ))}
            </div>
            <form onSubmit={handleAddICal} className="space-y-2">
                 <div className="flex items-stretch space-x-2">
                    <input type="url" placeholder="Paste iCal URL..." value={iCalUrl} onChange={e => setICalUrl(e.target.value)} required className="flex-1 bg-black/5 dark:bg-white/5 rounded-md px-3 py-2 text-sm border-0 focus:ring-2 focus:ring-inset focus:ring-brand-primary" />
                    <select value={selectedMemberId ?? ''} onChange={e => setSelectedMemberId(Number(e.target.value))} required className="bg-black/5 dark:bg-white/5 rounded-md px-3 text-sm border-0 focus:ring-2 focus:ring-inset focus:ring-brand-primary text-gray-900">
                        <option value="" disabled>Assign to...</option>
                        {members?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                 </div>
                 <button type="submit" className="px-4 py-2 rounded-md text-white bg-brand-primary text-sm hover:bg-brand-primary/90 disabled:opacity-50" disabled={syncStatus.status === 'loading'}>Add & Sync Calendar</button>
            </form>
            {syncStatus.status !== 'idle' && (
                <p className={`text-xs mt-2 ${
                    syncStatus.status === 'success' ? 'text-green-600 dark:text-green-400' :
                    syncStatus.status === 'error' ? 'text-red-600 dark:text-red-400' :
                    'text-gray-600 dark:text-gray-400'
                }`}>{syncStatus.message}</p>
            )}
        </div>
    );
};

// Preferences Settings Tab
const PreferencesSettings = () => {
    return (
        <div className="divide-y divide-gray-300 dark:divide-white/10">
            <div className="pb-6">
                <h3 className="text-lg font-bold mb-2">Display &amp; View</h3>
                <PreferenceSelect prefKey="theme" label="Theme" defaultValue="system" options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'System' }]} />
                <PreferenceSelect prefKey="defaultView" label="Default Calendar View" defaultValue={CalendarViewType.Month} options={[{ value: CalendarViewType.Month, label: 'Month' }, { value: CalendarViewType.Week, label: 'Week' }, { value: CalendarViewType.Day, label: 'Day' }, { value: CalendarViewType.Agenda, label: 'Agenda' }]} />
                <PreferenceToggle prefKey="showTasksOnCalendar" label="Show Tasks on Calendar" defaultValue={true} />
            </div>
             <div className="py-6">
                <h3 className="text-lg font-bold mb-2">Notifications</h3>
                 <p className="text-xs text-gray-500 dark:text-white/60 mb-2">Browser push notifications for upcoming events. You may need to grant permission.</p>
                <PreferenceToggle prefKey="notificationsEnabled" label="Enable Event Notifications" defaultValue={true} />
                <PreferenceSelect prefKey="notificationTime" label="Remind Me Before an Event" defaultValue="15" options={[{value: '5', label: '5 minutes'}, {value: '15', label: '15 minutes'}, {value: '30', label: '30 minutes'}, {value: '60', label: '1 hour'}, {value: '1440', label: '1 day'}]} />
            </div>
            <div className="py-6">
                <h3 className="text-lg font-bold mb-2">Sidebar Widgets</h3>
                <PreferenceToggle prefKey="showWeather" label="Show Weather" defaultValue={true} />
                <PreferenceToggle prefKey="showTrains" label="Show Train Departures" defaultValue={true} />
                <PreferenceToggle prefKey="showTasks" label="Show Tasks List" defaultValue={true} />
            </div>
             <div className="pt-6">
                <h3 className="text-lg font-bold mb-4">Train Preferences</h3>
                <TrainStationPreference />
            </div>
        </div>
    )
}

const TrainStationPreference = () => {
    const station = useLiveQuery(() => getPreference('trainStation', null), []);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (query.trim().length < 2) return;
        try {
            const response = await fetch(`https://v6.db.transport.rest/locations?query=${encodeURIComponent(query)}&results=5&poi=false&stations=true`);
            const data = await response.json();
            setResults(data && data.length > 0 ? data : []);
        } catch (err) { setError('Failed to fetch stations.'); }
    };

    const handleSelect = (station: any) => {
        setPreference('trainStation', { name: station.name, id: station.id });
        setQuery('');
        setResults([]);
    };
    
    return (
        <div>
            <label className="text-sm font-medium">Default Departure Station</label>
            {station && <p className="text-lg font-semibold mb-2">{station.name}</p>}
            <form onSubmit={handleSearch} className="flex space-x-2">
                <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search for a station..." className="flex-1 bg-black/5 dark:bg-white/10 rounded-md px-3 py-1.5 text-sm border-0 focus:ring-2 focus:ring-inset focus:ring-brand-primary" />
                <button type="submit" className="px-3 py-1.5 bg-brand-primary rounded-md text-white text-sm">Search</button>
            </form>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            <div className="mt-2 space-y-1">
                {results.map(loc => (
                    <button key={loc.id} onClick={() => handleSelect(loc)} className="w-full text-left p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-sm">{loc.name}</button>
                ))}
            </div>
        </div>
    )
};


// Reusable Preference Components
const PreferenceToggle: React.FC<{ prefKey: string; label: string; defaultValue: boolean }> = ({ prefKey, label, defaultValue }) => {
    const value = useLiveQuery(() => db.preferences.get(prefKey).then(p => p?.value ?? defaultValue), [prefKey], defaultValue);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setPreference(prefKey, e.target.checked);
    return (
        <div className="flex items-center justify-between py-2">
            <label htmlFor={prefKey} className="text-sm font-medium">{label}</label>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" id={prefKey} checked={value} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand-primary/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-primary"></div>
            </label>
        </div>
    );
};

const PreferenceSelect: React.FC<{ prefKey: string; label: string; options: { value: string | number; label: string }[]; defaultValue: string | number }> = ({ prefKey, label, options, defaultValue }) => {
    const value = useLiveQuery(() => db.preferences.get(prefKey).then(p => p?.value ?? defaultValue), [prefKey], defaultValue);
    
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = e.target.value;
        // Check if the original value was a number and convert back
        const originalOption = options.find(opt => opt.value.toString() === selectedValue);
        if (typeof originalOption?.value === 'number') {
            setPreference(prefKey, Number(selectedValue));
        } else {
            setPreference(prefKey, selectedValue);
        }
    };

    return (
        <div className="flex items-center justify-between py-2">
            <label className="text-sm font-medium">{label}</label>
            <select value={value} onChange={handleChange} className="bg-black/5 dark:bg-white/10 rounded-md px-3 py-1.5 text-sm border-0 focus:ring-2 focus:ring-inset focus:ring-brand-primary text-gray-900">
                {options.map(opt => <option key={opt.value.toString()} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    );
};

export default SettingsModal;