const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');

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

    // Require authentication for POST, PUT, DELETE
    if (!verifyAdmin(req)) {
      return res.status(401).json({ detail: 'Unauthorized. Invalid or missing admin token.' });
    }

    // POST /api/events - Create new event
    if (req.method === 'POST') {
      const { id, title, type, mode, location, subtypes, date, desc } = req.body || {};
      
      // Strict type checking to prevent NoSQL injection
      if (typeof id !== 'number' || typeof title !== 'string' || typeof type !== 'string' || typeof date !== 'string' || typeof desc !== 'string') {
        return res.status(400).json({ detail: 'Invalid input format.' });
      }

      const newEvent = {
        id: Number(id), // Force number type
        title: String(title).trim(),
        type: String(type).trim(),
        mode: mode ? String(mode).trim() : null,
        location: location ? String(location).trim() : null,
        subtypes: Array.isArray(subtypes) ? subtypes.map(s => String(s).trim()) : [],
        date: String(date).trim(),
        desc: String(desc).trim()
      };

      await collection.insertOne(newEvent);
      return res.status(201).json({ detail: 'Event created.' });
    }

    // PUT /api/events - Update existing event
    if (req.method === 'PUT') {
      const { id, title, type, mode, location, subtypes, date, desc } = req.body || {};
      
      if (typeof id !== 'number') {
        return res.status(400).json({ detail: 'Invalid event ID.' });
      }

      const updatedFields = {
        title: String(title).trim(),
        type: String(type).trim(),
        mode: mode ? String(mode).trim() : null,
        location: location ? String(location).trim() : null,
        subtypes: Array.isArray(subtypes) ? subtypes.map(s => String(s).trim()) : [],
        date: String(date).trim(),
        desc: String(desc).trim()
      };

      // Query by ID (force Number to prevent injection passing objects like {$ne: null})
      const query = { id: Number(id) };
      await collection.updateOne(query, { $set: updatedFields });
      
      return res.status(200).json({ detail: 'Event updated.' });
    }

    // DELETE /api/events - Delete existing event
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      
      if (typeof id !== 'number') {
        return res.status(400).json({ detail: 'Invalid event ID.' });
      }

      const query = { id: Number(id) };
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
