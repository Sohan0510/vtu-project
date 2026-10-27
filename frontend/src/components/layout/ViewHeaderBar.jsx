import React from 'react';
import BackButton from '../common/BackButton.jsx';

export default function ViewHeaderBar({ onBack, backLabel, title, subtitle, rightElement }) {
  return (
    <div className="view-header-bar">
      {onBack && <BackButton onClick={onBack} label={backLabel} />}
      {rightElement}
      <div className="view-title-wrapper">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  );
}
