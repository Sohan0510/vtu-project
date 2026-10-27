import React, { useState } from 'react';
import SearchResultCard from './SearchResultCard.jsx';

export default function CompanySearch({
  isOpen,
  events,
  onClose,
  onSelectEvent,
}) {
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const rawQuery = query.trim().toLowerCase();

  const matches = (events || []).filter((ev) => {
    if (!rawQuery) return false;
    const matchTitle = ev.title && ev.title.toLowerCase().includes(rawQuery);
    const matchDesc = ev.desc && ev.desc.toLowerCase().includes(rawQuery);
    const matchSubtype =
      Array.isArray(ev.subtypes) &&
      ev.subtypes.some((st) => String(st).toLowerCase().includes(rawQuery));
    return matchTitle || matchDesc || matchSubtype;
  });

  const sortedMatches = matches.slice().sort((a, b) => {
    const aIsTbd = !a.date || a.date.trim().toUpperCase() === 'TBD';
    const bIsTbd = !b.date || b.date.trim().toUpperCase() === 'TBD';
    if (aIsTbd && !bIsTbd) return 1;
    if (!aIsTbd && bIsTbd) return -1;
    if (aIsTbd && bIsTbd) return (a.title || '').localeCompare(b.title || '');
    return a.date.localeCompare(b.date);
  });

  const handleSearch = () => {
    setHasSearched(true);
  };

  const handleClear = () => {
    setQuery('');
    setHasSearched(false);
  };

  return (
    <div className="calendar-search-drawer" id="calendar-search-drawer" style={{ display: 'block' }}>
      <div className="cal-search-inner">
        <div className="cal-search-bar-row">
          <div className="cal-search-input-wrap">
            <svg
              className="cal-search-input-icon"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              stroke="currentColor"
              strokeWidth="2.2"
              fill="none"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              id="cal-company-search-input"
              className="cal-search-wide-input"
              placeholder="Enter company name (e.g. Google, Cisco, TCS, Amazon)..."
              autoComplete="off"
              spellCheck="false"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHasSearched(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />
            {query.length > 0 && (
              <button
                type="button"
                id="cal-search-clear-btn"
                className="cal-search-clear-btn"
                title="Clear input"
                style={{ display: 'inline-flex' }}
                onClick={handleClear}
              >
                &times;
              </button>
            )}
          </div>
          <button
            type="button"
            id="cal-search-exec-btn"
            className="cal-search-exec-btn"
            onClick={handleSearch}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.4" fill="none">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>Search</span>
          </button>
          <button
            type="button"
            id="cal-search-close-btn"
            className="cal-search-close-btn"
            title="Close search"
            aria-label="Close search"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.2" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {hasSearched && (
          <div className="cal-search-results-panel" id="cal-search-results-panel" style={{ display: 'block' }}>
            {!rawQuery ? (
              <div className="cal-search-empty-prompt">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Please enter a company name (e.g. Cisco, TCS, Amazon) to find drive dates.</span>
              </div>
            ) : sortedMatches.length === 0 ? (
              <div className="cal-search-no-results">
                <div className="cal-no-results-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="1.8" fill="none">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </div>
                <div className="cal-no-results-title">
                  No drive dates found for "<strong>{query}</strong>"
                </div>
                <div className="cal-no-results-subtitle">
                  Try searching with fewer characters or check for alternate company spellings.
                </div>
              </div>
            ) : (
              <>
                <div className="cal-search-results-header">
                  <span className="cal-search-count-badge">
                    Found <strong>{sortedMatches.length}</strong> drive schedule
                    {sortedMatches.length === 1 ? '' : 's'}
                  </span>
                  <span className="cal-search-hint">Click any company to open its calendar date</span>
                </div>
                <div className="cal-search-results-list">
                  {sortedMatches.map((ev) => (
                    <SearchResultCard key={ev.id} event={ev} onClick={onSelectEvent} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
