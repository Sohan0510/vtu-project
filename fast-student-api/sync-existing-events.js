require('dotenv').config();
const { MongoClient } = require('mongodb');
const { google } = require('googleapis');

async function syncExistingEvents() {
  console.log("Connecting to MongoDB...");
  const client = await MongoClient.connect(process.env.MONGO_URI);
  const db = client.db(process.env.DB_NAME || 'vtu_database');
  const collection = db.collection('calendar_events');

  console.log("Setting up Google Calendar Auth...");
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : null,
  };

  if (!credentials.client_email || !credentials.private_key) {
    console.error("Missing Google Credentials in .env!");
    process.exit(1);
  }

  const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ['https://www.googleapis.com/auth/calendar.events']
  );

  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const calendar = google.calendar({ version: 'v3', auth });

  console.log("Fetching existing events from MongoDB...");
  const events = await collection.find({}).toArray();
  console.log(`Found ${events.length} events.`);

  let syncedCount = 0;

  for (const event of events) {
    if (event.googleEventId) {
      console.log(`Skipping event "${event.title}" - already synced.`);
      continue;
    }

    try {
      console.log(`Syncing event: "${event.title}"...`);
      const eventDate = new Date(event.date);
      const nextDay = new Date(eventDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];

      let desc = event.desc || "";
      if (event.type) desc += `\n\nType: ${event.type}`;
      if (event.mode) desc += `\nMode: ${event.mode}`;
      if (event.location) desc += `\nLocation: ${event.location}`;

      const gCalEvent = {
        summary: event.title,
        description: desc.trim(),
        start: { date: event.date },
        end: { date: nextDayStr },
      };

      const response = await calendar.events.insert({
        calendarId: calendarId,
        resource: gCalEvent,
      });

      const googleEventId = response.data.id;

      // Update MongoDB with the new googleEventId
      await collection.updateOne(
        { id: event.id },
        { $set: { googleEventId: googleEventId } }
      );
      
      console.log(`✅ Synced! Google ID: ${googleEventId}`);
      syncedCount++;
      
      // Sleep for a bit to avoid hitting Google API rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (err) {
      console.error(`❌ Failed to sync event "${event.title}":`, err.message);
    }
  }

  console.log(`\n🎉 Sync complete! Successfully pushed ${syncedCount} events to Google Calendar.`);
  process.exit(0);
}

syncExistingEvents();
