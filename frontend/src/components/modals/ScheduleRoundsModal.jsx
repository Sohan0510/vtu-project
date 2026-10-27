import React, { useState } from 'react';
import { createEventApi, updateEventApi, deleteEventApi } from '../../services/api.js';

export default function ScheduleRoundsModal({ event, onClose, onScheduled }) {
  const isTbd = !event.date || event.date.trim().toUpperCase() === 'TBD';
  const todayStr = new Date().toISOString().split('T')[0];

  const existingSubtypes = (Array.isArray(event.subtypes) ? event.subtypes : [])
    .map((s) => String(s).trim())
    .filter((s) => s.length > 0);

  const standardRounds = ['OA', 'Technical', 'HR', 'Interview', 'PPT', 'GD', 'Full Drive'];
  const availableRounds = [...existingSubtypes];
  standardRounds.forEach((r) => {
    if (!availableRounds.some((a) => a.toLowerCase() === r.toLowerCase())) {
      availableRounds.push(r);
    }
  });

  let descSnippet = '';
  if (event.desc) {
    const firstLine = event.desc.split(/\r?\n/).find((l) => l.trim().length > 0) || '';
    descSnippet = firstLine.replace(/[*#_•\-]/g, '').trim();
    if (descSnippet.length > 90) descSnippet = descSnippet.substring(0, 87) + '...';
  }

  const [rows, setRows] = useState([
    {
      id: 1,
      stage: existingSubtypes[0] || 'OA',
      customStage: '',
      date: todayStr,
      mode: event.mode || 'online',
    },
  ]);
  const [keepTbd, setKeepTbd] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const scheduledStages = rows.map((r) =>
    (r.stage === 'Custom' ? r.customStage || 'Custom' : r.stage).trim().toLowerCase()
  );
  const remaining = existingSubtypes.filter(
    (s) => !scheduledStages.includes(s.toLowerCase())
  );

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        stage: availableRounds[0] || 'Technical',
        customStage: '',
        date: todayStr,
        mode: event.mode || 'online',
      },
    ]);
  };

  const removeRow = (idx) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRow = (idx, field, val) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    for (const r of rows) {
      if (r.stage === 'Custom' && !r.customStage.trim()) {
        setErrorMsg('Please specify custom stage name.');
        return;
      }
      if (!r.date) {
        setErrorMsg('Please specify confirmed dates for all rounds.');
        return;
      }
    }

    setSubmitting(true);

    try {
      const scheduledRoundNames = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const stageName = row.stage === 'Custom' ? row.customStage.trim() : row.stage.trim();
        scheduledRoundNames.push(stageName);

        const newEventId = Date.now() + Math.floor(Math.random() * 10000) + i * 37;
        const newEvent = {
          id: newEventId,
          title: event.title,
          type: event.type || 'exams',
          mode: row.mode || event.mode || 'online',
          location: event.location || 'rvce',
          studentType: event.studentType || null,
          subtypes: [stageName],
          date: row.date,
          desc: event.desc,
        };

        await createEventApi(newEvent);
      }

      if (isTbd) {
        if (keepTbd) {
          const scheduledLower = scheduledRoundNames.map((s) => s.toLowerCase());
          const remainingSubtypes = (event.subtypes || []).filter(
            (s) => !scheduledLower.includes(String(s).trim().toLowerCase())
          );

          await updateEventApi({
            ...event,
            subtypes: remainingSubtypes,
          });
        } else {
          await deleteEventApi(event.id);
        }
      }

      onScheduled();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to schedule event.');
      setSubmitting(false);
    }
  };

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
    <>
      <div className="modal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '1.55rem',
              fontWeight: 700,
              color: 'var(--wood-dark)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            📅 Schedule Rounds for {event.title}
          </h3>
        </div>
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
      </div>

      <div className="schedule-modal-content">
        <div className="schedule-company-banner">
          <div className="schedule-banner-top">
            <span className="schedule-company-name">{event.title}</span>
            <div className="schedule-banner-tags">
              {event.studentType && (
                <span
                  className={`tbd-mode-tag mode-studenttype-${event.studentType
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')}`}
                >
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
            </div>
          </div>
          {descSnippet && <div className="schedule-banner-desc">{descSnippet}</div>}
        </div>

        <p className="schedule-intro-text">
          Select recruitment rounds (e.g. <strong>OA</strong>, <strong>Technical</strong>,{' '}
          <strong>HR</strong>) and set confirmed dates. Duplicate events will be placed on the live
          calendar with complete company details preserved.
        </p>

        <div id="schedule-rows-container" className="schedule-rows-list">
          {rows.map((row, index) => {
            const isCustom = row.stage === 'Custom';
            const currentStageName = isCustom ? row.customStage || 'Custom' : row.stage;

            return (
              <div key={row.id} className="schedule-round-card">
                <div className="schedule-round-header">
                  <div className="schedule-round-title">
                    <span className="schedule-round-number">Round {index + 1}</span>
                    <span className="schedule-round-badge">{currentStageName}</span>
                  </div>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      className="schedule-remove-row-btn"
                      onClick={() => removeRow(index)}
                      title="Remove this round date"
                    >
                      &times; Remove
                    </button>
                  )}
                </div>

                <div className="schedule-field-group">
                  <label className="schedule-field-label">Select Round / Stage</label>
                  <div className="schedule-pills-list">
                    {availableRounds.map((rnd) => {
                      const isSelected =
                        !isCustom && row.stage.toLowerCase() === rnd.toLowerCase();
                      return (
                        <button
                          key={rnd}
                          type="button"
                          className={`schedule-stage-pill ${isSelected ? 'active' : ''}`}
                          onClick={() => {
                            updateRow(index, 'stage', rnd);
                          }}
                        >
                          {rnd}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      className={`schedule-stage-pill ${isCustom ? 'active' : ''}`}
                      onClick={() => updateRow(index, 'stage', 'Custom')}
                    >
                      Custom...
                    </button>
                  </div>
                  {isCustom && (
                    <input
                      type="text"
                      className="schedule-custom-stage-input"
                      placeholder="Type stage name (e.g. Coding Test 2, Hackathon...)"
                      value={row.customStage}
                      onChange={(e) => updateRow(index, 'customStage', e.target.value)}
                    />
                  )}
                </div>

                <div className="schedule-grid-row">
                  <div className="schedule-field-group" style={{ flex: 1.4 }}>
                    <label className="schedule-field-label">Confirmed Date</label>
                    <input
                      type="date"
                      className="schedule-date-input"
                      value={row.date}
                      onChange={(e) => updateRow(index, 'date', e.target.value)}
                      required
                    />
                  </div>
                  <div className="schedule-field-group" style={{ flex: 1 }}>
                    <label className="schedule-field-label">Mode / Format</label>
                    <div className="format-buttons-group">
                      <button
                        type="button"
                        className={`format-btn ${row.mode === 'online' ? 'active' : ''}`}
                        onClick={() => updateRow(index, 'mode', 'online')}
                      >
                        Online
                      </button>
                      <button
                        type="button"
                        className={`format-btn ${row.mode === 'offline' ? 'active' : ''}`}
                        onClick={() => updateRow(index, 'mode', 'offline')}
                      >
                        Offline
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="schedule-add-row-wrapper">
          <button type="button" className="schedule-add-btn" onClick={addRow}>
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="none"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>+ Add another round on a different date (e.g. Technical / Interview)</span>
          </button>
        </div>

        {isTbd ? (
          <div className="schedule-pipeline-box">
            <label className="schedule-checkbox-label" htmlFor="schedule-keep-tbd">
              <input
                type="checkbox"
                id="schedule-keep-tbd"
                checked={keepTbd}
                onChange={(e) => setKeepTbd(e.target.checked)}
              />
              <div className="schedule-checkbox-content">
                <span className="schedule-checkbox-title">
                  {remaining.length > 0
                    ? `Keep in Upcoming / TBD for remaining rounds (${remaining.join(', ')})`
                    : 'Keep in Upcoming / TBD pipeline for future updates'}
                </span>
                <span className="schedule-checkbox-hint">
                  {remaining.length > 0
                    ? `"${event.title}" will remain in TBD with rounds: ${remaining.join(
                        ', '
                      )}. You can set their dates later.`
                    : `Uncheck if all rounds are scheduled and you want to remove "${event.title}" from the TBD sidebar.`}
                </span>
              </div>
            </label>
          </div>
        ) : (
          <div
            className="schedule-pipeline-box"
            style={{
              background: 'rgba(37, 99, 235, 0.05)',
              borderColor: 'rgba(37, 99, 235, 0.2)',
            }}
          >
            <div style={{ fontSize: '0.82rem', color: '#1e40af', lineHeight: 1.45 }}>
              💡 <strong>Multi-Date Scheduling:</strong> This will create duplicate calendar
              events on the selected dates for the new rounds while preserving company details.
            </div>
          </div>
        )}

        {errorMsg && (
          <div
            id="schedule-error-msg"
            className="login-error-msg"
            style={{ display: 'block', marginTop: '12px' }}
          >
            {errorMsg}
          </div>
        )}
      </div>

      <div
        className="form-submit-group"
        style={{
          paddingTop: '14px',
          borderTop: '1px solid var(--border-gold)',
          marginTop: '14px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
        }}
      >
        <button type="button" className="form-cancel-btn" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="form-submit-btn"
          style={{
            background: 'linear-gradient(135deg, #059669, #047857)',
            color: 'white',
            border: 'none',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          disabled={submitting}
          onClick={handleSubmit}
        >
          <span>{submitting ? 'Scheduling...' : 'Confirm Date & Schedule'}</span>
        </button>
      </div>
    </>
  );
}
