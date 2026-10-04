const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');

// Cached connection for performance
let cachedClient = null;

// In-memory cache for events to eliminate redundant MongoDB Atlas queries
let inMemoryEvents = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const client = await MongoClient.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  cachedClient = client;
  return client;
}

// Middleware to verify JWT token
function verifyAdmin(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  
  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    console.error('JWT_SECRET environment variable is not set.');
    return false;
  }
  
  try {
    const decoded = jwt.verify(token, jwtSecret);
    return decoded && decoded.admin === true;
  } catch (err) {
    return false;
  }
}

// Initialize Google Calendar Auth
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
  } catch(err) {
    console.error('Google Auth Error', err);
    return null;
  }
};

// Clean text and remove markdown asterisks/stars and headings
function cleanTitle(title) {
  if (!title) return '';
  return String(title).replace(/[\*_~#]/g, '').trim();
}

// Clean and format description specifically for Google Calendar
// Removes raw markdown symbols (like * and **) while preserving clean bullets and structure
function formatGoogleCalendarDescription(desc, metadata = {}) {
  if (!desc) desc = '';
  
  const lines = String(desc).split(/\r?\n/);
  const cleanedLines = lines.map(line => {
    let l = line.trim();
    if (!l) return '';
    
    // Replace leading markdown bullets (*, -, +) with clean unicode bullet •
    l = l.replace(/^[\*\-\+•]\s*/, '• ');
    
    // Remove bold and italic markdown asterisks and underscores:
    // e.g. ***text***, **text**, *text*, ___text___, __text__, _text_
    l = l.replace(/\*{2,3}(.+?)\*{2,3}/g, '$1');
    l = l.replace(/_{2,3}(.+?)_{2,3}/g, '$1');
    l = l.replace(/(^|[^\*])\*([^\*]+?)\*([^\*]|$)/g, '$1$2$3');
    l = l.replace(/(^|[^_])_([^_]+?)_([^_]|$)/g, '$1$2$3');
    
    // Remove any remaining stray asterisks
    l = l.replace(/\*{1,3}/g, '');
    
    // Convert markdown links [text](url) -> text: url
    l = l.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '$1: $2');
    
    // Remove markdown header markers (e.g. ### Header)
    l = l.replace(/^#{1,6}\s+/, '');
    
    return l;
  });

  let result = cleanedLines.join('\n').trim();

  // Append clean metadata
  const metaParts = [];
  if (metadata.type) {
    const typeLabel = metadata.type === 'exams' ? 'exams' : (metadata.type === 'holidays' ? 'holidays' : metadata.type);
    metaParts.push(`Type: ${typeLabel}`);
  }
  if (metadata.mode) {
    metaParts.push(`Mode: ${metadata.mode}`);
  }
  if (metadata.location) {
    metaParts.push(`Location: ${metadata.location}`);
  }
  if (metadata.studentType) {
    metaParts.push(`Target: ${metadata.studentType}`);
  }

  if (metaParts.length > 0) {
    result += (result ? '\n\n' : '') + metaParts.join('\n');
  }

  return result;
}

module.exports = async function (req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const client = await connectToDatabase();
    const dbName = process.env.DB_NAME || 'vtu_database';
    const db = client.db(dbName);
    const collection = db.collection('calendar_events');

    // GET /api/events - Publicly fetch all events
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      
      const now = Date.now();
      if (inMemoryEvents && (now - lastCacheTime) < CACHE_TTL_MS) {
        return res.status(200).json(inMemoryEvents);
      }

      const events = await collection.find({}).toArray();
      // Remove MongoDB internal _id before sending to frontend
      const cleanedEvents = events.map(ev => {
        delete ev._id;
        return ev;
      });

      inMemoryEvents = cleanedEvents;
      lastCacheTime = now;
      return res.status(200).json(cleanedEvents);
    }

    // Require authentication for POST, PUT, DELETE
    if (!verifyAdmin(req)) {
      return res.status(401).json({ detail: 'Unauthorized. Invalid or missing admin token.' });
    }

    // POST /api/events - Create new event or handle admin actions
    if (req.method === 'POST') {
      // Optional admin action: resync existing Google Calendar events with clean descriptions
      if (req.body && req.body.action === 'resync_gcal') {
        const calendarId = process.env.GOOGLE_CALENDAR_ID;
        const auth = getGoogleAuth();
        if (!auth || !calendarId) {
          return res.status(400).json({ detail: 'Google Calendar credentials not configured.' });
        }
        try {
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
          return res.status(200).json({ detail: `Successfully updated ${updatedCount} Google Calendar events with clean descriptions.` });
        } catch (err) {
          console.error("Google Calendar Resync Error:", err);
          return res.status(500).json({ detail: 'Failed to resync Google Calendar events.' });
        }
      }

      const { id, title, type, mode, location, studentType, subtypes, date, desc } = req.body || {};
      
      // Strict type checking to prevent NoSQL injection
      if (typeof id !== 'number' || typeof title !== 'string' || typeof type !== 'string' || typeof date !== 'string' || typeof desc !== 'string') {
        return res.status(400).json({ detail: 'Invalid input format.' });
      }

      let googleEventId = null;
      const calendarId = process.env.GOOGLE_CALENDAR_ID;
      const auth = getGoogleAuth();
      const isTbd = date.trim().toUpperCase() === 'TBD';
      
      if (auth && calendarId && !isTbd) {
        try {
          const calendar = google.calendar({ version: 'v3', auth });
          const eventDate = new Date(date);
          const nextDay = new Date(eventDate);
          nextDay.setDate(nextDay.getDate() + 1);
          const nextDayStr = nextDay.toISOString().split('T')[0];
          
          const gCalEvent = {
            summary: cleanTitle(title),
            description: formatGoogleCalendarDescription(desc, {
              type,
              mode,
              location,
              studentType
            }),
            start: { date: date }, // all-day event format
            end: { date: nextDayStr }, // exclusive end date
          };
          
          const response = await calendar.events.insert({
            calendarId: calendarId,
            resource: gCalEvent,
          });
          googleEventId = response.data.id;
        } catch (err) {
          console.error("Google Calendar Insert Error:", err);
        }
      }

      const newEvent = {
        id: Number(id), // Force number type
        title: String(title).trim(),
        type: String(type).trim(),
        mode: mode ? String(mode).trim() : null,
        location: location ? String(location).trim() : null,
        studentType: studentType ? String(studentType).trim() : null,
        subtypes: Array.isArray(subtypes) ? subtypes.map(s => String(s).trim()) : [],
        date: isTbd ? 'TBD' : String(date).trim(),
        desc: String(desc).trim(),
        googleEventId: googleEventId
      };

      await collection.insertOne(newEvent);
      inMemoryEvents = null;
      lastCacheTime = 0;
      return res.status(201).json({ detail: 'Event created.' });
    }

    // PUT /api/events - Update existing event
    if (req.method === 'PUT') {
      const { id, title, type, mode, location, studentType, subtypes, date, desc } = req.body || {};
      
      if (typeof id !== 'number') {
        return res.status(400).json({ detail: 'Invalid event ID.' });
      }

      // Query by ID (force Number to prevent injection passing objects like {$ne: null})
      const query = { id: Number(id) };
      const existingEvent = await collection.findOne(query);

      const isTbd = date ? date.trim().toUpperCase() === 'TBD' : false;

      const updatedFields = {
        title: String(title).trim(),
        type: String(type).trim(),
        mode: mode ? String(mode).trim() : null,
        location: location ? String(location).trim() : null,
        studentType: studentType ? String(studentType).trim() : null,
        subtypes: Array.isArray(subtypes) ? subtypes.map(s => String(s).trim()) : [],
        date: isTbd ? 'TBD' : String(date).trim(),
        desc: String(desc).trim()
      };

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
              description: formatGoogleCalendarDescription(desc, {
                type,
                mode,
                location,
                studentType
              }),
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
              // Promoted from TBD to a scheduled date
              const response = await calendar.events.insert({
                calendarId: calendarId,
                resource: gCalEvent,
              });
              googleEventId = response.data.id;
              updatedFields.googleEventId = googleEventId;
            }
          } else if (googleEventId) {
            // Moved back to TBD from a scheduled date
            await calendar.events.delete({
              calendarId: calendarId,
              eventId: googleEventId,
            });
            updatedFields.googleEventId = null;
          }
        } catch (err) {
          console.error("Google Calendar Sync Error on Update:", err);
        }
      }

      await collection.updateOne(query, { $set: updatedFields });
      inMemoryEvents = null;
      lastCacheTime = 0;
      
      return res.status(200).json({ detail: 'Event updated.' });
    }

    // DELETE /api/events - Delete existing event
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      
      if (typeof id !== 'number') {
        return res.status(400).json({ detail: 'Invalid event ID.' });
      }

      const query = { id: Number(id) };
      const existingEvent = await collection.findOne(query);

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

      await collection.deleteOne(query);
      inMemoryEvents = null;
      lastCacheTime = 0;
      
      return res.status(200).json({ detail: 'Event deleted.' });
    }
    return res.status(405).json({ detail: 'Method not allowed' });

  } catch (error) {
    console.error('Database error in events API:', error);
    return res.status(500).json({ detail: 'Internal Server Error' });
  }
};
