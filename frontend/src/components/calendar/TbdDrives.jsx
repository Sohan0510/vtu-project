import React from 'react';
import TbdCard from './TbdCard.jsx';

export default function TbdDrives({
  events,
  filters,
  isAdmin,
  isEventsFetched,
  onAddTbd,
  onEventClick,
  onScheduleEvent,
  onEditEvent,
  onDeleteEvent,
}) {
  const tbdEvents = (events || []).filter((ev) => {
    const isTbd = ev.date && ev.date.trim().toUpperCase() === 'TBD';
    if (!isTbd) return false;
    if (!filters[ev.type]) return false;
    if (ev.mode === 'online' && !filters.online) return false;
    if (ev.mode === 'offline' && !filters.offline) return false;

    const isRVCE = ev.location === 'rvce' || ev.location === 'offcampus';
    const isRVITM = ev.location === 'rvitm' || ev.location === 'oncampus';
    const isWorksite = ev.location === 'worksite';

    if (isRVCE && !filters.oncampus) return false;
    if (isRVITM && !filters.offcampus) return false;
    if (isWorksite && !filters.worksite) return false;
    return true;
  });

  return (
    <>
      <div className="tbd-section-header">
        <div className="tbd-header-title-row">
          <h3>Upcoming Drives</h3>
          <span className="tbd-count-pill">{tbdEvents.length} TBD</span>
        </div>
        {isAdmin && (
          <button
            className="tbd-add-btn"
            id="btn-add-tbd"
            title="Add company drive with unconfirmed date"
            onClick={onAddTbd}
          >
            <svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" strokeWidth="2.5" fill="none">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add</span>
          </button>
        )}
      </div>

      <div className="tbd-items-list">
        {tbdEvents.length === 0 ? (
          !isEventsFetched && (!events || events.length === 0) ? (
            <div className="tbd-skeleton-list">
              <div className="tbd-skeleton-item"></div>
              <div className="tbd-skeleton-item"></div>
              <div className="tbd-skeleton-item"></div>
            </div>
          ) : (
            <div className="tbd-empty-state">
              <div className="tbd-empty-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="1.6" fill="none">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span className="tbd-empty-text">No unconfirmed drives pending.</span>
              {isAdmin && (
                <button
                  type="button"
                  className="tbd-empty-add-btn"
                  id="btn-add-tbd-empty"
                  onClick={onAddTbd}
                >
                  + Add First TBD Drive
                </button>
              )}
            </div>
          )
        ) : (
          tbdEvents.map((ev) => (
            <TbdCard
              key={ev.id}
              event={ev}
              isAdmin={isAdmin}
              onClick={onEventClick}
              onSchedule={onScheduleEvent}
              onEdit={onEditEvent}
              onDelete={onDeleteEvent}
            />
          ))
        )}
      </div>
    </>
  );
}
