import React, { useState } from 'react';
import { sha256 } from '../../utils/sha256.js';

export default function SPCPasswordModal({ onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pwHash = await sha256(password);
    if (
      pwHash === '959bb004eb614b51840f0754e29012b627dae2bbb42232bf1751b578a1d6176b' ||
      pwHash === '74ffa579c6aa545cdcbc5faf5fbfa3c889ee6aa669dd2245e35b64536a2c2c76'
    ) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg('Invalid Access Password.');
    }
  };

  return (
    <>
      <div className="modal-header">
        <h3>SPC Authorization</h3>
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
      </div>
      <form id="spc-login-form" className="modal-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="spc-password">Access Password</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="spc-password"
              required
              placeholder="Enter SPC Access Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="password-toggle"
              id="spc-toggle-password"
              aria-label="Toggle password visibility"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg
                  id="spc-eye-off-icon"
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  id="spc-eye-icon"
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {errorMsg && (
          <div id="spc-login-error" className="login-error-msg active">
            {errorMsg}
          </div>
        )}
        <div className="form-submit-group">
          <button type="button" className="form-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="form-submit-btn">
            Authorize
          </button>
        </div>
      </form>
    </>
  );
}
