import React, { useState } from 'react';
import { formatLocalDate } from '../../utils/formatDate.js';

export default function EditEventModal({ event, onClose, onSaved, onCancelToDetail }) {
  const isInitialTbd = !event.date || event.date.trim().toUpperCase() === 'TBD';

  const [title, setTitle] = useState(event.title || '');
  const [type, setType] = useState(event.type || 'exams');
  const [mode, setMode] = useState(event.mode || '');
  const [location, setLocation] = useState(event.location || '');
  const [studentType, setStudentType] = useState(event.studentType || '');
  const [subtypes, setSubtypes] = useState(Array.isArray(event.subtypes) ? event.subtypes : []);
  const [isTbd, setIsTbd] = useState(isInitialTbd);
  const [date, setDate] = useState(isInitialTbd ? '' : event.date || '');
  const [desc, setDesc] = useState(event.desc || '');
  const [saving, setSaving] = useState(false);

  const toggleSubtype = (val) => {
    setSubtypes((prev) =>
      prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isTbd && !date) {
      alert('Please choose a valid scheduled date or select Date is TBD.');
      return;
    }

    setSaving(true);

    const updatedEvent = {
      id: event.id,
      title: title.trim(),
      type,
      mode: mode || null,
      location: location || null,
      studentType: studentType || null,
      subtypes,
      date: isTbd ? 'TBD' : date,
      desc: desc.trim(),
    };

    try {
      await onSaved(updatedEvent);
      onClose();
    } catch (err) {
      alert('Failed to update event: ' + err.message);
      setSaving(false);
    }
  };

  return (
    <>
      <div className="modal-header">
        <h3>Edit Placement Update</h3>
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
      </div>
      <form id="edit-event-form" className="modal-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="form-title">Company Name</label>
          <input
            type="text"
            id="form-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Google India"
          />
        </div>
        <div className="form-group">
          <label htmlFor="form-type">Update Type</label>
          <select id="form-type" value={type} onChange={(e) => setType(e.target.value)} required>
            <option value="exams">Interviews & Tests</option>
            <option value="holidays">Holidays & Breaks</option>
          </select>
        </div>
        <div className="form-group">
          <label>Drive Format</label>
          <div className="format-buttons-group">
            <button
              type="button"
              className={`format-btn ${mode === 'online' ? 'active' : ''}`}
              id="format-btn-online"
              onClick={() => setMode(mode === 'online' ? '' : 'online')}
            >
              Online
            </button>
            <button
              type="button"
              className={`format-btn ${mode === 'offline' ? 'active' : ''}`}
              id="format-btn-offline"
              onClick={() => setMode(mode === 'offline' ? '' : 'offline')}
            >
              Offline
            </button>
          </div>
        </div>
        <div className="form-group">
          <label>Location</label>
          <div className="location-buttons-group">
            <button
              type="button"
              className={`location-btn ${location === 'rvce' ? 'active' : ''}`}
              id="location-btn-rvce"
              onClick={() => setLocation(location === 'rvce' ? '' : 'rvce')}
            >
              RVCE
            </button>
            <button
              type="button"
              className={`location-btn ${location === 'rvitm' ? 'active' : ''}`}
              id="location-btn-rvitm"
              onClick={() => setLocation(location === 'rvitm' ? '' : 'rvitm')}
            >
              RVITM
            </button>
            <button
              type="button"
              className={`location-btn ${location === 'worksite' ? 'active' : ''}`}
              id="location-btn-worksite"
              onClick={() => setLocation(location === 'worksite' ? '' : 'worksite')}
            >
              Worksite
            </button>
          </div>
        </div>
        <div className="form-group">
          <label>
            Student Type <span className="form-label-optional">(optional)</span>
          </label>
          <div className="studenttype-buttons-group">
            <button
              type="button"
              className={`studenttype-btn ${studentType === 'BE' ? 'active' : ''}`}
              id="studenttype-btn-be"
              onClick={() => setStudentType(studentType === 'BE' ? '' : 'BE')}
            >
              BE
            </button>
            <button
              type="button"
              className={`studenttype-btn ${studentType === 'MCA' ? 'active' : ''}`}
              id="studenttype-btn-mca"
              onClick={() => setStudentType(studentType === 'MCA' ? '' : 'MCA')}
            >
              MCA
            </button>
            <button
              type="button"
              className={`studenttype-btn ${studentType === 'BE | MCA' ? 'active' : ''}`}
              id="studenttype-btn-bemca"
              onClick={() => setStudentType(studentType === 'BE | MCA' ? '' : 'BE | MCA')}
            >
              BE | MCA
            </button>
          </div>
        </div>
        <div className="form-group">
          <label>Rounds</label>
          <div className="subtypes-buttons-group">
            {['PPT', 'OA', 'Technical'].map((rnd) => (
              <button
                key={rnd}
                type="button"
                className={`subtype-btn ${subtypes.includes(rnd) ? 'active' : ''}`}
                onClick={() => toggleSubtype(rnd)}
              >
                {rnd}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px',
            }}
          >
            <label htmlFor="form-date" style={{ margin: 0, fontWeight: 600 }}>
              Scheduled Date
            </label>
            <label
              style={{
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                color: '#b45309',
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                id="form-is-tbd"
                checked={isTbd}
                onChange={(e) => {
                  setIsTbd(e.target.checked);
                  if (!e.target.checked && !date) {
                    setDate(formatLocalDate(new Date()));
                  }
                }}
              />
              <span>Date is TBD (Unconfirmed)</span>
            </label>
          </div>
          <input
            type="date"
            id="form-date"
            value={isTbd ? '' : date}
            disabled={isTbd}
            onChange={(e) => setDate(e.target.value)}
            style={{ background: isTbd ? '#f3f4f6' : 'white' }}
          />
        </div>
        <div className="form-group">
          <label htmlFor="form-desc">Details / Description</label>
          <textarea
            id="form-desc"
            rows={4}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Describe placement criteria, eligibility, compensation..."
          />
        </div>
        <div className="form-submit-group">
          <button
            type="button"
            className="form-cancel-btn"
            id="form-cancel-edit"
            onClick={onCancelToDetail || onClose}
          >
            Cancel
          </button>
          <button type="submit" className="form-submit-btn" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </>
  );
}
