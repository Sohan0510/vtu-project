import React from 'react';

export default function MarksTable({ semsToShow, semGroups, sgpaMap }) {
  if (!semsToShow || semsToShow.length === 0) return null;

  return (
    <div className="marks-section" id="marks-section">
      {semsToShow.map((sem) => {
        const subs = (semGroups[sem] || []).slice().sort((a, b) => a.code.localeCompare(b.code));
        const semTotal = subs.reduce((sum, s) => sum + (s.total || 0), 0);
        const passed = subs.filter((s) => s.status === 'P').length;
        const sgpaVal = sgpaMap && sgpaMap[sem] ? Number(sgpaMap[sem]).toFixed(2) : '-';

        return (
          <div key={sem} className="marks-container">
            <div className="marks-header">
              <div className="marks-title">Semester {sem}</div>
              <div className="marks-stats">
                <span>{semTotal}</span> Total Marks &bull;{' '}
                <span>{passed}/{subs.length}</span> Passed &bull;{' '}
                SGPA: <span>{sgpaVal}</span>
              </div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Subject Name</th>
                    <th>Credits</th>
                    <th>INT</th>
                    <th>EXT</th>
                    <th>Total</th>
                    <th>Result Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map((s) => (
                    <tr key={s.code}>
                      <td className="subject-code">{s.code}</td>
                      <td className="subject-name">{s.name}</td>
                      <td className="mark-val">{s.credits}</td>
                      <td className="mark-val">{s.internals}</td>
                      <td className="mark-val">{s.externals}</td>
                      <td className="mark-total">{s.total}</td>
                      <td>
                        <span className={`status-badge ${s.status === 'P' ? 'status-p' : 'status-f'}`}>
                          {s.status === 'P' ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
