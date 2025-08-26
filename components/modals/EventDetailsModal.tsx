import React from 'react';
import { CalendarItem, Event, Task } from '../../types';
import { Trash2, Circle, CheckSquare } from '../icons/LucideIcons';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CalendarItem | null;
  onDelete: (item: CalendarItem) => void;
  error: string | null;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ isOpen, onClose, item, onDelete, error }) => {
  if (!isOpen || !item) return null;

  const isEvent = item.type === 'event';
  const data = item.data as Event & Task;

  const timeFormat: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
  const dateFormat: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };

  // Check if this item should be deletable
  const isDeletable =
    item.type === 'task' || // Always allow tasks
    !item.source ||         // Local events (no source)
    item.source?.type !== 'ical'; // Any non-ical source events

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-200/90 dark:bg-gray-900/90 border border-gray-300 dark:border-white/20 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col outline-none"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 flex justify-between items-start border-b border-gray-300 dark:border-white/20">
          <div className="flex items-start space-x-3">
            <div
              className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1"
              style={{ backgroundColor: `${item.member?.color_hex}40` }}
            >
              {isEvent ? (
                <Circle className="w-4 h-4" style={{ color: item.member?.color_hex || '#9ca3af' }} />
              ) : (
                <CheckSquare className="w-4 h-4" style={{ color: item.member?.color_hex || '#9ca3af' }} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{data.title}</h2>
              <p className="text-sm text-gray-600 dark:text-white/70">
                {new Date(item.date).toLocaleDateString([], dateFormat)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-1 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </header>

        <main className="p-6 space-y-4 text-gray-800 dark:text-white/90">
          {isEvent ? (
            <>
              <p>
                <strong>Time:</strong>{' '}
                {data.is_all_day
                  ? 'All Day'
                  : `${data.start_time.toLocaleTimeString([], timeFormat)} - ${data.end_time.toLocaleTimeString([], timeFormat)}`}
              </p>
              {data.description && (
                <p className="whitespace-pre-wrap">
                  <strong>Description:</strong> {data.description}
                </p>
              )}
            </>
          ) : (
            <>
              {data.due_date && (
                <p>
                  <strong>Due:</strong> {data.due_date.toLocaleTimeString([], timeFormat)}
                </p>
              )}
              <p>
                <strong>Status:</strong> {data.is_completed ? 'Completed' : 'Pending'}
              </p>
            </>
          )}

          {item.member && <p><strong>Assigned to:</strong> {item.member.name}</p>}
          {item.source && <p><strong>Source:</strong> {item.source.name || 'Imported Calendar'}</p>}
        </main>

        <footer className="p-4 flex justify-between items-center border-t border-gray-300 dark:border-white/20">
          {error && <p className="text-sm text-red-500 flex-1 mr-4">{error}</p>}
          <div className="flex-1 flex justify-end">
            {isDeletable && (
              <button
                onClick={() => onDelete(item)}
                className="flex items-center space-x-2 px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors font-semibold text-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default EventDetailsModal;