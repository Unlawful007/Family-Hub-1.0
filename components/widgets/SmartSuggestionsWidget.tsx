import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getPreference } from '../../services/db';
import useWeather from '../../hooks/useWeather';
import { Wand2 } from '../icons/LucideIcons';

const SmartSuggestionsWidget: React.FC = () => {
    const tasks = useLiveQuery(() => db.tasks.where('is_completed').equals(0).toArray(), []);
    const location = useLiveQuery(() => getPreference('weatherLocation', null), []);
    const { forecast } = useWeather(location);
    const [dismissed, setDismissed] = useState<string[]>([]);
    
    const suggestions = useMemo(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowKey = tomorrow.toDateString();

        let generated: { id: string; text: string; }[] = [];

        // Suggestion 1: Recycling day
        const recyclingTask = tasks?.find(t => t.title.toLowerCase().includes('recycling'));
        if (recyclingTask && recyclingTask.due_date?.toDateString() === tomorrowKey) {
            generated.push({ id: 'recycling', text: "It’s recycling day tomorrow, don't forget to put the bins out tonight." });
        }
        
        // Suggestion 2: Rain forecast
        const tomorrowForecast = forecast[1];
        if (tomorrowForecast && (tomorrowForecast.weatherDescription.toLowerCase().includes('rain') || tomorrowForecast.weatherDescription.toLowerCase().includes('showers'))) {
             generated.push({ id: 'rain', text: `Rain is forecast for tomorrow. You might want to carry an umbrella.` });
        }
        
        // Suggestion 3: Generic task reminder
        const upcomingTasks = tasks?.filter(t => t.due_date && t.due_date > new Date() && t.due_date < tomorrow).length || 0;
        if(upcomingTasks > 1) {
             generated.push({ id: 'tasks', text: `You have ${upcomingTasks} tasks due soon. Stay on top of your to-do list!` });
        }

        return generated;

    }, [tasks, forecast]);

    const activeSuggestions = suggestions.filter(s => !dismissed.includes(s.id));
    
    if (activeSuggestions.length === 0) {
        return null; // Don't render if no suggestions
    }

    return (
        <div className="bg-brand-primary/20 dark:bg-brand-primary/30 border border-brand-primary/30 rounded-2xl p-4">
            <div className="flex items-center space-x-2 mb-2">
                <Wand2 className="w-5 h-5 text-brand-primary dark:text-white" />
                <h3 className="font-bold">Smart Suggestions</h3>
            </div>
            <div className="space-y-2">
            {activeSuggestions.map(suggestion => (
                <div key={suggestion.id} className="text-sm p-2 bg-black/5 dark:bg-white/10 rounded-md flex justify-between items-center">
                    <p className="flex-1 pr-2">{suggestion.text}</p>
                    <button onClick={() => setDismissed(d => [...d, suggestion.id])} className="text-xs font-semibold opacity-70 hover:opacity-100 flex-shrink-0">Dismiss</button>
                </div>
            ))}
            </div>
        </div>
    );
};

export default SmartSuggestionsWidget;