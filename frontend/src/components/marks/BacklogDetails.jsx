import React from 'react';

export default function BacklogDetails({ studentData }) {
  if (!studentData) return null;

  const activeBacklogCount = studentData.active_backlog_count || 0;
  const activeBacklogList = studentData.active_backlogs || [];
  const backlogHistoryList = studentData.backlog_history || [];

  if (activeBacklogCount === 0 && backlogHistoryList.length === 0) {
    return null;
  }

  return (
    <div id="backlog-details">
      {activeBacklogCount > 0 && (
        <div className="backlog-detail-section active-backlogs-section">
          <div className="backlog-detail-header">
            <span className="backlog-detail-icon">🔴</span>
            <span className="backlog-detail-title">Active Backlogs ({activeBacklogCount})</span>
          </div>
          <div className="backlog-detail-list">
            {activeBacklogList.map((b, idx) => (
              <div key={idx} className="backlog-item active-backlog-item">
                <span className="backlog-subj-code">{b.code || b}</span>
                <span className="backlog-subj-name">{b.name || ''}</span>
                {b.semester && <span className="backlog-sem-badge">Sem {b.semester}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {backlogHistoryList.length > 0 && (
        <div className="backlog-detail-section history-backlogs-section">
          <div className="backlog-detail-header">
            <span className="backlog-detail-icon">🟡</span>
            <span className="backlog-detail-title">Backlog History (Cleared)</span>
          </div>
          <div className="backlog-detail-list">
            {backlogHistoryList.map((b, idx) => (
              <div key={idx} className="backlog-item cleared-backlog-item">
                <span className="backlog-subj-code">{b.code || b}</span>
                <span className="backlog-subj-name">{b.name || ''}</span>
                {b.failed_sem && (
                  <span className="backlog-sem-badge fail-badge">Failed Sem {b.failed_sem}</span>
                )}
                {b.cleared_sem && (
                  <span className="backlog-sem-badge clear-badge">Cleared Sem {b.cleared_sem}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
