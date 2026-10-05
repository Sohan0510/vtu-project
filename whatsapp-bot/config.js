import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load parent .env first, then local .env if present (without overwriting system/Docker env vars)
const parentEnvPath = path.resolve(process.cwd(), '../.env');
const localEnvPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(parentEnvPath)) {
  dotenv.config({ path: parentEnvPath });
}
if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
} else {
  dotenv.config();
}

// Detect if running inside a Docker container
const isDocker = fs.existsSync('/.dockerenv') || process.env.IS_DOCKER === 'true';

// Determine backend API Base URL
// When inside Docker, localhost:8000 refers to the container itself; route to backend container http://backend:8000
let apiBaseUrl = process.env.API_BASE_URL || (isDocker ? 'http://backend:8000' : 'http://localhost:8000');
if (isDocker && (apiBaseUrl.includes('localhost:8000') || apiBaseUrl.includes('127.0.0.1:8000'))) {
  apiBaseUrl = apiBaseUrl.replace(/localhost:8000|127\.0\.0\.1:8000/, 'backend:8000');
}

export const CONFIG = {
  // WhatsApp Configuration
  ALLOWED_GROUPS: process.env.ALLOWED_GROUPS || '*',
  ENABLE_EMOJI_REACTIONS: process.env.ENABLE_EMOJI_REACTIONS !== 'false',
  
  // Backend COE API Base URL
  API_BASE_URL: apiBaseUrl,
  
  // Admin credentials / secrets (all loaded strictly from environment)
  ADMIN_ID: process.env.ADMIN_ID || '',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',
  ADMIN_TOKEN: process.env.ADMIN_TOKEN || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  
  // Google Gemini API Key
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  
  // MongoDB Atlas URI
  MONGO_URI: process.env.MONGO_URI || '',
  
  // Dry run mode
  DRY_RUN: process.env.DRY_RUN === 'true'
};
