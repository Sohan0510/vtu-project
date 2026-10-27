import React from 'react';

export default function UserAuthBar({ session, onLogout }) {
  if (!session) return null;

  const initial = (session.name || session.email || 'U')[0].toUpperCase();

  return (
    <div className="user-auth-bar">
      <div className="user-profile-chip">
        <div className="user-avatar-circle">
          {session.picture ? (
            <img src={session.picture} alt={session.name} referrerpolicy="no-referrer" />
          ) : (
            initial
          )}
        </div>
        <span className="user-chip-email" title={session.email || ''}>
          {session.email || ''}
        </span>
        <button className="btn-chip-logout" id="btn-user-logout" title="Sign out" onClick={onLogout}>
          <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
