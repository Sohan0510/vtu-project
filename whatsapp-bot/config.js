import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load from current directory .env, or fallback to parent directory .env
const localEnvPath = path.resolve(process.cwd(), '.env');
const parentEnvPath = path.resolve(process.cwd(), '../.env');

if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
} else if (fs.existsSync(parentEnvPath)) {
  dotenv.config({ path: parentEnvPath });
} else {
  dotenv.config();
}

export const CONFIG = {
  // WhatsApp Configuration
  // Allowed group JIDs or names (comma-separated, or '*' for open/discovery mode)
  ALLOWED_GROUPS: process.env.ALLOWED_GROUPS || '*',
  
  // Optional: Auto-reply / reaction on WhatsApp
  ENABLE_EMOJI_REACTIONS: process.env.ENABLE_EMOJI_REACTIONS !== 'false',
  
  // Backend COE API Base URL
  API_BASE_URL: process.env.API_BASE_URL || 'https://fast-student-api.vercel.app',
  
  // Admin credentials / secrets
  ADMIN_ID: process.env.ADMIN_ID || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',
  ADMIN_TOKEN: process.env.ADMIN_TOKEN || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  
  // Google Gemini API Key
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  
  // MongoDB Atlas URI (optional direct access)
  MONGO_URI: process.env.MONGO_URI || '',
  
  // Dry run mode: logs parsed events & plans without calling create/update
  DRY_RUN: process.env.DRY_RUN === 'true'
};
