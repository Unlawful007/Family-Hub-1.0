import ICAL from 'ical.js';
import { db } from './db';
import { CalendarSource, Event } from '../types';

async function fetchiCalData(url: string): Promise<string> {
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch iCal data. Status: ${response.status}`);
    }
    const text = await response.text();
    if (!text.includes('BEGIN:VCALENDAR')) {
        if (text.trim().toLowerCase().startsWith('<!doctype html') || text.trim().toLowerCase().startsWith('<html')) {
             throw new Error("The URL did not provide a valid iCal file. It might be an error page or require a login.");
        }
      throw new Error('Fetched content does not appear to be a valid iCalendar file.');
    }
    return text;
  } catch (error) {
    console.error('Error fetching iCal data:', error);
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Network request failed. This could be a temporary issue, a problem with the CORS proxy, or a network configuration (like a VPN or ad-blocker) blocking the request.');
    }
    throw error;
  }
}

/**
 * The core, robust iCal parser.
 * Takes iCal text and expands events within a date range.
 * @param icalText The raw iCal data as a string.
 * @returns An object with the calendar name and a list of event objects.
 */
function parseAndExpandiCal(icalText: string): { name: string; events: Omit<Event, 'id' | 'member_id' | 'source_id'>[] } {
  try {
    const jcalData = ICAL.parse(icalText);
    const vcalendar = new ICAL.Component(jcalData);
    const calendarName = vcalendar.getFirstPropertyValue('x-wr-calname')?.toString() || 'Unnamed Calendar';
    const vevents = vcalendar.getAllSubcomponents('vevent');

    const expandedEvents: Omit<Event, 'id' | 'member_id' | 'source_id'>[] = [];
    
    // Define the expansion window: 1 year in the past, 2 years in the future.
    const now = ICAL.Time.now();
    const startDate = now.clone();
    startDate.year -= 1;
    const endDate = now.clone();
    endDate.year += 2;

    for (const vevent of vevents) {
      try {
        const event = new ICAL.Event(vevent);

        if (event.isRecurring()) {
          const it = event.iterator();
          let next;
          while ((next = it.next()) && next.compare(endDate) <= 0) {
            if (next.compare(startDate) >= 0) {
              const occurrence = event.getOccurrenceDetails(next);
              expandedEvents.push({
                title: occurrence.item.summary.toString(),
                description: occurrence.item.description?.toString() || '',
                start_time: occurrence.startDate.toJSDate(),
                end_time: occurrence.endDate.toJSDate(),
                is_all_day: occurrence.startDate.isDate,
              });
            }
          }
        } else {
          // Handle non-recurring events within the window
          if (event.startDate.compare(endDate) <= 0 && event.endDate.compare(startDate) >= 0) {
            expandedEvents.push({
              title: event.summary.toString(),
              description: event.description?.toString() || '',
              start_time: event.startDate.toJSDate(),
              end_time: event.endDate.toJSDate(),
              is_all_day: event.startDate.isDate,
            });
          }
        }
      } catch (e) {
        // This will skip single malformed events instead of crashing the whole sync.
        console.warn('Skipping malformed iCal event during parse:', e);
      }
    }
    
    // Sort all events chronologically before returning
    expandedEvents.sort((a, b) => a.start_time.getTime() - b.start_time.getTime());

    return { name: calendarName, events: expandedEvents };
  } catch (error) {
    console.error('Failed to parse iCal data:', error);
    throw new Error('Failed to parse the iCal file. It might be malformed or invalid.');
  }
}


export async function previewiCalEvents(url: string): Promise<{name: string, events: Omit<Event, 'id'>[]}> {
  const icalText = await fetchiCalData(url);
  // The core function returns events without IDs, which is perfect for a preview.
  return parseAndExpandiCal(icalText);
}


export async function synciCalSource(source: CalendarSource): Promise<string | undefined> {
  if (!source.url || !source.id) {
    throw new Error('iCal source URL or ID is missing.');
  }

  const icalText = await fetchiCalData(source.url);
  const { name, events } = parseAndExpandiCal(icalText);

  // Add the source and member IDs to the parsed events
  const newEvents = events.map(event => ({
    ...event,
    member_id: source.member_id,
    source_id: source.id,
  }));

  // Perform the database transaction
  await db.transaction('rw', db.events, async () => {
    // Clear old events from this source first
    await db.events.where({ source_id: source.id }).delete();
    if (newEvents.length > 0) {
      await db.events.bulkAdd(newEvents as Event[]);
    }
  });

  return name;
}

export async function removeEventsFromSource(sourceId: number): Promise<void> {
  await db.events.where({ source_id: sourceId }).delete();
}
