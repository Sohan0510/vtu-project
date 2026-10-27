import React, { useState } from 'react';
import { sha256 } from '../../utils/sha256.js';
import { useAdminLoginMutation } from '../../hooks/useApiQueries.js';

export default function AdminLoginModal({ onClose, onAuthenticated }) {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const adminLoginMutation = useAdminLoginMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const id = adminId.trim();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const data = await adminLoginMutation.mutateAsync({ id, password });
      if (data?.token) {
        sessionStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminToken', data.token);
        onAuthenticated();
        onClose();
        return;
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Invalid Admin ID or Password.';
      setErrorMsg(msg);
      setSubmitting(false);
    }

  };

  return (
    <>
      <div className="modal-header">
        <h3>Admin Authentication</h3>
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
      </div>
      <form id="login-form" className="modal-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="admin-id">Admin ID</label>
          <input
            type="text"
            id="admin-id"
            value={adminId}
            onChange={(e) => setAdminId(e.target.value)}
            required
            placeholder="Enter Admin ID"
            autoComplete="username"
          />
        </div>
        <div className="form-group">
          <label htmlFor="admin-password">Password</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="admin-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter Password"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              id="toggle-password"
              aria-label="Toggle password visibility"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg
                  id="eye-off-icon"
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
                  id="eye-icon"
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
          <div id="login-error" className="login-error-msg active">
            {errorMsg}
          </div>
        )}
        <div className="form-submit-group">
          <button type="button" className="form-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="form-submit-btn" disabled={submitting}>
            {submitting ? 'Authenticating...' : 'Authenticate'}
          </button>
        </div>
      </form>
    </>
  );
}
