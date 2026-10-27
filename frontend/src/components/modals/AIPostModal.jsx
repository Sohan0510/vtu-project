import React, { useState } from 'react';
import { useAIParseMutation } from '../../hooks/useApiQueries.js';

export default function AIPostModal({ onClose, onParsed }) {
  const [rawText, setRawText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const aiParseMutation = useAIParseMutation();

  const handleAnalyze = async () => {
    if (!rawText.trim()) {
      setErrorMsg('Please paste the raw placement text to parse.');
      return;
    }

    setErrorMsg('');

    try {
      const parsedEvents = await aiParseMutation.mutateAsync(rawText.trim());
      onParsed(parsedEvents);
    } catch (err) {
      console.error(err);
      setErrorMsg(
        'AI service was busy or failed to parse. Please verify the dates and formatting and try again.'
      );
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
          <span style={{ fontSize: '1.4rem' }}>✨</span> AI Quick Post Placement Update
        </h3>
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
      </div>
      <div style={{ padding: '20px' }}>
        <p
          style={{
            margin: '0 0 15px 0',
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.4,
          }}
        >
          Paste the raw company notification, email criteria, or WhatsApp update text below. The AI
          will automatically parse the company name, dates, rounds, compensation, and eligibility
          criteria to generate the calendar events.
        </p>
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label
            htmlFor="ai-raw-text"
            style={{
              fontWeight: 600,
              marginBottom: '6px',
              display: 'block',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
            }}
          >
            Raw Placement Text / Notification
          </label>
          <textarea
            id="ai-raw-text"
            rows={8}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid var(--border-gold)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.88rem',
              lineHeight: 1.5,
              resize: 'vertical',
            }}
            placeholder="e.g. Google visiting. OA on 2026-08-10. Technical rounds on 2026-08-12. CTC: 35 LPA. Eligible branches: CSE, ISE. CGPA >= 7.5. No active backlogs."
          />
        </div>
        {errorMsg && (
          <div
            id="ai-post-error"
            className="login-error-msg active"
            style={{ marginBottom: '15px' }}
          >
            {errorMsg}
          </div>
        )}
        <div className="form-submit-group" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="button" className="form-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="form-submit-btn"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: 'white',
              border: 'none',
            }}
            disabled={aiParseMutation.isPending}
            onClick={handleAnalyze}
          >
            {aiParseMutation.isPending ? 'Analyzing with AI...' : 'Analyze & Parse with AI'}
          </button>
        </div>
      </div>
    </>
  );
}
