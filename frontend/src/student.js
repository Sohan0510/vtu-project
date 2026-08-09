import './student.css';

const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? ''
  : 'https://fast-student-api.vercel.app';

// SPA Navigation State
let currentView = 'home';
let currentStudentData = null;
let activeSem = 'all';
let isAdmin = false;
let currentCalendarDate = new Date();
let selectedCalendarDate = new Date();
let calendarInitialLoad = true;

// Calendar Filter States (Online, Offline, On-Campus & Off-Campus drives)
const calendarFilters = {
  exams: true,
  holidays: true,
  online: true,
  offline: true,
  oncampus: true,
  offcampus: true,
  worksite: true,
};

// XSS Prevention Utility
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Formats description text into HTML, converting bullet points to list tags and preserving newlines
function formatEventDescription(desc) {
  if (!desc) return '';
  const escaped = escapeHTML(desc);
  const lines = escaped.split(/\r?\n/);
  
  let html = [];
  let inList = false;
  
  for (let line of lines) {
    const trimmed = line.trim();
    // Match bullet points starting with -, *, +, or • followed by one or more spaces
    const listMatch = trimmed.match(/^([-\*\+•])\s+(.+)$/);
    
    if (listMatch) {
      if (!inList) {
        html.push('<ul class="desc-list">');
        inList = true;
      }
      html.push(`<li>${listMatch[2]}</li>`);
    } else {
      if (inList) {
        html.push('</ul>');
        inList = false;
      }
      if (trimmed === '') {
        html.push('<div class="desc-empty-line"></div>');
      } else {
        // Keep original line spacing and indentation by using line instead of trimmed
        html.push(`<p class="desc-text-line">${line}</p>`);
      }
    }
  }
  if (inList) {
    html.push('</ul>');
  }
  return html.join('');
}

// Helper for secure client-side hashing
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Placement Calendar Database array
let calendarEvents = [];

// Fetch events from secure backend
async function fetchEvents() {
  try {
    const res = await fetch(`${API}/api/events`);
    if (res.ok) {
      calendarEvents = await res.json();
    } else {
      calendarEvents = [];
    }
  } catch (err) {
    console.error('Failed to fetch events:', err);
    calendarEvents = [];
  }
}

// Router Entry
function render() {
  const container = document.querySelector('#student-app');
  container.className = `view-${currentView}`;

  if (currentView === 'home') {
    renderHome(container);
  } else if (currentView === 'registry-selector') {
    renderRegistrySelector(container);
  } else if (currentView === 'cse') {
    renderCSE(container);
  } else if (currentView === 'ece') {
    renderECE(container);
  } else if (currentView === 'calendar') {
    renderCalendar(container);
  } else if (currentView === 'spc') {
    renderSPC(container);
  }
}

// 1. Render Home / Lobby
function renderHome(container) {
  container.innerHTML = `
    <div class="lobby-container">
      <!-- Toast Notification -->
      <div class="lobby-toast" id="lobby-toast">
        <div class="toast-content">
          <div class="toast-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div class="toast-text-wrapper">
            <div class="toast-heading">Upcoming Update</div>
            <div class="toast-message" id="toast-message-text"></div>
          </div>
        </div>
        <div class="toast-progress-bar"></div>
      </div>
      <header class="lobby-header">
        <h1>PLACEMENT & STUDENT REGISTRY</h1>
        <p class="subtitle">RV INSTITUTE OF TECHNOLOGY & MANAGEMENT</p>
      </header>
      
      <div class="lobby-divider">
        <div class="diamond"></div>
      </div>

      <div class="navigation-grid">
        <button class="nav-card featured-card" id="btn-calendar">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="1.5" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div class="card-title">Placement Calendar</div>
          <div class="card-desc">Track active recruitment drives, mock interviews, placement tests, and system scheduler details.</div>
          <div class="card-action">Open Calendar →</div>
        </button>

        <button class="nav-card" id="btn-marks-registry">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="1.5" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <circle cx="9" cy="9" r="1"/>
            </svg>
          </div>
          <div class="card-title">Marks Registry</div>
          <div class="card-desc">Access student examinations database, calculate GPA indices, and query academic logs for CSE, ISE & ECE.</div>
          <div class="card-action">Select Branch →</div>
        </button>

        <button class="nav-card" id="btn-blacklist">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="1.5" fill="none">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <line x1="17" y1="8" x2="23" y2="14"></line>
              <line x1="23" y1="8" x2="17" y2="14"></line>
            </svg>
          </div>
          <div class="card-title">Blacklisted Registry</div>
          <div class="card-desc">View the official database of academic debarments, eligibility warnings, and active placement restrictions.</div>
          <div class="card-action">Open Registry →</div>
        </button>

        <button class="nav-card" id="btn-spc">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="1.5" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div class="card-title">SPC Control Panel</div>
          <div class="card-desc">Access the Placement Coordinator management portal and embedded calendar configurations.</div>
          <div class="card-action">Enter Portal →</div>
        </button>
      </div>
      
      <footer class="lobby-footer">
        <p>Official Placement & Student Registry Portal. Secured via Departmental Access Keys.</p>
      </footer>
    </div>

    <!-- Multi-purpose Modal Overlay -->
    <div class="modal-overlay" id="event-modal">
      <div class="modal-card" id="modal-card-content">
        <!-- Renders details, CRUD forms, and logins dynamically -->
      </div>
    </div>
  `;

  // Bind Card Click Events
  document.getElementById('btn-marks-registry').addEventListener('click', () => {
    currentView = 'registry-selector';
    render();
  });

  document.getElementById('btn-blacklist').addEventListener('click', () => {
    window.open('https://docs.google.com/spreadsheets/d/1VaHBoHdMgSeC5tEfPZZA4VV1S703B4oLNJreDdVa40I/edit?usp=sharing', '_blank');
  });

  document.getElementById('btn-spc').addEventListener('click', () => {
    showSPCPasswordModal();
  });

  document.getElementById('btn-calendar').addEventListener('click', () => {
    currentView = 'calendar';
    calendarInitialLoad = true;
    render();
  });

  // Trigger upcoming calendar event toast
  triggerUpcomingToast();
}

// 1.5 Render Registry Selection Page (for CSE, ISE, ECE selector)
function renderRegistrySelector(container) {
  container.innerHTML = `
    <div class="selector-container">
      <div class="view-header-bar">
        <button class="btn-back" id="selector-back">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Return to Dashboard
        </button>
        <div class="view-title-wrapper">
          <h2>Marks Registry</h2>
          <p>Select Branch Academic Database</p>
        </div>
      </div>

      <div class="navigation-grid" style="margin-top: 40px;">
        <button class="nav-card" id="btn-cse">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="1.5" fill="none">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 11l2 2 4-4"/>
            </svg>
          </div>
          <div class="card-title">CSE Marks Registry</div>
          <div class="card-desc">Access student examinations database, calculate GPA indices, and query academic logs.</div>
          <div class="card-action">Enter Registry →</div>
        </button>

        <button class="nav-card" id="btn-ise">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="1.5" fill="none">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <div class="card-title">ISE Marks Registry</div>
          <div class="card-desc">Access student examinations database, calculate GPA indices, and query academic logs.</div>
          <div class="card-action">Visit Portal →</div>
        </button>

        <button class="nav-card" id="btn-ece">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="1.5" fill="none">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="card-title">ECE Marks Registry</div>
          <div class="card-desc">Access student examinations database, calculate GPA indices, and query academic logs.</div>
          <div class="card-action">Enter Registry →</div>
        </button>
      </div>
    </div>
  `;

  // Bind back button
  document.getElementById('selector-back').addEventListener('click', () => {
    currentView = 'home';
    render();
  });

  // Bind Selector Card Click Events
  document.getElementById('btn-cse').addEventListener('click', () => {
    currentView = 'cse';
    render();
  });

  document.getElementById('btn-ise').addEventListener('click', () => {
    window.location.href = 'https://placements-rvitm.netlify.app/student';
  });

  document.getElementById('btn-ece').addEventListener('click', () => {
    window.location.href = 'https://rvitm-ece-placement.vercel.app/';
  });
}

// Helper to find and render upcoming event notification toast
function triggerUpcomingToast() {
  const toast = document.getElementById('lobby-toast');
  if (!toast) return;

  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  const upcoming = calendarEvents
    .filter(ev => ev.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const msgText = document.getElementById('toast-message-text');
  if (upcoming.length > 0) {
    const nextEv = upcoming[0];
    const formatLabel = nextEv.mode ? ` (${nextEv.mode.charAt(0).toUpperCase() + nextEv.mode.slice(1)})` : '';
    
    // Parse date array safely for local formatting
    const parts = nextEv.date.split('-');
    const eventDate = new Date(parts[0], parts[1] - 1, parts[2]);
    const formattedDate = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    msgText.innerHTML = `<strong>${nextEv.title}</strong>${formatLabel} on ${formattedDate}`;
  } else {
    msgText.textContent = 'No upcoming placement updates scheduled.';
  }

  // Add active animation class
  setTimeout(() => {
    toast.classList.add('show');
  }, 150);

  // Fade out toast after 5s
  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hide');
  }, 5000);
}

// 2. Render CSE Marks View
function renderCSE(container) {
  container.innerHTML = `
    <div class="cse-container">
      <div class="view-header-bar">
        <button class="btn-back" id="cse-back">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Return to Registry
        </button>
        <div class="view-title-wrapper">
          <h2>CSE Marks Registry</h2>
          <p>Official Examination Database Query</p>
        </div>
      </div>

      <div class="search-container">
        <form id="search-form" class="search-box">
          <svg class="search-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" id="usn-input" class="search-input" placeholder="Enter USN (e.g. 1RF22CS001)" required maxlength="12" autocomplete="off" spellcheck="false">
          <button type="submit" class="search-btn">Query Database</button>
        </form>
        <div id="error-msg" class="error-msg"></div>
      </div>

      <div id="spinner" class="spinner-container">
        <div class="spinner"></div>
      </div>

      <div id="result-container" class="result-container">
        <div class="profile-card" id="profile-card"></div>
        <div class="semesters-nav" id="semesters-nav"></div>
        <div class="marks-section" id="marks-section"></div>
      </div>
    </div>
  `;

  // Restore active student state if returning to view
  if (currentStudentData) {
    document.getElementById('usn-input').value = currentStudentData.usn;
    document.getElementById('result-container').classList.add('active');
    renderStudent(activeSem);
  }

  // Bind back button
  document.getElementById('cse-back').addEventListener('click', () => {
    currentView = 'registry-selector';
    render();
  });

  // Bind search form submit
  const form = document.getElementById('search-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usn = document.getElementById('usn-input').value.trim().toUpperCase();
    if (!usn) return;

    const resultContainer = document.getElementById('result-container');
    const errorMsg = document.getElementById('error-msg');
    const spinner = document.getElementById('spinner');

    // CSE USN validation: 1RF##CS### (e.g. 1RF23CS001, 1RF24CS400)
    const CSE_USN_REGEX = /^1RF\d{2}CS\d{3}$/;
    if (!CSE_USN_REGEX.test(usn)) {
      errorMsg.textContent = 'Invalid USN format. Expected format: 1RF23CS001 or 1RF24CS400';
      errorMsg.classList.add('active');
      resultContainer.classList.remove('active');
      return;
    }

    resultContainer.classList.remove('active');
    errorMsg.classList.remove('active');
    spinner.classList.add('active');

    try {
      const res = await fetch(`${API}/api/results/${usn}`);
      if (!res.ok) {
        throw new Error('Student record not found in registry database.');
      }
      const data = await res.json();
      currentStudentData = data;
      activeSem = 'all';
      
      renderStudent('all');
      
      spinner.classList.remove('active');
      resultContainer.classList.add('active');
    } catch (err) {
      spinner.classList.remove('active');
      errorMsg.textContent = err.message;
      errorMsg.classList.add('active');
    }
  });
}

// 2.5. Render ECE Marks View
function renderECE(container) {
  container.innerHTML = `
    <div class="ece-container">
      <div class="view-header-bar">
        <button class="btn-back" id="ece-back">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Return to Registry
        </button>
        <div class="view-title-wrapper">
          <h2>ECE Marks Registry</h2>
          <p>Official Examination Database Query</p>
        </div>
      </div>

      <div class="search-container">
        <form id="search-form" class="search-box">
          <svg class="search-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" id="usn-input" class="search-input" placeholder="Enter USN (e.g. 1RF23EC001)" required maxlength="12" autocomplete="off" spellcheck="false">
          <button type="submit" class="search-btn">Query Database</button>
        </form>
        <div id="error-msg" class="error-msg"></div>
      </div>

      <div id="spinner" class="spinner-container">
        <div class="spinner"></div>
      </div>

      <div id="result-container" class="result-container">
        <div class="profile-card" id="profile-card"></div>
        <div class="semesters-nav" id="semesters-nav"></div>
        <div class="marks-section" id="marks-section"></div>
      </div>
    </div>
  `;

  // Restore active student state if returning to view
  if (currentStudentData) {
    document.getElementById('usn-input').value = currentStudentData.usn;
    document.getElementById('result-container').classList.add('active');
    renderStudent(activeSem);
  }

  // Bind back button
  document.getElementById('ece-back').addEventListener('click', () => {
    currentView = 'registry-selector';
    render();
  });

  // Bind search form submit
  const form = document.getElementById('search-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usn = document.getElementById('usn-input').value.trim().toUpperCase();
    if (!usn) return;

    const resultContainer = document.getElementById('result-container');
    const errorMsg = document.getElementById('error-msg');
    const spinner = document.getElementById('spinner');

    // ECE USN validation: 1RF##EC### (e.g. 1RF23EC001, 1RF24EC400, 1RF21EC023)
    const ECE_USN_REGEX = /^1RF\d{2}EC\d{3}$/;
    if (!ECE_USN_REGEX.test(usn)) {
      errorMsg.textContent = 'Invalid USN format. Expected format: 1RF23EC001 or 1RF24EC400';
      errorMsg.classList.add('active');
      resultContainer.classList.remove('active');
      return;
    }

    resultContainer.classList.remove('active');
    errorMsg.classList.remove('active');
    spinner.classList.add('active');

    try {
      // Load ECE data directly from the static JSON file (no backend required)
      const res = await fetch('/ece_students.json');
      if (!res.ok) throw new Error('Failed to load ECE registry.');
      const eceList = await res.json();

      const student = eceList.find(s => s.usn === usn);
      if (!student) {
        throw new Error('Student record not found in ECE registry.');
      }

      // Shape into the same data format renderStudent() expects
      currentStudentData = {
        usn: student.usn,
        name: student.name,
        cgpa: student.cgpa,
        sgpa: student.cgpa,
        subjects: {},
        semesters: student.cgpa ? [1] : [],
        sgpa_map: student.cgpa ? { '1': student.cgpa } : {}
      };
      activeSem = 'all';

      renderStudent('all');

      spinner.classList.remove('active');
      resultContainer.classList.add('active');
    } catch (err) {
      spinner.classList.remove('active');
      errorMsg.textContent = err.message;
      errorMsg.classList.add('active');
    }
  });
}


// 3. Render Outlook Calendar View (with Admin authentication)
function renderCalendar(container) {
  container.innerHTML = `
    <div class="calendar-container">
      <div class="view-header-bar">
        <button class="btn-back" id="calendar-back">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Return to Registry
        </button>
        
        <div class="calendar-auth-control">
          ${isAdmin ? `
            <button class="btn-auth admin-active" id="btn-admin-logout">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                <path d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              </svg>
              Admin Mode (Logout)
            </button>
          ` : `
            <button class="btn-auth" id="btn-admin-login">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Admin Login
            </button>
          `}
        </div>

        <div class="view-title-wrapper">
          <h2>Placement Calendar</h2>
          <p>Outlook Registry Format</p>
        </div>
      </div>

      <div class="calendar-workspace">
        <!-- Left Sidebar -->
        <aside class="calendar-sidebar">
          <div class="mini-calendar">
            <div class="mini-month-header">
              <span class="mini-month-title"></span>
            </div>
            <div class="mini-grid">
              <div class="mini-day-name">S</div>
              <div class="mini-day-name">M</div>
              <div class="mini-day-name">T</div>
              <div class="mini-day-name">W</div>
              <div class="mini-day-name">T</div>
              <div class="mini-day-name">F</div>
              <div class="mini-day-name">S</div>
              <!-- Mini calendar days populated dynamically -->
            </div>
          </div>

          <div class="calendar-filters">
            <h3>My Calendars</h3>
            <label class="filter-item">
              <input type="checkbox" id="filter-exams" ${calendarFilters.exams ? 'checked' : ''}>
              <span class="checkbox-custom checkbox-exams"></span>
              Interviews & Tests
            </label>
            <label class="filter-item">
              <input type="checkbox" id="filter-holidays" ${calendarFilters.holidays ? 'checked' : ''}>
              <span class="checkbox-custom checkbox-holidays"></span>
              Holidays & Breaks
            </label>
            <label class="filter-item">
              <input type="checkbox" id="filter-online" ${calendarFilters.online ? 'checked' : ''}>
              <span class="checkbox-custom checkbox-online"></span>
              Online Drives
            </label>
            <label class="filter-item">
              <input type="checkbox" id="filter-offline" ${calendarFilters.offline ? 'checked' : ''}>
              <span class="checkbox-custom checkbox-offline"></span>
              Offline Drives
            </label>
            <label class="filter-item">
              <input type="checkbox" id="filter-oncampus" ${calendarFilters.oncampus ? 'checked' : ''}>
              <span class="checkbox-custom checkbox-oncampus"></span>
              RVCE Drives
            </label>
            <label class="filter-item">
              <input type="checkbox" id="filter-offcampus" ${calendarFilters.offcampus ? 'checked' : ''}>
              <span class="checkbox-custom checkbox-offcampus"></span>
              RVITM Drives
            </label>
            <label class="filter-item">
              <input type="checkbox" id="filter-worksite" ${calendarFilters.worksite ? 'checked' : ''}>
              <span class="checkbox-custom checkbox-worksite"></span>
              Worksite Drives
            </label>
          </div>
        </aside>

        <!-- Main Calendar Desk -->
        <main class="calendar-main">
          <div class="calendar-toolbar">
            <div class="toolbar-left">
              <button class="toolbar-btn today-btn" id="cal-today-btn">Today</button>
              <div class="toolbar-nav">
                <button class="toolbar-nav-btn" id="cal-prev-btn">&lt;</button>
                <span class="toolbar-current-month"></span>
                <button class="toolbar-nav-btn" id="cal-next-btn">&gt;</button>
              </div>
            </div>
            <div class="toolbar-right" style="display: flex; gap: 10px;">
              <button onclick="showSubscribeModal()" class="toolbar-btn" style="background: #4285F4; color: white; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 2V6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 2V6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 10H21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 16H12.01" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Subscribe
              </button>
            </div>
          </div>

          <div class="calendar-grid-scroll-wrapper">
            <div class="calendar-grid-header">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            <div class="calendar-grid-body" id="calendar-days-grid">
              <!-- Grid days rendered dynamically -->
            </div>
          </div>
          <!-- Agenda View for Selected Day (optimized for Mobile UX) -->
          <div class="calendar-agenda" id="calendar-agenda-view">
            <!-- Agenda content populated dynamically -->
          </div>
        </main>
      </div>
    </div>

    <!-- Multi-purpose Modal Overlay -->
    <div class="modal-overlay" id="event-modal">
      <div class="modal-card" id="modal-card-content">
        <!-- Renders details, CRUD forms, and logins dynamically -->
      </div>
    </div>
  `;

  // Generate layouts
  generateMiniCalendar();
  generateCalendarGrid();

  // Calendar navigation
  document.getElementById('cal-prev-btn')?.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    generateMiniCalendar();
    generateCalendarGrid();
  });
  document.getElementById('cal-next-btn')?.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    generateMiniCalendar();
    generateCalendarGrid();
  });
  document.getElementById('cal-today-btn')?.addEventListener('click', () => {
    currentCalendarDate = new Date();
    calendarInitialLoad = true;
    generateMiniCalendar();
    generateCalendarGrid();
  });

  // Bind back button
  document.getElementById('calendar-back').addEventListener('click', () => {
    currentView = 'home';
    render();
  });

  // Bind Admin Auth Controls
  const loginBtn = document.getElementById('btn-admin-login');
  if (loginBtn) {
    loginBtn.addEventListener('click', showLoginModal);
  }

  const logoutBtn = document.getElementById('btn-admin-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      isAdmin = false;
      sessionStorage.removeItem('adminToken');
      render();
    });
  }

  // Bind checkbox filter change events
  ['exams', 'holidays', 'online', 'offline', 'oncampus', 'offcampus', 'worksite'].forEach(key => {
    document.getElementById(`filter-${key}`)?.addEventListener('change', (e) => {
      calendarFilters[key] = e.target.checked;
      generateCalendarGrid();
      renderAgendaList();
    });
  });

  // Close modal when clicking background overlay
  document.getElementById('event-modal').addEventListener('click', (e) => {
    if (e.target.id === 'event-modal') hideEventModal();
  });
}

// Helper to translate event types to human labels
function getCategoryLabel(type) {
  const labels = {
    exams: 'Interviews & Tests',
    holidays: 'Holidays & Breaks'
  };
  return labels[type] || 'Event';
}

function getMonthData(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  return { firstDay, daysInMonth, daysInPrevMonth };
}

// 4. Generate Sidebar Mini Calendar
function generateMiniCalendar() {
  const miniGrid = document.querySelector('.mini-grid');
  if (!miniGrid) return;
  // Keep only headers
  const headers = Array.from(miniGrid.children).slice(0, 7);
  miniGrid.innerHTML = '';
  headers.forEach(h => miniGrid.appendChild(h));

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  
  const title = document.querySelector('.mini-month-title');
  if (title) {
    title.textContent = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  const { firstDay, daysInMonth, daysInPrevMonth } = getMonthData(year, month);
  const today = new Date();
  
  // Previous month filler days
  for (let i = firstDay - 1; i >= 0; i--) {
    const el = document.createElement('div');
    el.className = 'mini-day-cell prev-month';
    el.textContent = daysInPrevMonth - i;
    miniGrid.appendChild(el);
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const el = document.createElement('div');
    el.className = 'mini-day-cell';
    if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      el.classList.add('today');
    }
    
    // Highlight days with events
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const hasEvents = calendarEvents.some(ev => ev.date === dateStr);
    if (hasEvents) el.classList.add('has-event');
    
    el.textContent = d;
    miniGrid.appendChild(el);
  }

  // Next month filler days
  const remainingCells = 42 - (firstDay + daysInMonth); // standard 6 rows
  for (let d = 1; d <= remainingCells; d++) {
    const el = document.createElement('div');
    el.className = 'mini-day-cell next-month';
    el.textContent = d;
    miniGrid.appendChild(el);
  }
}

// 5. Generate Main Calendar Grid
function generateCalendarGrid() {
  const gridContainer = document.getElementById('calendar-days-grid');
  if (!gridContainer) return;
  gridContainer.innerHTML = '';

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  const title = document.querySelector('.toolbar-current-month');
  if (title) {
    title.textContent = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  const { firstDay, daysInMonth, daysInPrevMonth } = getMonthData(year, month);
  const today = new Date();

  // Prev month days
  for (let i = firstDay - 1; i >= 0; i--) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell prev-month';
    cell.innerHTML = `<span class="day-number">${daysInPrevMonth - i}</span>`;
    gridContainer.appendChild(cell);
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell';
    if (isAdmin) cell.classList.add('admin-active');
    
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      cell.classList.add('today');
    }

    // Highlight if selected
    const selYear = selectedCalendarDate.getFullYear();
    const selMonth = selectedCalendarDate.getMonth();
    const selDay = selectedCalendarDate.getDate();
    if (d === selDay && month === selMonth && year === selYear) {
      cell.classList.add('selected-day');
    }

    let cellContent = `<span class="day-number">${d}</span>`;
    
    // Extract events active under current filters (category + format filter)
    const events = calendarEvents.filter(ev => {
      if (ev.date !== dateStr) return false;
      if (!calendarFilters[ev.type]) return false;
      if (ev.mode === 'online' && !calendarFilters.online) return false;
      if (ev.mode === 'offline' && !calendarFilters.offline) return false;
      
      const isRVCE = ev.location === 'rvce' || ev.location === 'offcampus';
      const isRVITM = ev.location === 'rvitm' || ev.location === 'oncampus';
      const isWorksite = ev.location === 'worksite';

      if (isRVCE && !calendarFilters.oncampus) return false; // "oncampus" filter controls RVCE
      if (isRVITM && !calendarFilters.offcampus) return false; // "offcampus" filter controls RVITM
      if (isWorksite && !calendarFilters.worksite) return false;
      return true;
    });
    
    if (events.length > 0) {
      // Responsive max: 1 event on very small screens, 2 on larger mobile/desktop
      const isMobile = window.innerWidth <= 768;
      const isVerySmall = window.innerWidth < 480;
      const maxVisible = isMobile && isVerySmall ? 1 : 2;
      const visibleEvents = events.slice(0, maxVisible);
      const extraCount = events.length - maxVisible;

      cellContent += `<div class="day-events">`;
      visibleEvents.forEach(ev => {
        cellContent += `<div class="calendar-event-pill event-${ev.type}" data-event-id="${ev.id}"><span class="event-dot"></span><span class="event-text">${escapeHTML(ev.title)}</span></div>`;
      });
      if (extraCount > 0) {
        cellContent += `<div class="calendar-event-more">+${extraCount} more</div>`;
      }
      cellContent += `</div>`;
    }

    cell.innerHTML = cellContent;
    gridContainer.appendChild(cell);

    cell.addEventListener('click', (e) => {
      // Do not trigger selection change if user clicks directly on an existing event pill
      if (e.target.closest('.calendar-event-pill')) return;

      selectedCalendarDate = new Date(year, month, d);
      generateCalendarGrid();

      // Auto-scroll down to the agenda view where events are shown
      const agendaView = document.getElementById('calendar-agenda-view');
      if (agendaView) {
        setTimeout(() => {
          agendaView.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }

      // Only show the direct create modal if Admin and on desktop (width > 768px)
      // Mobile admins will use the "Add Update" button inside the Agenda view
      if (isAdmin && window.innerWidth > 768) {
        showCreateEventModal(dateStr);
      }
    });
  }

  // Next month filler days
  const remainingCells = 42 - (firstDay + daysInMonth);
  for (let d = 1; d <= remainingCells; d++) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell next-month';
    cell.innerHTML = `<span class="day-number">${d}</span>`;
    gridContainer.appendChild(cell);
  }

  // Bind click event to event pills for details viewing
  document.querySelectorAll('.calendar-event-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      const eventId = parseInt(pill.getAttribute('data-event-id'));
      const ev = calendarEvents.find(event => event.id === eventId);
      if (ev) {
        if (isAdmin) {
          showEventDetailModalAdmin(ev);
        } else {
          showEventDetailModalVisitor(ev);
        }
      }
    });
  });

  // Render agenda list for the selected date
  renderAgendaList();

  // Auto-scroll to the current week when first loaded or to the first day when month changes
  if (calendarInitialLoad) {
    const todayCell = gridContainer.querySelector('.today');
    const scrollWrapper = gridContainer.closest('.calendar-grid-scroll-wrapper');
    if (scrollWrapper && window.innerWidth <= 768) {
      setTimeout(() => {
        if (todayCell) {
          todayCell.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
          scrollWrapper.scrollTo({ left: 0, behavior: 'smooth' });
        }
      }, 150);
    }
    calendarInitialLoad = false;
  }
}

// 5.5. Render Agenda List for Selected Day
function renderAgendaList() {
  const agendaContainer = document.getElementById('calendar-agenda-view');
  if (!agendaContainer) return;

  const selYear = selectedCalendarDate.getFullYear();
  const selMonth = selectedCalendarDate.getMonth();
  const selDay = selectedCalendarDate.getDate();
  const dateStr = `${selYear}-${String(selMonth + 1).padStart(2, '0')}-${String(selDay).padStart(2, '0')}`;

  const formattedDateStr = selectedCalendarDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Filter events for this day matching active filters
  const events = calendarEvents.filter(ev => {
    if (ev.date !== dateStr) return false;
    if (!calendarFilters[ev.type]) return false;
    if (ev.mode === 'online' && !calendarFilters.online) return false;
    if (ev.mode === 'offline' && !calendarFilters.offline) return false;
    
    const isRVCE = ev.location === 'rvce' || ev.location === 'offcampus';
    const isRVITM = ev.location === 'rvitm' || ev.location === 'oncampus';
    const isWorksite = ev.location === 'worksite';

    if (isRVCE && !calendarFilters.oncampus) return false;
    if (isRVITM && !calendarFilters.offcampus) return false;
    if (isWorksite && !calendarFilters.worksite) return false;
    return true;
  });

  let html = `
    <div class="agenda-header">
      <div class="agenda-title">Schedule for ${formattedDateStr}</div>
      ${isAdmin ? `
        <div style="display: flex; gap: 8px;">
          <button class="agenda-add-btn" id="agenda-add-event-btn">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg> Add Update
          </button>
          <button class="agenda-add-btn" id="agenda-ai-post-btn" style="background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; border: none; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.25);">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="margin-right: 4px;">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg> AI Quick Post
          </button>
        </div>
      ` : ''}
    </div>
    <div class="agenda-items">
  `;

  if (events.length === 0) {
    html += `
      <div class="agenda-empty">
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="1.5" fill="none">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>No placement events or activities scheduled.</span>
      </div>
    `;
  } else {
    events.forEach(ev => {
      const modeTag = ev.mode ? `<span class="agenda-mode-tag mode-${ev.mode}">${ev.mode.toUpperCase()}</span>` : '';
      const locationLabel = (ev.location === 'rvitm' || ev.location === 'oncampus') ? 'RVITM' : (ev.location === 'rvce' || ev.location === 'offcampus') ? 'RVCE' : ev.location === 'worksite' ? 'WORKSITE' : '';
      const locationClass = (ev.location === 'rvitm' || ev.location === 'oncampus') ? 'oncampus' : (ev.location === 'rvce' || ev.location === 'offcampus') ? 'offcampus' : 'worksite';
      const locationTag = ev.location ? `<span class="agenda-mode-tag mode-${locationClass}">${locationLabel}</span>` : '';
      const studentTypeClass = ev.studentType ? ev.studentType.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '';
      const studentTypeTag = ev.studentType ? `<span class="agenda-mode-tag mode-studenttype-${studentTypeClass}">${ev.studentType.toUpperCase()}</span>` : '';
      let subtypeTags = '';
      if (ev.subtypes && Array.isArray(ev.subtypes)) {
        ev.subtypes.forEach(sub => {
          subtypeTags += `<span class="agenda-subtype-tag subtype-${sub.toLowerCase()}">${sub.toUpperCase()}</span>`;
        });
      }
      html += `
        <div class="agenda-card event-${ev.type}" data-event-id="${ev.id}">
          <div class="agenda-card-header">
            <span class="agenda-category-badge category-${ev.type}">${getCategoryLabel(ev.type)}</span>
            <div class="agenda-card-tags">
              ${modeTag}
              ${locationTag}
              ${studentTypeTag}
              ${subtypeTags}
            </div>
          </div>
          <div class="agenda-card-body">
            <h4 class="agenda-event-title">${escapeHTML(ev.title)}</h4>
            <div class="agenda-event-desc">${formatEventDescription(ev.desc)}</div>
          </div>
          ${isAdmin ? `
            <div class="agenda-card-actions">
              <button class="agenda-action-btn edit" data-action="edit">Edit</button>
              <button class="agenda-action-btn delete" data-action="delete">Delete</button>
            </div>
          ` : ''}
        </div>
      `;
    });
  }

  html += `</div>`;
  agendaContainer.innerHTML = html;

  // Bind click listener on agenda card for viewing full details modal
  agendaContainer.querySelectorAll('.agenda-card').forEach(card => {
    const eventId = parseInt(card.getAttribute('data-event-id'));
    const ev = calendarEvents.find(event => event.id === eventId);
    if (!ev) return;

    card.addEventListener('click', (e) => {
      // Do not open details modal if clicking edit/delete action buttons
      if (e.target.closest('.agenda-card-actions')) return;

      if (isAdmin) {
        showEventDetailModalAdmin(ev);
      } else {
        showEventDetailModalVisitor(ev);
      }
    });

    if (isAdmin) {
      card.querySelector('.agenda-action-btn.edit')?.addEventListener('click', (e) => {
        e.stopPropagation();
        showEditEventModal(ev);
      });

      card.querySelector('.agenda-action-btn.delete')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete the placement update for "${ev.title}"?`)) {
          const btn = e.target;
          btn.disabled = true;
          btn.textContent = 'Deleting...';
          const token = sessionStorage.getItem('adminToken');
          
          try {
            const res = await fetch(`${API}/api/events`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ id: ev.id })
            });
            
            if (!res.ok) throw new Error('Delete failed');
            
            await fetchEvents();
            generateCalendarGrid();
            generateMiniCalendar();
            renderAgendaList();
          } catch (err) {
            alert('Failed to delete event. Please check your connection.');
            btn.disabled = false;
            btn.textContent = 'Delete';
          }
        }
      });
    }
  });

  // Bind add button click handler
  if (isAdmin) {
    document.getElementById('agenda-add-event-btn')?.addEventListener('click', () => {
      showCreateEventModal(dateStr);
    });
    document.getElementById('agenda-ai-post-btn')?.addEventListener('click', () => {
      showAIPostModal();
    });
  }
}

// 6. Dynamic Modal Overlays
// Close modal helper
function hideEventModal() {
  const modal = document.getElementById('event-modal');
  if (modal) modal.classList.remove('active');
}
window.hideEventModal = hideEventModal;

// Subscribe Modal View
function showSubscribeModal() {
  const modal = document.getElementById('event-modal');
  const card = document.getElementById('modal-card-content');
  
  card.innerHTML = `
    <div class="modal-header">
      <span class="modal-category event-exams" style="background: #4285F4; color: white;">Google Calendar Sync</span>
      <button class="modal-close" onclick="hideEventModal()">&times;</button>
    </div>
    <div style="padding: 10px 0;">
      <p style="margin-bottom: 15px; line-height: 1.5; color: #333;">
        You are about to subscribe to the live <strong>Placement Calendar</strong>. All placement drives, exams, and holidays will be automatically added to your personal Google Calendar and will stay updated in real-time.
      </p>
      <div style="background: #f8f9fa; border-left: 4px solid #fbbc05; padding: 12px; border-radius: 4px; margin-bottom: 20px;">
        <strong style="display: block; margin-bottom: 5px; color: #d93025;">💡 Pro Tip: Homescreen Widget</strong>
        <p style="margin: 0; font-size: 14px; color: #555;">After subscribing, add a Google Calendar widget directly to your phone's homescreen. You will instantly see all live placement updates at a glance without even opening the app!</p>
      </div>
      <div class="modal-actions" style="display: flex; justify-content: flex-end; gap: 10px;">
        <button class="modal-btn cancel-btn" onclick="hideEventModal()" style="padding: 10px 16px; border-radius: 8px; border: 1px solid #ccc; background: white; cursor: pointer;">Cancel</button>
        <a href="https://calendar.google.com/calendar/r?cid=830563c902db01ba6c39b8914eb647d8954734b8299b1d23fafb10c462e263a0@group.calendar.google.com" target="_blank" onclick="hideEventModal()" class="modal-btn" style="padding: 10px 16px; border-radius: 8px; border: none; background: #4285F4; color: white; cursor: pointer; text-decoration: none;">Continue to Calendar</a>
      </div>
    </div>
  `;
  modal.classList.add('active');
}
window.showSubscribeModal = showSubscribeModal;

// Visitor Details View
function showEventDetailModalVisitor(event) {
  const modal = document.getElementById('event-modal');
  const card = document.getElementById('modal-card-content');
  
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const parts = event.date.split('-');
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  const dateStr = dateObj.toLocaleDateString('en-US', options);
  
  const modeBadge = event.mode ? `<span class="modal-mode-badge mode-${event.mode}">${event.mode.toUpperCase()}</span>` : '';
  const locationLabel = (event.location === 'rvitm' || event.location === 'oncampus') ? 'RVITM' : (event.location === 'rvce' || event.location === 'offcampus') ? 'RVCE' : event.location === 'worksite' ? 'WORKSITE' : '';
  const locationClass = (event.location === 'rvitm' || event.location === 'oncampus') ? 'oncampus' : (event.location === 'rvce' || event.location === 'offcampus') ? 'offcampus' : 'worksite';
  const locationBadge = event.location ? `<span class="modal-mode-badge mode-${locationClass}">${locationLabel}</span>` : '';
  const studentTypeClass = event.studentType ? event.studentType.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '';
  const studentTypeBadge = event.studentType ? `<span class="modal-mode-badge mode-studenttype-${studentTypeClass}">${event.studentType.toUpperCase()}</span>` : '';
  let subtypeBadges = '';
  if (event.subtypes && Array.isArray(event.subtypes)) {
    event.subtypes.forEach(sub => {
      subtypeBadges += `<span class="modal-subtype-badge subtype-${sub.toLowerCase()}">${sub.toUpperCase()}</span>`;
    });
  }
  
  card.innerHTML = `
    <div class="modal-header">
      <span class="modal-category event-${event.type}">${getCategoryLabel(event.type)}</span>
      <div class="modal-header-tags">
        ${modeBadge}
        ${locationBadge}
        ${studentTypeBadge}
        ${subtypeBadges}
      </div>
      <button class="modal-close" onclick="hideEventModal()">&times;</button>
    </div>
    <h3 class="modal-title">${escapeHTML(event.title)}</h3>
    <div class="modal-date">${dateStr}</div>
    <div class="modal-desc">${formatEventDescription(event.desc)}</div>
  `;
  modal.classList.add('active');
}

// Admin Details View (with Edit/Delete toggles)
function showEventDetailModalAdmin(event) {
  const modal = document.getElementById('event-modal');
  const card = document.getElementById('modal-card-content');
  
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const parts = event.date.split('-');
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  const dateStr = dateObj.toLocaleDateString('en-US', options);
  
  const modeBadge = event.mode ? `<span class="modal-mode-badge mode-${event.mode}">${event.mode.toUpperCase()}</span>` : '';
  const locationLabel2 = (event.location === 'rvitm' || event.location === 'oncampus') ? 'RVITM' : (event.location === 'rvce' || event.location === 'offcampus') ? 'RVCE' : event.location === 'worksite' ? 'WORKSITE' : '';
  const locationClass = (event.location === 'rvitm' || event.location === 'oncampus') ? 'oncampus' : (event.location === 'rvce' || event.location === 'offcampus') ? 'offcampus' : 'worksite';
  const locationBadge = event.location ? `<span class="modal-mode-badge mode-${locationClass}">${locationLabel2}</span>` : '';
  const studentTypeClass = event.studentType ? event.studentType.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '';
  const studentTypeBadge = event.studentType ? `<span class="modal-mode-badge mode-studenttype-${studentTypeClass}">${event.studentType.toUpperCase()}</span>` : '';
  let subtypeBadges = '';
  if (event.subtypes && Array.isArray(event.subtypes)) {
    event.subtypes.forEach(sub => {
      subtypeBadges += `<span class="modal-subtype-badge subtype-${sub.toLowerCase()}">${sub.toUpperCase()}</span>`;
    });
  }
  
  card.innerHTML = `
    <div class="modal-header">
      <span class="modal-category event-${event.type}">${getCategoryLabel(event.type)}</span>
      <div class="modal-header-tags">
        ${modeBadge}
        ${locationBadge}
        ${studentTypeBadge}
        ${subtypeBadges}
      </div>
      <button class="modal-close" onclick="hideEventModal()">&times;</button>
    </div>
    <h3 class="modal-title">${escapeHTML(event.title)}</h3>
    <div class="modal-date">${dateStr}</div>
    <div class="modal-desc">${formatEventDescription(event.desc)}</div>
    <div class="modal-actions">
      <button class="modal-btn edit-btn" id="modal-edit-btn">Edit Update</button>
      <button class="modal-btn delete-btn" id="modal-delete-btn">Delete Update</button>
    </div>
  `;
  modal.classList.add('active');
  
  // Edit click
  document.getElementById('modal-edit-btn').addEventListener('click', () => {
    showEditEventModal(event);
  });
  
  // Delete click
  document.getElementById('modal-delete-btn').addEventListener('click', async (e) => {
    if (confirm(`Are you sure you want to delete the placement update for "${event.title}"?`)) {
      const btn = e.target;
      btn.disabled = true;
      btn.textContent = 'Deleting...';
      const token = sessionStorage.getItem('adminToken');
      
      try {
        const res = await fetch(`${API}/api/events`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ id: event.id })
        });
        
        if (!res.ok) throw new Error('Delete failed');
        
        await fetchEvents();
        hideEventModal();
        generateCalendarGrid();
        generateMiniCalendar();
        renderAgendaList();
      } catch (err) {
        alert('Failed to delete event. Please check your connection.');
        btn.disabled = false;
        btn.textContent = 'Delete Update';
      }
    }
  });
}

// Edit Event Modal Form
function showEditEventModal(event) {
  const modal = document.getElementById('event-modal');
  const card = document.getElementById('modal-card-content');
  
  card.innerHTML = `
    <div class="modal-header">
      <h3>Edit Placement Update</h3>
      <button class="modal-close" onclick="hideEventModal()">&times;</button>
    </div>
    <form id="edit-event-form" class="modal-form">
      <div class="form-group">
        <label for="form-title">Company Name</label>
        <input type="text" id="form-title" value="${escapeHTML(event.title)}" required placeholder="e.g. Google India">
      </div>
      <div class="form-group">
        <label for="form-type">Update Type</label>
        <select id="form-type" required>
          <option value="exams" ${event.type === 'exams' ? 'selected' : ''}>Interviews & Tests</option>
          <option value="holidays" ${event.type === 'holidays' ? 'selected' : ''}>Holidays & Breaks</option>
        </select>
      </div>
      <div class="form-group">
        <label>Drive Format</label>
        <div class="format-buttons-group">
          <button type="button" class="format-btn ${event.mode === 'online' ? 'active' : ''}" id="format-btn-online" data-value="online">Online</button>
          <button type="button" class="format-btn ${event.mode === 'offline' ? 'active' : ''}" id="format-btn-offline" data-value="offline">Offline</button>
        </div>
        <input type="hidden" id="form-mode" value="${event.mode || ''}">
      </div>
      <div class="form-group">
        <label>Location</label>
        <div class="location-buttons-group">
          <button type="button" class="location-btn ${event.location === 'rvce' || event.location === 'offcampus' ? 'active' : ''}" id="location-btn-rvce" data-value="rvce">RVCE</button>
          <button type="button" class="location-btn ${event.location === 'rvitm' || event.location === 'oncampus' ? 'active' : ''}" id="location-btn-rvitm" data-value="rvitm">RVITM</button>
          <button type="button" class="location-btn ${event.location === 'worksite' ? 'active' : ''}" id="location-btn-worksite" data-value="worksite">Worksite</button>
        </div>
        <input type="hidden" id="form-location" value="${event.location || ''}">
      </div>
      <div class="form-group">
        <label>Student Type <span class="form-label-optional">(optional)</span></label>
        <div class="studenttype-buttons-group">
          <button type="button" class="studenttype-btn ${event.studentType === 'BE' ? 'active' : ''}" id="studenttype-btn-be" data-value="BE">BE</button>
          <button type="button" class="studenttype-btn ${event.studentType === 'MCA' ? 'active' : ''}" id="studenttype-btn-mca" data-value="MCA">MCA</button>
          <button type="button" class="studenttype-btn ${event.studentType === 'BE | MCA' ? 'active' : ''}" id="studenttype-btn-bemca" data-value="BE | MCA">BE | MCA</button>
        </div>
        <input type="hidden" id="form-studenttype" value="${event.studentType || ''}">
      </div>
      <div class="form-group">
        <label>Rounds</label>
        <div class="subtypes-buttons-group">
          <button type="button" class="subtype-btn" data-value="PPT">PPT</button>
          <button type="button" class="subtype-btn" data-value="OA">OA</button>
          <button type="button" class="subtype-btn" data-value="Technical">Technical</button>
        </div>
        <input type="hidden" id="form-subtypes" value="">
      </div>
      <div class="form-group">
        <label for="form-date">Scheduled Date</label>
        <input type="date" id="form-date" value="${event.date}" required>
      </div>
      <div class="form-group">
        <label for="form-desc">Details / Description</label>
        <textarea id="form-desc" rows="4" required placeholder="Describe placement criteria, eligibility, compensation...">${escapeHTML(event.desc)}</textarea>
      </div>
      <div class="form-submit-group">
        <button type="button" class="form-cancel-btn" id="form-cancel-edit">Cancel</button>
        <button type="submit" class="form-submit-btn">Save Changes</button>
      </div>
    </form>
  `;
  
  if (modal) modal.classList.add('active');
  
  // Format buttons logic
  const modeInput = document.getElementById('form-mode');
  const onlineBtn = document.getElementById('format-btn-online');
  const offlineBtn = document.getElementById('format-btn-offline');
  
  const handleFormatClick = (btn, value) => {
    if (btn.classList.contains('active')) {
      btn.classList.remove('active');
      modeInput.value = '';
    } else {
      [onlineBtn, offlineBtn].forEach(b => b?.classList.remove('active'));
      btn.classList.add('active');
      modeInput.value = value;
    }
  };
  
  if (onlineBtn) onlineBtn.addEventListener('click', () => handleFormatClick(onlineBtn, 'online'));
  if (offlineBtn) offlineBtn.addEventListener('click', () => handleFormatClick(offlineBtn, 'offline'));
  
  // Location buttons logic
  const locationInput = document.getElementById('form-location');
  const rvceBtn = document.getElementById('location-btn-rvce');
  const rvitmBtn = document.getElementById('location-btn-rvitm');
  const worksiteBtn = document.getElementById('location-btn-worksite');
  const allLocBtns = [rvceBtn, rvitmBtn, worksiteBtn];
  
  const handleLocationClick = (btn, value) => {
    if (btn.classList.contains('active')) {
      btn.classList.remove('active');
      locationInput.value = '';
    } else {
      allLocBtns.forEach(b => b?.classList.remove('active'));
      btn.classList.add('active');
      locationInput.value = value;
    }
  };
  
  if (rvceBtn) rvceBtn.addEventListener('click', () => handleLocationClick(rvceBtn, 'rvce'));
  if (rvitmBtn) rvitmBtn.addEventListener('click', () => handleLocationClick(rvitmBtn, 'rvitm'));
  if (worksiteBtn) worksiteBtn.addEventListener('click', () => handleLocationClick(worksiteBtn, 'worksite'));

  // Student Type toggle logic (single-select, optional)
  const studentTypeInput = document.getElementById('form-studenttype');
  const beBtn = document.getElementById('studenttype-btn-be');
  const mcaBtn = document.getElementById('studenttype-btn-mca');
  const bemcaBtn = document.getElementById('studenttype-btn-bemca');
  const allTypeBtns = [beBtn, mcaBtn, bemcaBtn];

  const handleStudentTypeClick = (btn, value) => {
    if (btn.classList.contains('active')) {
      btn.classList.remove('active');
      studentTypeInput.value = '';
    } else {
      allTypeBtns.forEach(b => b?.classList.remove('active'));
      btn.classList.add('active');
      studentTypeInput.value = value;
    }
  };

  if (beBtn) beBtn.addEventListener('click', () => handleStudentTypeClick(beBtn, 'BE'));
  if (mcaBtn) mcaBtn.addEventListener('click', () => handleStudentTypeClick(mcaBtn, 'MCA'));
  if (bemcaBtn) bemcaBtn.addEventListener('click', () => handleStudentTypeClick(bemcaBtn, 'BE | MCA'));
  
  // Subtypes multi-select logic
  const subtypesInput = document.getElementById('form-subtypes');
  const subtypeButtons = card.querySelectorAll('.subtype-btn');
  const initialSubtypes = event.subtypes || [];
  
  subtypeButtons.forEach(btn => {
    const val = btn.getAttribute('data-value');
    if (initialSubtypes.includes(val)) {
      btn.classList.add('active');
    }
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      const selected = Array.from(subtypeButtons)
        .filter(b => b.classList.contains('active'))
        .map(b => b.getAttribute('data-value'));
      subtypesInput.value = JSON.stringify(selected);
    });
  });
  subtypesInput.value = JSON.stringify(initialSubtypes);
  
  document.getElementById('form-cancel-edit').addEventListener('click', () => {
    showEventDetailModalAdmin(event);
  });
  
  document.getElementById('edit-event-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('form-title').value.trim();
    const type = document.getElementById('form-type').value;
    const mode = document.getElementById('form-mode').value || null;
    const location = document.getElementById('form-location').value || null;
    const studentType = document.getElementById('form-studenttype').value || null;
    const subtypesVal = document.getElementById('form-subtypes').value;
    const subtypes = subtypesVal ? JSON.parse(subtypesVal) : [];
    const date = document.getElementById('form-date').value;
    const desc = document.getElementById('form-desc').value.trim();
    
    const submitBtn = e.target.querySelector('.form-submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    const token = sessionStorage.getItem('adminToken');
    
    const updatedEvent = {
      id: event.id,
      title,
      type,
      mode,
      location,
      studentType,
      subtypes,
      date,
      desc
    };
    
    try {
      const res = await fetch(`${API}/api/events`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updatedEvent)
      });
      
      if (!res.ok) {
        let errData = {};
        try { errData = await res.json(); } catch(e) {}
        throw new Error(errData.detail || `Server returned ${res.status}`);
      }
      
      await fetchEvents();
      hideEventModal();
      generateCalendarGrid();
      generateMiniCalendar();
      renderAgendaList();
    } catch (err) {
      alert('Failed to update event: ' + err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Changes';
    }
  });
}

// Create Event Modal Form
function showCreateEventModal(dateStr) {
  const modal = document.getElementById('event-modal');
  const card = document.getElementById('modal-card-content');
  
  card.innerHTML = `
    <div class="modal-header">
      <h3>Post Placement Update</h3>
      <button class="modal-close" onclick="hideEventModal()">&times;</button>
    </div>
    <form id="create-event-form" class="modal-form">
      <div class="form-group">
        <label for="form-title">Company Name</label>
        <input type="text" id="form-title" required placeholder="e.g. Google India">
      </div>
      <div class="form-group">
        <label for="form-type">Update Type</label>
        <select id="form-type" required>
          <option value="exams" selected>Interviews & Tests</option>
          <option value="holidays">Holidays & Breaks</option>
        </select>
      </div>
      <div class="form-group">
        <label>Drive Format</label>
        <div class="format-buttons-group">
          <button type="button" class="format-btn" id="format-btn-online" data-value="online">Online</button>
          <button type="button" class="format-btn" id="format-btn-offline" data-value="offline">Offline</button>
        </div>
        <input type="hidden" id="form-mode" value="">
      </div>
      <div class="form-group">
        <label>Location</label>
        <div class="location-buttons-group">
          <button type="button" class="location-btn" id="location-btn-rvce" data-value="rvce">RVCE</button>
          <button type="button" class="location-btn" id="location-btn-rvitm" data-value="rvitm">RVITM</button>
          <button type="button" class="location-btn" id="location-btn-worksite" data-value="worksite">Worksite</button>
        </div>
        <input type="hidden" id="form-location" value="">
      </div>
      <div class="form-group">
        <label>Student Type <span class="form-label-optional">(optional)</span></label>
        <div class="studenttype-buttons-group">
          <button type="button" class="studenttype-btn" id="studenttype-btn-be" data-value="BE">BE</button>
          <button type="button" class="studenttype-btn" id="studenttype-btn-mca" data-value="MCA">MCA</button>
          <button type="button" class="studenttype-btn" id="studenttype-btn-bemca" data-value="BE | MCA">BE | MCA</button>
        </div>
        <input type="hidden" id="form-studenttype" value="">
      </div>
      <div class="form-group">
        <label>Rounds</label>
        <div class="subtypes-buttons-group">
          <button type="button" class="subtype-btn" data-value="PPT">PPT</button>
          <button type="button" class="subtype-btn" data-value="OA">OA</button>
          <button type="button" class="subtype-btn" data-value="Technical">Technical</button>
        </div>
        <input type="hidden" id="form-subtypes" value="">
      </div>
      <div class="form-group">
        <label for="form-date">Scheduled Date</label>
        <input type="date" id="form-date" value="${dateStr}" required>
      </div>
      <div class="form-group">
        <label for="form-desc">Details / Description</label>
        <textarea id="form-desc" rows="4" required placeholder="Describe placement criteria, eligibility, compensation..."></textarea>
      </div>
      <div class="form-submit-group">
        <button type="button" class="form-cancel-btn" onclick="hideEventModal()">Cancel</button>
        <button type="submit" class="form-submit-btn">Post Update</button>
      </div>
    </form>
  `;
  modal.classList.add('active');
  
  // Format buttons logic
  const modeInput = document.getElementById('form-mode');
  const onlineBtn = document.getElementById('format-btn-online');
  const offlineBtn = document.getElementById('format-btn-offline');
  
  const handleFormatClick = (btn, value) => {
    if (btn.classList.contains('active')) {
      btn.classList.remove('active');
      modeInput.value = '';
    } else {
      [onlineBtn, offlineBtn].forEach(b => b?.classList.remove('active'));
      btn.classList.add('active');
      modeInput.value = value;
    }
  };
  
  if (onlineBtn) onlineBtn.addEventListener('click', () => handleFormatClick(onlineBtn, 'online'));
  if (offlineBtn) offlineBtn.addEventListener('click', () => handleFormatClick(offlineBtn, 'offline'));
  
  // Location buttons logic
  const locationInput = document.getElementById('form-location');
  const rvceBtn = document.getElementById('location-btn-rvce');
  const rvitmBtn = document.getElementById('location-btn-rvitm');
  const worksiteBtn = document.getElementById('location-btn-worksite');
  const allLocBtns = [rvceBtn, rvitmBtn, worksiteBtn];
  
  const handleLocationClick = (btn, value) => {
    if (btn.classList.contains('active')) {
      btn.classList.remove('active');
      locationInput.value = '';
    } else {
      allLocBtns.forEach(b => b?.classList.remove('active'));
      btn.classList.add('active');
      locationInput.value = value;
    }
  };
  
  if (rvceBtn) rvceBtn.addEventListener('click', () => handleLocationClick(rvceBtn, 'rvce'));
  if (rvitmBtn) rvitmBtn.addEventListener('click', () => handleLocationClick(rvitmBtn, 'rvitm'));
  if (worksiteBtn) worksiteBtn.addEventListener('click', () => handleLocationClick(worksiteBtn, 'worksite'));

  // Student Type toggle logic (single-select, optional)
  const studentTypeInput = document.getElementById('form-studenttype');
  const beBtn = document.getElementById('studenttype-btn-be');
  const mcaBtn = document.getElementById('studenttype-btn-mca');
  const bemcaBtn = document.getElementById('studenttype-btn-bemca');
  const allTypeBtns = [beBtn, mcaBtn, bemcaBtn];

  const handleStudentTypeClick = (btn, value) => {
    if (btn.classList.contains('active')) {
      btn.classList.remove('active');
      studentTypeInput.value = '';
    } else {
      allTypeBtns.forEach(b => b?.classList.remove('active'));
      btn.classList.add('active');
      studentTypeInput.value = value;
    }
  };

  if (beBtn) beBtn.addEventListener('click', () => handleStudentTypeClick(beBtn, 'BE'));
  if (mcaBtn) mcaBtn.addEventListener('click', () => handleStudentTypeClick(mcaBtn, 'MCA'));
  if (bemcaBtn) bemcaBtn.addEventListener('click', () => handleStudentTypeClick(bemcaBtn, 'BE | MCA'));
  
  // Subtypes multi-select logic
  const subtypesInput = document.getElementById('form-subtypes');
  const subtypeButtons = card.querySelectorAll('.subtype-btn');
  
  subtypeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      const selected = Array.from(subtypeButtons)
        .filter(b => b.classList.contains('active'))
        .map(b => b.getAttribute('data-value'));
      subtypesInput.value = JSON.stringify(selected);
    });
  });
  subtypesInput.value = JSON.stringify([]);
  
  document.getElementById('create-event-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('form-title').value.trim();
    const type = document.getElementById('form-type').value;
    const mode = document.getElementById('form-mode').value || null;
    const location = document.getElementById('form-location').value || null;
    const studentType = document.getElementById('form-studenttype').value || null;
    const subtypesVal = document.getElementById('form-subtypes').value;
    const subtypes = subtypesVal ? JSON.parse(subtypesVal) : [];
    const date = document.getElementById('form-date').value;
    const desc = document.getElementById('form-desc').value.trim();
    
    const submitBtn = e.target.querySelector('.form-submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';
    const token = sessionStorage.getItem('adminToken');
    
    const newEvent = {
      id: Date.now() + Math.floor(Math.random() * 10000),
      title,
      type,
      mode,
      location,
      studentType,
      subtypes,
      date,
      desc
    };
    
    try {
      const res = await fetch(`${API}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newEvent)
      });
      
      if (!res.ok) {
        let errData = {};
        try { errData = await res.json(); } catch(e) {}
        throw new Error(errData.detail || `Server returned ${res.status}`);
      }
      
      await fetchEvents();
      hideEventModal();
      generateCalendarGrid();
      generateMiniCalendar();
      renderAgendaList();
    } catch (err) {
      alert('Failed to create event: ' + err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Post Update';
    }
  });
}

// AI Quick Post Modal and Preview Layout
function showAIPostModal() {
  const modal = document.getElementById('event-modal');
  const card = document.getElementById('modal-card-content');
  if (!modal || !card) return;

  card.innerHTML = `
    <div class="modal-header">
      <h3 style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.6rem; font-weight: 700; color: var(--wood-dark); display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 1.4rem;">✨</span> AI Quick Post Placement Update
      </h3>
      <button class="modal-close" onclick="hideEventModal()">&times;</button>
    </div>
    <div style="padding: 20px;">
      <p style="margin: 0 0 15px 0; font-size: 0.88rem; color: var(--text-secondary); line-height: 1.4;">
        Paste the raw company notification, email criteria, or WhatsApp update text below. The AI will automatically parse the company name, dates, rounds, compensation, and eligibility criteria to generate the calendar events.
      </p>
      <div class="form-group" style="margin-bottom: 20px;">
        <label for="ai-raw-text" style="font-weight: 600; margin-bottom: 6px; display: block; font-size: 0.85rem; color: var(--text-secondary);">Raw Placement Text / Notification</label>
        <textarea id="ai-raw-text" rows="8" style="width: 100%; padding: 12px; border: 1px solid var(--border-gold); border-radius: var(--radius-sm); font-family: 'Inter', sans-serif; font-size: 0.88rem; line-height: 1.5; resize: vertical;" placeholder="e.g. Google visiting. OA on 2026-08-10. Technical rounds on 2026-08-12. CTC: 35 LPA. Eligible branches: CSE, ISE. CGPA >= 7.5. No active backlogs."></textarea>
      </div>
      <div id="ai-post-error" class="login-error-msg" style="margin-bottom: 15px;"></div>
      <div class="form-submit-group" style="display: flex; gap: 12px; justify-content: flex-end;">
        <button type="button" class="form-cancel-btn" onclick="hideEventModal()">Cancel</button>
        <button type="button" id="ai-parse-submit-btn" class="form-submit-btn" style="background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; border: none;">
          Analyze & Parse with AI
        </button>
      </div>
    </div>
  `;

  modal.classList.add('active');

  document.getElementById('ai-parse-submit-btn').addEventListener('click', async () => {
    const rawText = document.getElementById('ai-raw-text').value.trim();
    const errorMsg = document.getElementById('ai-post-error');
    const submitBtn = document.getElementById('ai-parse-submit-btn');

    if (!rawText) {
      errorMsg.textContent = 'Please paste the raw placement text to parse.';
      errorMsg.classList.add('active');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="spinner" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" style="animation: spin 1s linear infinite; margin-right: 6px; display: inline-block;">
        <circle cx="12" cy="12" r="10" stroke-dasharray="31.4" stroke-dashoffset="10"/>
      </svg>
      Analyzing with AI...
    `;
    errorMsg.classList.remove('active');

    try {
      const token = sessionStorage.getItem('adminToken');
      const response = await fetch(`${API}/api/ai/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: rawText })
      });
      
      if (!response.ok) throw new Error('AI parser service returned an error status');
      
      const parsedEvents = await response.json();
      if (!Array.isArray(parsedEvents)) throw new Error('AI response was not a JSON array of events');

      showAIPreviewModal(parsedEvents);
    } catch (err) {
      console.error(err);
      errorMsg.textContent = 'AI service was busy or failed to parse. Please verify the dates and formatting and try again.';
      errorMsg.classList.add('active');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Analyze & Parse with AI';
    }
  });
}

function showAIPreviewModal(events) {
  const modal = document.getElementById('event-modal');
  const card = document.getElementById('modal-card-content');
  if (!modal || !card) return;

  let html = `
    <div class="modal-header">
      <h3 style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.6rem; font-weight: 700; color: var(--wood-dark); display: flex; align-items: center; gap: 8px;">
        ✨ Review AI Generated Updates
      </h3>
      <button class="modal-close" onclick="hideEventModal()">&times;</button>
    </div>
    <div style="padding: 20px; max-height: 60vh; overflow-y: auto;" id="ai-preview-list-container">
      <p style="margin: 0 0 15px 0; font-size: 0.88rem; color: var(--text-secondary); line-height: 1.4;">
        We found ${events.length} event(s) in your text. Tweak any values below before posting them to the calendar.
      </p>
  `;

  events.forEach((ev, idx) => {
    const title = ev.title || 'Placement Update';
    const type = ev.type || 'exams';
    const date = ev.date || new Date().toISOString().split('T')[0];
    const mode = ev.mode || 'online';
    const location = ev.location || 'rvitm';
    const studentType = ev.studentType || '';
    const subtypes = Array.isArray(ev.subtypes) ? ev.subtypes : [];
    const desc = ev.desc || '';

    html += `
      <div class="ai-event-card" data-index="${idx}" style="border: 1px solid var(--border-gold); border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px; background: var(--cream-card); position: relative; text-align: left;">
        <button type="button" class="ai-delete-card-btn" style="position: absolute; top: 12px; right: 12px; border: none; background: transparent; color: #dc2626; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;" title="Remove this event">&times;</button>
        
        <div class="form-group" style="margin-bottom: 12px;">
          <label style="font-weight: 600; margin-bottom: 4px; display: block; font-size: 0.8rem; color: var(--text-secondary);">Company / Title</label>
          <input type="text" class="preview-title" value="${escapeHTML(title)}" style="width: 100%; padding: 8px; border: 1px solid var(--border-gold); border-radius: var(--radius-sm); font-size: 0.85rem; font-family: 'Inter', sans-serif;">
        </div>

        <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 12px;">
          <div class="form-group" style="flex: 1; min-width: 120px;">
            <label style="font-weight: 600; margin-bottom: 4px; display: block; font-size: 0.8rem; color: var(--text-secondary);">Date</label>
            <input type="date" class="preview-date" value="${date}" style="width: 100%; padding: 8px; border: 1px solid var(--border-gold); border-radius: var(--radius-sm); font-size: 0.85rem; font-family: 'Inter', sans-serif; height: 35px; background: white;">
          </div>
          <div class="form-group" style="flex: 1; min-width: 120px;">
            <label style="font-weight: 600; margin-bottom: 4px; display: block; font-size: 0.8rem; color: var(--text-secondary);">Type</label>
            <select class="preview-type" style="width: 100%; padding: 8px; border: 1px solid var(--border-gold); border-radius: var(--radius-sm); font-size: 0.85rem; height: 35px; background: white; font-family: 'Inter', sans-serif;">
              <option value="exams" ${type === 'exams' ? 'selected' : ''}>Interviews & Tests</option>
              <option value="holidays" ${type === 'holidays' ? 'selected' : ''}>Holidays & Breaks</option>
            </select>
          </div>
        </div>

        <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 12px;">
          <div class="form-group" style="flex: 1; min-width: 130px;">
            <label style="font-weight: 600; margin-bottom: 4px; display: block; font-size: 0.8rem; color: var(--text-secondary);">Drive Format</label>
            <div class="format-buttons-group" style="display: flex; gap: 6px;">
              <button type="button" class="format-btn ${mode === 'online' ? 'active' : ''}" data-value="online" style="padding: 6px 12px; font-size: 0.75rem; flex: 1;">Online</button>
              <button type="button" class="format-btn ${mode === 'offline' ? 'active' : ''}" data-value="offline" style="padding: 6px 12px; font-size: 0.75rem; flex: 1;">Offline</button>
            </div>
            <input type="hidden" class="preview-mode" value="${mode}">
          </div>

          <div class="form-group" style="flex: 2; min-width: 200px;">
            <label style="font-weight: 600; margin-bottom: 4px; display: block; font-size: 0.8rem; color: var(--text-secondary);">Location</label>
            <div class="location-buttons-group" style="display: flex; gap: 6px;">
              <button type="button" class="location-btn ${location === 'rvce' ? 'active' : ''}" data-value="rvce" style="padding: 6px 10px; font-size: 0.75rem; flex: 1;">RVCE</button>
              <button type="button" class="location-btn ${location === 'rvitm' ? 'active' : ''}" data-value="rvitm" style="padding: 6px 10px; font-size: 0.75rem; flex: 1;">RVITM</button>
              <button type="button" class="location-btn ${location === 'worksite' ? 'active' : ''}" data-value="worksite" style="padding: 6px 10px; font-size: 0.75rem; flex: 1;">Worksite</button>
            </div>
            <input type="hidden" class="preview-location" value="${location}">
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 12px;">
          <label style="font-weight: 600; margin-bottom: 4px; display: block; font-size: 0.8rem; color: var(--text-secondary);">Student Type <span class="form-label-optional">(optional)</span></label>
          <div class="studenttype-buttons-group" style="display: flex; gap: 6px;">
            <button type="button" class="studenttype-btn ${studentType === 'BE' ? 'active' : ''}" data-value="BE" style="padding: 6px 10px; font-size: 0.75rem; flex: 1;">BE</button>
            <button type="button" class="studenttype-btn ${studentType === 'MCA' ? 'active' : ''}" data-value="MCA" style="padding: 6px 10px; font-size: 0.75rem; flex: 1;">MCA</button>
            <button type="button" class="studenttype-btn ${studentType === 'BE | MCA' ? 'active' : ''}" data-value="BE | MCA" style="padding: 6px 10px; font-size: 0.75rem; flex: 1.5;">BE | MCA</button>
          </div>
          <input type="hidden" class="preview-studenttype" value="${studentType}">
        </div>

        <div class="form-group" style="margin-bottom: 12px;">
          <label style="font-weight: 600; margin-bottom: 4px; display: block; font-size: 0.8rem; color: var(--text-secondary);">Rounds</label>
          <div class="subtypes-buttons-group" style="display: flex; gap: 6px;">
            <button type="button" class="subtype-btn ${subtypes.includes('PPT') ? 'active' : ''}" data-value="PPT" style="padding: 6px 12px; font-size: 0.75rem;">PPT</button>
            <button type="button" class="subtype-btn ${subtypes.includes('OA') ? 'active' : ''}" data-value="OA" style="padding: 6px 12px; font-size: 0.75rem;">OA</button>
            <button type="button" class="subtype-btn ${subtypes.includes('Technical') ? 'active' : ''}" data-value="Technical" style="padding: 6px 12px; font-size: 0.75rem;">Technical</button>
          </div>
          <input type="hidden" class="preview-subtypes" value='${JSON.stringify(subtypes)}'>
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label style="font-weight: 600; margin-bottom: 4px; display: block; font-size: 0.8rem; color: var(--text-secondary);">Description / Details</label>
          <textarea class="preview-desc" rows="4" style="width: 100%; padding: 8px; border: 1px solid var(--border-gold); border-radius: var(--radius-sm); font-size: 0.85rem; font-family: 'Inter', sans-serif; line-height: 1.4; resize: vertical;">${escapeHTML(desc)}</textarea>
        </div>
      </div>
    `;
  });

  html += `
    </div>
    <div id="ai-preview-error" class="login-error-msg" style="margin: 0 20px 15px 20px;"></div>
    <div class="form-submit-group" style="display: flex; gap: 12px; justify-content: flex-end; padding: 20px; border-top: 1px solid var(--border-gold); background: var(--cream-dark); border-bottom-left-radius: var(--radius-lg); border-bottom-right-radius: var(--radius-lg);">
      <button type="button" class="form-cancel-btn" id="ai-preview-back-btn">Back</button>
      <button type="button" id="ai-post-confirm-btn" class="form-submit-btn" style="background: linear-gradient(135deg, #059669, #047857); color: white; border: none; font-weight: 700;">
        Confirm & Post All
      </button>
    </div>
  `;

  card.innerHTML = html;

  // Bind active togglers for buttons in preview cards
  const container = document.getElementById('ai-preview-list-container');
  
  container.querySelectorAll('.ai-event-card').forEach(cardEl => {
    // Mode Buttons
    const modeInput = cardEl.querySelector('.preview-mode');
    const modeBtns = cardEl.querySelectorAll('.format-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('active')) {
          btn.classList.remove('active');
          modeInput.value = '';
        } else {
          modeBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          modeInput.value = btn.getAttribute('data-value');
        }
      });
    });

    // Location Buttons
    const locationInput = cardEl.querySelector('.preview-location');
    const locationBtns = cardEl.querySelectorAll('.location-btn');
    locationBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('active')) {
          btn.classList.remove('active');
          locationInput.value = '';
        } else {
          locationBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          locationInput.value = btn.getAttribute('data-value');
        }
      });
    });

    // Student Type Buttons
    const studentTypeInput = cardEl.querySelector('.preview-studenttype');
    const studentTypeBtns = cardEl.querySelectorAll('.studenttype-btn');
    studentTypeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('active')) {
          btn.classList.remove('active');
          studentTypeInput.value = '';
        } else {
          studentTypeBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          studentTypeInput.value = btn.getAttribute('data-value');
        }
      });
    });

    // Subtype Buttons
    const subtypesInput = cardEl.querySelector('.preview-subtypes');
    const subtypeBtns = cardEl.querySelectorAll('.subtype-btn');
    subtypeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        const selected = Array.from(subtypeBtns)
          .filter(b => b.classList.contains('active'))
          .map(b => b.getAttribute('data-value'));
        subtypesInput.value = JSON.stringify(selected);
      });
    });

    // Delete Card Button
    cardEl.querySelector('.ai-delete-card-btn').addEventListener('click', () => {
      cardEl.remove();
      if (container.querySelectorAll('.ai-event-card').length === 0) {
        hideEventModal();
      }
    });
  });

  // Bind back button
  document.getElementById('ai-preview-back-btn').addEventListener('click', () => {
    showAIPostModal();
  });

  // Post Confirm
  document.getElementById('ai-post-confirm-btn').addEventListener('click', async () => {
    const confirmBtn = document.getElementById('ai-post-confirm-btn');
    const errorMsg = document.getElementById('ai-preview-error');
    const cards = container.querySelectorAll('.ai-event-card');
    
    if (cards.length === 0) {
      hideEventModal();
      return;
    }

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `
      <svg class="spinner" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" style="animation: spin 1s linear infinite; margin-right: 6px; display: inline-block;">
        <circle cx="12" cy="12" r="10" stroke-dasharray="31.4" stroke-dashoffset="10"/>
      </svg>
      Posting Updates...
    `;
    errorMsg.classList.remove('active');

    const token = sessionStorage.getItem('adminToken');

    try {
      for (const cardEl of cards) {
        const title = cardEl.querySelector('.preview-title').value.trim();
        const date = cardEl.querySelector('.preview-date').value;
        const type = cardEl.querySelector('.preview-type').value;
        const mode = cardEl.querySelector('.preview-mode').value || null;
        const location = cardEl.querySelector('.preview-location').value || null;
        const studentType = cardEl.querySelector('.preview-studenttype').value || null;
        const subtypesVal = cardEl.querySelector('.preview-subtypes').value;
        const subtypes = subtypesVal ? JSON.parse(subtypesVal) : [];
        const desc = cardEl.querySelector('.preview-desc').value.trim();

        if (!title || !date) {
          throw new Error('Title and Date are required for all events.');
        }

        const newEvent = {
          id: Date.now() + Math.floor(Math.random() * 10000),
          title,
          type,
          mode,
          location,
          studentType,
          subtypes,
          date,
          desc
        };

        const res = await fetch(`${API}/api/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newEvent)
        });

        if (!res.ok) throw new Error(`Failed to post event for ${title}`);
      }

      hideEventModal();
      await fetchEvents();
      generateCalendarGrid();
      generateMiniCalendar();
      renderAgendaList();
    } catch (err) {
      console.error(err);
      errorMsg.textContent = err.message || 'Failed to post updates. Verify fields and connection.';
      errorMsg.classList.add('active');
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm & Post All';
    }
  });
}

// Add these to window
window.showAIPostModal = showAIPostModal;
window.showAIPreviewModal = showAIPreviewModal;

// Admin Authorization Login Modal Form
function showLoginModal() {
  const modal = document.getElementById('event-modal');
  const card = document.getElementById('modal-card-content');
  
  card.innerHTML = `
    <div class="modal-header">
      <h3>Admin Authentication</h3>
      <button class="modal-close" onclick="hideEventModal()">&times;</button>
    </div>
    <form id="login-form" class="modal-form">
      <div class="form-group">
        <label for="admin-id">Admin ID</label>
        <input type="text" id="admin-id" required placeholder="Enter Admin ID" autocomplete="username">
      </div>
      <div class="form-group">
        <label for="admin-password">Password</label>
        <div class="password-wrapper">
          <input type="password" id="admin-password" required placeholder="Enter Password" autocomplete="current-password">
          <button type="button" class="password-toggle" id="toggle-password" aria-label="Toggle password visibility">
            <svg id="eye-icon" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <svg id="eye-off-icon" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="display: none;">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          </button>
        </div>
      </div>
      <div id="login-error" class="login-error-msg"></div>
      <div class="form-submit-group">
        <button type="button" class="form-cancel-btn" onclick="hideEventModal()">Cancel</button>
        <button type="submit" class="form-submit-btn">Authenticate</button>
      </div>
    </form>
  `;
  modal.classList.add('active');
  
  // Toggle password visibility
  const toggleBtn = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('admin-password');
  const eyeIcon = document.getElementById('eye-icon');
  const eyeOffIcon = document.getElementById('eye-off-icon');

  toggleBtn.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    eyeIcon.style.display = isPassword ? 'none' : 'block';
    eyeOffIcon.style.display = isPassword ? 'block' : 'none';
  });
  
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('admin-id').value.trim();
    const password = document.getElementById('admin-password').value;
    const errorMsg = document.getElementById('login-error');
    const submitBtn = e.target.querySelector('.form-submit-btn');
    
    // Disable button while authenticating
    submitBtn.disabled = true;
    submitBtn.textContent = 'Authenticating...';
    errorMsg.classList.remove('active');
    
    try {
      // Try server-side authentication first (returns real JWT for API calls)
      const res = await fetch(`${API}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.token) {
        // Store real JWT token — this is required for event CRUD operations
        sessionStorage.setItem('adminToken', data.token);
        isAdmin = true;
        hideEventModal();
        render();
        return;
      }
      // Server rejected credentials — try client-side hash fallback
      // (handles case where backend uses different default credentials)
    } catch (err) {
      // Server unreachable — fall through to client-side hash check
    }

    // Client-side hash fallback: works offline or when server creds differ
    try {
      const pwHash = await sha256(password);
      if (id === 'mdadmin' && (pwHash === 'cd86e1bc9f8fcb8b62abfea747668a1fd7bd5fbb7acc40acf102d31675f7960f' || pwHash === 'd79f0702aae8d80ff2465bfe083561c951caeda227aa9b751480d252f0c0a8ba')) {
        sessionStorage.setItem('adminToken', 'dummy-admin-jwt-token');
        isAdmin = true;
        hideEventModal();
        render();
      } else {
        errorMsg.textContent = 'Invalid Admin ID or Password.';
        errorMsg.classList.add('active');
      }
    } catch {
      errorMsg.textContent = 'Authentication error. Please try again.';
      errorMsg.classList.add('active');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Authenticate';
    }
  });
}


// ── Result Rendering (adapted from old student.js) ──
function getSemFromCode(code) {
  for (const ch of code) {
    if (ch >= '0' && ch <= '9') return parseInt(ch);
  }
  return 0;
}

window.filterSem = function(sem) {
  if (!currentStudentData) return;
  activeSem = sem;
  renderStudent(sem);
};

function renderStudent(targetSem) {
  const data = currentStudentData;
  const subjects = data.subjects || {};
  
  // Group by semester
  const semGroups = {};
  Object.entries(subjects).forEach(([code, s]) => {
    const sem = s.semester || getSemFromCode(code);
    if (!semGroups[sem]) semGroups[sem] = [];
    semGroups[sem].push({ code, ...s });
  });
  
  const sortedSems = Object.keys(semGroups).sort((a, b) => Number(a) - Number(b));
  
  // Render Profile Card
  const initials = (data.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2);
  const isECE = data.usn && (data.usn.includes('EC') || data.usn.includes('ec'));

  if (isECE) {
    document.getElementById('profile-card').innerHTML = `
      <div class="profile-avatar">${initials}</div>
      <div class="profile-info">
        <div class="profile-name">${data.name || 'Unknown'}</div>
        <div class="profile-usn">${data.usn} &bull; ECE Department Registry</div>
      </div>
      <div class="score-cards">
        <div class="score-card cgpa-card">
          <div class="score-val">${data.cgpa || '-'}</div>
          <div class="score-lbl">Overall CGPA</div>
        </div>
      </div>
    `;
    document.getElementById('semesters-nav').innerHTML = '';
    document.getElementById('marks-section').innerHTML = '';
    return;
  }

  // Compute backlog info from API data
  const activeBacklogCount = data.active_backlog_count || 0;
  const hasHistoricalBacklogs = data.historical_backlogs || false;
  const activeBacklogList = data.active_backlogs || [];
  const backlogHistoryList = data.backlog_history || [];

  document.getElementById('profile-card').innerHTML = `
    <div class="profile-avatar">${initials}</div>
    <div class="profile-info">
      <div class="profile-name">${data.name || 'Unknown'}</div>
      <div class="profile-usn">${data.usn} &bull; ${sortedSems.length} Semester${sortedSems.length > 1 ? 's' : ''} Record</div>
    </div>
    <div class="score-cards">
      <div class="score-card sgpa-card">
        <div class="score-val">${data.sgpa || '-'}</div>
        <div class="score-lbl">Latest SGPA</div>
      </div>
      <div class="score-card cgpa-card">
        <div class="score-val">${data.cgpa || '-'}</div>
        <div class="score-lbl">Overall CGPA</div>
      </div>
      <div class="score-card backlog-card ${activeBacklogCount > 0 ? 'has-backlogs' : ''}">
        <div class="score-val">${activeBacklogCount}</div>
        <div class="score-lbl">Active Backlogs</div>
      </div>
      <div class="score-card history-card ${hasHistoricalBacklogs ? 'has-history' : ''}">
        <div class="score-val">${hasHistoricalBacklogs ? 'YES' : 'NO'}</div>
        <div class="score-lbl">History of Backlogs</div>
      </div>
    </div>
  `;

  // Render backlog details section (shown below profile card, above semester tabs)
  let backlogDetailsHtml = '';

  if (activeBacklogCount > 0) {
    backlogDetailsHtml += `
      <div class="backlog-detail-section active-backlogs-section">
        <div class="backlog-detail-header">
          <span class="backlog-detail-icon">🔴</span>
          <span class="backlog-detail-title">Active Backlogs (${activeBacklogCount})</span>
        </div>
        <div class="backlog-detail-list">
          ${activeBacklogList.map(b => `
            <div class="backlog-item active-backlog-item">
              <span class="backlog-subj-code">${escapeHTML(b.code || b)}</span>
              <span class="backlog-subj-name">${escapeHTML(b.name || '')}</span>
              ${b.semester ? `<span class="backlog-sem-badge">Sem ${b.semester}</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (backlogHistoryList.length > 0) {
    backlogDetailsHtml += `
      <div class="backlog-detail-section history-backlogs-section">
        <div class="backlog-detail-header">
          <span class="backlog-detail-icon">🟡</span>
          <span class="backlog-detail-title">Backlog History (Cleared)</span>
        </div>
        <div class="backlog-detail-list">
          ${backlogHistoryList.map(b => `
            <div class="backlog-item cleared-backlog-item">
              <span class="backlog-subj-code">${escapeHTML(b.code || b)}</span>
              <span class="backlog-subj-name">${escapeHTML(b.name || '')}</span>
              ${b.failed_sem ? `<span class="backlog-sem-badge fail-badge">Failed Sem ${b.failed_sem}</span>` : ''}
              ${b.cleared_sem ? `<span class="backlog-sem-badge clear-badge">Cleared Sem ${b.cleared_sem}</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Insert backlog details after profile card
  const profileCard = document.getElementById('profile-card');
  const existingBacklogContainer = document.getElementById('backlog-details');
  if (backlogDetailsHtml) {
    let backlogContainer = existingBacklogContainer;
    if (!backlogContainer) {
      backlogContainer = document.createElement('div');
      backlogContainer.id = 'backlog-details';
      profileCard.insertAdjacentElement('afterend', backlogContainer);
    }
    backlogContainer.innerHTML = backlogDetailsHtml;
  } else if (existingBacklogContainer) {
    existingBacklogContainer.remove();
  }

  // Render Semesters Nav Tabs
  document.getElementById('semesters-nav').innerHTML = `
    <button class="sem-btn ${targetSem === 'all' ? 'active' : ''}" onclick="filterSem('all')">All Semesters</button>
    ${sortedSems.map(sem => `
      <button class="sem-btn ${String(targetSem) === String(sem) ? 'active' : ''}" onclick="filterSem('${sem}')">Semester ${sem}</button>
    `).join('')}
  `;

  const semsToShow = targetSem === 'all' ? sortedSems : [String(targetSem)];
  
  // Render Subject Table
  let marksHtml = '';
  semsToShow.forEach(sem => {
    const subs = semGroups[sem].sort((a, b) => a.code.localeCompare(b.code));
    const semTotal = subs.reduce((sum, s) => sum + (s.total || 0), 0);
    const passed = subs.filter(s => s.status === 'P').length;
    
    marksHtml += `
      <div class="marks-container">
        <div class="marks-header">
          <div class="marks-title">Semester ${sem}</div>
          <div class="marks-stats">
            <span>${semTotal}</span> Total Marks &bull; 
            <span>${passed}/${subs.length}</span> Passed &bull; 
            SGPA: <span>${data.sgpa_map && data.sgpa_map[sem] ? Number(data.sgpa_map[sem]).toFixed(2) : '-'}</span>
          </div>
        </div>
        <div class="table-wrapper">
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
              ${subs.map(s => `
                <tr>
                  <td class="subject-code">${s.code}</td>
                  <td class="subject-name">${s.name}</td>
                  <td class="mark-val">${s.credits}</td>
                  <td class="mark-val">${s.internals}</td>
                  <td class="mark-val">${s.externals}</td>
                  <td class="mark-total">${s.total}</td>
                  <td>
                    <span class="status-badge ${s.status === 'P' ? 'status-p' : 'status-f'}">
                      ${s.status === 'P' ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  });
  
  document.getElementById('marks-section').innerHTML = marksHtml;
}

// SPC Password Authorization Modal
function showSPCPasswordModal() {
  const modal = document.getElementById('event-modal');
  const card = document.getElementById('modal-card-content');
  
  card.innerHTML = `
    <div class="modal-header">
      <h3>SPC Authorization</h3>
      <button class="modal-close" onclick="hideEventModal()">&times;</button>
    </div>
    <form id="spc-login-form" class="modal-form">
      <div class="form-group">
        <label for="spc-password">Access Password</label>
        <div class="password-wrapper">
          <input type="password" id="spc-password" required placeholder="Enter SPC Access Password" autocomplete="current-password">
          <button type="button" class="password-toggle" id="spc-toggle-password" aria-label="Toggle password visibility">
            <svg id="spc-eye-icon" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <svg id="spc-eye-off-icon" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="display: none;">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          </button>
        </div>
      </div>
      <div id="spc-login-error" class="login-error-msg"></div>
      <div class="form-submit-group">
        <button type="button" class="form-cancel-btn" onclick="hideEventModal()">Cancel</button>
        <button type="submit" class="form-submit-btn">Authorize</button>
      </div>
    </form>
  `;
  modal.classList.add('active');
  
  // Toggle password visibility
  const toggleBtn = document.getElementById('spc-toggle-password');
  const passwordInput = document.getElementById('spc-password');
  const eyeIcon = document.getElementById('spc-eye-icon');
  const eyeOffIcon = document.getElementById('spc-eye-off-icon');
  
  toggleBtn.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    eyeIcon.style.display = isPassword ? 'none' : 'block';
    eyeOffIcon.style.display = isPassword ? 'block' : 'none';
  });
  
  document.getElementById('spc-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('spc-password').value;
    const errorMsg = document.getElementById('spc-login-error');
    
    // Hash password using sha256 helper
    const pwHash = await sha256(password);
    
    // Compare hashes (spc@5 or spc%405)
    if (pwHash === '959bb004eb614b51840f0754e29012b627dae2bbb42232bf1751b578a1d6176b' || 
        pwHash === '74ffa579c6aa545cdcbc5faf5fbfa3c889ee6aa669dd2245e35b64536a2c2c76') {
      hideEventModal();
      currentView = 'spc';
      render();
    } else {
      errorMsg.textContent = 'Invalid Access Password.';
      errorMsg.classList.add('active');
    }
  });
}

// Render SPC Control Panel View
function renderSPC(container) {
  // Render toast and waving man at body level to prevent parent container transform scrolling bugs
  let toast = document.getElementById('spc-toast');
  let wavingMan = document.getElementById('waving-man');
  
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'lobby-toast';
    toast.id = 'spc-toast';
    document.body.appendChild(toast);
  }
  
  if (!wavingMan) {
    wavingMan = document.createElement('div');
    wavingMan.className = 'waving-man-container';
    wavingMan.id = 'waving-man';
    document.body.appendChild(wavingMan);
  }

  // Set fresh content and reset transition classes
  toast.className = 'lobby-toast';
  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-icon" style="color: var(--gold-satin);">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      <div class="toast-text-wrapper">
        <div class="toast-heading" style="color: var(--wood-dark); font-size: 1.1rem; font-weight: 700;">Welcome dear SPC</div>
        <div class="toast-message" style="font-size: 0.8rem; color: var(--text-muted);">I hope you are doing well.</div>
      </div>
    </div>
    <div class="toast-progress-bar" style="background-color: var(--gold-satin); animation-duration: 4s; width: 100%;"></div>
  `;

  wavingMan.className = 'waving-man-container';
  wavingMan.innerHTML = `
    <div class="waving-man-bubble">We you SPC!</div>
    <svg viewBox="0 0 120 64" class="waving-man-svg">
      <!-- Left Stick Man -->
      <g class="stick-man-left">
        <path d="M18 60 C18 42, 42 42, 42 60" fill="var(--wood-light)" />
        <circle cx="30" cy="26" r="9" fill="var(--gold-light)" stroke="var(--wood-dark)" stroke-width="1.5" />
        <path class="waving-arm-left" d="M35 34 C40 30, 46 18, 44 16 C42 14, 38 22, 35 30" fill="none" stroke="var(--wood-dark)" stroke-width="2.5" stroke-linecap="round" />
        <path d="M25 34 C20 38, 16 48, 18 50" fill="none" stroke="var(--wood-dark)" stroke-width="2.5" stroke-linecap="round" />
        <circle cx="27" cy="24" r="0.8" fill="var(--wood-dark)" />
        <circle cx="33" cy="24" r="0.8" fill="var(--wood-dark)" />
        <path d="M27 29 Q30 31 33 29" fill="none" stroke="var(--wood-dark)" stroke-width="1" stroke-linecap="round" />
      </g>

      <!-- Middle Stick Man -->
      <g class="stick-man-mid">
        <path d="M48 60 C48 40, 72 40, 72 60" fill="var(--wood-medium)" />
        <circle cx="60" cy="24" r="10" fill="var(--gold-light)" stroke="var(--wood-dark)" stroke-width="1.5" />
        <path class="waving-arm-mid" d="M66 32 C72 28, 80 14, 78 12 C76 10, 70 20, 66 28" fill="none" stroke="var(--wood-dark)" stroke-width="3" stroke-linecap="round" />
        <path d="M54 32 C48 36, 42 48, 44 50" fill="none" stroke="var(--wood-dark)" stroke-width="3" stroke-linecap="round" />
        <circle cx="57" cy="22" r="1" fill="var(--wood-dark)" />
        <circle cx="63" cy="22" r="1" fill="var(--wood-dark)" />
        <path d="M57 27 Q60 30 63 27" fill="none" stroke="var(--wood-dark)" stroke-width="1.2" stroke-linecap="round" />
      </g>

      <!-- Right Stick Man -->
      <g class="stick-man-right">
        <path d="M78 60 C78 42, 102 42, 102 60" fill="var(--wood-light)" />
        <circle cx="90" cy="26" r="9" fill="var(--gold-light)" stroke="var(--wood-dark)" stroke-width="1.5" />
        <path class="waving-arm-right" d="M95 34 C100 30, 106 18, 104 16 C102 14, 98 22, 95 30" fill="none" stroke="var(--wood-dark)" stroke-width="2.5" stroke-linecap="round" />
        <path d="M85 34 C80 38, 76 48, 78 50" fill="none" stroke="var(--wood-dark)" stroke-width="2.5" stroke-linecap="round" />
        <circle cx="87" cy="24" r="0.8" fill="var(--wood-dark)" />
        <circle cx="93" cy="24" r="0.8" fill="var(--wood-dark)" />
        <path d="M87 29 Q90 31 93 29" fill="none" stroke="var(--wood-dark)" stroke-width="1" stroke-linecap="round" />
      </g>
    </svg>
  `;

  container.innerHTML = `
    <div class="spc-container">
      <div class="view-header-bar">
        <button class="btn-back" id="spc-back">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Return to Registry
        </button>
        <div class="view-title-wrapper">
          <h2>SPC Control Panel</h2>
          <p>Official Placement Coordinator Database</p>
        </div>
      </div>

      <!-- Priority Drive Card -->
      <div class="spc-drive-card" style="margin-bottom: 20px; background: var(--cream-card); border: 1px solid var(--border-gold); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-premium); display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 16px; min-width: 250px;">
          <!-- Folder SVG Icon -->
          <div style="background: #fff7ed; padding: 12px; border-radius: 50%; color: #c2410c; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <h3 style="margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.4rem; font-weight: 700; color: var(--wood-dark);">All Placement Data Drive</h3>
              <span style="font-size: 0.65rem; font-weight: 800; background: #fff7ed; color: #c2410c; padding: 2px 8px; border-radius: 12px; letter-spacing: 0.05em; text-transform: uppercase; border: 1px solid #ffedd5;">Priority</span>
            </div>
            <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: var(--text-secondary);">Central Google Drive repository for student resumes, criteria spreadsheets, and recruitment drives data.</p>
          </div>
        </div>
        <a href="https://drive.google.com/drive/folders/1TH8qfWIIXuux1p9MCMqZ0MD3_7JlzIj7?usp=sharing" target="_blank" class="spc-open-btn" style="flex-shrink: 0; padding: 10px 18px; display: inline-flex; align-items: center; gap: 8px; font-weight: 700; background-color: var(--wood-dark); color: var(--gold-light); border-color: var(--wood-dark);">
          Open Placement Drive
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>

      <!-- Students Database Card -->
      <div class="spc-drive-card" style="margin-bottom: 30px; background: var(--cream-card); border: 1px solid var(--border-gold); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-premium); display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 16px; min-width: 250px;">
          <!-- Spreadsheet SVG Icon -->
          <div style="background: #ecfdf5; padding: 12px; border-radius: 50%; color: #059669; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <h3 style="margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.4rem; font-weight: 700; color: var(--wood-dark);">Students Database</h3>
              <span style="font-size: 0.65rem; font-weight: 800; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 12px; letter-spacing: 0.05em; text-transform: uppercase; border: 1px solid #bae6fd;">Active</span>
            </div>
            <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: var(--text-secondary);">Master spreadsheet tracking student registrations, branch details, eligibility parameters, and contact info.</p>
          </div>
        </div>
        <a href="https://docs.google.com/spreadsheets/d/11XeRRSKqICTTqZ_-_g-z1yYnSU_yTiBVFf6fxQBbku8/edit?usp=sharing" target="_blank" class="spc-open-btn" style="flex-shrink: 0; padding: 10px 18px; display: inline-flex; align-items: center; gap: 8px; font-weight: 700; background-color: var(--wood-dark); color: var(--gold-light); border-color: var(--wood-dark);">
          Open Students Database
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>

      <!-- Embedded Spreadsheet -->
      <div class="spc-spreadsheet-container">
        <div class="spc-spreadsheet-header">
          <span>Placed Data (Live Preview)</span>
          <a href="https://docs.google.com/spreadsheets/d/1eiLJQ0l6RjVPSlxjdivoiY2kcDNdFGhkFpVDHYxCTV0/edit?usp=sharing" target="_blank" class="spc-open-btn">
            Open Placed Data
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>
        <div class="spc-iframe-wrapper">
          <iframe src="https://docs.google.com/spreadsheets/d/1eiLJQ0l6RjVPSlxjdivoiY2kcDNdFGhkFpVDHYxCTV0/htmlembed?widget=true&headers=false" width="100%" height="600"></iframe>
        </div>
      </div>
    </div>
  `;

  // Bind back button and clear absolute body overlays immediately
  document.getElementById('spc-back').addEventListener('click', () => {
    if (toast) {
      toast.classList.remove('show');
      toast.classList.add('hide');
    }
    if (wavingMan) {
      wavingMan.classList.remove('show');
      wavingMan.classList.add('hide');
    }
    currentView = 'home';
    render();
  });

  // Trigger login toast alert and waving man for exactly 4 seconds
  setTimeout(() => {
    toast.classList.add('show');
    wavingMan.classList.add('show');
  }, 150);
  
  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hide');
    wavingMan.classList.remove('show');
    wavingMan.classList.add('hide');
  }, 4000);
}

// Initial Boot — verify existing JWT token before rendering
async function boot() {
  await fetchEvents();
  const token = sessionStorage.getItem('adminToken');
  if (token) {
    try {
      const res = await fetch(`${API}/api/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.valid && data.admin) {
        isAdmin = true;
      } else {
        // Token expired or invalid — clean up
        sessionStorage.removeItem('adminToken');
        isAdmin = false;
      }
    } catch {
      // Network/Server error — fallback client-side check for dummy token
      if (token === 'dummy-admin-jwt-token') {
        isAdmin = true;
      } else {
        isAdmin = false;
      }
    }
  }
  render();
}

boot();
