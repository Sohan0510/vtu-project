import React from 'react';
import { formatEventDescription } from '../../utils/formatDescription.js';

function getCategoryLabel(type) {
  const labels = {
    exams: 'Interviews & Tests',
    holidays: 'Holidays & Breaks',
  };
  return labels[type] || 'Event';
}

export default function EventDetailModal({ event, onClose }) {
  if (!event) return null;

  const isTbd = !event.date || event.date.trim().toUpperCase() === 'TBD';
  let dateDisplay = null;

  if (isTbd) {
    dateDisplay = (
      <span
        className="modal-tbd-tag"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: '#fef3c7',
          color: '#b45309',
          border: '1px solid #fde68a',
          padding: '4px 10px',
          borderRadius: '6px',
          fontWeight: 700,
          fontSize: '0.85rem',
        }}
      >
        ⏳ Date: To Be Decided (TBD)
      </span>
    );
  } else {
    const parts = event.date.split('-');
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    dateDisplay = dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  const studentTypeClass = event.studentType
    ? event.studentType.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    : '';

  return (
    <>
      <div className="modal-header">
        <span className={`modal-category event-${event.type}`}>
          {getCategoryLabel(event.type)}
        </span>
        <div className="modal-header-tags">
          {event.mode && (
            <span className={`modal-mode-badge mode-${event.mode}`}>
              {event.mode.toUpperCase()}
            </span>
          )}
          {event.location && (
            <span className={`modal-mode-badge mode-${locationClass}`}>
              {locationLabel}
            </span>
          )}
          {event.studentType && (
            <span className={`modal-mode-badge mode-studenttype-${studentTypeClass}`}>
              {event.studentType.toUpperCase()}
            </span>
          )}
          {Array.isArray(event.subtypes) &&
            event.subtypes.map((sub, i) => (
              <span
                key={i}
                className={`modal-subtype-badge subtype-${String(sub).toLowerCase()}`}
              >
                {String(sub).toUpperCase()}
              </span>
            ))}
        </div>
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
      </div>
      <h3 className="modal-title">{event.title}</h3>
      <div className="modal-date">{dateDisplay}</div>
      <div
        className="modal-desc"
        dangerouslySetInnerHTML={{ __html: formatEventDescription(event.desc) }}
      />
      <div className="modal-actions">
        <button className="modal-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </>
  );
}
