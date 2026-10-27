import React from 'react';

export default function Footer({ text = 'Official Placement & Student Registry Portal. Secured via Departmental Access Keys.' }) {
  return (
    <footer className="lobby-footer">
      <p>{text}</p>
    </footer>
  );
}
