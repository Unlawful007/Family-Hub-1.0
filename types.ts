export interface Member {
  id?: number;
  name: string;
  initials: string;
  color_hex: string;
  is_home?: boolean;
}

export interface Event {
  id?: number;
  title: string;
  description?: string;
  start_time: Date;
  end_time: Date;
  member_id?: number;
  is_all_day: boolean;
  source_id?: number;
}

export interface Task {
  id?: number;
  title: string;
  description?: string;
  is_completed: boolean;
  due_date?: Date;
  member_id?: number;
}

export interface CalendarSource {
  id?: number;
  name?: string;
  type: 'ical' | 'google' | 'outlook';
  url?: string;
  account_email?: string;
  member_id: number;
}

export interface TaskSource {
  id?: number;
  type: 'google' | 'microsoft';
  account_email: string;
}

export interface Preference {
  key: string;
  value: any;
}

export enum CalendarViewType {
  Day = 'Day',
  Week = 'Week',
  Month = 'Month',
  Agenda = 'Agenda',
}

// A unified type for displaying items on the calendar
export type CalendarItem = {
  type: 'event' | 'task';
  date: Date;
  data: Event | Task;
  member?: Member;
  source?: CalendarSource;
};

// Types for new Smart Hub widgets
export interface WidgetPosition {
  x: number;
  y: number;
}

export interface VoiceMessage {
  id?: number;
  timestamp: Date;
  memberId: number;
  audioBlob: Blob;
  memberName?: string;
  memberInitials?: string;
  memberColor?: string;
}

export interface AQIData {
  aqi: number;
  level: string;
  advice: string;
}

export interface SunriseSunsetData {
  sunrise: string;
  sunset: string;
}

export interface Integration {
  key: string;
  isConnected: boolean;
}
