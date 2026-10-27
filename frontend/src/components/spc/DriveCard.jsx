import React from 'react';

export default function DriveCard({
  iconBg,
  iconColor,
  icon,
  title,
  badgeText,
  badgeBg,
  badgeColor,
  badgeBorder,
  desc,
  linkText,
  linkHref,
  marginBottom = '20px',
}) {
  return (
    <div
      className="spc-drive-card"
      style={{
        marginBottom,
        background: 'var(--cream-card)',
        border: '1px solid var(--border-gold)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        boxShadow: 'var(--shadow-premium)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '250px' }}>
        <div
          style={{
            background: iconBg,
            padding: '12px',
            borderRadius: '50%',
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h3
              style={{
                margin: 0,
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--wood-dark)',
              }}
            >
              {title}
            </h3>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                background: badgeBg,
                color: badgeColor,
                padding: '2px 8px',
                borderRadius: '12px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                border: badgeBorder ? `1px solid ${badgeBorder}` : 'none',
              }}
            >
              {badgeText}
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {desc}
          </p>
        </div>
      </div>
      <a
        href={linkHref}
        target="_blank"
        rel="noopener noreferrer"
        className="spc-open-btn"
        style={{
          flexShrink: 0,
          padding: '10px 18px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 700,
          backgroundColor: 'var(--wood-dark)',
          color: 'var(--gold-light)',
          borderColor: 'var(--wood-dark)',
        }}
      >
        {linkText}
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </div>
  );
}
