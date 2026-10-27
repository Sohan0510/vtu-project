import React from 'react';
import AgendaCard from './AgendaCard.jsx';

export default function AgendaView({
  selectedCalendarDate,
  isAdmin,
  events,
  filters,
  isEventsFetched,
  onAddEvent,
  onAIPost,
  onEventClick,
  onEditEvent,
  onDeleteEvent,
}) {
  const selYear = selectedCalendarDate.getFullYear();
  const selMonth = selectedCalendarDate.getMonth();
  const selDay = selectedCalendarDate.getDate();
  const dateStr = `${selYear}-${String(selMonth + 1).padStart(2, '0')}-${String(selDay).padStart(2, '0')}`;

  const formattedDateStr = selectedCalendarDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const dayEvents = (events || []).filter((ev) => {
    if (ev.date !== dateStr) return false;
    if (!filters[ev.type]) return false;
    if (ev.mode === 'online' && !filters.online) return false;
    if (ev.mode === 'offline' && !filters.offline) return false;

    const isRVCE = ev.location === 'rvce' || ev.location === 'offcampus';
    const isRVITM = ev.location === 'rvitm' || ev.location === 'oncampus';
    const isWorksite = ev.location === 'worksite';

    if (isRVCE && !filters.oncampus) return false;
    if (isRVITM && !filters.offcampus) return false;
    if (isWorksite && !filters.worksite) return false;
    return true;
  });

  return (
    <div className="calendar-agenda" id="calendar-agenda-view">
      <div className="agenda-header">
        <div className="agenda-title">Schedule for {formattedDateStr}</div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="agenda-add-btn" id="agenda-add-event-btn" onClick={onAddEvent}>
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>{' '}
              Add Event
            </button>
            <button
              className="agenda-add-btn"
              id="agenda-ai-post-btn"
              style={{
                background: 'linear-gradient(135deg, #000000ff, #000000ff)',
                color: 'white',
                border: 'none',
                boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)',
              }}
              onClick={onAIPost}
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                style={{ marginRight: '4px' }}
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>{' '}
              AI Quick Post
            </button>
          </div>
        )}
      </div>

      <div className="agenda-items">
        {dayEvents.length === 0 ? (
          !isEventsFetched && (!events || events.length === 0) ? (
            <div className="agenda-empty">
              <div
                className="agenda-spinner-wrap"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '16px',
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  fill="none"
                  style={{ animation: 'spin 0.8s linear infinite' }}
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  Connecting to database & syncing live schedule...
                </span>
              </div>
            </div>
          ) : (
            <div className="agenda-empty">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="1.5" fill="none">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>No events scheduled for this date.</span>
            </div>
          )
        ) : (
          dayEvents.map((ev) => (
            <AgendaCard
              key={ev.id}
              event={ev}
              isAdmin={isAdmin}
              onClick={onEventClick}
              onEdit={onEditEvent}
              onDelete={onDeleteEvent}
            />
          ))
        )}
      </div>
    </div>
  );
}
