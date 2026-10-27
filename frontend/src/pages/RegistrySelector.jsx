import React from 'react';
import { useNavigate } from 'react-router-dom';
import ViewHeaderBar from '../components/layout/ViewHeaderBar.jsx';
import NavCard from '../components/home/NavCard.jsx';

export default function RegistrySelector() {
  const navigate = useNavigate();

  return (
    <div className="selector-container">
      <ViewHeaderBar
        onBack={() => navigate('/')}
        backLabel="Return to Dashboard"
        title="Marks Registry"
        subtitle="Select Branch Academic Database"
      />

      <div className="navigation-grid" style={{ marginTop: '40px' }}>
        <NavCard
          id="btn-cse"
          icon={
            <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="1.5" fill="none">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 11l2 2 4-4" />
            </svg>
          }
          title="CSE Marks Registry"
          desc="Access student examinations database, calculate GPA indices, and query academic logs."
          actionText="Enter Registry →"
          onClick={() => navigate('/cse')}
        />

        <NavCard
          id="btn-ise"
          icon={
            <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="1.5" fill="none">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          }
          title="ISE Marks Registry"
          desc="Access student examinations database, calculate GPA indices, and query academic logs."
          actionText="Visit Portal →"
          onClick={() => {
            window.location.href = 'https://placements-rvitm.netlify.app/student';
          }}
        />

        <NavCard
          id="btn-ece"
          icon={
            <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="1.5" fill="none">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          title="ECE Marks Registry"
          desc="Access student examinations database, calculate GPA indices, and query academic logs."
          actionText="Enter Registry →"
          onClick={() => navigate('/ece')}
        />
      </div>
    </div>
  );
}
