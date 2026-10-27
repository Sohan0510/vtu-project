import React, { useEffect, useState } from 'react';

export default function Toast({ events, isEventsFetched }) {
  const [toastState, setToastState] = useState({ show: false, hide: false, message: null });

  useEffect(() => {
    if (!isEventsFetched || !events) return;

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    const upcoming = events
      .filter(ev => ev.date && ev.date.trim().toUpperCase() !== 'TBD' && ev.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));

    let content = null;
    if (upcoming.length > 0) {
      const nextEv = upcoming[0];
      const formatLabel = nextEv.mode ? ` (${nextEv.mode.charAt(0).toUpperCase() + nextEv.mode.slice(1)})` : '';
      const parts = nextEv.date.split('-');
      const eventDate = new Date(parts[0], parts[1] - 1, parts[2]);
      const formattedDate = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      content = {
        title: nextEv.title,
        label: formatLabel,
        date: formattedDate
      };
    }

    setToastState({ show: false, hide: false, message: content });

    const showTimer = setTimeout(() => {
      setToastState(prev => ({ ...prev, show: true, hide: false }));
    }, 150);

    const hideTimer = setTimeout(() => {
      setToastState(prev => ({ ...prev, show: false, hide: true }));
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [events, isEventsFetched]);

  return (
    <div
      className={`lobby-toast ${toastState.show ? 'show' : ''} ${toastState.hide ? 'hide' : ''}`}
      id="lobby-toast"
    >
      <div className="toast-content">
        <div className="toast-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <div className="toast-text-wrapper">
          <div className="toast-heading">Upcoming Update</div>
          <div className="toast-message" id="toast-message-text">
            {toastState.message ? (
              <>
                <strong>{toastState.message.title}</strong>
                {toastState.message.label} on {toastState.message.date}
              </>
            ) : (
              'No upcoming placement updates scheduled.'
            )}
          </div>
        </div>
      </div>
      <div className="toast-progress-bar"></div>
    </div>
  );
}
