import React, { useEffect, useState } from 'react';

export default function WavingMan() {
  const [show, setShow] = useState(false);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setShow(true);
      setHide(false);
    }, 150);

    const hideTimer = setTimeout(() => {
      setShow(false);
      setHide(true);
    }, 4000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <>
      {/* Toast Alert */}
      <div className={`lobby-toast ${show ? 'show' : ''} ${hide ? 'hide' : ''}`} id="spc-toast">
        <div className="toast-content">
          <div className="toast-icon" style={{ color: 'var(--gold-satin)' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="toast-text-wrapper">
            <div
              className="toast-heading"
              style={{ color: 'var(--wood-dark)', fontSize: '1.1rem', fontWeight: 700 }}
            >
              Welcome dear SPC
            </div>
            <div className="toast-message" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              I hope you are doing well.
            </div>
          </div>
        </div>
        <div
          className="toast-progress-bar"
          style={{ backgroundColor: 'var(--gold-satin)', animationDuration: '4s', width: '100%' }}
        />
      </div>

      {/* Stick Figure Waving Animation */}
      <div
        className={`waving-man-container ${show ? 'show' : ''} ${hide ? 'hide' : ''}`}
        id="waving-man"
      >
        <div className="waving-man-bubble">We ❤️ you SPC!</div>
        <svg viewBox="0 0 120 64" className="waving-man-svg">
          {/* Left Stick Man */}
          <g className="stick-man-left">
            <path d="M18 60 C18 42, 42 42, 42 60" fill="var(--wood-light)" />
            <circle cx="30" cy="26" r="9" fill="var(--gold-light)" stroke="var(--wood-dark)" strokeWidth="1.5" />
            <path
              className="waving-arm-left"
              d="M35 34 C40 30, 46 18, 44 16 C42 14, 38 22, 35 30"
              fill="none"
              stroke="var(--wood-dark)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M25 34 C20 38, 16 48, 18 50"
              fill="none"
              stroke="var(--wood-dark)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="27" cy="24" r="0.8" fill="var(--wood-dark)" />
            <circle cx="33" cy="24" r="0.8" fill="var(--wood-dark)" />
            <path
              d="M27 29 Q30 31 33 29"
              fill="none"
              stroke="var(--wood-dark)"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </g>

          {/* Middle Stick Man */}
          <g className="stick-man-mid">
            <path d="M48 60 C48 40, 72 40, 72 60" fill="var(--wood-medium)" />
            <circle cx="60" cy="24" r="10" fill="var(--gold-light)" stroke="var(--wood-dark)" strokeWidth="1.5" />
            <path
              className="waving-arm-mid"
              d="M66 32 C72 28, 80 14, 78 12 C76 10, 70 20, 66 28"
              fill="none"
              stroke="var(--wood-dark)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M54 32 C48 36, 42 48, 44 50"
              fill="none"
              stroke="var(--wood-dark)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="57" cy="22" r="1" fill="var(--wood-dark)" />
            <circle cx="63" cy="22" r="1" fill="var(--wood-dark)" />
            <path
              d="M57 27 Q60 30 63 27"
              fill="none"
              stroke="var(--wood-dark)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </g>

          {/* Right Stick Man */}
          <g className="stick-man-right">
            <path d="M78 60 C78 42, 102 42, 102 60" fill="var(--wood-light)" />
            <circle cx="90" cy="26" r="9" fill="var(--gold-light)" stroke="var(--wood-dark)" strokeWidth="1.5" />
            <path
              className="waving-arm-right"
              d="M95 34 C100 30, 106 18, 104 16 C102 14, 98 22, 95 30"
              fill="none"
              stroke="var(--wood-dark)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M85 34 C80 38, 76 48, 78 50"
              fill="none"
              stroke="var(--wood-dark)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="87" cy="24" r="0.8" fill="var(--wood-dark)" />
            <circle cx="93" cy="24" r="0.8" fill="var(--wood-dark)" />
            <path
              d="M87 29 Q90 31 93 29"
              fill="none"
              stroke="var(--wood-dark)"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>
    </>
  );
}
