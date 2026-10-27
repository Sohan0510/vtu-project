import React from 'react';

export default function SemesterNav({ semesters, activeSem, onSelectSem }) {
  if (!semesters || semesters.length === 0) return null;

  return (
    <div className="semesters-nav" id="semesters-nav">
      <button
        className={`sem-btn ${activeSem === 'all' ? 'active' : ''}`}
        onClick={() => onSelectSem('all')}
      >
        All Semesters
      </button>
      {semesters.map((sem) => (
        <button
          key={sem}
          className={`sem-btn ${String(activeSem) === String(sem) ? 'active' : ''}`}
          onClick={() => onSelectSem(sem)}
        >
          Semester {sem}
        </button>
      ))}
    </div>
  );
}
