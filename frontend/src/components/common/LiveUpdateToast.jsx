import React, { useEffect, useState } from 'react';

export default function LiveUpdateToast({ event, onClose, onSelectDate }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!event) return;
    const anim = requestAnimationFrame(() => setVisible(true));
    const autoDismiss = setTimeout(() => {
      onClose();
    }, 8000);

    return () => {
      cancelAnimationFrame(anim);
      clearTimeout(autoDismiss);
    };
  }, [event, onClose]);

  if (!event) return null;

  return (
    <div id="live-update-toast" className={`live-update-toast-banner ${visible ? 'visible' : ''}`}>
      <div className="live-toast-content">
        <span className="live-toast-dot"></span>
        <span className="live-toast-text">
          <strong>{event.title}</strong>{' '}
          {event.date === 'TBD'
            ? 'added to Upcoming Drives (TBD)'
            : `scheduled for ${event.date}`}
        </span>
        {event.date && event.date !== 'TBD' && (
          <button
            type="button"
            className="live-toast-view-btn"
            id="live-toast-goto"
            onClick={() => {
              onSelectDate(event.date);
              onClose();
            }}
          >
            View Date
          </button>
        )}
        <button
          type="button"
          className="live-toast-close"
          aria-label="Close notification"
          onClick={onClose}
        >
          &times;
        </button>
      </div>
    </div>
  );
}
