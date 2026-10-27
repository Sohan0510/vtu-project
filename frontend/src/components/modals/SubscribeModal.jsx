import React from 'react';

export default function SubscribeModal({ onClose }) {
  return (
    <>
      <div className="modal-header">
        <span
          className="modal-category event-exams"
          style={{ background: '#4285F4', color: 'white' }}
        >
          Google Calendar Sync
        </span>
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
      </div>
      <div style={{ padding: '10px 0' }}>
        <p style={{ marginBottom: '15px', lineHeight: 1.5, color: '#333' }}>
          You are about to subscribe to the live <strong>Placement Calendar</strong>. All placement
          drives, exams, and holidays will be automatically added to your personal Google Calendar
          and will stay updated in real-time.
        </p>
        <div
          style={{
            background: '#f8f9fa',
            borderLeft: '4px solid #fbbc05',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          <strong style={{ display: 'block', marginBottom: '5px', color: '#d93025' }}>
            💡 Pro Tip: Homescreen Widget
          </strong>
          <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>
            After subscribing, add a Google Calendar widget directly to your phone's homescreen. You
            will instantly see all live placement updates at a glance without even opening the app!
          </p>
        </div>
        <div
          className="modal-actions"
          style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}
        >
          <button
            className="modal-btn cancel-btn"
            onClick={onClose}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <a
            href="https://calendar.google.com/calendar/r?cid=830563c902db01ba6c39b8914eb647d8954734b8299b1d23fafb10c462e263a0@group.calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="modal-btn"
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: '#4285F4',
              color: 'white',
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            Continue to Calendar
          </a>
        </div>
      </div>
    </>
  );
}
