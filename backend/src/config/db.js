import { MongoClient } from 'mongodb';

let cachedClient = null;

export async function connectToDatabase() {
  if (cachedClient) {
    try {
      await cachedClient.db('admin').command({ ping: 1 });
      return cachedClient;
    } catch (err) {
      console.warn('MongoDB connection stale, reconnecting...', err.message);
      cachedClient = null;
    }
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI environment variable is not defined.');
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  await client.connect();
  cachedClient = client;
  return client;
}
