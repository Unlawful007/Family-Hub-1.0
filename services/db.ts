import Dexie, { type Table } from 'dexie';
import { Member, Event, Task, CalendarSource, Preference, TaskSource, CalendarViewType, VoiceMessage, Integration } from '../types';
import { synciCalSource, removeEventsFromSource } from './ical';

export const db = new Dexie('familyHubDatabase') as Dexie & {
  members: Table<Member, number>;
  events: Table<Event, number>;
  tasks: Table<Task, number>;
  calendar_sources: Table<CalendarSource, number>;
  preferences: Table<Preference, string>;
  task_sources: Table<TaskSource, number>;
  voiceMessages: Table<VoiceMessage, number>;
  integrations: Table<Integration, string>;
};

// V1 Schema
db.version(1).stores({
  members: '++id, &initials',
  events: '++id, start_time, member_id',
  tasks: '++id, is_completed',
});

// V2 Schema - Add calendar sources, update events and tasks
db.version(2).stores({
  members: '++id, &initials',
  events: '++id, start_time, member_id',
  tasks: '++id, is_completed, due_date, member_id',
  calendar_sources: '++id, type, member_id',
});

// V3 Schema - Add preferences and task sources
db.version(3).stores({
  members: '++id, &initials',
  events: '++id, start_time, member_id',
  tasks: '++id, is_completed, due_date, member_id',
  calendar_sources: '++id, type, member_id',
  preferences: 'key', // key is the primary key
  task_sources: '++id, type',
});

// V4 Schema - Add source_id to events for iCal integration
db.version(4).stores({
  events: '++id, start_time, member_id, source_id',
});

// V5 Schema - Add name to calendar sources
db.version(5).stores({
  calendar_sources: '++id, type, member_id, name',
});

// V6 Schema - Add voice messages table and notification preferences
db.version(6).stores({
  voiceMessages: '++id, timestamp'
}).upgrade(async (tx) => {
  // This upgrade function is needed to add new tables in Dexie 3+
  // We will also add new default preferences here
  await tx.table('preferences').put({ key: 'notificationsEnabled', value: true });
  await tx.table('preferences').put({ key: 'notificationTime', value: 15 }); // 15 minutes before
  await tx.table('preferences').delete('widgetLayouts'); // Clean up old preference
});

// V7 Schema - Add integrations table for smart home devices
db.version(7).stores({
  integrations: 'key', // key is the primary key
}).upgrade(async (tx) => {
  await tx.table('integrations').put({ key: 'google_assistant', isConnected: false });
});


async function initializePreferences() {
  const defaultPreferences: Preference[] = [
    { key: 'theme', value: 'system' },
    { key: 'defaultView', value: CalendarViewType.Month },
    { key: 'showWeather', value: true },
    { key: 'showTrains', value: true },
    { key: 'showTasks', value: true },
    { key: 'showTasksOnCalendar', value: true },
    { key: 'weatherLocation', value: { name: 'Amsterdam', latitude: 52.37, longitude: 4.89 } },
    { key: 'trainStation', value: { name: 'Eindhoven Centraal', id: '8400180' } },
    { key: 'notificationsEnabled', value: true },
    { key: 'notificationTime', value: 15 },
  ];
  
  await db.transaction('rw', db.preferences, async () => {
    for (const pref of defaultPreferences) {
      const existing = await db.preferences.get(pref.key);
      if (!existing) {
        await db.preferences.put(pref);
      }
    }
  });
}

async function initializeIntegrations() {
  const defaultIntegrations: Integration[] = [
    { key: 'google_assistant', isConnected: false },
  ];
  
  await db.transaction('rw', db.integrations, async () => {
    for (const integration of defaultIntegrations) {
      const existing = await db.integrations.get(integration.key);
      if (!existing) {
        await db.integrations.put(integration);
      }
    }
  });
}

export async function seedDatabase() {
  await initializePreferences();
  await initializeIntegrations();
  
  const memberCount = await db.members.count();
  if (memberCount > 0) {
    console.log("Database already seeded.");
    return;
  }
  
  console.log("Seeding database...");

  const members: Omit<Member, 'id'>[] = [
    { name: 'AJ', initials: 'AJ', color_hex: '#3b82f6', is_home: true },
    { name: 'TJ', initials: 'TJ', color_hex: '#ec4899', is_home: false },
  ];
  
  const [ajId, tjId] = await db.transaction('rw', db.members, async () => {
    const aj = await db.members.add(members[0]);
    const tj = await db.members.add(members[1]);
    return [aj, tj];
  });

  const today = new Date();
  const events: Event[] = [
    { title: 'Team Meeting', description: 'Weekly sync up', start_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0), end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0), member_id: ajId as number, is_all_day: false },
    { title: 'Design Review', start_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0), end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 30), member_id: ajId as number, is_all_day: false },
    { title: 'Yoga Class', start_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18, 0), end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 19, 0), member_id: tjId as number, is_all_day: false },
    { title: 'Doctor Appointment', start_time: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 9, 30), end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 10, 0), member_id: tjId as number, is_all_day: false },
    { title: 'Project Deadline', start_time: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5), end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5), member_id: ajId as number, is_all_day: true },
  ];
  await db.events.bulkAdd(events);

  const tasks: Task[] = [
    { title: 'Water the plants', is_completed: false, member_id: ajId as number },
    { title: 'Take out the recycling', is_completed: false, member_id: tjId as number, due_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1) },
    { title: 'Buy groceries for dinner', is_completed: true },
    { title: 'Schedule dentist appointment', is_completed: false, due_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3) },
  ];
  await db.tasks.bulkAdd(tasks);

  console.log("Database seeding complete.");
}

// Preference Management
export const getPreference = async <T>(key: string, defaultValue: T): Promise<T> => {
  const pref = await db.preferences.get(key);
  return pref ? (pref.value as T) : defaultValue;
};

export const setPreference = async (key: string, value: any) => {
  await db.preferences.put({ key, value });
};


// Event Management
export const addEvent = async (event: Omit<Event, 'id'>) => {
  await db.events.add(event as Event);
};

export const addEvents = async (events: Omit<Event, 'id'>[]) => {
  await db.events.bulkAdd(events as Event[]);
};

export const deleteEvent = async (id: number) => {
  const event = await db.events.get(id);
  if (!event) {
    throw new Error("Item not found. It may have been deleted already.");
  }
  await db.events.delete(id);
};

// Task Management
export const addTask = async (task: Omit<Task, 'id' | 'is_completed'>) => {
  if (!task.title.trim()) return;
  const newTask: Omit<Task, 'id'> = { ...task, is_completed: false };
  await db.tasks.add(newTask);
};

export const toggleTaskCompletion = async (task: Task) => {
  if (task.id) {
    await db.tasks.update(task.id, { is_completed: !task.is_completed });
  }
};

export const deleteTask = async (id: number) => {
  const task = await db.tasks.get(id);
  if (!task) {
    throw new Error("Item not found. It may have been deleted already.");
  }
  await db.tasks.delete(id);
};

// Member Management
export const addMember = async (member: Omit<Member, 'id'>): Promise<number> => {
  return db.members.add(member);
};

export const updateMember = async (id: number, updates: Partial<Member>) => {
  await db.members.update(id, updates);
};

export const deleteMember = async (id: number) => {
  // Also unassign tasks and events from this member
  await db.transaction('rw', db.tasks, db.events, db.members, async () => {
    await db.tasks.where({ member_id: id }).modify({ member_id: undefined });
    await db.events.where({ member_id: id }).modify({ member_id: undefined });
    await db.members.delete(id);
  });
};

export const togglePresence = async (member: Member) => {
  if (member.id) {
    await db.members.update(member.id, { is_home: !member.is_home });
  }
};

// Calendar Source Management
export const addCalendarSource = async (source: Omit<CalendarSource, 'id'>): Promise<number> => {
  const id = await db.calendar_sources.add(source as CalendarSource);
  if (source.type === 'ical') {
    const calendarName = await synciCalSource({ ...source, id });
    if (calendarName) {
      await db.calendar_sources.update(id, { name: calendarName });
    }
  }
  return id;
}

export const deleteCalendarSource = async (id: number) => {
  await removeEventsFromSource(id);
  await db.calendar_sources.delete(id);
}

export const refreshAlliCalSources = async () => {
  const iCalSources = await db.calendar_sources.where({ type: 'ical' }).toArray();
  console.log(`Found ${iCalSources.length} iCal source(s) to refresh.`);
  for (const source of iCalSources) {
    try {
      console.log(`Refreshing source: ${source.name || source.url}`);
      await synciCalSource(source);
    } catch (error) {
      console.error(`Failed to refresh iCal source ${source.id} (${source.url}):`, error);
      // Continue to the next source even if one fails
    }
  }
};

// Task Source Management
export const addTaskSource = async (source: Omit<TaskSource, 'id'>) => {
  await db.task_sources.add(source as TaskSource);
}

export const deleteTaskSource = async (id: number) => {
  await db.task_sources.delete(id);
}

// Voice Message Management
export const addVoiceMessage = async (message: Omit<VoiceMessage, 'id' | 'timestamp'>) => {
    return await db.voiceMessages.add({
        ...message,
        timestamp: new Date()
    } as VoiceMessage);
};

export const deleteVoiceMessage = async (id: number) => {
    await db.voiceMessages.delete(id);
};