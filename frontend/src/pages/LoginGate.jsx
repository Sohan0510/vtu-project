import React, { useState } from 'react';
import { AUTH_CONFIG } from '../auth.config.js';
import { triggerGoogleAccountPicker } from '../auth.js';

export default function LoginGate({ onLoginSuccess }) {
  const [errorInfo, setErrorInfo] = useState(null);
  const [loadingText, setLoadingText] = useState(null);

  const startGoogleSignIn = () => {
    setErrorInfo(null);

    if (
      AUTH_CONFIG.clientId.includes('YOUR_GOOGLE_CLIENT_ID') ||
      AUTH_CONFIG.clientId.includes('placeholder')
    ) {
      setErrorInfo({
        title: 'Google Client ID Required',
        body: 'Please add your Google OAuth Web Client ID into frontend/src/auth.config.js to connect with Google Cloud.',
        isEmailError: false,
      });
      return;
    }

    setLoadingText('Connecting to Google...');

    triggerGoogleAccountPicker(
      (session) => {
        setLoadingText('Loading Portal...');
        onLoginSuccess(session);
      },
      (err, unauthEmail) => {
        setLoadingText(null);
        if (err?.message === 'POPUP_CLOSED') {
          return;
        }
        if (err?.message === 'UNAUTHORIZED_EMAIL' || unauthEmail) {
          const displayEmail = unauthEmail || err?.email || 'this account';
          setErrorInfo({
            title: 'Access Denied',
            email: displayEmail,
            isEmailError: true,
          });
        } else {
          setErrorInfo({
            title: 'Google Authentication Notice',
            body: err?.message || 'Could not complete Google Sign-In. Please try again.',
            isEmailError: false,
          });
        }
      },
      (progress) => {
        setLoadingText(progress || 'Verifying credentials...');
      }
    );
  };

  return (
    <div className="login-gate-wrapper">
      <div className="login-ambient-orb login-orb-1"></div>
      <div className="login-ambient-orb login-orb-2"></div>

      <div className="login-gate-card">
        <div className="login-gate-crest">
          <svg viewBox="0 0 24 24" width="30" height="30" stroke="currentColor" strokeWidth="1.8" fill="none">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v5M12 16h.01" strokeWidth="2" />
          </svg>
        </div>

        <div className="login-gate-tag">RESTRICTED INSTITUTIONAL ACCESS</div>

        <h1 className="login-gate-title">Placement & Registry Portal</h1>
        <div className="login-gate-subtitle">RV INSTITUTE OF TECHNOLOGY & MANAGEMENT</div>

        <p className="login-gate-desc">
          Sign in with your authorized institutional Google account to access student examination
          records, placement calendar, and the marks database.
        </p>

        {errorInfo && (
          <div className="login-gate-error" id="login-gate-error" style={{ display: 'block' }}>
            <div className="login-error-head">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span id="login-error-title">{errorInfo.title}</span>
            </div>
            <p className="login-error-msg" id="login-error-msg-body">
              {errorInfo.isEmailError ? (
                <>
                  The account <span className="unauth-email-badge">{errorInfo.email}</span> is not
                  authorized to access this portal.
                </>
              ) : (
                errorInfo.body
              )}
            </p>
            <button
              className="btn-retry-google"
              id="btn-switch-account"
              type="button"
              onClick={startGoogleSignIn}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M1 4v6h6M23 20v-6h-6" />
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
              </svg>
              Choose a Different Account
            </button>
          </div>
        )}

        <div className="login-oauth-section">
          <button
            className={`btn-choose-account ${loadingText ? 'is-loading' : ''}`}
            id="btn-google-single-signin"
            type="button"
            title="Sign in with your Google account"
            onClick={startGoogleSignIn}
          >
            {loadingText ? (
              <>
                <span className="google-loader-spinner"></span>
                <span>{loadingText}</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="oauth-btn-text">Sign in with Google</span>
              </>
            )}
          </button>

          <div className="login-hint-domain">
            <span>
              Authorized for <strong>@rvei.edu.in</strong> accounts
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
