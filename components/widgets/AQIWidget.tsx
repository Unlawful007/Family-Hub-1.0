import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getPreference } from '../../services/db';
import useWeather from '../../hooks/useWeather';
import { Wind } from '../icons/LucideIcons';

const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return 'bg-green-500';
    if (aqi <= 100) return 'bg-yellow-500';
    if (aqi <= 150) return 'bg-orange-500';
    if (aqi <= 200) return 'bg-red-500';
    if (aqi <= 300) return 'bg-purple-500';
    return 'bg-red-800';
};

const AQIWidget: React.FC = () => {
    const location = useLiveQuery(() => getPreference('weatherLocation', null), []);
    const { aqiData, loading } = useWeather(location);

    if (loading) {
        return <div className="h-full bg-gray-300 dark:bg-white/10 rounded-xl animate-pulse"></div>;
    }
    
    if (!aqiData) return null;

    const colorClass = getAqiColor(aqiData.aqi);

    return (
        <div className={`p-4 rounded-xl text-white ${colorClass}`}>
            <div className="flex items-center space-x-2">
                <Wind className="w-5 h-5" />
                <h3 className="font-bold">Air Quality</h3>
            </div>
            <p className="text-4xl font-bold mt-2">{aqiData.aqi}</p>
            <p className="text-sm font-semibold">{aqiData.level}</p>
        </div>
    );
};

export default AQIWidget;