import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getPreference, setPreference } from '../../services/db';
import { Settings } from '../icons/LucideIcons';

// --- TYPES ---
interface Station {
    id: string;
    name: string;
}

interface Leg {
    departure: string;
    arrival: string;
    line: {
        name: string;
    };
    departurePlatform?: string;
    destination: {
        name: string;
    };
}

interface Journey {
    id: string; // Custom ID for React key
    legs: Leg[];
}

// --- HELPER FUNCTIONS (testable) ---
export const formatTime = (isoString: string): string => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        return date.toLocaleTimeString('nl-NL', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Amsterdam',
        });
    } catch (e) {
        return '';
    }
};

export const calculateDuration = (startIso: string, endIso: string): string => {
    if (!startIso || !endIso) return '';
    try {
        const start = new Date(startIso).getTime();
        const end = new Date(endIso).getTime();
        const minutes = Math.round((end - start) / 60000);
        if (minutes < 0) return '';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    } catch (e) {
        return '';
    }
};


// --- CUSTOM HOOKS ---
const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

const useJourneys = (source: Station | null, destinations: Station[]) => {
    const [journeys, setJourneys] = useState<Journey[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!source || destinations.length === 0) {
            setJourneys([]);
            setLoading(false);
            return;
        }

        const fetchJourneys = async () => {
            setLoading(true);
            setError(null);
            try {
                const journeyPromises = destinations.map(dest =>
                    fetch(`https://v6.db.transport.rest/journeys?from=${source.id}&to=${dest.id}&results=3&stopovers=true`)
                );
                
                const responses = await Promise.all(journeyPromises);

                const journeyData = await Promise.all(responses.map(res => {
                    if (!res.ok) {
                        console.error(`Failed to fetch journey data for a destination. Status: ${res.status}`);
                        return { journeys: [] }; // Return empty for failed requests to not break the whole list
                    }
                    return res.json();
                }));
                
                const allJourneys = journeyData.flatMap(data => data.journeys || []);

                if (allJourneys.length === 0) {
                     setJourneys([]);
                     return;
                }

                const formattedJourneys: Journey[] = allJourneys.map((j: any, index: number) => ({
                    id: `${j.legs[0]?.tripId || index}-${new Date().getTime()}`,
                    legs: j.legs,
                }));

                // Sort all journeys by departure time
                formattedJourneys.sort((a, b) => {
                   try {
                     const timeA = new Date(a.legs[0].departure).getTime();
                     const timeB = new Date(b.legs[0].departure).getTime();
                     return timeA - timeB;
                   } catch(e) { return 0; }
                });

                setJourneys(formattedJourneys);

            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
                setJourneys([]);
            } finally {
                setLoading(false);
            }
        };

        fetchJourneys();
    }, [source, JSON.stringify(destinations)]); // Stringify to compare array values

    return { journeys, loading, error };
};


// --- UI COMPONENTS ---
const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/60 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/20 rounded-2xl p-6 shadow-md ${className}`}>
        {children}
    </div>
);

const JourneyItem: React.FC<{ journey: Journey }> = ({ journey }) => {
    const firstLeg = journey.legs[0];
    const lastLeg = journey.legs[journey.legs.length - 1];

    if (!firstLeg || !lastLeg) return null;

    const duration = calculateDuration(firstLeg.departure, lastLeg.arrival);
    const changes = journey.legs.length - 1;

    return (
        <div className="flex items-center space-x-3 py-3 border-b border-gray-200 dark:border-white/10 last:border-b-0">
            <div className="text-center w-14 flex-shrink-0">
                <p className="font-bold text-lg">{formatTime(firstLeg.departure)}</p>
                <p className="text-sm text-gray-500 dark:text-white/60">{formatTime(lastLeg.arrival)}</p>
            </div>
            <div className="flex-1 overflow-hidden">
                <p className="font-semibold truncate">{lastLeg.destination.name}</p>
                 <p className="text-xs text-gray-600 dark:text-white/70">
                    {duration} &bull; {changes > 0 ? `${changes} change${changes > 1 ? 's' : ''}` : 'Direct'}
                </p>
            </div>
            {firstLeg.departurePlatform && (
                <div className="text-sm text-center">
                    <span className="font-medium">Pl.</span>
                    <span className="font-bold text-lg"> {firstLeg.departurePlatform}</span>
                </div>
            )}
        </div>
    );
};

const JourneySkeleton: React.FC = () => (
    <div className="flex items-center space-x-3 py-3 border-b border-gray-200 dark:border-white/10 last:border-b-0 animate-pulse">
        <div className="w-14 flex-shrink-0 space-y-1">
            <div className="h-6 w-12 bg-gray-300 dark:bg-white/20 rounded-md mx-auto"></div>
            <div className="h-4 w-10 bg-gray-300 dark:bg-white/20 rounded-md mx-auto"></div>
        </div>
        <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-gray-300 dark:bg-white/20 rounded-md"></div>
            <div className="h-3 w-1/2 bg-gray-300 dark:bg-white/20 rounded-md"></div>
        </div>
        <div className="w-10 h-8 bg-gray-300 dark:bg-white/20 rounded-md"></div>
    </div>
);

const StationEditor: React.FC<{ onStationSet: () => void }> = ({ onStationSet }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Station[]>([]);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (query.trim().length < 2) return;
        try {
            const response = await fetch(`https://v6.db.transport.rest/locations?query=${encodeURIComponent(query)}&results=5&poi=false&stations=true`);
            const data = await response.json();
            if (data && data.length > 0) {
                setResults(data);
            } else {
                setError('No stations found.');
            }
        } catch (err) {
            setError('Failed to fetch stations.');
        }
    };

    const handleSelect = (station: Station) => {
        setPreference('trainStation', { name: station.name, id: station.id });
        onStationSet();
    };

    return (
        <div>
            <form onSubmit={handleSearch} className="flex space-x-2">
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search for a station..."
                    className="flex-1 bg-black/5 dark:bg-white/10 rounded-md px-3 py-1.5 text-sm border-0 focus:ring-2 focus:ring-inset focus:ring-brand-primary"
                />
                <button type="submit" className="px-3 py-1.5 bg-brand-primary rounded-md text-white text-sm">Search</button>
            </form>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            <div className="mt-2 space-y-1">
                {results.map(loc => (
                    <button key={loc.id} onClick={() => handleSelect(loc)} className="w-full text-left p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-sm">
                        {loc.name}
                    </button>
                ))}
            </div>
        </div>
    );
};

const DestinationSearch: React.FC<{ onSelectionChange: (stations: Station[]) => void }> = ({ onSelectionChange }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Station[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedStations, setSelectedStations] = useState<Station[]>([]);
    const debouncedQuery = useDebounce(query, 300);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchStations = async () => {
            if (debouncedQuery.length < 2) {
                setResults([]);
                setIsOpen(false);
                return;
            }
            setLoading(true);
            try {
                const response = await fetch(`https://v6.db.transport.rest/locations?query=${encodeURIComponent(debouncedQuery)}&results=5&poi=false&stations=true`);
                const data = await response.json();
                setResults(data || []);
                setIsOpen(true);
            } catch (error) {
                console.error("Failed to search stations", error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        };
        fetchStations();
    }, [debouncedQuery]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (station: Station) => {
        if (!selectedStations.some(s => s.id === station.id)) {
            const newSelection = [...selectedStations, station];
            setSelectedStations(newSelection);
            onSelectionChange(newSelection);
        }
        setQuery('');
        setIsOpen(false);
        setResults([]);
    };

    const handleRemove = (stationId: string) => {
        const newSelection = selectedStations.filter(s => s.id !== stationId);
        setSelectedStations(newSelection);
        onSelectionChange(newSelection);
    };

    return (
        <div className="relative" ref={searchRef}>
            <div className="relative flex flex-wrap items-center gap-1.5 bg-black/5 dark:bg-white/10 rounded-md p-1 border-0 focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand-primary">
                {selectedStations.map(station => (
                    <span key={station.id} className="flex items-center bg-brand-primary/20 text-brand-primary dark:text-white/90 dark:bg-brand-primary/50 text-xs font-semibold px-2 py-1 rounded">
                        {station.name}
                        <button onClick={() => handleRemove(station.id)} className="ml-1.5 -mr-0.5 text-brand-primary/70 hover:text-brand-primary dark:text-white/70 dark:hover:text-white focus:outline-none" aria-label={`Remove ${station.name}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={selectedStations.length === 0 ? "To..." : "Add another..."}
                    className="flex-1 bg-transparent p-1 text-sm border-none focus:ring-0 min-w-[80px]"
                />
            </div>
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                    {loading && <div className="p-2 text-xs text-gray-500">Searching...</div>}
                    {!loading && results.length === 0 && debouncedQuery.length > 1 && <div className="p-2 text-xs text-gray-500">No stations found.</div>}
                    {results.map(station => (
                        <button key={station.id} onClick={() => handleSelect(station)} className="w-full text-left p-2 hover:bg-black/10 dark:hover:bg-white/10 text-sm">
                            {station.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};


const TrainsCard: React.FC = () => {
    const sourceStation = useLiveQuery(() => getPreference('trainStation', null), []);
    const [destinations, setDestinations] = useState<Station[]>([]);
    const { journeys, loading, error } = useJourneys(sourceStation, destinations);
    const [isEditingSource, setIsEditingSource] = useState(false);
    
    if (isEditingSource) {
        return (
            <GlassCard>
               <div className="flex justify-between items-center mb-4">
                   <h2 className="text-xl font-bold">Change Station</h2>
                   <button onClick={() => setIsEditingSource(false)} className="text-sm">Done</button>
               </div>
               <StationEditor onStationSet={() => setIsEditingSource(false)} />
            </GlassCard>
        );
    }

    const renderContent = () => {
        if (destinations.length === 0) {
            return <p className="text-center py-4 text-gray-500 dark:text-white/60">Select one or more destinations.</p>;
        }
        if (loading) {
            return Array.from({ length: 3 }).map((_, i) => <JourneySkeleton key={i} />);
        }
        if (error) {
            return (
                <div className="text-center py-4">
                    <p className="text-red-500">Could not load journey data.</p>
                    <p className="text-xs text-gray-500 dark:text-white/60">{error}</p>
                </div>
            );
        }
        if (journeys.length === 0) {
            return <p className="text-center py-4 text-gray-500 dark:text-white/60">No journeys found to selected destinations.</p>;
        }
        return journeys.map((j) => <JourneyItem key={j.id} journey={j} />);
    };

    return (
        <GlassCard>
            <div className="flex justify-between items-center mb-1">
                <h2 className="text-sm font-bold truncate pr-2">From: {sourceStation?.name || '...'}</h2>
                 <button onClick={() => setIsEditingSource(true)} className="text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white flex-shrink-0">
                    <Settings className="w-4 h-4" />
                 </button>
            </div>
            <div className="mb-3">
                 <DestinationSearch onSelectionChange={setDestinations} />
            </div>
            <h3 className="text-lg font-bold mb-2">Next Departures</h3>
            <div className="max-h-60 overflow-y-auto pr-2">
                {renderContent()}
            </div>
        </GlassCard>
    );
};

export default TrainsCard;