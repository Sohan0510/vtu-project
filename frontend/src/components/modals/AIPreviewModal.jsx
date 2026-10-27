import React, { useState } from 'react';
import { API_BASE_URL } from '../../services/api.js';

export default function AIPreviewModal({ initialEvents, onClose, onBack, onConfirmed }) {
  const [events, setEvents] = useState(
    initialEvents.map((ev) => ({
      title: ev.title || 'Placement Update',
      type: ev.type || 'exams',
      isTbd: ev.date === 'TBD' || ev.isTbd === true || !ev.date,
      date: ev.date === 'TBD' || ev.isTbd === true || !ev.date ? '' : ev.date,
      mode: ev.mode || 'online',
      location: ev.location || 'rvitm',
      studentType: ev.studentType || '',
      subtypes: Array.isArray(ev.subtypes) ? ev.subtypes : [],
      desc: ev.desc || '',
    }))
  );

  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateEvent = (idx, field, value) => {
    setEvents((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const removeEvent = (idx) => {
    setEvents((prev) => {
      const copy = prev.filter((_, i) => i !== idx);
      if (copy.length === 0) {
        onClose();
      }
      return copy;
    });
  };

  const toggleSubtype = (idx, val) => {
    setEvents((prev) => {
      const copy = [...prev];
      const cur = copy[idx].subtypes;
      copy[idx].subtypes = cur.includes(val) ? cur.filter((s) => s !== val) : [...cur, val];
      return copy;
    });
  };

  const handleConfirm = async () => {
    if (events.length === 0) {
      onClose();
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '';


    try {
      const addedEvents = [];
      for (const ev of events) {
        if (!ev.title || (!ev.date && !ev.isTbd)) {
          throw new Error('Title and a valid Date (or Date TBD) are required for all events.');
        }

        const newEvent = {
          id: Date.now() + Math.floor(Math.random() * 10000) + addedEvents.length,
          title: ev.title.trim(),
          type: ev.type,
          mode: ev.mode || null,
          location: ev.location || null,
          studentType: ev.studentType || null,
          subtypes: ev.subtypes,
          date: ev.isTbd ? 'TBD' : ev.date,
          desc: ev.desc.trim(),
        };

        const res = await fetch(`${API_BASE_URL}/api/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newEvent),
        });

        if (!res.ok) throw new Error(`Failed to post event for ${ev.title}`);
        addedEvents.push(newEvent);
      }

      onConfirmed(addedEvents);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to post updates. Verify fields and connection.');
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="modal-header">
        <h3
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '1.6rem',
            fontWeight: 700,
            color: 'var(--wood-dark)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          ✨ Review AI Generated Updates
        </h3>
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
      </div>
      <div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
        <p
          style={{
            margin: '0 0 15px 0',
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.4,
          }}
        >
          We found {events.length} event(s) in your text. Tweak any values below before posting them
          to the calendar.
        </p>

        {events.map((ev, idx) => (
          <div
            key={idx}
            className="ai-event-card"
            style={{
              border: '1px solid var(--border-gold)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: '20px',
              background: 'var(--cream-card)',
              position: 'relative',
              textAlign: 'left',
            }}
          >
            <button
              type="button"
              className="ai-delete-card-btn"
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                border: 'none',
                background: 'transparent',
                color: '#dc2626',
                fontSize: '1.2rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
              }}
              title="Remove this event"
              onClick={() => removeEvent(idx)}
            >
              &times;
            </button>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label
                style={{
                  fontWeight: 600,
                  marginBottom: '4px',
                  display: 'block',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Company / Title
              </label>
              <input
                type="text"
                value={ev.title}
                onChange={(e) => updateEvent(idx, 'title', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-gold)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontFamily: "'Inter', sans-serif",
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                marginBottom: '12px',
                alignItems: 'flex-end',
              }}
            >
              <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px',
                  }}
                >
                  <label
                    style={{
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      margin: 0,
                    }}
                  >
                    Date
                  </label>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      color: '#b45309',
                      fontWeight: 600,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={ev.isTbd}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        updateEvent(idx, 'isTbd', checked);
                        if (!checked && !ev.date) {
                          updateEvent(idx, 'date', new Date().toISOString().split('T')[0]);
                        }
                      }}
                    />
                    <span>Date TBD</span>
                  </label>
                </div>
                <input
                  type="date"
                  value={ev.date}
                  disabled={ev.isTbd}
                  onChange={(e) => updateEvent(idx, 'date', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid var(--border-gold)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontFamily: "'Inter', sans-serif",
                    height: '35px',
                    background: ev.isTbd ? '#f3f4f6' : 'white',
                  }}
                />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: '120px' }}>
                <label
                  style={{
                    fontWeight: 600,
                    marginBottom: '4px',
                    display: 'block',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Type
                </label>
                <select
                  value={ev.type}
                  onChange={(e) => updateEvent(idx, 'type', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid var(--border-gold)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    height: '35px',
                    background: 'white',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <option value="exams">Interviews & Tests</option>
                  <option value="holidays">Holidays & Breaks</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '130px' }}>
                <label
                  style={{
                    fontWeight: 600,
                    marginBottom: '4px',
                    display: 'block',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Drive Format
                </label>
                <div className="format-buttons-group" style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className={`format-btn ${ev.mode === 'online' ? 'active' : ''}`}
                    onClick={() => updateEvent(idx, 'mode', ev.mode === 'online' ? '' : 'online')}
                    style={{ padding: '6px 12px', fontSize: '0.75rem', flex: 1 }}
                  >
                    Online
                  </button>
                  <button
                    type="button"
                    className={`format-btn ${ev.mode === 'offline' ? 'active' : ''}`}
                    onClick={() => updateEvent(idx, 'mode', ev.mode === 'offline' ? '' : 'offline')}
                    style={{ padding: '6px 12px', fontSize: '0.75rem', flex: 1 }}
                  >
                    Offline
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ flex: 2, minWidth: '200px' }}>
                <label
                  style={{
                    fontWeight: 600,
                    marginBottom: '4px',
                    display: 'block',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Location
                </label>
                <div className="location-buttons-group" style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className={`location-btn ${ev.location === 'rvce' ? 'active' : ''}`}
                    onClick={() => updateEvent(idx, 'location', ev.location === 'rvce' ? '' : 'rvce')}
                    style={{ padding: '6px 10px', fontSize: '0.75rem', flex: 1 }}
                  >
                    RVCE
                  </button>
                  <button
                    type="button"
                    className={`location-btn ${ev.location === 'rvitm' ? 'active' : ''}`}
                    onClick={() => updateEvent(idx, 'location', ev.location === 'rvitm' ? '' : 'rvitm')}
                    style={{ padding: '6px 10px', fontSize: '0.75rem', flex: 1 }}
                  >
                    RVITM
                  </button>
                  <button
                    type="button"
                    className={`location-btn ${ev.location === 'worksite' ? 'active' : ''}`}
                    onClick={() =>
                      updateEvent(idx, 'location', ev.location === 'worksite' ? '' : 'worksite')
                    }
                    style={{ padding: '6px 10px', fontSize: '0.75rem', flex: 1 }}
                  >
                    Worksite
                  </button>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label
                style={{
                  fontWeight: 600,
                  marginBottom: '4px',
                  display: 'block',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Student Type <span className="form-label-optional">(optional)</span>
              </label>
              <div className="studenttype-buttons-group" style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className={`studenttype-btn ${ev.studentType === 'BE' ? 'active' : ''}`}
                  onClick={() =>
                    updateEvent(idx, 'studentType', ev.studentType === 'BE' ? '' : 'BE')
                  }
                  style={{ padding: '6px 10px', fontSize: '0.75rem', flex: 1 }}
                >
                  BE
                </button>
                <button
                  type="button"
                  className={`studenttype-btn ${ev.studentType === 'MCA' ? 'active' : ''}`}
                  onClick={() =>
                    updateEvent(idx, 'studentType', ev.studentType === 'MCA' ? '' : 'MCA')
                  }
                  style={{ padding: '6px 10px', fontSize: '0.75rem', flex: 1 }}
                >
                  MCA
                </button>
                <button
                  type="button"
                  className={`studenttype-btn ${ev.studentType === 'BE | MCA' ? 'active' : ''}`}
                  onClick={() =>
                    updateEvent(idx, 'studentType', ev.studentType === 'BE | MCA' ? '' : 'BE | MCA')
                  }
                  style={{ padding: '6px 10px', fontSize: '0.75rem', flex: 1.5 }}
                >
                  BE | MCA
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label
                style={{
                  fontWeight: 600,
                  marginBottom: '4px',
                  display: 'block',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Rounds
              </label>
              <div className="subtypes-buttons-group" style={{ display: 'flex', gap: '6px' }}>
                {['PPT', 'OA', 'Technical'].map((rnd) => (
                  <button
                    key={rnd}
                    type="button"
                    className={`subtype-btn ${ev.subtypes.includes(rnd) ? 'active' : ''}`}
                    onClick={() => toggleSubtype(idx, rnd)}
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    {rnd}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label
                style={{
                  fontWeight: 600,
                  marginBottom: '4px',
                  display: 'block',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Description / Details
              </label>
              <textarea
                rows={4}
                value={ev.desc}
                onChange={(e) => updateEvent(idx, 'desc', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-gold)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontFamily: "'Inter', sans-serif",
                  lineHeight: 1.4,
                  resize: 'vertical',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {errorMsg && (
        <div id="ai-preview-error" className="login-error-msg active" style={{ margin: '0 20px 15px 20px' }}>
          {errorMsg}
        </div>
      )}

      <div
        className="form-submit-group"
        style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          padding: '20px',
          borderTop: '1px solid var(--border-gold)',
          background: 'var(--cream-dark)',
          borderBottomLeftRadius: 'var(--radius-lg)',
          borderBottomRightRadius: 'var(--radius-lg)',
        }}
      >
        <button type="button" className="form-cancel-btn" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="form-submit-btn"
          style={{
            background: 'linear-gradient(135deg, #059669, #047857)',
            color: 'white',
            border: 'none',
            fontWeight: 700,
          }}
          disabled={submitting}
          onClick={handleConfirm}
        >
          {submitting ? 'Posting Updates...' : 'Confirm & Post All'}
        </button>
      </div>
    </>
  );
}
