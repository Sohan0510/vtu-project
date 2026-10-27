import React from 'react';

export default function CalendarSidebar({
  filters,
  onToggleFilter,
  tbdChildren,
}) {
  return (
    <aside className="calendar-sidebar">
      {/* TBD Upcoming Drives Pipeline */}
      <div className="calendar-tbd-section" id="calendar-tbd-section">
        {tbdChildren}
      </div>

      <div className="calendar-filters">
        <h3>My Calendars</h3>
        <label className="filter-item">
          <input
            type="checkbox"
            id="filter-exams"
            checked={filters.exams}
            onChange={() => onToggleFilter('exams')}
          />
          <span className="checkbox-custom checkbox-exams"></span>
          Interviews & Tests
        </label>
        <label className="filter-item">
          <input
            type="checkbox"
            id="filter-holidays"
            checked={filters.holidays}
            onChange={() => onToggleFilter('holidays')}
          />
          <span className="checkbox-custom checkbox-holidays"></span>
          Holidays & Breaks
        </label>
        <label className="filter-item">
          <input
            type="checkbox"
            id="filter-online"
            checked={filters.online}
            onChange={() => onToggleFilter('online')}
          />
          <span className="checkbox-custom checkbox-online"></span>
          Online Drives
        </label>
        <label className="filter-item">
          <input
            type="checkbox"
            id="filter-offline"
            checked={filters.offline}
            onChange={() => onToggleFilter('offline')}
          />
          <span className="checkbox-custom checkbox-offline"></span>
          Offline Drives
        </label>
        <label className="filter-item">
          <input
            type="checkbox"
            id="filter-oncampus"
            checked={filters.oncampus}
            onChange={() => onToggleFilter('oncampus')}
          />
          <span className="checkbox-custom checkbox-oncampus"></span>
          RVCE Drives
        </label>
        <label className="filter-item">
          <input
            type="checkbox"
            id="filter-offcampus"
            checked={filters.offcampus}
            onChange={() => onToggleFilter('offcampus')}
          />
          <span className="checkbox-custom checkbox-offcampus"></span>
          RVITM Drives
        </label>
        <label className="filter-item">
          <input
            type="checkbox"
            id="filter-worksite"
            checked={filters.worksite}
            onChange={() => onToggleFilter('worksite')}
          />
          <span className="checkbox-custom checkbox-worksite"></span>
          Worksite Drives
        </label>
      </div>
    </aside>
  );
}
