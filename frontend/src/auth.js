import { ALLOWED_EMAILS, ALLOWED_DOMAIN_REGEX, AUTH_CONFIG } from './auth.config.js';

/**
 * Check whether a given email address is in the authorized whitelist or matches domain regex
 */
export function isEmailWhitelisted(email) {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();

  // 1. Check exact email whitelist
  const inList = ALLOWED_EMAILS.some(allowed => allowed.trim().toLowerCase() === normalized);
  if (inList) return true;

  // 2. Check institutional domain regex pattern
  if (ALLOWED_DOMAIN_REGEX && ALLOWED_DOMAIN_REGEX.test(normalized)) {
    return true;
  }

  return false;
}

/**
 * Decode JWT token payload safely (Base64Url decoding)
 */
export function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse Google JWT:', e);
    return null;
  }
}

/**
 * Retrieve the current active authentication session if valid
 * Validates expiration (30 days) and confirms email is still whitelisted.
 */
export function getAuthSession() {
  try {
    const raw = localStorage.getItem(AUTH_CONFIG.storageKey);
    if (!raw) return null;

    const session = JSON.parse(raw);
    if (!session || !session.email || !session.expiresAt) {
      clearAuthSession();
      return null;
    }

    // Check if session has expired
    if (Date.now() > session.expiresAt) {
      console.warn('Authentication session has expired (30-day limit reached).');
      clearAuthSession();
      return null;
    }

    // Check if email is still permitted on the whitelist
    if (!isEmailWhitelisted(session.email)) {
      console.warn(`Email ${session.email} is no longer permitted on the whitelist.`);
      clearAuthSession();
      return null;
    }

    return session;
  } catch (err) {
    console.error('Error reading auth session:', err);
    clearAuthSession();
    return null;
  }
}

/**
 * Save authorized user session into localStorage with 30-day lifespan
 */
export function saveAuthSession(credential, payload) {
  const durationMs = AUTH_CONFIG.sessionDurationDays * 24 * 60 * 60 * 1000;
  const expiresAt = Date.now() + durationMs;

  const session = {
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
    picture: payload.picture || '',
    token: credential,
    loginTime: Date.now(),
    expiresAt: expiresAt,
  };

  localStorage.setItem(AUTH_CONFIG.storageKey, JSON.stringify(session));
  return session;
}

/**
 * Clear local auth session and log out
 */
export function clearAuthSession() {
  localStorage.removeItem(AUTH_CONFIG.storageKey);
  if (window.google?.accounts?.id) {
    try {
      window.google.accounts.id.disableAutoSelect();
    } catch {
      // Ignore if unavailable
    }
  }
}

/**
 * Initialize Google Identity Services button inside the target container element
 */
export function initGoogleSignIn(containerElement, onAuthSuccess, onAuthError) {
  const checkGoogleLoaded = () => {
    if (window.google?.accounts?.id) {
      setupGoogleButton(containerElement, onAuthSuccess, onAuthError);
    } else {
      // Wait for GIS script to load
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          setupGoogleButton(containerElement, onAuthSuccess, onAuthError);
        } else if (attempts > 20) {
          clearInterval(interval);
          onAuthError?.(new Error('Google Identity Services script could not be loaded. Please check your network connection.'));
        }
      }, 150);
    }
  };

  checkGoogleLoaded();
}

let isGoogleInitialized = false;

function setupGoogleButton(containerElement, onAuthSuccess, onAuthError) {
  try {
    if (!isGoogleInitialized) {
      window.google.accounts.id.initialize({
        client_id: AUTH_CONFIG.clientId,
        callback: (response) => {
          if (!response.credential) {
            onAuthError?.(new Error('No credentials returned from Google.'));
            return;
          }

          const payload = parseJwt(response.credential);
          if (!payload || !payload.email) {
            onAuthError?.(new Error('Failed to extract email from Google identity token.'));
            return;
          }

          const email = payload.email.trim();

          // Check against whitelist
          if (!isEmailWhitelisted(email)) {
            const err = new Error('UNAUTHORIZED_EMAIL');
            err.email = email;
            onAuthError?.(err, email);
            return;
          }

          // Save session and notify caller
          const session = saveAuthSession(response.credential, payload);
          onAuthSuccess?.(session);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      isGoogleInitialized = true;
    }

    // Clear previous button content if any
    containerElement.innerHTML = '';

    // Render official Google button
    window.google.accounts.id.renderButton(containerElement, {
      theme: 'outline',
      size: 'large',
      type: 'standard',
      shape: 'pill',
      text: 'signin_with',
      logo_alignment: 'left',
      width: 280
    });
  } catch (err) {
    console.error('Error initializing Google Sign-In:', err);
    onAuthError?.(err);
  }
}

let tokenClient = null;

/**
 * Triggers Google's native OAuth 2.0 Account Chooser popup with prompt: 'select_account'
 * This explicitly presents the user with the list of their Google accounts and "+ Use another account"
 */
export function triggerGoogleAccountPicker(onAuthSuccess, onAuthError, onProgress) {
  if (!window.google?.accounts?.oauth2) {
    onAuthError?.(new Error('Google OAuth client library is still loading. Please try again.'));
    return;
  }

  try {
    if (!tokenClient) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: AUTH_CONFIG.clientId,
        scope: 'email profile openid',
        prompt: 'select_account',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            if (tokenResponse.error !== 'popup_closed_by_user') {
              onAuthError?.(new Error(tokenResponse.error_description || tokenResponse.error));
            } else {
              onAuthError?.(new Error('POPUP_CLOSED'));
            }
            return;
          }

          onProgress?.('Verifying account with Google...');

          try {
            // Fetch verified user profile directly from Google
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
            });
            if (!res.ok) {
              throw new Error('Failed to retrieve user profile from Google.');
            }
            const userinfo = await res.json();
            const email = (userinfo.email || '').trim();

            // Validate against institutional whitelist
            if (!isEmailWhitelisted(email)) {
              const err = new Error('UNAUTHORIZED_EMAIL');
              err.email = email;
              onAuthError?.(err, email);
              return;
            }

            const session = saveAuthSession(tokenResponse.access_token, {
              email: email,
              name: userinfo.name || email.split('@')[0],
              picture: userinfo.picture || ''
            });

            onAuthSuccess?.(session);
          } catch (err) {
            console.error('OAuth profile fetch error:', err);
            onAuthError?.(err);
          }
        }
      });
    }

    // Force account selection dialog
    tokenClient.requestAccessToken({ prompt: 'select_account' });
  } catch (err) {
    console.error('Failed to trigger account picker:', err);
    onAuthError?.(err);
  }
}

