import { google } from 'googleapis';
import { connectToDatabase } from '../config/db.js';

let inMemoryEvents = null;
let lastCacheTime = 0;

const getGoogleAuth = () => {
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : null,
  };

  if (!credentials.client_email || !credentials.private_key) {
    return null;
  }

  try {
    return new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/calendar.events']
    );
  } catch (err) {
    console.error('Google Auth Error', err);
    return null;
  }
};

function cleanTitle(title) {
  if (!title) return '';
  return String(title).replace(/[\*_~#]/g, '').trim();
}

function formatGoogleCalendarDescription(desc, metadata = {}) {
  if (!desc) desc = '';

  const lines = String(desc).split(/\r?\n/);
  const cleanedLines = lines.map(line => {
    let l = line.trim();
    if (!l) return '';

    l = l.replace(/^[\*\-\+•]\s*/, '• ');
    l = l.replace(/\*{2,3}(.+?)\*{2,3}/g, '$1');
    l = l.replace(/_{2,3}(.+?)_{2,3}/g, '$1');
    l = l.replace(/(^|[^\*])\*([^\*]+?)\*([^\*]|$)/g, '$1$2$3');
    l = l.replace(/(^|[^_])_([^_]+?)_([^_]|$)/g, '$1$2$3');
    l = l.replace(/\*{1,3}/g, '');
    l = l.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '$1: $2');
    l = l.replace(/^#{1,6}\s+/, '');

    return l;
  });

  let result = cleanedLines.join('\n').trim();

  const metaParts = [];
  if (metadata.type) metaParts.push(`Type: ${metadata.type}`);
  if (metadata.mode) metaParts.push(`Mode: ${metadata.mode}`);
  if (metadata.location) metaParts.push(`Location: ${metadata.location}`);
  if (metadata.studentType) metaParts.push(`Target: ${metadata.studentType}`);

  if (metaParts.length > 0) {
    result += (result ? '\n\n' : '') + metaParts.join('\n');
  }

  return result;
}

async function getCollection() {
  const client = await connectToDatabase();
  const dbName = process.env.DB_NAME || 'vtu_database';
  return client.db(dbName).collection('calendar_events');
}

export async function getAllEvents() {
  const collection = await getCollection();
  const events = await collection.find({}).sort({ id: 1 }).toArray();
  const cleanedEvents = events.map(ev => {
    delete ev._id;
    return ev;
  });
  inMemoryEvents = cleanedEvents;
  lastCacheTime = Date.now();
  return cleanedEvents;
}

export async function createEvent(eventData) {
  const { id, title, type, mode, location, studentType, subtypes, date, desc } = eventData || {};

  if (!id || typeof id !== 'number' || !title || typeof title !== 'string' || !type || typeof type !== 'string' || !date || typeof date !== 'string') {
    const error = new Error('Invalid input format.');
    error.statusCode = 400;
    throw error;
  }

  const isTbd = date.trim().toUpperCase() === 'TBD';
  const safeDesc = typeof desc === 'string' ? desc.trim() : (desc ? String(desc).trim() : '');

  const newEvent = {
    id: Number(id),
    title: String(title).trim(),
    type: String(type).trim(),
    mode: mode ? String(mode).trim() : null,
    location: location ? String(location).trim() : null,
    studentType: studentType ? String(studentType).trim() : null,
    subtypes: Array.isArray(subtypes) ? subtypes.map(s => String(s).trim()) : [],
    date: isTbd ? 'TBD' : String(date).trim(),
    desc: safeDesc,
    googleEventId: null
  };

  const collection = await getCollection();
  await collection.insertOne(newEvent);
  inMemoryEvents = null;
  lastCacheTime = 0;

  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const auth = getGoogleAuth();

  if (auth && calendarId && !isTbd) {
    try {
      const calendar = google.calendar({ version: 'v3', auth });
      const eventDate = new Date(date);
      const nextDay = new Date(eventDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];

      const gCalEvent = {
        summary: cleanTitle(title),
        description: formatGoogleCalendarDescription(safeDesc, { type, mode, location, studentType }),
        start: { date: date },
        end: { date: nextDayStr },
      };

      const response = await calendar.events.insert({
        calendarId: calendarId,
        resource: gCalEvent,
      });
      if (response.data && response.data.id) {
        await collection.updateOne({ id: Number(id) }, { $set: { googleEventId: response.data.id } });
      }
    } catch (err) {
      console.error("Google Calendar Insert Error:", err);
    }
  }

  return { detail: 'Event created.' };
}

export async function updateEvent(eventData) {
  const { id, title, type, mode, location, studentType, subtypes, date, desc } = eventData || {};

  if (typeof id !== 'number') {
    const error = new Error('Invalid event ID.');
    error.statusCode = 400;
    throw error;
  }

  const collection = await getCollection();
  const query = { id: Number(id) };
  const existingEvent = await collection.findOne(query);

  const isTbd = date ? date.trim().toUpperCase() === 'TBD' : false;
  const safeDesc = typeof desc === 'string' ? desc.trim() : (desc ? String(desc).trim() : '');

  const updatedFields = {
    title: String(title).trim(),
    type: String(type).trim(),
    mode: mode ? String(mode).trim() : null,
    location: location ? String(location).trim() : null,
    studentType: studentType ? String(studentType).trim() : null,
    subtypes: Array.isArray(subtypes) ? subtypes.map(s => String(s).trim()) : [],
    date: isTbd ? 'TBD' : String(date).trim(),
    desc: safeDesc
  };

  await collection.updateOne(query, { $set: updatedFields });
  inMemoryEvents = null;
  lastCacheTime = 0;

  let googleEventId = existingEvent?.googleEventId;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const auth = getGoogleAuth();

  if (auth && calendarId) {
    try {
      const calendar = google.calendar({ version: 'v3', auth });
      if (!isTbd) {
        const eventDate = new Date(date);
        const nextDay = new Date(eventDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().split('T')[0];

        const gCalEvent = {
          summary: cleanTitle(title),
          description: formatGoogleCalendarDescription(safeDesc, { type, mode, location, studentType }),
          start: { date: date },
          end: { date: nextDayStr },
        };

        if (googleEventId) {
          await calendar.events.update({
            calendarId: calendarId,
            eventId: googleEventId,
            resource: gCalEvent,
          });
        } else {
          const response = await calendar.events.insert({
            calendarId: calendarId,
            resource: gCalEvent,
          });
          if (response.data && response.data.id) {
            googleEventId = response.data.id;
            await collection.updateOne(query, { $set: { googleEventId } });
          }
        }
      } else if (googleEventId) {
        await calendar.events.delete({
          calendarId: calendarId,
          eventId: googleEventId,
        });
        await collection.updateOne(query, { $set: { googleEventId: null } });
      }
    } catch (err) {
      console.error("Google Calendar Sync Error on Update:", err);
    }
  }

  return { detail: 'Event updated.' };
}

export async function deleteEvent(id) {
  if (typeof id !== 'number') {
    const error = new Error('Invalid event ID.');
    error.statusCode = 400;
    throw error;
  }

  const collection = await getCollection();
  const query = { id: Number(id) };
  const existingEvent = await collection.findOne(query);

  await collection.deleteOne(query);
  inMemoryEvents = null;
  lastCacheTime = 0;

  const googleEventId = existingEvent?.googleEventId;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const auth = getGoogleAuth();

  if (googleEventId && auth && calendarId) {
    try {
      const calendar = google.calendar({ version: 'v3', auth });
      await calendar.events.delete({
        calendarId: calendarId,
        eventId: googleEventId,
      });
    } catch (err) {
      console.error("Google Calendar Delete Error:", err);
    }
  }

  return { detail: 'Event deleted.' };
}

export async function resyncGoogleCalendar() {
  const collection = await getCollection();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const auth = getGoogleAuth();
  if (!auth || !calendarId) {
    const error = new Error('Google Calendar credentials not configured.');
    error.statusCode = 400;
    throw error;
  }

  const calendar = google.calendar({ version: 'v3', auth });
  const eventsWithGCal = await collection.find({ googleEventId: { $ne: null } }).toArray();
  let updatedCount = 0;

  for (const ev of eventsWithGCal) {
    if (!ev.date || ev.date.trim().toUpperCase() === 'TBD') continue;
    try {
      const eventDate = new Date(ev.date);
      const nextDay = new Date(eventDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];

      const gCalEvent = {
        summary: cleanTitle(ev.title),
        description: formatGoogleCalendarDescription(ev.desc, {
          type: ev.type,
          mode: ev.mode,
          location: ev.location,
          studentType: ev.studentType
        }),
        start: { date: ev.date },
        end: { date: nextDayStr },
      };

      await calendar.events.update({
        calendarId: calendarId,
        eventId: ev.googleEventId,
        resource: gCalEvent,
      });
      updatedCount++;
    } catch (err) {
      console.error(`Failed to update gCal event ${ev.id}:`, err.message);
    }
  }

  return { detail: `Successfully updated ${updatedCount} Google Calendar events with clean descriptions.` };
}
