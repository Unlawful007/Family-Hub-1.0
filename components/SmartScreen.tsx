import React from 'react';
import SmartSuggestionsWidget from './widgets/SmartSuggestionsWidget';
import VoiceMessageBoardWidget from './widgets/VoiceMessageBoardWidget';
import LocationMapWidget from './widgets/LocationMapWidget';
import SevereWeatherWidget from './widgets/SevereWeatherWidget';
import AQIWidget from './widgets/AQIWidget';
import SunriseSunsetWidget from './widgets/SunriseSunsetWidget';

const SmartScreen: React.FC = () => {
    return (
        <div className="h-full w-full overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Left Column */}
                <div className="space-y-6">
                    <LocationMapWidget />
                    <VoiceMessageBoardWidget />
                </div>
                {/* Right Column */}
                <div className="space-y-6">
                    <SevereWeatherWidget />
                    <SmartSuggestionsWidget />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <AQIWidget />
                        <SunriseSunsetWidget />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartScreen;