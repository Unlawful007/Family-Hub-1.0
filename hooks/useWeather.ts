import { useState, useEffect } from 'react';
import { AQIData, SunriseSunsetData } from '../types';

export interface CurrentWeather {
    temperature: number;
    apparentTemperature: number;
    weatherDescription: string;
    weatherCode: number;
    isDay: boolean;
}

export interface DailyForecast {
    day: string;
    high: number;
    low: number;
    weatherDescription: string;
}

interface Location {
    latitude: number;
    longitude: number;
}

const WMO_CODES: { [key: number]: string } = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    66: 'Light freezing rain', 67: 'Heavy freezing rain',
    71: 'Slight snow fall', 73: 'Moderate snow fall', 75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
    85: 'Slight snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
};

const getAqiInfo = (aqi: number): Omit<AQIData, 'aqi'> => {
    if (aqi <= 50) return { level: 'Good', advice: 'Air quality is excellent.' };
    if (aqi <= 100) return { level: 'Moderate', advice: 'Air quality is acceptable.' };
    if (aqi <= 150) return { level: 'Unhealthy for Sensitive Groups', advice: 'Sensitive groups may experience health effects.' };
    if (aqi <= 200) return { level: 'Unhealthy', advice: 'Everyone may begin to experience health effects.' };
    if (aqi <= 300) return { level: 'Very Unhealthy', advice: 'Health alert: everyone may experience more serious health effects.' };
    return { level: 'Hazardous', advice: 'Health warnings of emergency conditions.' };
};

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

const useWeather = (location: Location | null) => {
    const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
    const [forecast, setForecast] = useState<DailyForecast[]>([]);
    const [aqiData, setAqiData] = useState<AQIData | null>(null);
    const [sunriseSunset, setSunriseSunset] = useState<SunriseSunsetData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!location) {
            setLoading(false);
            return;
        }

        const fetchWeather = async () => {
            setLoading(true);
            setError(null);
            
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,weather_code,apparent_temperature,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`;
            const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${location.latitude}&longitude=${location.longitude}&hourly=european_aqi`;

            try {
                const [weatherResponse, aqiResponse] = await Promise.all([
                    fetch(weatherUrl),
                    fetch(aqiUrl)
                ]);

                if (!weatherResponse.ok) throw new Error(`Weather data fetch failed: ${weatherResponse.statusText}`);
                // AQI might fail, but we can still show weather
                
                const weatherData = await weatherResponse.json();
                
                if (!weatherData.current || !weatherData.daily) throw new Error('Invalid weather data format.');

                setCurrentWeather({
                    temperature: Math.round(weatherData.current.temperature_2m),
                    apparentTemperature: Math.round(weatherData.current.apparent_temperature),
                    weatherDescription: WMO_CODES[weatherData.current.weather_code] || 'Unknown',
                    weatherCode: weatherData.current.weather_code,
                    isDay: weatherData.current.is_day === 1,
                });
                
                const dailyForecast: DailyForecast[] = weatherData.daily.time.slice(0, 7).map((dateStr: string, index: number) => ({
                    day: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
                    high: Math.round(weatherData.daily.temperature_2m_max[index]),
                    low: Math.round(weatherData.daily.temperature_2m_min[index]),
                    weatherDescription: WMO_CODES[weatherData.daily.weather_code[index]] || 'Unknown',
                }));
                setForecast(dailyForecast);
                
                // Process Sunrise/Sunset
                if (weatherData.daily?.sunrise?.[0] && weatherData.daily?.sunset?.[0]) {
                    setSunriseSunset({
                        sunrise: formatTime(weatherData.daily.sunrise[0]),
                        sunset: formatTime(weatherData.daily.sunset[0]),
                    });
                }
                
                // Process AQI separately
                if (aqiResponse.ok) {
                    const aqiDataResponse = await aqiResponse.json();
                    if (aqiDataResponse.hourly?.european_aqi) {
                        const now = new Date();
                        let currentHourIndex = -1;
                        // Find the latest hour that is not in the future
                        for (let i = aqiDataResponse.hourly.time.length - 1; i >= 0; i--) {
                            if (new Date(aqiDataResponse.hourly.time[i]) <= now) {
                                currentHourIndex = i;
                                break;
                            }
                        }

                        const currentAqi = currentHourIndex !== -1 ? aqiDataResponse.hourly.european_aqi[currentHourIndex] : null;
                        
                        if (currentAqi !== null && currentAqi !== undefined) {
                            setAqiData({
                                aqi: Math.round(currentAqi),
                                ...getAqiInfo(Math.round(currentAqi))
                            });
                        } else {
                            setAqiData(null);
                        }
                    }
                } else {
                    console.warn("Could not fetch AQI data:", aqiResponse.statusText);
                    setAqiData(null);
                }

            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, [location]);

    return { currentWeather, forecast, aqiData, sunriseSunset, loading, error };
};

export default useWeather;