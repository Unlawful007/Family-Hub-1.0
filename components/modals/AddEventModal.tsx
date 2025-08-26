
import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addEvent, addMember, addCalendarSource, addEvents } from '../../services/db';
import { previewiCalEvents } from '../../services/ical';
import { Member, Event } from '../../types';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDate?: Date;
}

const AddEventModal: React.FC<AddEventModalProps> = ({ isOpen, onClose, preselectedDate }) => {
  const [activeTab, setActiveTab] = useState('manual');
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      setActiveTab('manual');
       if (modalRef.current) {
         requestAnimationFrame(() => modalRef.current?.focus({ preventScroll: true }));
       }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        ref={modalRef}
        tabIndex={-1}
        className="bg-gray-200/80 dark:bg-gray-900/80 border border-gray-300 dark:border-white/20 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col outline-none" 
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-white/20">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Event</h2>
                <p className="text-sm text-gray-600 dark:text-white/60">Create a new event manually or import from a URL.</p>
            </div>
            <div className="flex items-center bg-black/5 dark:bg-white/10 p-1 rounded-full">
                <button onClick={() => setActiveTab('manual')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'manual' ? 'bg-white text-gray-900 shadow-sm dark:text-gray-900' : 'text-gray-600 dark:text-white/70'}`}>Create Manually</button>
                <button onClick={() => setActiveTab('import')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'import' ? 'bg-white text-gray-900 shadow-sm dark:text-gray-900' : 'text-gray-600 dark:text-white/70'}`}>Import from URL</button>
            </div>
        </header>

        {activeTab === 'manual' ? <ManualEventForm preselectedDate={preselectedDate} onClose={onClose} /> : <ImportEventForm onClose={onClose} />}
        
      </div>
    </div>
  );
};


// Manual Event Form Component
const ManualEventForm: React.FC<{ preselectedDate?: Date; onClose: () => void }> = ({ preselectedDate, onClose }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [memberId, setMemberId] = useState<string>('');
    const [isAllDay, setIsAllDay] = useState(false);
    const [error, setError] = useState('');
    const [showNewMemberForm, setShowNewMemberForm] = useState(false);
    
    const members = useLiveQuery(() => db.members.toArray(), []);

    useEffect(() => {
        let startDate: Date;
        if (preselectedDate) {
            startDate = new Date(preselectedDate);
            startDate.setHours(9, 0, 0, 0);
        } else {
            startDate = new Date();
        }
        
        const endDate = new Date(startDate);
        endDate.setHours(startDate.getHours() + 1);

        startDate.setMinutes(startDate.getMinutes() - startDate.getTimezoneOffset());
        endDate.setMinutes(endDate.getMinutes() - endDate.getTimezoneOffset());
        
        setStartTime(startDate.toISOString().slice(0, 16));
        setEndTime(endDate.toISOString().slice(0, 16));
    }, [preselectedDate]);

    const handleMemberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === 'add_new') {
            setShowNewMemberForm(true);
        } else {
            setMemberId(e.target.value);
            setShowNewMemberForm(false);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!title.trim()) return;
        if (!isAllDay && new Date(endTime) <= new Date(startTime)) {
            setError('End time must be after start time.');
            return;
        }

        await addEvent({
            title, description,
            start_time: new Date(startTime),
            end_time: new Date(endTime),
            member_id: memberId ? Number(memberId) : undefined,
            is_all_day: isAllDay,
        });
        
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-4 space-y-5 overflow-y-auto">
            <InputField id="title" label="Title" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
            <InputField id="description" label="Description" type="textarea" value={description} onChange={e => setDescription(e.target.value)} />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField id="start_time" label="Starts" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} required disabled={isAllDay} />
              <InputField id="end_time" label="Ends" type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} required disabled={isAllDay} />
            </div>
             {error && <p className="text-red-500 text-xs text-center -mt-2">{error}</p>}
            
            <div className="flex items-center">
              <input id="is_all_day" type="checkbox" checked={isAllDay} onChange={e => setIsAllDay(e.target.checked)} className="h-4 w-4 rounded bg-gray-300/50 dark:bg-white/20 border-gray-400/50 dark:border-white/30 text-brand-primary focus:ring-brand-primary" />
              <label htmlFor="is_all_day" className="ml-2 block text-sm text-gray-700 dark:text-white/80">All-day event</label>
            </div>
            
            <div>
              <label htmlFor="member" className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">Assign to</label>
              <select id="member" value={memberId} onChange={handleMemberChange} className="w-full bg-black/5 dark:bg-white/10 rounded-md px-4 py-3 text-base border-0 focus:ring-2 focus:ring-inset focus:ring-brand-primary text-gray-900">
                <option value="">Nobody</option>
                {members?.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
                <option value="add_new" className="font-bold text-brand-primary">＋ Add new member...</option>
              </select>
            </div>
            {showNewMemberForm && <NewMemberForm onMemberAdded={(id) => { setMemberId(id.toString()); setShowNewMemberForm(false); }} />}

          </div>
          <div className="flex justify-end space-x-4 p-6 mt-auto border-t border-gray-300 dark:border-white/20 flex-shrink-0">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-md text-gray-700 dark:text-white/80 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-md text-white bg-brand-primary hover:bg-brand-primary/90 transition-colors font-semibold">Save Event</button>
          </div>
        </form>
    );
}

// Inline New Member Form
const NewMemberForm: React.FC<{onMemberAdded: (id: number) => void}> = ({ onMemberAdded }) => {
    const [name, setName] = useState('');
    const [initials, setInitials] = useState('');
    const [color, setColor] = useState('#8b5cf6');

    const handleAdd = async () => {
        if (!name.trim() || !initials.trim()) return;
        const newId = await addMember({ name, initials, color_hex: color });
        onMemberAdded(newId as number);
    };

    return (
        <div className="p-4 bg-black/5 dark:bg-white/5 rounded-md space-y-3">
            <p className="text-sm font-medium">Create New Member</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="col-span-1 bg-black/5 dark:bg-white/10 rounded-md px-3 py-2 text-sm border-0 focus:ring-2 focus:ring-inset focus:ring-brand-primary" />
                <input type="text" placeholder="Initials" value={initials} onChange={e => setInitials(e.target.value.toUpperCase())} maxLength={2} className="col-span-1 bg-black/5 dark:bg-white/10 rounded-md px-3 py-2 text-sm border-0 focus:ring-2 focus:ring-inset focus:ring-brand-primary" />
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-9 w-full col-span-1 bg-transparent border-none rounded-md cursor-pointer" />
            </div>
            <button type="button" onClick={handleAdd} className="px-3 py-1.5 text-sm rounded-md text-white bg-brand-primary/80 hover:bg-brand-primary/90">Add Member</button>
        </div>
    );
};

// Import from URL Form Component
const ImportEventForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'preview' | 'importing' | 'error'>('idle');
    const [error, setError] = useState('');
    const [calendarName, setCalendarName] = useState('');
    const [events, setEvents] = useState<Omit<Event, 'id'>[]>([]);
    const [selectedEvents, setSelectedEvents] = useState<number[]>([]);
    const members = useLiveQuery(() => db.members.toArray(), []);
    const [memberId, setMemberId] = useState<number | undefined>(undefined);


    const handlePreview = async () => {
        if (!url.trim()) return;
        setStatus('loading');
        setError('');
        try {
            const { name, events: previewedEvents } = await previewiCalEvents(url);
            setCalendarName(name);
            setEvents(previewedEvents);
            setSelectedEvents(previewedEvents.map((_, index) => index)); // Select all by default
            setStatus('preview');
        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred.");
            setStatus('error');
        }
    };
    
    const handleImport = async () => {
        if (selectedEvents.length === 0 || !memberId) return;
        setStatus('importing');
        try {
            const sourceId = await addCalendarSource({
                type: 'ical',
                url: url,
                member_id: memberId,
                name: calendarName
            });
            
            const eventsToImport = selectedEvents.map(index => ({
                ...events[index],
                member_id: memberId,
                source_id: sourceId
            }));

            await addEvents(eventsToImport);
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to import events.");
            setStatus('error');
        }
    };
    
    const handleToggleSelectAll = () => {
        if (selectedEvents.length === events.length) {
            setSelectedEvents([]);
        } else {
            setSelectedEvents(events.map((_, index) => index));
        }
    };

    const handleToggleEvent = (index: number) => {
        setSelectedEvents(prev => 
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 space-y-4">
                <label htmlFor="ical-url" className="block text-sm font-medium text-gray-700 dark:text-white/80">iCal URL</label>
                <div className="flex items-center space-x-2">
                    <input id="ical-url" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste your calendar URL here..." className="flex-1 bg-black/5 dark:bg-white/10 rounded-md px-4 py-3 text-base border-0 focus:ring-2 focus:ring-inset focus:ring-brand-primary" />
                    <button onClick={handlePreview} disabled={status === 'loading'} className="px-5 py-3 rounded-md text-white bg-brand-primary hover:bg-brand-primary/90 font-semibold disabled:opacity-50">Preview</button>
                </div>
                {status === 'error' && <p className="text-red-500 text-sm text-center">{error}</p>}
            </div>
            
            {status === 'loading' && <div className="text-center p-8">Loading event preview...</div>}
            
            {status === 'preview' && (
                <>
                <div className="px-6 pb-4 space-y-4 border-b border-gray-300 dark:border-white/20 flex-shrink-0">
                   <h3 className="text-lg font-bold">Preview: <span className="font-medium">{calendarName}</span></h3>
                   <div className="flex items-center justify-between">
                       <div className="flex items-center">
                            <input id="select-all" type="checkbox" checked={selectedEvents.length === events.length} onChange={handleToggleSelectAll} className="h-4 w-4 rounded bg-gray-300/50 dark:bg-white/20 border-gray-400/50" />
                            <label htmlFor="select-all" className="ml-2 text-sm">Select All ({selectedEvents.length} / {events.length})</label>
                       </div>
                        <select value={memberId ?? ''} onChange={e => setMemberId(Number(e.target.value))} required className="bg-black/5 dark:bg-white/10 rounded-md px-3 py-1.5 text-sm border-0 focus:ring-2 focus:ring-inset focus:ring-brand-primary text-gray-900">
                          <option value="" disabled selected>Assign to...</option>
                          {members?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                   </div>
                </div>
                <div className="overflow-y-auto flex-1 p-6 pt-2">
                    <ul className="space-y-2">
                        {events.map((event, index) => (
                            <li key={index} className="flex items-center p-2 rounded-md bg-black/5 dark:bg-white/5">
                               <input type="checkbox" checked={selectedEvents.includes(index)} onChange={() => handleToggleEvent(index)} className="h-4 w-4 rounded mr-3 bg-gray-300/50 dark:bg-white/20 border-gray-400/50" />
                               <div className="flex-1">
                                   <p className="font-semibold text-sm">{event.title}</p>
                                   <p className="text-xs text-gray-600 dark:text-white/60">{new Date(event.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                               </div>
                            </li>
                        ))}
                    </ul>
                </div>
                </>
            )}

            <div className="flex justify-end space-x-4 p-6 mt-auto border-t border-gray-300 dark:border-white/20 flex-shrink-0">
                <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-md text-gray-700 dark:text-white/80 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 font-semibold">Cancel</button>
                <button onClick={handleImport} disabled={status !== 'preview' || selectedEvents.length === 0 || !memberId} className="px-5 py-2.5 rounded-md text-white bg-brand-primary hover:bg-brand-primary/90 font-semibold disabled:opacity-50">
                    {status === 'importing' ? 'Importing...' : `Import ${selectedEvents.length} Events`}
                </button>
            </div>
        </div>
    );
};

// Reusable Input Field
const InputField: React.FC<any> = ({ id, label, type = 'text', ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">{label}</label>
        {type === 'textarea' ? (
            <textarea id={id} rows={3} className="w-full bg-black/5 dark:bg-white/10 rounded-md px-4 py-3 text-base border-0 focus:ring-2 focus:ring-inset focus:ring-brand-primary" {...props} />
        ) : (
            <input type={type} id={id} className="w-full bg-black/5 dark:bg-white/10 rounded-md px-4 py-3 text-base border-0 focus:ring-2 focus:ring-inset focus:ring-brand-primary disabled:opacity-50" {...props} />
        )}
    </div>
);


export default AddEventModal;