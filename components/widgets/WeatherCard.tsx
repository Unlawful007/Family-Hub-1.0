
import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getPreference, setPreference } from '../../services/db';
import useWeather from '../../hooks/useWeather';
import { Settings } from '../icons/LucideIcons';

const getWeatherIconUrl = (code: number, isDay: boolean = true): string => {
    const iconBasePath = 'https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/';
    
    if ([0, 1].includes(code)) return `${iconBasePath}${isDay ? 'day' : 'night'}.svg`; // Clear/Sunny
    if ([2].includes(code)) return `${iconBasePath}${isDay ? 'cloudy-day-3' : 'cloudy-night-3'}.svg`; // Partly cloudy
    if ([3].includes(code)) return `${iconBasePath}cloudy.svg`; // Overcast
    if ([45, 48].includes(code)) return `${iconBasePath}fog.svg`; // Fog
    if (code >= 51 && code <= 57) return `${iconBasePath}rainy-1.svg`; // Drizzle
    if (code >= 61 && code <= 67) return `${iconBasePath}rainy-6.svg`; // Rain
    if (code >= 80 && code <= 82) return `${iconBasePath}rainy-7.svg`; // Rain showers
    if (code >= 71 && code <= 77) return `${iconBasePath}snowy-6.svg`; // Snow
    if (code >= 85 && code <= 86) return `${iconBasePath}snowy-5.svg`; // Snow showers
    if ([95, 96, 99].includes(code)) return `${iconBasePath}thunder.svg`; // Thunderstorm
    
    return `${iconBasePath}weather.svg`; // Default
};


const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/60 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/20 rounded-2xl p-6 shadow-md ${className}`}>
        {children}
    </div>
);

const WeatherCardSkeleton: React.FC = () => (
    <GlassCard>
        <div className="animate-pulse">
            <div className="h-4 w-24 bg-gray-300 dark:bg-white/20 rounded-md mb-4"></div>
            <div className="flex justify-between items-start">
                <div>
                    <div className="h-20 w-28 bg-gray-300 dark:bg-white/20 rounded-md"></div>
                    <div className="h-6 w-36 bg-gray-300 dark:bg-white/20 rounded-md mt-2"></div>
                    <div className="h-4 w-24 bg-gray-300 dark:bg-white/20 rounded-md mt-1"></div>
                </div>
            </div>
        </div>
    </GlassCard>
);

const LocationEditor = ({ onLocationSet }: { onLocationSet: () => void }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (query.trim().length < 2) return;
        try {
            const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=en&format=json`);
            const data = await response.json();
            if (data.results) {
                setResults(data.results);
            } else {
                setError('No locations found.');
            }
        } catch (err) {
            setError('Failed to fetch locations.');
        }
    };

    const handleSelect = (location: any) => {
        setPreference('weatherLocation', { name: location.name, latitude: location.latitude, longitude: location.longitude });
        onLocationSet();
    };

    const handleUseCurrentLocation = () => {
        if (!window.isSecureContext) {
            setError('Using current location requires a secure connection (HTTPS).');
            return;
        }
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            return;
        }
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
             // Use reverse geocoding to get city name
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const data = await response.json();
            const name = data.city || data.locality || 'Current Location';

            setPreference('weatherLocation', { name, latitude, longitude });
            onLocationSet();
        }, () => {
            setError('Unable to retrieve your location. Please check browser permissions.');
        });
    }

    return (
        <div>
            <form onSubmit={handleSearch} className="flex space-x-2">
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search for a city..."
                    className="w-full bg-black/5 dark:bg-white/10 rounded-md px-3 py-1.5 text-sm border-0 focus:ring-2 focus:ring-inset focus:ring-brand-primary"
                />
                <button type="submit" className="px-3 py-1.5 bg-brand-primary rounded-md text-white text-sm">Search</button>
            </form>
             <button onClick={handleUseCurrentLocation} className="mt-2 text-sm text-center w-full hover:underline">Use Current Location</button>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            <div className="mt-2 space-y-1">
                {results.map(loc => (
                    <button key={loc.id} onClick={() => handleSelect(loc)} className="w-full text-left p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-sm">
                        {loc.name}, {loc.admin1 ? `${loc.admin1}, ` : ''}{loc.country_code}
                    </button>
                ))}
            </div>
        </div>
    )
}

const WeatherCard: React.FC = () => {
    const [isForecastVisible, setIsForecastVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const location = useLiveQuery(() => getPreference('weatherLocation', null), []);
    const { currentWeather, forecast, loading, error } = useWeather(location);
    
    const iconUrl = useMemo(() => {
        if (currentWeather) {
            return getWeatherIconUrl(currentWeather.weatherCode, currentWeather.isDay);
        }
        return null;
    }, [currentWeather]);

    if (!location) {
        return <WeatherCardSkeleton />;
    }
    
    if (isEditing) {
         return (
             <GlassCard>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Change Location</h2>
                    <button onClick={() => setIsEditing(false)} className="text-sm">Done</button>
                </div>
                <LocationEditor onLocationSet={() => setIsEditing(false)} />
             </GlassCard>
         )
    }

    if (loading) return <WeatherCardSkeleton />;

    if (error) {
        return (
            <GlassCard>
                <p className="text-center text-red-500">Could not load weather data.</p>
                <p className="text-center text-xs text-gray-500 dark:text-white/60">{error}</p>
                 <button onClick={() => setIsEditing(true)} className="mt-2 text-sm text-center w-full hover:underline">Change Location</button>
            </GlassCard>
        );
    }
    
    if (!currentWeather || forecast.length === 0) return null;

    const todayForecast = forecast[0];

    return (
        <GlassCard>
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold">{location.name}</h2>
                <button onClick={() => setIsEditing(true)} className="text-gray-600 dark:text-white/80 hover:text-black dark:hover:text-white">
                    <Settings className="w-4 h-4" />
                </button>
            </div>

            <div className="flex justify-between items-center">
                <div className="flex items-center -ml-4">
                    {iconUrl && <img src={iconUrl} alt={currentWeather.weatherDescription} className="w-24 h-24" />}
                    <p className="text-7xl font-bold">{currentWeather.temperature}°</p>
                </div>
                <div className="text-right text-sm">
                    <p>H: {todayForecast.high}°</p>
                    <p>L: {todayForecast.low}°</p>
                </div>
            </div>

            <div className="mt-1">
                <p className="text-xl">{currentWeather.weatherDescription}</p>
                <p className="text-sm text-gray-600 dark:text-white/80">Feels like {currentWeather.apparentTemperature}°</p>
            </div>
            
            <button onClick={() => setIsForecastVisible(!isForecastVisible)} className="mt-4 text-sm text-gray-700 dark:text-white/90 hover:underline">
                {isForecastVisible ? 'Hide' : 'Show'} 7-Day Forecast
            </button>
            {isForecastVisible && (
                <div className="mt-4 flex justify-between text-center">
                    {forecast.map(f => (
                        <div key={f.day}>
                            <p className="font-semibold text-sm">{f.day}</p>
                            <p className="text-lg mt-1">{f.high}°</p>
                            <p className="text-sm text-gray-500 dark:text-white/70">{f.low}°</p>
                        </div>
                    ))}
                </div>
            )}
        </GlassCard>
    );
};

export default WeatherCard;