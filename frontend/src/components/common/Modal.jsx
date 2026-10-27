import React from 'react';

export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay active"
      id="event-modal"
      onClick={(e) => {
        if (e.target.id === 'event-modal') {
          onClose();
        }
      }}
    >
      <div className="modal-card" id="modal-card-content">
        {children}
      </div>
    </div>
  );
}
