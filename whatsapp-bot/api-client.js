import jwt from 'jsonwebtoken';
import { CONFIG } from './config.js';
import { parseWithGeminiDirect } from './gemini-parser.js';

/**
 * Backend API Client
 * Interacts with existing /api/parse and /api/events endpoints
 * Supports login via /api/auth, signing with JWT_SECRET, or fallback to direct Gemini parsing.
 */
export class PlacementApiClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || CONFIG.API_BASE_URL;
    this.adminToken = options.adminToken || CONFIG.ADMIN_TOKEN || null;
    this.adminId = options.adminId || CONFIG.ADMIN_ID || 'admin';
    this.adminPassword = options.adminPassword || CONFIG.ADMIN_PASSWORD || null;
    this.jwtSecret = options.jwtSecret || CONFIG.JWT_SECRET || null;
    this.geminiApiKey = options.geminiApiKey || CONFIG.GEMINI_API_KEY || null;
    this._token = this.adminToken;
    this._tokenExpiry = 0;
  }

  async getAdminToken() {
    const now = Math.floor(Date.now() / 1000);
    if (this._token && this._tokenExpiry > now + 60) {
      return this._token;
    }

    if (this.adminToken) {
      this._token = this.adminToken;
      this._tokenExpiry = now + 86400;
      return this._token;
    }

    if (this.jwtSecret) {
      this._tokenExpiry = now + 86400;
      this._token = jwt.sign(
        { admin: true, id: this.adminId },
        this.jwtSecret,
        { expiresIn: '24h' }
      );
      return this._token;
    }

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
        }
      } catch (err) {
        // Fall through
      }
    }

    this._token = jwt.sign(
      { admin: true, id: this.adminId },
      'vtu_placement_secret_key_2026',
      { expiresIn: '24h' }
    );
    this._tokenExpiry = now + 86400;
    return this._token;
  }

  async getHeaders() {
    const token = await this.getAdminToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Parse announcement text into structured events
   * Tries API first, falls back directly to Gemini AI if API token isn't configured
   */
  async parseAnnouncement(text) {
    try {
      const url = `${this.baseUrl}/api/parse`;
      const headers = await this.getHeaders();
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text })
      });

      if (res.ok) {
        const data = await res.json();
        return data.events || [];
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
