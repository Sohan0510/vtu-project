import React from 'react';
import { useNavigate } from 'react-router-dom';
import ViewHeaderBar from '../components/layout/ViewHeaderBar.jsx';
import DriveCard from '../components/spc/DriveCard.jsx';
import SpreadsheetEmbed from '../components/spc/SpreadsheetEmbed.jsx';
import WavingMan from '../components/spc/WavingMan.jsx';
import { SPREADSHEET_LINKS } from '../config/spreadsheetConfig.js';


export default function SPCPanel() {
  const navigate = useNavigate();

  return (
    <div className="spc-container">
      {/* 4-second welcoming animation & greeting toast */}
      <WavingMan />

      <ViewHeaderBar
        onBack={() => navigate('/')}
        backLabel="Return to Registry"
        title="SPC Control Panel"
        subtitle="Official Placement Coordinator Database"
      />

      {/* Priority Drive Card */}
      <DriveCard
        iconBg="#fff7ed"
        iconColor="#c2410c"
        icon={
          <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        }
        title="All Placement Data Drive"
        badgeText="Priority"
        badgeBg="#fff7ed"
        badgeColor="#c2410c"
        badgeBorder="#ffedd5"
        desc="Central Google Drive repository for student resumes, criteria spreadsheets, and recruitment drives data."
        linkText="Open Placement Drive"
        linkHref={SPREADSHEET_LINKS.placementDrive}
        marginBottom="20px"
      />

      {/* Students Database Card */}
      <DriveCard
        iconBg="#ecfdf5"
        iconColor="#059669"
        icon={
          <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        }
        title="Students Database"
        badgeText="Active"
        badgeBg="#e0f2fe"
        badgeColor="#0369a1"
        badgeBorder="#bae6fd"
        desc="Master spreadsheet tracking student registrations, branch details, eligibility parameters, and contact info."
        linkText="Open Students Database"
        linkHref={SPREADSHEET_LINKS.studentsDatabase}
        marginBottom="30px"
      />


      {/* Embedded Placed Data Sheet */}
      <SpreadsheetEmbed />
    </div>
  );
}
