import React from 'react';

export default function BackButton({ onClick, label = 'Return to Registry', id }) {
  return (
    <button className="btn-back" id={id} onClick={onClick}>
      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
        <line x1="19" y1="12" x2="5" y2="12"/>
        <polyline points="12 19 5 12 12 5"/>
      </svg>
      {label}
    </button>
  );
}
