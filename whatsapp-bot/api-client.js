import jwt from 'jsonwebtoken';
import { CONFIG } from './config.js';
import { parseWithGeminiDirect } from './gemini-parser.js';

/**
 * Backend API Client
 * Interacts with /api/parse (or /api/ai/parse) and /api/events endpoints.
 * All credentials are loaded exclusively from environment variables / .env.
 */
export class PlacementApiClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || CONFIG.API_BASE_URL;
    this.adminToken = options.adminToken || CONFIG.ADMIN_TOKEN || null;
    this.adminId = options.adminId || CONFIG.ADMIN_ID || null;
    this.adminPassword = options.adminPassword || CONFIG.ADMIN_PASSWORD || null;
    this.jwtSecret = options.jwtSecret || CONFIG.JWT_SECRET || null;
    this.geminiApiKey = options.geminiApiKey || CONFIG.GEMINI_API_KEY || null;
    this._token = this.adminToken;
    this._tokenExpiry = 0;
  }

  /**
   * Resolves a valid admin token:
   * 1. Uses explicit ADMIN_TOKEN from .env if present.
   * 2. Signs a JWT if JWT_SECRET is configured in .env.
   * 3. Authenticates via POST /api/auth using ADMIN_ID and ADMIN_PASSWORD from .env.
   */
  async getAdminToken() {
    const now = Math.floor(Date.now() / 1000);
    if (this._token && this._tokenExpiry > now + 60) {
      return this._token;
    }

    // 1. Direct admin token from environment
    if (this.adminToken) {
      this._token = this.adminToken;
      this._tokenExpiry = now + 86400;
      return this._token;
    }

    // 2. JWT signing with secret from environment
    if (this.jwtSecret) {
      this._tokenExpiry = now + 86400;
      this._token = jwt.sign(
        { admin: true, id: this.adminId || 'admin' },
        this.jwtSecret,
        { expiresIn: '24h' }
      );
      return this._token;
    }

    // 3. Login via /api/auth using credentials from environment
    if (this.adminId && this.adminPassword) {
      try {
        const res = await fetch(`${this.baseUrl}/api/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: this.adminId, password: this.adminPassword })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.token) {
            this._token = data.token;
            this._tokenExpiry = now + 86400;
            return this._token;
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          console.error(`[PlacementApiClient] Auth failed (${res.status}): ${errData.detail || 'Check ADMIN_ID and ADMIN_PASSWORD in .env'}`);
        }
      } catch (err) {
        console.error(`[PlacementApiClient] Auth connection error:`, err.message);
      }
    }

    return null;
  }

  async getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = await this.getAdminToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Parse announcement text into structured events.
   * Tries backend API first (/api/parse or /api/ai/parse),
   * falls back directly to Gemini AI using GEMINI_API_KEY from .env.
   */
  async parseAnnouncement(text) {
    try {
      const headers = await this.getHeaders();
      let parseUrl = `${this.baseUrl}/api/parse`;
      let res = await fetch(parseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text })
      });

      if (!res.ok && res.status === 404) {
        // Try FastAPI endpoint name
        parseUrl = `${this.baseUrl}/api/ai/parse`;
        res = await fetch(parseUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ text })
        });
      }

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.events)) return data.events;
      }
    } catch (apiErr) {
      // Fall through to direct Gemini call
    }

    // Direct Gemini fallback using existing GEMINI_API_KEY
    return await parseWithGeminiDirect(text, this.geminiApiKey);
  }

  async getEvents() {
    const url = `${this.baseUrl}/api/events`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch events from COE (${res.status})`);
    }

    return await res.json();
  }

  async createEvent(event) {
    const url = `${this.baseUrl}/api/events`;
    const headers = await this.getHeaders();
    if (!headers['Authorization']) {
      throw new Error('Admin authentication required: Please configure ADMIN_ID and ADMIN_PASSWORD (or ADMIN_TOKEN) in your .env file.');
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(event)
    });

    if (!res.ok) {
      let errText = '';
      try { const errObj = await res.json(); errText = errObj.detail || errObj.message; } catch(e) { errText = await res.text(); }
      throw new Error(`Create event failed (${res.status}): ${errText}`);
    }

    return await res.json();
  }

  async updateEvent(event) {
    const url = `${this.baseUrl}/api/events`;
    const headers = await this.getHeaders();
    if (!headers['Authorization']) {
      throw new Error('Admin authentication required: Please configure ADMIN_ID and ADMIN_PASSWORD (or ADMIN_TOKEN) in your .env file.');
    }

    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(event)
    });

    if (!res.ok) {
      let errText = '';
      try { const errObj = await res.json(); errText = errObj.detail || errObj.message; } catch(e) { errText = await res.text(); }
      throw new Error(`Update event failed (${res.status}): ${errText}`);
    }

    return await res.json();
  }
}
