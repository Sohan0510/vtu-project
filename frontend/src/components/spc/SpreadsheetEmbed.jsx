import React from 'react';
import { SPREADSHEET_LINKS } from '../../config/spreadsheetConfig.js';

export default function SpreadsheetEmbed({
  title = 'Placed Data (Live Preview)',
  openLink = SPREADSHEET_LINKS.placedDataOpen,
  embedUrl = SPREADSHEET_LINKS.placedDataEmbed,
}) {

  return (
    <div className="spc-spreadsheet-container">
      <div className="spc-spreadsheet-header">
        <span>{title}</span>
        <a href={openLink} target="_blank" rel="noopener noreferrer" className="spc-open-btn">
          Open Placed Data
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
      <div className="spc-iframe-wrapper">
        <iframe
          src={embedUrl}
          width="100%"
          height="600"
          title="Google Spreadsheet Embed"
        />
      </div>
    </div>
  );
}
