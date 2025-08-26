import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getPreference } from '../../services/db';
import useWeather from '../../hooks/useWeather';
import { Sunrise, Sunset } from '../icons/LucideIcons';

const SunriseSunsetWidget: React.FC = () => {
    const location = useLiveQuery(() => getPreference('weatherLocation', null), []);
    const { sunriseSunset, loading } = useWeather(location);

    if (loading) {
        return <div className="h-full bg-gray-300 dark:bg-white/10 rounded-xl animate-pulse"></div>;
    }

    if (!sunriseSunset) return null;

    return (
        <div className="p-4 rounded-xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/20">
            <div className="flex items-center justify-around h-full text-center">
                <div>
                    <Sunrise className="w-8 h-8 mx-auto text-yellow-500" />
                    <p className="mt-1 font-bold text-lg">{sunriseSunset.sunrise}</p>
                    <p className="text-xs text-gray-500 dark:text-white/60">Sunrise</p>
                </div>
                 <div>
                    <Sunset className="w-8 h-8 mx-auto text-orange-500" />
                    <p className="mt-1 font-bold text-lg">{sunriseSunset.sunset}</p>
                    <p className="text-xs text-gray-500 dark:text-white/60">Sunset</p>
                </div>
            </div>
        </div>
    );
};

export default SunriseSunsetWidget;