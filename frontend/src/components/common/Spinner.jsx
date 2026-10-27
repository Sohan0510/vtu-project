import React from 'react';

export default function Spinner({ active }) {
  return (
    <div id="spinner" className={`spinner-container ${active ? 'active' : ''}`}>
      <div className="spinner"></div>
    </div>
  );
}
