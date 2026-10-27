import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables (.env in backend or parent root)
dotenv.config();
if (!process.env.MONGO_URI) {
  dotenv.config({ path: '../.env' });
}

import authRouter from './src/routes/auth.js';
import verifyRouter from './src/routes/verify.js';
import resultsRouter from './src/routes/results.js';
import eventsRouter from './src/routes/events.js';
import parseRouter from './src/routes/parse.js';

const app = express();

// Standard middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', '*'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Fast Student API (Express ESM) is running' });
});

// Mount routes
app.use('/api/auth', authRouter);
app.use('/api/verify', verifyRouter);
app.use('/api/results', resultsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/ai/parse', parseRouter);

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ detail: `Route ${req.method} ${req.url} not found` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ detail: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Student API server running at http://localhost:${PORT}`);
    console.log(`   - Results:  http://localhost:${PORT}/api/results/:usn`);
    console.log(`   - Events:   http://localhost:${PORT}/api/events`);
    console.log(`   - Auth:     http://localhost:${PORT}/api/auth`);
    console.log(`   - Verify:   http://localhost:${PORT}/api/verify`);
    console.log(`   - AI Parse: http://localhost:${PORT}/api/ai/parse`);
  });
}

export default app;
