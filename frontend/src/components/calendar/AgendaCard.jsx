import React from 'react';
import { formatEventDescription } from '../../utils/formatDescription.js';

function getCategoryLabel(type) {
  const labels = {
    exams: 'Interviews & Tests',
    holidays: 'Holidays & Breaks',
  };
  return labels[type] || 'Event';
}

export default function AgendaCard({
  event,
  isAdmin,
  onClick,
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

  return (
    <div
      className={`agenda-card event-${event.type}`}
      data-event-id={event.id}
      onClick={() => onClick(event)}
    >
      <div className="agenda-card-header">
        <span className={`agenda-category-badge category-${event.type}`}>
          {getCategoryLabel(event.type)}
        </span>
        <div className="agenda-card-tags">
          {event.mode && (
            <span className={`agenda-mode-tag mode-${event.mode}`}>
              {event.mode.toUpperCase()}
            </span>
          )}
          {event.location && (
            <span className={`agenda-mode-tag mode-${locationClass}`}>
              {locationLabel}
            </span>
          )}
          {event.studentType && (
            <span className={`agenda-mode-tag mode-studenttype-${studentTypeClass}`}>
              {event.studentType.toUpperCase()}
            </span>
          )}
          {Array.isArray(event.subtypes) &&
            event.subtypes.map((sub, i) => (
              <span key={i} className={`agenda-subtype-tag subtype-${String(sub).toLowerCase()}`}>
                {String(sub).toUpperCase()}
              </span>
            ))}
        </div>
      </div>
      <div className="agenda-card-body">
        <h4 className="agenda-event-title">{event.title}</h4>
        <div
          className="agenda-event-desc"
          dangerouslySetInnerHTML={{ __html: formatEventDescription(event.desc) }}
        />
      </div>
      {isAdmin && (
        <div className="agenda-card-actions">
          <button
            className="agenda-action-btn edit"
            data-action="edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(event);
            }}
          >
            Edit
          </button>
          <button
            className="agenda-action-btn delete"
            data-action="delete"
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
