import React from 'react';
import { useNavigate } from 'react-router-dom';
import UserAuthBar from '../components/home/UserAuthBar.jsx';
import NavCard from '../components/home/NavCard.jsx';
import { SPREADSHEET_LINKS } from '../config/spreadsheetConfig.js';
import Toast from '../components/common/Toast.jsx';
import Footer from '../components/layout/Footer.jsx';

export default function Home({
  session,
  onLogout,
  events,
  isEventsFetched,
  onOpenSPCModal,
}) {
  const navigate = useNavigate();

  return (
    <div className="lobby-container">
      {session && <UserAuthBar session={session} onLogout={onLogout} />}

      {/* Upcoming events toast */}
      <Toast events={events} isEventsFetched={isEventsFetched} />

      <header className="lobby-header">
        <h1>PLACEMENT & STUDENT REGISTRY</h1>
        <p className="subtitle">RV INSTITUTE OF TECHNOLOGY & MANAGEMENT</p>
      </header>

      <div className="lobby-divider">
        <div className="diamond"></div>
      </div>

      <div className="navigation-grid">
        <NavCard
          id="btn-calendar"
          featured={true}
          icon={
            <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="1.5" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
          title="Placement Calendar"
          desc="Track active recruitment drives, mock interviews, placement tests, and system scheduler details."
          actionText="Open Calendar →"
          onClick={() => navigate('/calendar')}
        />

        <NavCard
          id="btn-marks-registry"
          icon={
            <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="1.5" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <circle cx="9" cy="9" r="1" />
            </svg>
          }
          title="Marks Registry"
          desc="Access student examinations database, calculate GPA indices, and query academic logs for CSE, ISE & ECE."
          actionText="Select Branch →"
          onClick={() => navigate('/registry-selector')}
        />

        <NavCard
          id="btn-blacklist"
          icon={
            <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="1.5" fill="none">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <line x1="17" y1="8" x2="23" y2="14"></line>
              <line x1="23" y1="8" x2="17" y2="14"></line>
            </svg>
          }
          title="Blacklisted Registry"
          desc="View the official database of academic debarments, eligibility warnings, and active placement restrictions."
          actionText="Open Registry →"
          onClick={() => {
            window.open(SPREADSHEET_LINKS.blacklistedRegistry, '_blank');
          }}
        />


        <NavCard
          id="btn-spc"
          icon={
            <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="1.5" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          }
          title="SPC Control Panel"
          desc="Access the Placement Coordinator management portal and embedded calendar configurations."
          actionText="Enter Portal →"
          onClick={onOpenSPCModal}
        />
      </div>

      <Footer />
    </div>
  );
}
