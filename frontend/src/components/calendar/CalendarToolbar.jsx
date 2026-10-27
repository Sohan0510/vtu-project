import React from 'react';

export default function CalendarToolbar({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  onSyncRefresh,
  isSyncing,
  onToggleSearch,
  isSearchActive,
  onSubscribeClick,
}) {
  const monthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="calendar-toolbar">
      <div className="toolbar-left">
        <button className="toolbar-btn today-btn" id="cal-today-btn" onClick={onToday}>
          Today
        </button>
        <div className="toolbar-nav">
          <button
            className="toolbar-nav-btn"
            id="cal-prev-btn"
            title="Previous month"
            aria-label="Previous month"
            onClick={onPrevMonth}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.2" fill="none">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="toolbar-current-month">{monthName}</span>
          <button
            className="toolbar-nav-btn"
            id="cal-next-btn"
            title="Next month"
            aria-label="Next month"
            onClick={onNextMonth}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.2" fill="none">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
      <div className="toolbar-subscribe" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          className={`cal-sync-circle-btn ${isSyncing ? 'syncing' : ''}`}
          id="cal-sync-refresh-btn"
          title="Sync & Refresh latest calendar events"
          aria-label="Sync & Refresh latest calendar events"
          onClick={onSyncRefresh}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2.3" fill="none">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
        </button>
        <button
          className={`cal-search-circle-btn ${isSearchActive ? 'active' : ''}`}
          id="cal-search-toggle-btn"
          title="Search company drive dates"
          aria-label="Search company drive dates"
          onClick={onToggleSearch}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2.3" fill="none">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
        <button
          onClick={onSubscribeClick}
          className="toolbar-btn btn-subscribe-cal"
          style={{
            background: '#4285F4',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '6px 14px',
            fontSize: '0.85rem',
            borderRadius: '6px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M16 2V6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 2V6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 10H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 16H12.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Subscribe
        </button>
      </div>
    </div>
  );
}
