import React from 'react';

export default function ProfileCard({ studentData, semesterCount, isECE = false }) {
  if (!studentData) return null;

  const initials = (studentData.name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2);

  if (isECE) {
    return (
      <div className="profile-card" id="profile-card">
        <div className="profile-avatar">{initials}</div>
        <div className="profile-info">
          <div className="profile-name">{studentData.name || 'Unknown'}</div>
          <div className="profile-usn">{studentData.usn} &bull; ECE Department Registry</div>
        </div>
        <div className="score-cards">
          <div className="score-card cgpa-card">
            <div className="score-val">{studentData.cgpa || '-'}</div>
            <div className="score-lbl">Overall CGPA</div>
          </div>
        </div>
      </div>
    );
  }

  const activeBacklogCount = studentData.active_backlog_count || 0;
  const hasHistoricalBacklogs = studentData.historical_backlogs || false;

  return (
    <div className="profile-card" id="profile-card">
      <div className="profile-avatar">{initials}</div>
      <div className="profile-info">
        <div className="profile-name">{studentData.name || 'Unknown'}</div>
        <div className="profile-usn">
          {studentData.usn} &bull; {semesterCount} Semester{semesterCount > 1 ? 's' : ''} Record
        </div>
      </div>
      <div className="score-cards">
        <div className="score-card sgpa-card">
          <div className="score-val">{studentData.sgpa || '-'}</div>
          <div className="score-lbl">Latest SGPA</div>
        </div>
        <div className="score-card cgpa-card">
          <div className="score-val">{studentData.cgpa || '-'}</div>
          <div className="score-lbl">Overall CGPA</div>
        </div>
        <div className={`score-card backlog-card ${activeBacklogCount > 0 ? 'has-backlogs' : ''}`}>
          <div className="score-val">{activeBacklogCount}</div>
          <div className="score-lbl">Active Backlogs</div>
        </div>
        <div className={`score-card history-card ${hasHistoricalBacklogs ? 'has-history' : ''}`}>
          <div className="score-val">{hasHistoricalBacklogs ? 'YES' : 'NO'}</div>
          <div className="score-lbl">History of Backlogs</div>
        </div>
      </div>
    </div>
  );
}
