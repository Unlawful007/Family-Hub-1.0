
import React, { useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getPreference } from '../services/db';
import { CalendarViewType, Event, Member, Task, CalendarItem, CalendarSource } from '../types';
import { CheckSquare, Circle, Link } from './icons/LucideIcons';

interface CalendarViewProps {
  view: CalendarViewType;
  onDayClick: (date: Date) => void;
  viewDate: Date;
  memberFilterId: number | null;
  onEventClick: (item: CalendarItem) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const CalendarItemCard: React.FC<{ item: CalendarItem; onClick: (item: CalendarItem) => void }> = ({ item, onClick }) => {
  const timeFormat: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
  const isEvent = item.type === 'event';
  const data = item.data as Event & Task;

  const startTime = (data as Event).start_time?.toLocaleTimeString([], timeFormat);
  const endTime = (data as Event).end_time?.toLocaleTimeString([], timeFormat);
  
  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onClick(item); }}
      className="p-2 rounded-lg text-left text-xs bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors w-full cursor-pointer"
    >
      <div className="flex items-center space-x-2">
        {isEvent ? (
          <Circle className="w-2 h-2 flex-shrink-0" style={{ color: item.member?.color_hex || '#9ca3af', fill: item.member?.color_hex || '#9ca3af' }}/>
        ) : (
          <CheckSquare className="w-3 h-3 flex-shrink-0" style={{ color: item.member?.color_hex || '#9ca3af' }}/>
        )}
        <p className={`font-semibold truncate flex-1 ${data.is_completed ? 'line-through text-gray-500' : ''}`}>{data.title}</p>
        {item.source?.type === 'ical' && <Link className="w-3 h-3 text-gray-400 dark:text-white/40 flex-shrink-0" />}
        {item.member && (
          <span className="text-white/80 dark:text-white/70 px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap" style={{ backgroundColor: `${item.member.color_hex}80` }}>
            {item.member.initials}
          </span>
        )}
      </div>
      {isEvent && !(data as Event).is_all_day && <p className="text-gray-600 dark:text-white/60 pl-4">{startTime} - {endTime}</p>}
      {!isEvent && data.due_date && <p className="text-gray-600 dark:text-white/60 pl-4">Due {data.due_date.toLocaleTimeString([], timeFormat)}</p>}
    </div>
  );
};

const CalendarView: React.FC<CalendarViewProps> = ({ view, onDayClick, viewDate, memberFilterId, onEventClick, onPrevMonth, onNextMonth }) => {
  const events = useLiveQuery(() => db.events.toArray(), []);
  const tasks = useLiveQuery(() => db.tasks.where('due_date').above(new Date(0)).toArray(), []);
  const members = useLiveQuery(() => db.members.toArray(), []);
  const calendarSources = useLiveQuery(() => db.calendar_sources.toArray(), []);
  const showTasksOnCalendar = useLiveQuery(() => getPreference('showTasksOnCalendar', true), []);
  
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
      touchEnd.current = null;
      touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
      touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
      if (!touchStart.current || !touchEnd.current) return;
      const distance = touchStart.current - touchEnd.current;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;

      if (isLeftSwipe) {
          onNextMonth();
      } else if (isRightSwipe) {
          onPrevMonth();
      }

      touchStart.current = null;
      touchEnd.current = null;
  };

  const calendarItems = useMemo<CalendarItem[]>(() => {
    if (!events || !members || !calendarSources) return [];
    
    const memberMap = new Map(members.map(m => [m.id, m]));
    const sourceMap = new Map(calendarSources.map(s => [s.id, s]));

    const eventItems: CalendarItem[] = events.map(e => ({
      type: 'event',
      date: e.start_time,
      data: e,
      member: e.member_id ? memberMap.get(e.member_id) : undefined,
      source: e.source_id ? sourceMap.get(e.source_id) : undefined,
    }));
    
    const taskItems: CalendarItem[] = (showTasksOnCalendar && tasks) 
      ? tasks.filter(t => t.due_date).map(t => ({
          type: 'task',
          date: t.due_date!,
          data: t,
          member: t.member_id ? memberMap.get(t.member_id) : undefined
        }))
      : [];

    const allItems = [...eventItems, ...taskItems];

    const filteredItems = memberFilterId === null
      ? allItems
      : allItems.filter(item => item.data.member_id === memberFilterId);

    return filteredItems.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events, tasks, members, showTasksOnCalendar, calendarSources, memberFilterId]);

  const renderMonthView = () => {
    const today = new Date();
    const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    const daysInMonth = endOfMonth.getDate();
    const startDay = startOfMonth.getDay();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div 
        className="h-full flex flex-col bg-white/40 dark:bg-white/5 rounded-xl overflow-hidden shadow-lg"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="grid grid-cols-7 text-center text-sm font-semibold text-gray-500 dark:text-white/50">
          {weekDays.map(day => <div key={day} className="py-2 border-b border-r border-gray-200 dark:border-white/10">{day}</div>)}
        </div>
        <div className="grid grid-cols-7 grid-rows-5 flex-1">
          {Array.from({ length: startDay }).map((_, i) => <div key={`blank-${i}`} className="border-r border-b border-gray-200 dark:border-white/10"></div>)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
            const dayItems = calendarItems.filter(item => 
              item.date.getFullYear() === date.getFullYear() &&
              item.date.getMonth() === date.getMonth() &&
              item.date.getDate() === date.getDate()
            );
            const isToday = date.toDateString() === today.toDateString();
            const isCurrentMonth = viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();

            return (
              <div 
                key={day}
                onClick={() => onDayClick(date)}
                className="border-t border-r border-gray-200 dark:border-white/10 p-2 overflow-hidden flex flex-col cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <span className={`font-medium text-sm self-start ${isToday && isCurrentMonth ? 'bg-brand-primary text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>{day}</span>
                <div className="flex-1 overflow-y-auto space-y-1 mt-1 pr-1">
                   {dayItems.map(item => <CalendarItemCard key={`${item.type}-${item.data.id}`} item={item} onClick={onEventClick} />)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    const groupedItems = calendarItems.reduce((acc, item) => {
        const dateKey = item.date.toDateString();
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(item);
        return acc;
    }, {} as Record<string, CalendarItem[]>);

    return (
      <div className="p-4 bg-white/40 dark:bg-white/5 rounded-xl h-full overflow-y-auto">
        {Object.keys(groupedItems).length === 0 && <p className="text-center text-gray-500 dark:text-white/50">No upcoming items for this view.</p>}
        {Object.entries(groupedItems).map(([date, items]) => (
          <div key={date} className="mb-6">
            <h3 className="font-bold text-lg mb-2 sticky top-0 bg-gray-100/80 dark:bg-[#24243e]/80 backdrop-blur-sm py-1">
              {new Date(date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <div className="space-y-2">
              {items.map(item => <CalendarItemCard key={`${item.type}-${item.data.id}`} item={item} onClick={onEventClick} />)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDayWeekView = (days: number) => {
    const today = viewDate;
    const dates = Array.from({ length: days }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        return d;
    });

    return (
        <div className="h-full bg-white/40 dark:bg-white/5 rounded-xl overflow-hidden shadow-lg flex flex-col">
            <div className={`grid ${days === 1 ? 'grid-cols-1' : 'grid-cols-7'} text-center text-sm font-semibold text-gray-500 dark:text-white/50`}>
                {dates.map(date => (
                    <div key={date.toISOString()} className="py-2 border-b border-r border-gray-200 dark:border-white/10">
                        {date.toLocaleDateString([], { weekday: 'short' })} {date.getDate()}
                    </div>
                ))}
            </div>
            <div className={`grid ${days === 1 ? 'grid-cols-1' : 'grid-cols-7'} flex-1 overflow-hidden`}>
                {dates.map(date => {
                    const dayItems = calendarItems.filter(item => item.date.toDateString() === date.toDateString());
                    return (
                        <div key={date.toISOString()} onClick={() => onDayClick(date)} className="border-r border-gray-200 dark:border-white/10 p-2 overflow-y-auto cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                           <div className="space-y-2">
                            {dayItems.length > 0 ? (
                                dayItems.map(item => <CalendarItemCard key={`${item.type}-${item.data.id}`} item={item} onClick={onEventClick} />)
                            ) : (
                                <p className="text-center text-xs text-gray-400 dark:text-white/40 mt-4">No items scheduled</p>
                            )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  switch(view) {
    case CalendarViewType.Month: return renderMonthView();
    case CalendarViewType.Agenda: return renderAgendaView();
    case CalendarViewType.Day: return renderDayWeekView(1);
    case CalendarViewType.Week: return renderDayWeekView(7);
    default: return renderMonthView();
  }
};

export default CalendarView;