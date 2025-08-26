import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getPreference } from '../services/db';
import WeatherCard from './widgets/WeatherCard';
import TrainsCard from './widgets/TrainsCard';
import MemberFilterCard from './widgets/MemberFilterCard';
import TasksCard from './widgets/TasksCard';

interface SidebarProps {
  selectedMemberId: number | null;
  onSelectMember: (id: number | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedMemberId, onSelectMember }) => {
  const showWeather = useLiveQuery(() => getPreference('showWeather', true), []);
  const showTrains = useLiveQuery(() => getPreference('showTrains', true), []);
  const showTasks = useLiveQuery(() => getPreference('showTasks', true), []);

  return (
    <aside className="w-[380px] h-full flex-shrink-0 p-6">
      <div className="h-full flex flex-col space-y-6 overflow-y-auto pr-2">
        {showWeather && <WeatherCard />}
        {showTrains && <TrainsCard />}
        <MemberFilterCard selectedMemberId={selectedMemberId} onSelectMember={onSelectMember} />
        {showTasks && <TasksCard />}
      </div>
    </aside>
  );
};

export default Sidebar;