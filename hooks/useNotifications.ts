import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getPreference } from '../services/db';

const useNotifications = () => {
  const events = useLiveQuery(() => db.events.toArray(), []);
  const notificationPrefs = useLiveQuery(() => db.preferences.where('key').startsWith('notification').toArray(), []);

  useEffect(() => {
    const checkEvents = async () => {
      if (!events || !notificationPrefs) return;

      const enabled = notificationPrefs.find(p => p.key === 'notificationsEnabled')?.value ?? false;
      if (!enabled) return;

      if (Notification.permission === 'denied') return;
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      
      if (Notification.permission === 'granted') {
        const now = new Date().getTime();
        const reminderMinutes = notificationPrefs.find(p => p.key === 'notificationTime')?.value ?? 15;

        for (const event of events) {
          const eventTime = new Date(event.start_time).getTime();
          const timeUntilEvent = eventTime - now;
          const reminderTimeMs = reminderMinutes * 60 * 1000;

          // Check if event is within the reminder window but not in the past
          if (timeUntilEvent > 0 && timeUntilEvent <= reminderTimeMs) {
            // Use a unique tag to prevent re-notifying for the same event
            const tag = `event-${event.id}`;
            const serviceWorker = await navigator.serviceWorker.getRegistration();
            const existingNotifications = serviceWorker ? await serviceWorker.getNotifications({ tag }) : [];

            if (existingNotifications.length === 0) {
                const title = event.title;
                const baseOptions: NotificationOptions = {
                    body: `Starts at ${new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                    icon: '/vite.svg', // Replace with a better icon
                    tag: tag,
                };
                
                if (serviceWorker) {
                    // The 'actions' property is specific to service worker notifications.
                    // We cast the extended options object to `any` to bypass TypeScript's default NotificationOptions type.
                    const optionsWithActions: any = {
                        ...baseOptions,
                        actions: [
                            { action: 'snooze', title: 'Snooze (5 min)' },
                            { action: 'dismiss', title: 'Dismiss' }
                        ]
                    };
                    serviceWorker.showNotification(title, optionsWithActions);
                } else {
                    // Fallback for environments without a service worker (actions are not supported)
                    new Notification(title, baseOptions);
                }
            }
          }
        }
      }
    };

    const intervalId = setInterval(checkEvents, 60 * 1000); // Check every minute
    return () => clearInterval(intervalId);
  }, [events, notificationPrefs]);

  // TODO: Add event listeners for notification actions (snooze, dismiss) in a service worker.
  // This is a simplified implementation.
};

export default useNotifications;