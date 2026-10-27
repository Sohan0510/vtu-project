import React from 'react';

export default function NavCard({
  id,
  featured = false,
  icon,
  title,
  desc,
  actionText,
  onClick,
}) {
  return (
    <button
      className={`nav-card ${featured ? 'featured-card' : ''}`}
      id={id}
      onClick={onClick}
    >
      <div className="card-icon">{icon}</div>
      <div className="card-title">{title}</div>
      <div className="card-desc">{desc}</div>
      <div className="card-action">{actionText}</div>
    </button>
  );
}
