import React from 'react';

export default function EventPill({ event, onClick }) {
  let stageLabel = '';
  if (event.subtypes && Array.isArray(event.subtypes) && event.subtypes.length === 1) {
    const st = String(event.subtypes[0]).trim();
    if (st && !event.title.toLowerCase().includes(st.toLowerCase())) {
      stageLabel = ` (${st})`;
    }
  }

  return (
    <div
      className={`calendar-event-pill event-${event.type}`}
      data-event-id={event.id}
      onClick={(e) => {
        e.stopPropagation();
        onClick(event);
      }}
    >
      <span className="event-dot"></span>
      <span className="event-text">
        {event.title}
        {stageLabel}
      </span>
    </div>
  );
}
