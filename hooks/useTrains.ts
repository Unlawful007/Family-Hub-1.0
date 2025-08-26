
import { useState, useEffect } from 'react';

export interface Departure {
    id: string;
    time: string;
    platform: string | null;
    direction: string;
    lineName: string;
    delay: number | null;
}

interface Station {
    id: string;
    name: string;
}

const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const useTrains = (station: Station | null) => {
    const [departures, setDepartures] = useState<Departure[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!station) {
            setLoading(false);
            return;
        }

        const fetchDepartures = async () => {
            // Don't set loading to true on interval refreshes for a smoother UX
            if (departures.length === 0) {
                setLoading(true);
            }
            setError(null);
            try {
                // Fetch top 5 results for the next 2 hours
                const response = await fetch(`https://v6.db.transport.rest/stops/${station.id}/departures?duration=120&results=5`);
                if (!response.ok) throw new Error('Failed to fetch train data.');
                const data = await response.json();

                if (!data.departures) {
                    setDepartures([]); // Set to empty array if no departures
                    return;
                };

                const formattedDepartures: Departure[] = data.departures.map((dep: any) => ({
                    id: dep.tripId,
                    time: formatTime(dep.when || dep.plannedWhen),
                    platform: dep.platform,
                    direction: dep.direction,
                    lineName: dep.line.name,
                    delay: dep.delay ? Math.round(dep.delay / 60) : null,
                }));
                setDepartures(formattedDepartures);

            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setLoading(false);
            }
        };

        fetchDepartures();
        const intervalId = setInterval(fetchDepartures, 60000); // Refresh every minute

        return () => clearInterval(intervalId);
    }, [station]);

    return { departures, loading, error };
};

export default useTrains;