import React from 'react';

export default function SearchResultCard({ event, onClick }) {
  const isTbd = !event.date || event.date.trim().toUpperCase() === 'TBD';
  let dateBadge = null;

  if (isTbd) {
    dateBadge = (
      <div className="cal-result-date-badge tbd">
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span className="cal-date-text">Date: To Be Decided (TBD)</span>
      </div>
    );
  } else {
    const parts = event.date.split('-');
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTarget = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const diffDays = Math.round((startOfTarget - startOfToday) / (1000 * 60 * 60 * 24));

    let relativeTag = null;
    if (diffDays === 0) {
      relativeTag = <span className="cal-rel-badge rel-today">Today</span>;
    } else if (diffDays === 1) {
      relativeTag = <span className="cal-rel-badge rel-tomorrow">Tomorrow</span>;
    } else if (diffDays > 1 && diffDays <= 7) {
      relativeTag = <span className="cal-rel-badge rel-soon">In {diffDays} days</span>;
    } else if (diffDays > 7) {
      relativeTag = <span className="cal-rel-badge rel-future">In {diffDays} days</span>;
    } else {
      relativeTag = <span className="cal-rel-badge rel-past">Completed</span>;
    }

    dateBadge = (
      <div className="cal-result-date-badge confirmed">
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className="cal-date-text">
          <strong>{formattedDate}</strong>
        </span>
        {relativeTag}
      </div>
    );
  }

  const locationLabel =
    event.location === 'rvitm' || event.location === 'oncampus'
      ? 'RVITM'
      : event.location === 'rvce' || event.location === 'offcampus'
      ? 'RVCE'
      : event.location === 'worksite'
      ? 'WORKSITE'
      : '';
  const locationClass =
    event.location === 'rvitm' || event.location === 'oncampus'
      ? 'oncampus'
      : event.location === 'rvce' || event.location === 'offcampus'
      ? 'offcampus'
      : 'worksite';

  return (
    <div
      className="cal-search-result-card"
      data-event-id={event.id}
      onClick={() => onClick(event)}
    >
      <div className="cal-result-main-info">
        <div className="cal-result-company-row">
          <span className="cal-result-company-name">{event.title}</span>
          <div className="cal-result-meta-tags">
            {event.mode && (
              <span className={`cal-result-tag tag-${event.mode}`}>
                {event.mode.toUpperCase()}
              </span>
            )}
            {event.location && (
              <span className={`cal-result-tag tag-${locationClass}`}>
                {locationLabel}
              </span>
            )}
            {Array.isArray(event.subtypes) &&
              event.subtypes.map((st, i) => (
                <span key={i} className="cal-result-subtype-tag">
                  {st}
                </span>
              ))}
          </div>
        </div>
        <div className="cal-result-date-row">{dateBadge}</div>
      </div>
      <div className="cal-result-action">
        <span className="cal-result-action-link">
          <span>View Date</span>
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.2" fill="none">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
      </div>
    </div>
  );
}
