import React from 'react';

export default function TbdCard({
  event,
  isAdmin,
  onClick,
  onSchedule,
  onEdit,
  onDelete,
}) {
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

  const studentTypeClass = event.studentType
    ? event.studentType.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    : '';

  let descSnippet = '';
  if (event.desc) {
    const firstLine = event.desc.split(/\r?\n/).find((l) => l.trim().length > 0) || '';
    descSnippet = firstLine.replace(/[*#_•\-]/g, '').trim();
  }

  return (
    <div
      className="tbd-card"
      data-event-id={event.id}
      onClick={() => onClick(event)}
    >
      <div className="tbd-card-top">
        <span className="tbd-pill-badge">TBD</span>
        <div className="tbd-card-tags">
          {event.studentType && (
            <span className={`tbd-mode-tag mode-studenttype-${studentTypeClass}`}>
              {event.studentType.toUpperCase()}
            </span>
          )}
          {event.mode && (
            <span className={`tbd-mode-tag mode-${event.mode}`}>
              {event.mode.toUpperCase()}
            </span>
          )}
          {event.location && (
            <span className={`tbd-mode-tag mode-${locationClass}`}>
              {locationLabel}
            </span>
          )}
          {Array.isArray(event.subtypes) &&
            event.subtypes.slice(0, 2).map((sub, i) => (
              <span key={i} className="tbd-subtype-tag">
                {String(sub).toUpperCase()}
              </span>
            ))}
        </div>
      </div>
      <div className="tbd-card-title">{event.title}</div>
      {descSnippet && (
        <div className="tbd-card-snippet" title={descSnippet}>
          {descSnippet}
        </div>
      )}
      {isAdmin && (
        <div className="tbd-card-actions">
          <button
            className="tbd-action-btn schedule"
            data-action="schedule"
            title="Assign a date to schedule this drive"
            onClick={(e) => {
              e.stopPropagation();
              onSchedule(event);
            }}
          >
            <svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" strokeWidth="2.5" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Set Date</span>
          </button>
          <button
            className="tbd-action-btn edit"
            data-action="edit"
            title="Edit drive criteria"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(event);
            }}
          >
            Edit
          </button>
          <button
            className="tbd-action-btn delete"
            data-action="delete"
            title="Delete drive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(event);
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
