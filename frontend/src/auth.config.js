/**
 * Authentication Configuration & Whitelist Management
 */

// 1. Specific Whitelist of Authorized Email Addresses
export const ALLOWED_EMAILS = [
  'bhavaniks_23bcs107.rvitm@rvei.edu.in',
  // You can add more specific emails here
];

// 2. Institutional Domain Regex Pattern (Option A)
// Allows all accounts from RVEI & RVITM (@rvei.edu.in and any subdomains like @*.rvei.edu.in)
export const ALLOWED_DOMAIN_REGEX = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.)?rvei\.edu\.in$/i;

export const AUTH_CONFIG = {
  // Google OAuth 2.0 Web Client ID from Google Cloud Console
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '31228933142-48rbu7plcld23n1llop0hq93s8ehe80p.apps.googleusercontent.com',
  
  // Session duration for authenticated users (in days)
  sessionDurationDays: 30,

  // Key used in browser storage
  storageKey: 'vtu_auth_session'
};
