import React from 'react';

export default function SearchForm({
  usn,
  setUsn,
  onSubmit,
  placeholder = 'Enter USN (e.g. 1RF22CS001)',
  errorMsg,
}) {
  return (
    <div className="search-container">
      <form id="search-form" className="search-box" onSubmit={onSubmit}>
        <svg
          className="search-icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          id="usn-input"
          className="search-input"
          placeholder={placeholder}
          required
          maxLength={12}
          autoComplete="off"
          spellCheck="false"
          value={usn}
          onChange={(e) => setUsn(e.target.value)}
        />
        <button type="submit" className="search-btn">
          Query Database
        </button>
      </form>
      {errorMsg ? (
        <div id="error-msg" className="error-msg active">
          {errorMsg}
        </div>
      ) : (
        <div id="error-msg" className="error-msg"></div>
      )}
    </div>
  );
}
