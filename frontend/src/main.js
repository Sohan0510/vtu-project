import './style.css';

const API = '';  // Vite proxy handles /api -> localhost:8000

// ── State ──
let currentJobId = null;
let pollInterval = null;
let allResults = [];
let liveLogs = [];
let activeLogFilter = 'all';

// ── App Shell ──
document.querySelector('#app').innerHTML = `
  <div class="bg-orb bg-orb-1"></div>
  <div class="bg-orb bg-orb-2"></div>
  <div class="bg-orb bg-orb-3"></div>

  <header class="header">
    <div class="header-content">
      <div class="logo">
        <div class="logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1.9 2 2 2h8a2 2 0 002-2v-5"/></svg>
        </div>
        <div><div class="logo-text">VTU Scraper</div><div class="logo-sub">Automated Result Extraction</div></div>
      </div>
      <nav class="nav">
        <button class="nav-btn active" data-tab="scrape">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/><path d="M21 3v6h-6"/></svg>
          Scrape
        </button>
        <button class="nav-btn" data-tab="results">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>
          Results
        </button>
        <button class="nav-btn" data-tab="find">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          Find
        </button>
        <button class="nav-btn" data-tab="leaderboard">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          Best
        </button>
        <button class="nav-btn" data-tab="queue">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h7"/></svg>
          Queue
        </button>
        <button class="nav-btn" data-tab="eligibility">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Eligibility
        </button>
      </nav>
      <div class="stat-chip"><span class="stat-dot"></span><span id="stat-count">0</span> Students</div>
    </div>
  </header>

  <main class="main-content">
    <!-- SCRAPE TAB -->
    <section class="tab-content active" id="tab-scrape">
      <div class="section-header">
        <h2 class="section-title">Scrape Results</h2>
        <p class="section-desc">Paste the VTU result URL and configure USN range to start automated scraping.</p>
      </div>
      <div class="cards-grid">
        <div class="card card-wide">
          <div class="card-header">
            <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg></div>
            <h3>VTU Result URL</h3>
          </div>
          <div class="input-group">
            <input type="url" id="input-url" class="input" placeholder="https://results.vtu.ac.in/D25J26Ecbcs/index.php">
            <span class="input-label">Paste the VTU result page link</span>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <div class="card-icon icon-purple"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
            <h3>USN Pattern</h3>
          </div>
          <div class="usn-preview">
            <span class="usn-part" id="preview-college">___</span>
            <span class="usn-part" id="preview-year">__</span>
            <span class="usn-part" id="preview-branch">__</span>
            <span class="usn-part highlight" id="preview-roll">001</span>
          </div>
          <div class="input-row">
            <div class="input-group small"><input type="text" id="input-college" class="input" placeholder="1RF" maxlength="4"><span class="input-label">College Code</span></div>
            <div class="input-group small"><input type="text" id="input-year" class="input" placeholder="23" maxlength="2"><span class="input-label">Year</span></div>
            <div class="input-group small"><input type="text" id="input-branch" class="input" placeholder="CS" maxlength="4"><span class="input-label">Branch</span></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <div class="card-icon icon-cyan"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg></div>
            <h3>Roll Number Range</h3>
          </div>
          <div class="input-row">
            <div class="input-group small"><input type="number" id="input-start" class="input" placeholder="1" min="1"><span class="input-label">From</span></div>
            <span class="range-arrow">&rarr;</span>
            <div class="input-group small"><input type="number" id="input-end" class="input" placeholder="200" min="1"><span class="input-label">To</span></div>
          </div>
          <div class="student-count" id="student-count">0 students</div>
          <div class="toggle-row">
            <label class="toggle"><input type="checkbox" id="input-reval"><span class="toggle-slider"></span></label>
            <div class="toggle-label"><span>Revaluation Mode</span><small>Compare &amp; update only improved marks</small></div>
          </div>
        </div>
      </div>
      <div class="action-bar">
        <button class="btn btn-primary btn-large" id="btn-start">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21"/></svg>
          Start Scraping
        </button>
      </div>
      <div class="progress-section hidden" id="progress-section">
        <div class="card card-wide progress-card">
          <div class="progress-header">
            <h3 id="progress-title">Scraping in Progress...</h3>
            <span class="badge badge-running" id="progress-badge">Running</span>
          </div>
          <div class="progress-bar-container"><div class="progress-bar" id="progress-bar"></div></div>
          <div class="progress-stats">
            <div class="progress-stat"><span class="progress-label">Progress</span><span class="progress-value" id="progress-text">0 / 0</span></div>
            <div class="progress-stat"><span class="progress-label">Current USN</span><span class="progress-value" id="progress-usn">-</span></div>
            <div class="progress-stat"><span class="progress-label">Status</span><span class="progress-value" id="progress-status">-</span></div>
            <div class="progress-stat"><span class="progress-label">Elapsed</span><span class="progress-value" id="progress-elapsed">0s</span></div>
          </div>
          <!-- ENHANCED LIVE SCRAPING DASHBOARD -->
          <div class="live-log-container">
            <div class="live-metrics-bar">
              <div class="live-metric ongoing-metric">
                <span class="live-metric-icon">⏳</span>
                <div class="live-metric-info">
                  <span class="live-metric-label">Ongoing / Active</span>
                  <span class="live-metric-val" id="live-ongoing-usn">-</span>
                </div>
              </div>
              <div class="live-metric completed-metric">
                <span class="live-metric-icon">✓</span>
                <div class="live-metric-info">
                  <span class="live-metric-label">Completed</span>
                  <span class="live-metric-val" id="live-count-completed">0</span>
                </div>
              </div>
              <div class="live-metric redoing-metric">
                <span class="live-metric-icon">🔄</span>
                <div class="live-metric-info">
                  <span class="live-metric-label">Redoing / Retry</span>
                  <span class="live-metric-val" id="live-count-redoing">0</span>
                </div>
              </div>
              <div class="live-metric notfound-metric">
                <span class="live-metric-icon">⚠</span>
                <div class="live-metric-info">
                  <span class="live-metric-label">Not Found</span>
                  <span class="live-metric-val" id="live-count-notfound">0</span>
                </div>
              </div>
              <div class="live-metric failed-metric">
                <span class="live-metric-icon">✗</span>
                <div class="live-metric-info">
                  <span class="live-metric-label">Failed</span>
                  <span class="live-metric-val" id="live-count-failed">0</span>
                </div>
              </div>
            </div>

            <div class="live-log-header-bar">
              <div class="live-log-tabs">
                <button class="log-tab active" data-filter="all">All <span class="tab-count" id="tab-cnt-all">0</span></button>
                <button class="log-tab" data-filter="completed">Completed <span class="tab-count" id="tab-cnt-completed">0</span></button>
                <button class="log-tab" data-filter="redoing">Redoing <span class="tab-count" id="tab-cnt-redoing">0</span></button>
                <button class="log-tab" data-filter="not_found">Not Found <span class="tab-count" id="tab-cnt-notfound">0</span></button>
                <button class="log-tab" data-filter="failed">Failed <span class="tab-count" id="tab-cnt-failed">0</span></button>
              </div>
              <div class="live-log-controls">
                <label class="log-autoscroll-label">
                  <input type="checkbox" id="log-autoscroll-chk" checked>
                  <span>Auto-scroll</span>
                </label>
              </div>
            </div>

            <div class="log-entries-enhanced" id="log-entries">
              <div class="log-empty-state">Waiting for scraping to begin...</div>
            </div>
          </div>
          <div class="completion-summary hidden" id="completion-summary">
            <div class="summary-grid">
              <div class="summary-item success"><span class="summary-number" id="sum-success">0</span><span class="summary-label" id="sum-success-label">Success</span></div>
              <div class="summary-item failed"><span class="summary-number" id="sum-failed">0</span><span class="summary-label">Failed</span></div>
              <div class="summary-item not-found"><span class="summary-number" id="sum-notfound">0</span><span class="summary-label">Not Found</span></div>
              <div class="summary-item unchanged hidden" id="sum-unchanged-item"><span class="summary-number" id="sum-unchanged">0</span><span class="summary-label">Unchanged</span></div>
              <div class="summary-item time"><span class="summary-number" id="sum-time">0s</span><span class="summary-label">Time</span></div>
            </div>
            <button class="btn btn-success" id="btn-download">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download Excel Report
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- RESULTS TAB -->
    <section class="tab-content" id="tab-results">
      <div class="section-header"><h2 class="section-title">All Results</h2><p class="section-desc">View all scraped student results from the database.</p></div>
      <div class="results-toolbar">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="results-search" class="search-input" placeholder="Search by USN or name...">
        </div>
        <button class="btn btn-outline" id="btn-refresh">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/><path d="M21 3v6h-6"/></svg>
          Refresh
        </button>
        <div class="export-dropdown" id="export-dropdown">
          <button class="btn btn-success" id="btn-export-toggle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="export-menu hidden" id="export-menu">
            <button class="export-option" data-sem="all">All Semesters</button>
          </div>
        </div>
      </div>
      <div id="results-area">
        <div class="empty-state" id="results-empty">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>
          <h3>No Results Yet</h3>
          <p>Start a scraping job to see results here.</p>
        </div>
        <table class="results-table hidden" id="results-table">
          <thead><tr><th>#</th><th>USN</th><th>Name</th><th>Subjects</th><th>Passed</th><th>Failed</th><th>Backlogs</th><th>Total</th><th>SGPA</th><th>CGPA</th><th>Status</th><th></th></tr></thead>
          <tbody id="results-tbody"></tbody>
        </table>
      </div>
    </section>

    <!-- FIND TAB -->
    <section class="tab-content" id="tab-find">
      <div class="section-header"><h2 class="section-title">Find Student</h2><p class="section-desc">Search for a specific student by USN to view detailed marks.</p></div>
      <div class="find-search-area">
        <div class="find-input-wrapper">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="find-usn" class="find-input" placeholder="Enter USN (e.g., 1RF22CS024)" maxlength="12">
          <button class="btn btn-primary" id="btn-find">Search</button>
        </div>
      </div>
      <div id="student-card" class="student-card hidden"></div>
      <div id="find-empty" class="find-empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <p>Enter a USN above to find a student's results</p>
      </div>
      <div id="find-error" class="find-error hidden">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        <p id="find-error-msg">Student not found</p>
      </div>
    </section>

    <!-- BEST / LEADERBOARD TAB -->
    <section class="tab-content" id="tab-leaderboard">
      <div class="section-header">
        <h2 class="section-title">Top Performers</h2>
        <p class="section-desc">The absolute best students ranked by their CGPA across all semesters.</p>
      </div>
      <div id="leaderboard-area">
        <div class="leaderboard-grid" id="leaderboard-grid"></div>
      </div>
    </section>
    <!-- QUEUE TAB -->
    <section class="tab-content" id="tab-queue">
      <div class="section-header">
        <h2 class="section-title">Multi-URL Scrape Queue</h2>
        <p class="section-desc">Paste multiple semester URLs in chronological order to correctly build the backlog history (Sem 1 &rarr; Sem 2 &rarr; Makeup, etc).</p>
      </div>
      <div class="cards-grid">
        <div class="card card-wide">
          <div class="card-header">
            <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
            <h3>Chronological URLs (One per line)</h3>
          </div>
          <div class="input-group">
            <textarea id="input-queue-urls" class="input" style="height: 220px; padding: 12px; resize: vertical; font-family: monospace; font-size: 13px; line-height: 1.6;">https://results.vtu.ac.in/DJcbcs24/index.php
https://results.vtu.ac.in/DJRVcbcs24/index.php
https://results.vtu.ac.in/JJEcbcs24/index.php
https://results.vtu.ac.in/JJRVcbcs24/index.php
https://results.vtu.ac.in/MakeUpEcbcs24/index.php
https://results.vtu.ac.in/DJcbcs25/index.php
https://results.vtu.ac.in/DJRVcbcs25/index.php
https://results.vtu.ac.in/JJEcbcs25/index.php
https://results.vtu.ac.in/JJRVcbcs25/index.php
https://results.vtu.ac.in/MakeUpEcbcs25/index.php
https://results.vtu.ac.in/SEcbcs25/index.php
https://results.vtu.ac.in/SERVcbcs25/index.php
https://results.vtu.ac.in/D25J26Ecbcs/index.php
https://results.vtu.ac.in/D25J26RVcbcs/index.php
https://results.vtu.ac.in/MJ26cbcs/index.php
https://results.vtu.ac.in/MJ26rvcbcs/index.php</textarea>
            <span class="input-label" style="margin-top: 6px; display: block; font-size: 12px; color: var(--text-muted);">Pre-populated with Sem 1 &rarr; Sem 6 including Reval, Makeup &amp; Summer Semesters in chronological order</span>
          </div>
        </div>
        <div class="card card-wide" style="grid-column: span 1;">
          <div class="card-header">
            <div class="card-icon icon-purple"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
            <h3>Target Students</h3>
          </div>
          <div class="input-row">
            <div class="input-group small"><input type="text" id="q-input-college" class="input" placeholder="1RF" maxlength="4"><span class="input-label">College Code</span></div>
            <div class="input-group small"><input type="text" id="q-input-year" class="input" placeholder="23" maxlength="2"><span class="input-label">Year</span></div>
            <div class="input-group small"><input type="text" id="q-input-branch" class="input" placeholder="CS" maxlength="4"><span class="input-label">Branch</span></div>
          </div>
          <div class="input-row" style="margin-top: 15px;">
            <div class="input-group small"><input type="number" id="q-input-start" class="input" placeholder="1" min="1"><span class="input-label">From Roll #</span></div>
            <span class="range-arrow">&rarr;</span>
            <div class="input-group small"><input type="number" id="q-input-end" class="input" placeholder="200" min="1"><span class="input-label">To Roll #</span></div>
          </div>
        </div>
      </div>
      <div class="action-bar" style="margin-top: 24px;">
        <button class="btn btn-primary btn-large" id="btn-start-queue">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21"/></svg>
          Start Queue Processing
        </button>
      </div>
    </section>
    <!-- ELIGIBILITY TAB -->
    <section class="tab-content" id="tab-eligibility">
      <div class="section-header">
        <h2 class="section-title">Placement Eligibility Engine</h2>
        <p class="section-desc">Filter students based on company-specific placement criteria (CGPA, active backlogs, history).</p>
      </div>
      <div class="cards-grid">
        <div class="card card-wide">
          <div class="card-header">
            <div class="card-icon icon-cyan"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg></div>
            <h3>Filter Criteria</h3>
          </div>
          <div class="input-row" style="align-items: center;">
            <div class="input-group small">
              <select id="el-preset" class="input" style="padding: 12px;">
                <option value="custom">Custom Rules</option>
                <!-- Populated via API -->
              </select>
              <span class="input-label">Preset</span>
            </div>
            <div class="input-group small">
              <input type="number" id="el-cgpa" class="input" placeholder="6.0" step="0.1" min="0" max="10" value="6.0">
              <span class="input-label">Min CGPA</span>
            </div>
            <div class="input-group small">
              <input type="number" id="el-backlogs" class="input" placeholder="0" min="0" value="0">
              <span class="input-label">Max Active Backlogs</span>
            </div>
            <label class="toggle" style="margin-left: 15px;">
              <input type="checkbox" id="el-history" checked>
              <span class="toggle-slider"></span>
              <span style="font-size: 12px; margin-left: 8px;">Allow History of Backlogs</span>
            </label>
          </div>
          <div class="action-bar" style="margin-top: 20px; padding: 0;">
            <button class="btn btn-primary" id="btn-check-eligibility">Check Eligibility</button>
          </div>
        </div>
      </div>
      
      <div id="eligibility-results" class="hidden" style="margin-top: 30px;">
        <div class="summary-grid" style="margin-bottom: 20px;">
          <div class="summary-item success"><span class="summary-number" id="el-count-eligible">0</span><span class="summary-label">Eligible</span></div>
          <div class="summary-item warning"><span class="summary-number" id="el-count-conditional">0</span><span class="summary-label">Conditional (Near miss)</span></div>
          <div class="summary-item failed"><span class="summary-number" id="el-count-not">0</span><span class="summary-label">Not Eligible</span></div>
        </div>
        
        <h3 style="margin-bottom: 10px; color: var(--text-color);">Eligible Students</h3>
        <table class="results-table" id="el-table-eligible">
          <thead><tr><th>USN</th><th>Name</th><th>CGPA</th><th>SGPA</th><th>Active Backlogs</th><th>History</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </section>
  </main>
`;

// ── Tab Navigation ──
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    if (btn.dataset.tab === 'results' || btn.dataset.tab === 'leaderboard') {
      if (allResults.length === 0) loadAllResults();
      else if (btn.dataset.tab === 'leaderboard') renderLeaderboard();
      else renderResults(allResults);
    }
  });
});

// ── USN Preview ──
const usnInputs = ['input-college', 'input-year', 'input-branch'];
usnInputs.forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    document.getElementById('preview-college').textContent = document.getElementById('input-college').value.toUpperCase() || '___';
    document.getElementById('preview-year').textContent = document.getElementById('input-year').value || '__';
    document.getElementById('preview-branch').textContent = document.getElementById('input-branch').value.toUpperCase() || '__';
  });
});

// ── Student Count ──
['input-start', 'input-end'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    const s = parseInt(document.getElementById('input-start').value) || 0;
    const e = parseInt(document.getElementById('input-end').value) || 0;
    const count = e >= s && s > 0 ? e - s + 1 : 0;
    document.getElementById('student-count').textContent = `${count} students`;
  });
});

// ── Multi-URL Queue Scraping ──
document.getElementById('btn-start-queue').addEventListener('click', async () => {
  const queueText = document.getElementById('input-queue-urls').value.trim();
  const college = document.getElementById('q-input-college').value.trim().toUpperCase();
  const year = document.getElementById('q-input-year').value.trim();
  const branch = document.getElementById('q-input-branch').value.trim().toUpperCase();
  const start = parseInt(document.getElementById('q-input-start').value);
  const end = parseInt(document.getElementById('q-input-end').value);

  if (!queueText || !college || !year || !branch || !start || !end) {
    alert('Please fill all fields and provide at least one URL.');
    return;
  }

  // Parse URLs
  const urls = queueText.split('\n').map(u => u.trim()).filter(u => u);
  if (urls.length === 0) {
    alert('Please provide valid URLs.');
    return;
  }

  const queue = urls.map((url, i) => ({
    url,
    label: `URL ${i + 1}`,
    is_reval: url.toLowerCase().includes('rv') || url.toLowerCase().includes('reval')
  }));

  try {
    document.getElementById('btn-start-queue').disabled = true;
    document.getElementById('btn-start-queue').innerHTML = '<span class="spinner"></span> Starting...';

    const res = await fetch(`${API}/api/scrape-queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queue, college_code: college, year, branch,
        start_roll: start, end_roll: end, delay: 0.5
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to start queue');

    currentJobId = data.job_id;
    document.getElementById('tab-queue').classList.remove('active');
    document.getElementById('tab-scrape').classList.add('active'); // Switch to main tab to show progress
    
    // Un-hide progress section in main tab
    document.getElementById('progress-section').classList.remove('hidden');
    document.getElementById('progress-title').textContent = 'Queue Processing...';
    document.getElementById('completion-summary').classList.add('hidden');
    document.getElementById('log-entries').innerHTML = '';
    
    pollInterval = setInterval(pollStatus, 1500);

  } catch (err) {
    alert('Error: ' + err.message);
  } finally {
    document.getElementById('btn-start-queue').disabled = false;
    document.getElementById('btn-start-queue').innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21"/></svg> Start Queue Processing';
  }
});

// ── Eligibility Engine ──
async function loadEligibilityPresets() {
  try {
    const res = await fetch(`${API}/api/eligibility/presets`);
    const data = await res.json();
    const select = document.getElementById('el-preset');
    
    data.presets.forEach((p, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = p.company_name;
      opt.dataset.cgpa = p.min_cgpa;
      opt.dataset.backlogs = p.max_active_backlogs;
      opt.dataset.history = p.allow_historical_backlogs;
      select.appendChild(opt);
    });
    
    select.addEventListener('change', (e) => {
      if (e.target.value === 'custom') return;
      const opt = e.target.options[e.target.selectedIndex];
      document.getElementById('el-cgpa').value = opt.dataset.cgpa;
      document.getElementById('el-backlogs').value = opt.dataset.backlogs;
      document.getElementById('el-history').checked = (opt.dataset.history === 'true');
    });
  } catch (err) {
    console.error("Failed to load presets", err);
  }
}

// Load presets on init
loadEligibilityPresets();

document.getElementById('btn-check-eligibility').addEventListener('click', async () => {
  const btn = document.getElementById('btn-check-eligibility');
  btn.disabled = true;
  btn.textContent = 'Checking...';
  
  const presetSel = document.getElementById('el-preset');
  const company_name = presetSel.options[presetSel.selectedIndex].textContent;
  
  const payload = {
    min_cgpa: parseFloat(document.getElementById('el-cgpa').value),
    max_active_backlogs: parseInt(document.getElementById('el-backlogs').value),
    allow_historical_backlogs: document.getElementById('el-history').checked,
    company_name
  };
  
  try {
    const res = await fetch(`${API}/api/eligibility/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    
    document.getElementById('eligibility-results').classList.remove('hidden');
    document.getElementById('el-count-eligible').textContent = data.eligible_count;
    document.getElementById('el-count-conditional').textContent = data.conditional_count;
    document.getElementById('el-count-not').textContent = data.not_eligible_count;
    
    const tbody = document.querySelector('#el-table-eligible tbody');
    tbody.innerHTML = '';
    
    data.eligible.forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="usn-cell">${s.usn}</td>
        <td class="name-cell">${s.name}</td>
        <td><b>${s.cgpa.toFixed(2)}</b></td>
        <td>${(s.sgpa || 0).toFixed(2)}</td>
        <td>${s.active_backlog_count > 0 ? `<span class="badge badge-error">${s.active_backlog_count}</span>` : '<span class="badge badge-success">0</span>'}</td>
        <td>${s.historical_backlogs ? '<span class="badge badge-warning">Yes</span>' : '<span class="badge badge-success">Clean</span>'}</td>
      `;
      tbody.appendChild(tr);
    });
    
  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Check Eligibility';
  }
});

// ── Start Scraping ──
document.getElementById('btn-start').addEventListener('click', async () => {
  const url = document.getElementById('input-url').value.trim();
  const college = document.getElementById('input-college').value.trim().toUpperCase();
  const year = document.getElementById('input-year').value.trim();
  const branch = document.getElementById('input-branch').value.trim().toUpperCase();
  const start = parseInt(document.getElementById('input-start').value);
  const end = parseInt(document.getElementById('input-end').value);
  const isReval = document.getElementById('input-reval').checked;

  if (!url || !college || !year || !branch || !start || !end) {
    alert('Please fill in all fields.'); return;
  }
  if (end < start) { alert('End roll must be >= start roll.'); return; }

  document.getElementById('btn-start').disabled = true;
  document.getElementById('progress-section').classList.remove('hidden');
  document.getElementById('completion-summary').classList.add('hidden');
  document.getElementById('log-entries').innerHTML = '';
  document.getElementById('progress-bar').style.width = '0%';
  document.getElementById('progress-title').textContent = 'Scraping in Progress...';
  document.getElementById('progress-badge').className = 'badge badge-running';
  document.getElementById('progress-badge').textContent = 'Running';
  window._scrapeStartTime = Date.now();

  try {
    const res = await fetch(`${API}/api/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, college_code: college, year, branch, start_roll: start, end_roll: end, is_reval: isReval })
    });
    const data = await res.json();
    currentJobId = data.job_id;
    pollInterval = setInterval(pollStatus, 1500);
  } catch (err) {
    alert('Failed to start scraping: ' + err.message);
    document.getElementById('btn-start').disabled = false;
  }
});

// ── Enhanced Log Dashboard Logic ──
document.addEventListener('click', (e) => {
  const tab = e.target.closest('.log-tab');
  if (tab) {
    document.querySelectorAll('.log-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeLogFilter = tab.getAttribute('data-filter');
    renderLiveLog();
  }
});

function renderLiveLog() {
  const container = document.getElementById('log-entries');
  if (!container) return;

  const filtered = liveLogs.filter(item => {
    if (activeLogFilter === 'all') return true;
    if (activeLogFilter === 'completed') return item.status === 'success' || item.status === 'updated';
    if (activeLogFilter === 'redoing') return item.status === 'redoing' || item.status === 'retrying' || (item.round_label && item.round_label.includes('RETRY'));
    if (activeLogFilter === 'not_found') return item.status === 'not_found';
    if (activeLogFilter === 'failed') return item.status === 'failed';
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="log-empty-state">No log entries matching '${activeLogFilter.replace('_', ' ')}'</div>`;
    return;
  }

  const statusMap = {
    success: { label: '✓ COMPLETED', badgeClass: 'badge-log-success' },
    updated: { label: '↑ UPDATED', badgeClass: 'badge-log-success' },
    redoing: { label: '🔄 REDOING', badgeClass: 'badge-log-redoing' },
    retrying: { label: '🔄 RETRYING', badgeClass: 'badge-log-redoing' },
    not_found: { label: '⚠ NOT FOUND', badgeClass: 'badge-log-notfound' },
    unchanged: { label: '– UNCHANGED', badgeClass: 'badge-log-neutral' },
    failed: { label: '✗ FAILED', badgeClass: 'badge-log-failed' },
    ongoing: { label: '⏳ ONGOING', badgeClass: 'badge-log-ongoing' }
  };

  container.innerHTML = filtered.map(item => {
    const s = statusMap[item.status] || { label: item.status.toUpperCase(), badgeClass: 'badge-log-neutral' };
    const nameStr = item.name ? ` <span class="log-student-name">(${item.name})</span>` : '';
    const marksStr = item.grand_total ? `<span class="log-marks-pill">Total: ${item.grand_total}</span>` : '';
    const roundStr = item.round_label ? `<span class="log-round-pill">${item.round_label}</span>` : '';
    const timeStr = item.time ? `<span class="log-time-str">${item.time}</span>` : '';
    const urlStr = item.url_label ? `<span class="log-url-pill" title="${item.url || ''}">🔗 ${item.url_label}</span>` : '';
    const isFailedView = item.status === 'failed' || activeLogFilter === 'failed';
    const linkDetailStr = isFailedView && (item.url_label || item.url)
      ? `<div class="log-failed-link-detail">📍 <b>Failed USN:</b> <span class="log-usn-highlight">${item.usn}</span> &nbsp;|&nbsp; <b>Failed in Link:</b> <span class="log-link-label">${item.url_label || 'URL'}</span> (<a href="${item.url || '#'}" target="_blank" class="log-link-href">${item.url || 'N/A'}</a>)</div>`
      : '';

    return `
      <div class="log-row-card log-status-${item.status}">
        <div class="log-row-main">
          <div class="log-row-left">
            <span class="log-status-badge ${s.badgeClass}">${s.label}</span>
            <span class="log-usn-text">${item.usn}</span>
            ${nameStr}
          </div>
          <div class="log-row-right">
            ${marksStr}
            ${urlStr}
            ${roundStr}
            ${timeStr}
          </div>
        </div>
        ${linkDetailStr}
      </div>
    `;
  }).join('');

  const autoScroll = document.getElementById('log-autoscroll-chk');
  if (autoScroll && autoScroll.checked) {
    container.scrollTop = container.scrollHeight;
  }
}

// ── Poll Status ──
let lastLogCount = 0;
async function pollStatus() {
  if (!currentJobId) return;
  try {
    const res = await fetch(`${API}/api/status/${currentJobId}`);
    const data = await res.json();
    const pct = data.percentage || 0;

    document.getElementById('progress-bar').style.width = `${pct}%`;
    if (data.type === 'queue') {
      const qProgress = `[${data.queue_index + 1}/${data.queue_total}] ${data.queue_label}`;
      document.getElementById('progress-title').textContent = `Queue Processing: ${qProgress}`;
    }

    document.getElementById('progress-text').textContent = `${data.progress} / ${data.total} (${data.percentage}%)`;
    document.getElementById('progress-usn').textContent = data.current_usn || '-';
    document.getElementById('progress-status').textContent = data.current_status || '-';

    // Update elapsed time
    if (window._scrapeStartTime) {
      const elapsed = Math.round((Date.now() - window._scrapeStartTime) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      document.getElementById('progress-elapsed').textContent = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    }

    // Update live metrics & log
    if (data.results_log) {
      liveLogs = data.results_log;
      
      let completedCnt = 0, redoingCnt = 0, notfoundCnt = 0, failedCnt = 0;
      liveLogs.forEach(e => {
        if (e.status === 'success' || e.status === 'updated') completedCnt++;
        else if (e.status === 'redoing' || e.status === 'retrying' || (e.round_label && e.round_label.includes('RETRY'))) redoingCnt++;
        else if (e.status === 'not_found') notfoundCnt++;
        else if (e.status === 'failed') failedCnt++;
      });
      
      const elCompleted = document.getElementById('live-count-completed');
      const elRedoing = document.getElementById('live-count-redoing');
      const elNotFound = document.getElementById('live-count-notfound');
      const elFailed = document.getElementById('live-count-failed');
      const elOngoing = document.getElementById('live-ongoing-usn');
      
      if (elCompleted) elCompleted.textContent = completedCnt;
      if (elRedoing) elRedoing.textContent = redoingCnt;
      if (elNotFound) elNotFound.textContent = notfoundCnt;
      if (elFailed) elFailed.textContent = failedCnt;
      if (elOngoing) elOngoing.textContent = data.current_usn || '-';
      
      const tabAll = document.getElementById('tab-cnt-all');
      const tabComp = document.getElementById('tab-cnt-completed');
      const tabRedo = document.getElementById('tab-cnt-redoing');
      const tabNF = document.getElementById('tab-cnt-notfound');
      const tabFail = document.getElementById('tab-cnt-failed');
      
      if (tabAll) tabAll.textContent = liveLogs.length;
      if (tabComp) tabComp.textContent = completedCnt;
      if (tabRedo) tabRedo.textContent = redoingCnt;
      if (tabNF) tabNF.textContent = notfoundCnt;
      if (tabFail) tabFail.textContent = failedCnt;
      
      renderLiveLog();
    }

    if (data.status === 'completed' || data.status === 'error') {
      clearInterval(pollInterval);
      pollInterval = null;
      document.getElementById('btn-start').disabled = false;

      if (data.status === 'completed') {
        document.getElementById('progress-title').textContent = 'Scraping Complete!';
        document.getElementById('progress-badge').className = 'badge badge-completed';
        document.getElementById('progress-badge').textContent = 'Completed';
        document.getElementById('progress-bar').style.width = '100%';
        document.getElementById('completion-summary').classList.remove('hidden');

        const s = data.summary || {};
        document.getElementById('sum-success').textContent = s.success_count || 0;
        document.getElementById('sum-failed').textContent = s.failed_count || 0;
        document.getElementById('sum-notfound').textContent = s.not_found_count || 0;
        const secs = Math.round(s.elapsed_seconds || 0);
        document.getElementById('sum-time').textContent = secs > 60 ? `${Math.round(secs/60)}m` : `${secs}s`;

        // Show unchanged count for reval mode
        const unchangedCount = s.unchanged_count || 0;
        const unchangedItem = document.getElementById('sum-unchanged-item');
        if (unchangedCount > 0) {
          unchangedItem.classList.remove('hidden');
          document.getElementById('sum-unchanged').textContent = unchangedCount;
        } else {
          unchangedItem.classList.add('hidden');
        }

        // Update success label for reval mode
        const isRevalMode = document.getElementById('input-reval').checked;
        document.getElementById('sum-success-label').textContent = isRevalMode ? 'Updated' : 'Success';

        updateStatCount();
      } else {
        document.getElementById('progress-title').textContent = 'Scraping Failed';
        document.getElementById('progress-badge').className = 'badge badge-error';
        document.getElementById('progress-badge').textContent = 'Error';
      }
    }
  } catch (err) { console.error('Poll error:', err); }
}

// ── Download Excel ──
document.getElementById('btn-download').addEventListener('click', () => {
  if (currentJobId) window.open(`${API}/api/export/${currentJobId}`, '_blank');
});

// ── Load All Results ──
async function loadAllResults() {
  try {
    const res = await fetch(`${API}/api/results`);
    const data = await res.json();
    allResults = data.results || [];
    if (document.querySelector('[data-tab="results"]').classList.contains('active')) {
      renderResults(allResults);
    } else if (document.querySelector('[data-tab="leaderboard"]').classList.contains('active')) {
      renderLeaderboard();
    }
    updateStatCount();
  } catch (err) { console.error('Load results error:', err); }
}

function renderLeaderboard() {
  const grid = document.getElementById('leaderboard-grid');
  const sorted = [...allResults].filter(r => r.cgpa > 0).sort((a, b) => b.cgpa - a.cgpa);
  
  if (sorted.length === 0) {
    grid.innerHTML = '<div class="empty-state"><h3>No CGPA data available yet</h3></div>';
    return;
  }
  
  const top10 = sorted.slice(0, 10);
  
  grid.innerHTML = top10.map((r, i) => {
    let rankClass = 'default';
    if (i === 0) rankClass = 'gold';
    else if (i === 1) rankClass = 'silver';
    else if (i === 2) rankClass = 'bronze';
    
    return `
      <div class="leaderboard-card" onclick="viewStudent('${r.usn}')">
        <div class="rank-badge ${rankClass}">#${i+1}</div>
        <div class="lb-info">
          <div class="lb-name">${r.name || 'Unknown'}</div>
          <div class="lb-usn">${r.usn}</div>
        </div>
        <div class="lb-score">
          <span class="lb-cgpa">${r.cgpa.toFixed(2)}</span>
          <span class="lb-label">CGPA</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderResults(results) {
  const tbody = document.getElementById('results-tbody');
  const table = document.getElementById('results-table');
  const empty = document.getElementById('results-empty');

  if (!results.length) {
    table.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }
  table.classList.remove('hidden');
  empty.classList.add('hidden');

  const sorted = [...results].sort((a, b) => (a.usn || '').localeCompare(b.usn || ''));
  tbody.innerHTML = sorted.map((r, i) => {
    const subs = r.subjects ? Object.keys(r.subjects).length : 0;
    const passed = r.subjects ? Object.values(r.subjects).filter(s => s.status === 'P').length : 0;
    const failed = subs - passed;
    const overall = failed === 0 && subs > 0 ? 'PASS' : 'FAIL';
    const backlogsStr = r.active_backlog_count > 0 ? `<span style="color:var(--red);font-weight:bold">${r.active_backlog_count}</span>` : `<span style="color:var(--green)">0</span>`;
    return `<tr>
      <td>${i + 1}</td>
      <td style="font-family:'Courier New',monospace;font-weight:600">${r.usn}</td>
      <td>${r.name || '-'}</td>
      <td>${subs}</td>
      <td style="color:var(--green)">${passed}</td>
      <td style="color:${failed > 0 ? 'var(--red)' : 'var(--text-muted)'}">${failed}</td>
      <td>${backlogsStr}</td>
      <td style="font-weight:700">${r.grand_total || 0}</td>
      <td style="font-weight:700; color:var(--purple)">${r.sgpa || '-'}</td>
      <td style="font-weight:700; color:var(--cyan)">${r.cgpa || '-'}</td>
      <td class="${overall === 'PASS' ? 'status-pass' : 'status-fail'}">${overall}</td>
      <td><button class="btn-view" onclick="viewStudent('${r.usn}')">View</button></td>
    </tr>`;
  }).join('');
}

document.getElementById('results-search').addEventListener('input', (e) => {
  const q = e.target.value.toUpperCase();
  const filtered = allResults.filter(r =>
    (r.usn || '').toUpperCase().includes(q) || (r.name || '').toUpperCase().includes(q)
  );
  renderResults(filtered);
});

document.getElementById('btn-refresh').addEventListener('click', loadAllResults);

// ── Export Dropdown ──
document.getElementById('btn-export-toggle').addEventListener('click', (e) => {
  e.stopPropagation();
  const menu = document.getElementById('export-menu');
  menu.classList.toggle('hidden');
  // Load semesters if not loaded yet
  if (menu.querySelectorAll('.export-option').length <= 1) {
    loadExportSemesters();
  }
});

// Close dropdown on outside click
document.addEventListener('click', () => {
  document.getElementById('export-menu').classList.add('hidden');
});

async function loadExportSemesters() {
  try {
    const res = await fetch(`${API}/api/semesters`);
    const data = await res.json();
    const menu = document.getElementById('export-menu');
    // Keep the 'All' option, add per-sem options
    const semButtons = (data.semesters || []).map(s =>
      `<button class="export-option" data-sem="${s}">Semester ${s}</button>`
    ).join('');
    menu.innerHTML = `<button class="export-option" data-sem="all">All Semesters</button>${semButtons}`;
    // Attach click handlers
    menu.querySelectorAll('.export-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sem = btn.dataset.sem;
        const url = sem === 'all' ? `${API}/api/export` : `${API}/api/export?semester=${sem}`;
        window.open(url, '_blank');
        menu.classList.add('hidden');
      });
    });
  } catch (err) { console.error('Failed to load semesters:', err); }
}

// ── Find Student ──
window.viewStudent = function(usn) {
  document.getElementById('find-usn').value = usn;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelector('[data-tab="find"]').classList.add('active');
  document.getElementById('tab-find').classList.add('active');
  findStudent(usn);
};

document.getElementById('btn-find').addEventListener('click', () => findStudent());
document.getElementById('find-usn').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') findStudent();
});

// Cache for re-rendering on semester pill clicks
let _lastStudentData = null;

async function findStudent(usnArg) {
  const usn = (usnArg || document.getElementById('find-usn').value).trim().toUpperCase();
  if (!usn) return;

  const card = document.getElementById('student-card');
  const empty = document.getElementById('find-empty');
  const error = document.getElementById('find-error');

  card.classList.add('hidden');
  empty.classList.add('hidden');
  error.classList.add('hidden');

  try {
    const res = await fetch(`${API}/api/results/${usn}`);
    if (!res.ok) {
      error.classList.remove('hidden');
      document.getElementById('find-error-msg').textContent = `No result found for USN: ${usn}`;
      return;
    }
    _lastStudentData = await res.json();
    renderStudentCard(_lastStudentData, 'all');
    card.classList.remove('hidden');
  } catch (err) {
    error.classList.remove('hidden');
    document.getElementById('find-error-msg').textContent = 'Error connecting to server.';
  }
}

// Called when a semester pill is clicked
window.filterSem = function(sem) {
  if (!_lastStudentData) return;
  renderStudentCard(_lastStudentData, sem);
  document.getElementById('student-card').classList.remove('hidden');
};

function renderStudentCard(data, activeSem) {
  const card = document.getElementById('student-card');
  const subjects = data.subjects || {};
  const initials = (data.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2);

  // Group subjects by semester
  const semGroups = {};
  Object.entries(subjects).forEach(([code, s]) => {
    const sem = s.semester || _getSemFromCode(code);
    if (!semGroups[sem]) semGroups[sem] = [];
    semGroups[sem].push({ code, ...s });
  });
  const sortedSems = Object.keys(semGroups).sort((a, b) => Number(a) - Number(b));

  // Build semester pills
  const pills = `
    <div class="sem-pills">
      <button class="sem-pill ${activeSem === 'all' ? 'active' : ''}" onclick="filterSem('all')">All Semesters</button>
      ${sortedSems.map(sem => `
        <button class="sem-pill ${String(activeSem) === String(sem) ? 'active' : ''}" onclick="filterSem('${sem}')">Sem ${sem}</button>
      `).join('')}
    </div>
  `;

  // Filter semesters to show
  const semsToShow = activeSem === 'all' ? sortedSems : sortedSems.filter(s => String(s) === String(activeSem));

  // Compute displayed total
  let displayTotal = 0;
  semsToShow.forEach(sem => {
    semGroups[sem].forEach(s => { displayTotal += s.total || 0; });
  });

  // Build semester sections
  const semSections = semsToShow.map(sem => {
    const subs = semGroups[sem].sort((a, b) => a.code.localeCompare(b.code));
    const semTotal = subs.reduce((sum, s) => sum + (s.total || 0), 0);
    const semPassed = subs.filter(s => s.status === 'P').length;
    const semFailed = subs.length - semPassed;
    const hasReval = subs.some(s => s.old_marks !== undefined || s.rv_marks !== undefined);

    const headers = hasReval
      ? '<th>Code</th><th>Subject Name</th><th>Cr.</th><th>Internal</th><th>Old Total</th><th>RV Total</th><th>New Total</th><th>Result</th>'
      : '<th>Code</th><th>Subject Name</th><th>Cr.</th><th>Internal</th><th>External</th><th>Total</th><th>Result</th>';

    return `
      <div class="sem-section">
        <div class="sem-header">
          <span class="sem-badge">Semester ${sem}${hasReval ? ' <span class="reval-tag">REVAL</span>' : ''}</span>
          <span class="sem-stats">${subs.length} subjects &middot; Total: ${semTotal} &middot; <span style="color:var(--green)">${semPassed}P</span>${semFailed > 0 ? ` <span style="color:var(--red)">${semFailed}F</span>` : ''} &middot; <span style="color:var(--purple); font-weight:700;">SGPA: ${data.sgpa_map && data.sgpa_map[sem] !== undefined ? Number(data.sgpa_map[sem]).toFixed(2) : '-'}</span></span>
        </div>
        <table class="marks-table">
          <thead><tr>${headers}</tr></thead>
          <tbody>
            ${subs.map(s => {
              if (hasReval) {
                const oldTotal = s.old_total ?? (s.old_marks !== undefined ? s.internals + s.old_marks : '-');
                const rvTotal = s.rv_total ?? (s.rv_marks !== undefined ? s.internals + s.rv_marks : '-');
                const improved = typeof oldTotal === 'number' && s.total > oldTotal;
                return `
                <tr${improved ? ' class="reval-improved"' : ''}>
                  <td style="font-family:'Courier New',monospace;font-weight:600">${s.code}</td>
                  <td>${s.name}</td>
                  <td style="font-weight:600; text-align:center">${s.credits}</td>
                  <td>${s.internals}</td>
                  <td style="color:var(--text-muted)">${oldTotal}</td>
                  <td style="color:var(--cyan)">${rvTotal}</td>
                  <td style="font-weight:700">${s.total}${improved ? ' <span style="color:var(--green)">↑</span>' : ''}</td>
                  <td class="${s.status === 'P' ? 'result-pass' : 'result-fail'}">${s.status === 'P' ? 'PASS' : 'FAIL'}</td>
                </tr>`;
              }
              return `
              <tr>
                <td style="font-family:'Courier New',monospace;font-weight:600">${s.code}</td>
                <td>${s.name}</td>
                <td style="font-weight:600; text-align:center">${s.credits}</td>
                <td>${s.internals}</td>
                <td>${s.externals}</td>
                <td style="font-weight:700">${s.total}</td>
                <td class="${s.status === 'P' ? 'result-pass' : 'result-fail'}">${s.status === 'P' ? 'PASS' : 'FAIL'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }).join('');

  const totalLabel = activeSem === 'all' ? 'Grand Total' : `Sem ${activeSem} Total`;

  card.innerHTML = `
    <div class="student-header">
      <div class="student-avatar">${initials}</div>
      <div class="student-info">
        <div class="student-name">${data.name || 'Unknown'}</div>
        <div class="student-usn">${data.usn} &middot; ${sortedSems.length} semester${sortedSems.length > 1 ? 's' : ''} on record</div>
      </div>
      <div class="student-total" style="padding: 10px 16px; border-radius: var(--radius-sm); background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.2);">
        <span class="total-number" style="color: var(--purple); font-size: 28px;">${data.sgpa || '-'}</span>
        <span class="total-label" style="color: var(--purple)">Latest SGPA</span>
      </div>
      <div class="student-total" style="padding: 10px 16px; border-radius: var(--radius-sm); background: rgba(34, 211, 238, 0.08); border: 1px solid rgba(34, 211, 238, 0.2);">
        <span class="total-number" style="color: var(--cyan); font-size: 28px;">${data.cgpa || '-'}</span>
        <span class="total-label" style="color: var(--cyan)">CGPA</span>
      </div>
      <div class="student-total">
        <span class="total-number">${displayTotal}</span>
        <span class="total-label">${totalLabel}</span>
      </div>
    </div>
    ${pills}
    <div class="marks-table-wrapper">
      ${semSections}
    </div>
  `;
}

// Fallback semester extraction if backend doesn't have it yet
function _getSemFromCode(code) {
  for (const ch of code) {
    if (ch >= '0' && ch <= '9') return parseInt(ch);
  }
  return 0;
}

// ── Stats ──
async function updateStatCount() {
  try {
    const res = await fetch(`${API}/api/stats`);
    const data = await res.json();
    document.getElementById('stat-count').textContent = data.total_students || 0;
  } catch (err) { /* ignore */ }
}

// ── Init ──
updateStatCount();
