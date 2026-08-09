const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');

// Cached connection for performance
let cachedClient = null;

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
      const events = await collection.find({}).toArray();
      // Remove MongoDB internal _id before sending to frontend
      const cleanedEvents = events.map(ev => {
        delete ev._id;
        return ev;
      });
      return res.status(200).json(cleanedEvents);
    }

    // POST /api/events - Handle invites (No JWT required) OR create new event (JWT required)
    if (req.method === 'POST') {
      const { action, id, email, title, type, mode, location, subtypes, date, desc } = req.body || {};
      
      // -- SINGLE EVENT EMAIL INVITE LOGIC --
      if (action === 'invite') {
        if (typeof id !== 'number' || !email || typeof email !== 'string') {
          return res.status(400).json({ detail: 'Invalid event ID or email.' });
        }
        
        const existingEvent = await collection.findOne({ id: Number(id) });
        if (!existingEvent || !existingEvent.googleEventId) {
          return res.status(404).json({ detail: 'Event not found or not synced to Google Calendar yet.' });
        }

        const calendarId = process.env.GOOGLE_CALENDAR_ID;
        const auth = getGoogleAuth();
        
        if (auth && calendarId) {
          try {
            const calendar = google.calendar({ version: 'v3', auth });
            
            // 1. Fetch current event to get existing attendees
            const currentEvent = await calendar.events.get({
              calendarId: calendarId,
              eventId: existingEvent.googleEventId,
            });
            
            let attendees = currentEvent.data.attendees || [];
            
            // 2. Check if already invited
            if (attendees.some(a => a.email.toLowerCase() === email.toLowerCase())) {
              return res.status(200).json({ detail: 'You are already subscribed to this event!' });
            }
            
            // 3. Append new email
            attendees.push({ email: email });
            
            // 4. Update the event with sendUpdates: 'all' to trigger email invite
            await calendar.events.patch({
              calendarId: calendarId,
              eventId: existingEvent.googleEventId,
              sendUpdates: 'all',
              resource: {
                attendees: attendees
              }
            });
            
            return res.status(200).json({ detail: 'Invite sent successfully!' });
          } catch (err) {
            console.error("Google Calendar Invite Error:", err);
            return res.status(500).json({ detail: 'Failed to send invite via Google Calendar.' });
          }
        }
        return res.status(500).json({ detail: 'Server misconfigured for Google Calendar API.' });
      }

      // -- EVENT CREATION LOGIC (Requires Admin) --
      if (!verifyAdmin(req)) {
        return res.status(401).json({ detail: 'Unauthorized. Invalid or missing admin token.' });
      }
      
      // Strict type checking to prevent NoSQL injection
      if (typeof id !== 'number' || typeof title !== 'string' || typeof type !== 'string' || typeof date !== 'string' || typeof desc !== 'string') {
        return res.status(400).json({ detail: 'Invalid input format.' });
      }

      let googleEventId = null;
      const calendarId = process.env.GOOGLE_CALENDAR_ID;
      const auth = getGoogleAuth();
      
      if (auth && calendarId) {
        try {
          const calendar = google.calendar({ version: 'v3', auth });
          const eventDate = new Date(date);
          const nextDay = new Date(eventDate);
          nextDay.setDate(nextDay.getDate() + 1);
          const nextDayStr = nextDay.toISOString().split('T')[0];
          
            const gCalEvent = {
              summary: title,
              description: desc + `\n\nType: ${type}` + (mode ? `\nMode: ${mode}` : '') + (location ? `\nLocation: ${location}` : ''),
              start: { date: date }, // all-day event format
              end: { date: nextDayStr }, // exclusive end date
              guestsCanModify: false,
              guestsCanInviteOthers: false,
              guestsCanSeeOtherGuests: false
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
        subtypes: Array.isArray(subtypes) ? subtypes.map(s => String(s).trim()) : [],
        date: String(date).trim(),
        desc: String(desc).trim(),
        googleEventId: googleEventId
      };

      await collection.insertOne(newEvent);
      return res.status(201).json({ detail: 'Event created.' });
    }

    // PUT /api/events - Update existing event
    if (req.method === 'PUT') {
      if (!verifyAdmin(req)) {
        return res.status(401).json({ detail: 'Unauthorized. Invalid or missing admin token.' });
      }
      const { id, title, type, mode, location, subtypes, date, desc } = req.body || {};
      
      if (typeof id !== 'number') {
        return res.status(400).json({ detail: 'Invalid event ID.' });
      }

      // Query by ID (force Number to prevent injection passing objects like {$ne: null})
      const query = { id: Number(id) };
      const existingEvent = await collection.findOne(query);

      const updatedFields = {
        title: String(title).trim(),
        type: String(type).trim(),
        mode: mode ? String(mode).trim() : null,
        location: location ? String(location).trim() : null,
        subtypes: Array.isArray(subtypes) ? subtypes.map(s => String(s).trim()) : [],
        date: String(date).trim(),
        desc: String(desc).trim()
      };

      const googleEventId = existingEvent?.googleEventId;
      const calendarId = process.env.GOOGLE_CALENDAR_ID;
      const auth = getGoogleAuth();

      if (googleEventId && auth && calendarId) {
        try {
          const calendar = google.calendar({ version: 'v3', auth });
          const eventDate = new Date(date);
          const nextDay = new Date(eventDate);
          nextDay.setDate(nextDay.getDate() + 1);
          const nextDayStr = nextDay.toISOString().split('T')[0];
          
          const gCalEvent = {
            summary: title,
            description: desc + `\n\nType: ${type}` + (mode ? `\nMode: ${mode}` : '') + (location ? `\nLocation: ${location}` : ''),
            start: { date: date },
            end: { date: nextDayStr },
            guestsCanModify: false,
            guestsCanInviteOthers: false,
            guestsCanSeeOtherGuests: false
          };
          
          await calendar.events.update({
            calendarId: calendarId,
            eventId: googleEventId,
            resource: gCalEvent,
          });
        } catch (err) {
          console.error("Google Calendar Update Error:", err);
        }
      }

      await collection.updateOne(query, { $set: updatedFields });
      
      return res.status(200).json({ detail: 'Event updated.' });
    }

    // DELETE /api/events - Delete existing event
    if (req.method === 'DELETE') {
      if (!verifyAdmin(req)) {
        return res.status(401).json({ detail: 'Unauthorized. Invalid or missing admin token.' });
      }
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
      
      return res.status(200).json({ detail: 'Event deleted.' });
    }

    // Unsupported method
    return res.status(405).json({ detail: 'Method not allowed' });

  } catch (error) {
    console.error('Database error in events API:', error);
    return res.status(500).json({ detail: 'Internal Server Error' });
  }
};
