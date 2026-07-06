import './student.css';

// Dynamic API detection for localhost development and cloud staging
const API = 'https://vtu-project.onrender.com'; // Point to deployed backend

// SPA Navigation State
let currentView = 'home';
let currentStudentData = null;
let activeSem = 'all';
let isAdmin = false;
let currentCalendarDate = new Date();

// Calendar Filter States (Online & Offline drives added)
const calendarFilters = {
  academic: true,
  exams: true,
  holidays: true,
  online: true,
  offline: true
};

// Placement Calendar Database array (persisted via localStorage)
let calendarEvents = [];
const storedEvents = localStorage.getItem('calendarEvents');
if (storedEvents) {
  calendarEvents = JSON.parse(storedEvents);
} else {
  calendarEvents = []; // Start completely empty as requested
}

// Persist events array
function saveEvents() {
  localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
}

// Router Entry
function render() {
  const container = document.querySelector('#student-app');
  container.className = `view-${currentView}`;

  if (currentView === 'home') {
    renderHome(container);
  } else if (currentView === 'cse') {
    renderCSE(container);
  } else if (currentView === 'calendar') {
    renderCalendar(container);
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

      <div class="luxury-crest">
        <div class="crest-line"></div>
        <span class="crest-text">EST. 2026</span>
        <div class="crest-line"></div>
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
      </div>
      
      <footer class="lobby-footer">
        <p>Official Placement & Student Registry Portal. Secured via Departmental Access Keys.</p>
      </footer>
    </div>
  `;

  // Bind Card Click Events
  document.getElementById('btn-cse').addEventListener('click', () => {
    currentView = 'cse';
    render();
  });

  document.getElementById('btn-ise').addEventListener('click', () => {
    window.location.href = 'https://placements-rvitm.netlify.app/student';
  });

  document.getElementById('btn-calendar').addEventListener('click', () => {
    currentView = 'calendar';
    render();
  });

  // Trigger upcoming calendar event toast
  triggerUpcomingToast();
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
    currentView = 'home';
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
              <span class="mini-month-title">July 2026</span>
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
              <input type="checkbox" id="filter-academic" ${calendarFilters.academic ? 'checked' : ''}>
              <span class="checkbox-custom checkbox-academic"></span>
              Placement Drives
            </label>
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
          </div>
        </aside>

        <!-- Main Calendar Desk -->
        <main class="calendar-main">
          <div class="calendar-toolbar">
            <div class="toolbar-left">
              <button class="toolbar-btn today-btn" id="cal-today-btn">Today</button>
              <div class="toolbar-nav">
                <button class="toolbar-nav-btn" id="cal-prev-btn">&lt;</button>
                <span class="toolbar-current-month">July 2026</span>
                <button class="toolbar-nav-btn" id="cal-next-btn">&gt;</button>
              </div>
            </div>
            <div class="toolbar-right">
              <button class="toolbar-view-btn active">Month</button>
              <button class="toolbar-view-btn">Week</button>
              <button class="toolbar-view-btn">Day</button>
            </div>
          </div>

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
      render();
    });
  }

  // Bind checkbox filter change events
  ['academic', 'exams', 'holidays', 'online', 'offline'].forEach(key => {
    document.getElementById(`filter-${key}`).addEventListener('change', (e) => {
      calendarFilters[key] = e.target.checked;
      generateCalendarGrid();
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
    academic: 'Placement Drive',
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

    let cellContent = `<span class="day-number">${d}</span>`;
    
    // Extract events active under current filters (category + format filter)
    const events = calendarEvents.filter(ev => {
      if (ev.date !== dateStr) return false;
      if (!calendarFilters[ev.type]) return false;
      if (ev.mode === 'online' && !calendarFilters.online) return false;
      if (ev.mode === 'offline' && !calendarFilters.offline) return false;
      return true;
    });
    
    if (events.length > 0) {
      cellContent += `<div class="day-events">`;
      events.forEach(ev => {
        const modeTag = ev.mode ? ` <span class="pill-mode-tag mode-${ev.mode}">${ev.mode}</span>` : '';
        cellContent += `
          <div class="calendar-event-pill event-${ev.type}" data-event-id="${ev.id}">
            <span class="event-dot"></span>
            <span class="event-text">${ev.title}${modeTag}</span>
          </div>
        `;
      });
      cellContent += `</div>`;
    }

    cell.innerHTML = cellContent;
    gridContainer.appendChild(cell);

    // Bind click listener on day cell for ADMIN placement event insertion
    cell.addEventListener('click', (e) => {
      if (!isAdmin) return;
      // Do not trigger cell add form if user clicks directly on an existing event pill
      if (e.target.closest('.calendar-event-pill')) return;
      showCreateEventModal(dateStr);
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
}

// 6. Dynamic Modal Overlays

// Close modal helper
function hideEventModal() {
  const modal = document.getElementById('event-modal');
  if (modal) modal.classList.remove('active');
}
window.hideEventModal = hideEventModal;

// Visitor Details View
function showEventDetailModalVisitor(event) {
  const modal = document.getElementById('event-modal');
  const card = document.getElementById('modal-card-content');
  
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const dateObj = new Date(event.date);
  const dateStr = dateObj.toLocaleDateString('en-US', options);
  
  const modeBadge = event.mode ? `<span class="modal-mode-badge mode-${event.mode}">${event.mode.toUpperCase()}</span>` : '';
  
  card.innerHTML = `
    <div class="modal-header">
      <span class="modal-category event-${event.type}">${getCategoryLabel(event.type)}</span>
      ${modeBadge}
      <button class="modal-close" onclick="hideEventModal()">&times;</button>
    </div>
    <h3 class="modal-title">${event.title}</h3>
    <div class="modal-date">${dateStr}</div>
    <p class="modal-desc">${event.desc}</p>
  `;
  modal.classList.add('active');
}

// Admin Details View (with Edit/Delete toggles)
function showEventDetailModalAdmin(event) {
  const modal = document.getElementById('event-modal');
  const card = document.getElementById('modal-card-content');
  
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const dateObj = new Date(event.date);
  const dateStr = dateObj.toLocaleDateString('en-US', options);
  
  const modeBadge = event.mode ? `<span class="modal-mode-badge mode-${event.mode}">${event.mode.toUpperCase()}</span>` : '';
  
  card.innerHTML = `
    <div class="modal-header">
      <span class="modal-category event-${event.type}">${getCategoryLabel(event.type)}</span>
      ${modeBadge}
      <button class="modal-close" onclick="hideEventModal()">&times;</button>
    </div>
    <h3 class="modal-title">${event.title}</h3>
    <div class="modal-date">${dateStr}</div>
    <p class="modal-desc">${event.desc}</p>
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
  document.getElementById('modal-delete-btn').addEventListener('click', () => {
    if (confirm(`Are you sure you want to delete the placement update for "${event.title}"?`)) {
      calendarEvents = calendarEvents.filter(ev => ev.id !== event.id);
      saveEvents();
      hideEventModal();
      generateCalendarGrid();
      generateMiniCalendar();
    }
  });
}

// Edit Event Modal Form
function showEditEventModal(event) {
  const card = document.getElementById('modal-card-content');
  
  card.innerHTML = `
    <div class="modal-header">
      <h3>Edit Placement Update</h3>
      <button class="modal-close" onclick="hideEventModal()">&times;</button>
    </div>
    <form id="edit-event-form" class="modal-form">
      <div class="form-group">
        <label for="form-title">Company Name</label>
        <input type="text" id="form-title" value="${event.title}" required placeholder="e.g. Google India">
      </div>
      <div class="form-group">
        <label for="form-type">Update Type</label>
        <select id="form-type" required>
          <option value="academic" ${event.type === 'academic' ? 'selected' : ''}>Placement Drive</option>
          <option value="exams" ${event.type === 'exams' ? 'selected' : ''}>Interviews & Tests</option>
          <option value="holidays" ${event.type === 'holidays' ? 'selected' : ''}>Holidays & Breaks</option>
        </select>
      </div>
      <div class="form-group">
        <label>Drive Format (Optional)</label>
        <div class="format-buttons-group">
          <button type="button" class="format-btn ${event.mode === 'online' ? 'active' : ''}" id="format-btn-online" data-value="online">Online</button>
          <button type="button" class="format-btn ${event.mode === 'offline' ? 'active' : ''}" id="format-btn-offline" data-value="offline">Offline</button>
        </div>
        <input type="hidden" id="form-mode" value="${event.mode || ''}">
      </div>
      <div class="form-group">
        <label for="form-date">Scheduled Date</label>
        <input type="date" id="form-date" value="${event.date}" required>
      </div>
      <div class="form-group">
        <label for="form-desc">Details / Description</label>
        <textarea id="form-desc" rows="4" required placeholder="Describe placement criteria, eligibility, compensation...">${event.desc}</textarea>
      </div>
      <div class="form-submit-group">
        <button type="button" class="form-cancel-btn" id="form-cancel-edit">Cancel</button>
        <button type="submit" class="form-submit-btn">Save Changes</button>
      </div>
    </form>
  `;
  
  // Format buttons logic
  const modeInput = document.getElementById('form-mode');
  const onlineBtn = document.getElementById('format-btn-online');
  const offlineBtn = document.getElementById('format-btn-offline');
  
  const handleFormatClick = (btn, value) => {
    if (btn.classList.contains('active')) {
      btn.classList.remove('active');
      modeInput.value = '';
    } else {
      onlineBtn.classList.remove('active');
      offlineBtn.classList.remove('active');
      btn.classList.add('active');
      modeInput.value = value;
    }
  };
  
  onlineBtn.addEventListener('click', () => handleFormatClick(onlineBtn, 'online'));
  offlineBtn.addEventListener('click', () => handleFormatClick(offlineBtn, 'offline'));
  
  document.getElementById('form-cancel-edit').addEventListener('click', () => {
    showEventDetailModalAdmin(event);
  });
  
  document.getElementById('edit-event-form').addEventListener('submit', (e) => {
    e.preventDefault();
    event.title = document.getElementById('form-title').value.trim();
    event.type = document.getElementById('form-type').value;
    event.mode = document.getElementById('form-mode').value || null;
    event.date = document.getElementById('form-date').value;
    event.desc = document.getElementById('form-desc').value.trim();
    
    saveEvents();
    hideEventModal();
    generateCalendarGrid();
    generateMiniCalendar();
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
          <option value="academic" selected>Placement Drive</option>
          <option value="exams">Interviews & Tests</option>
          <option value="holidays">Holidays & Breaks</option>
        </select>
      </div>
      <div class="form-group">
        <label>Drive Format (Optional)</label>
        <div class="format-buttons-group">
          <button type="button" class="format-btn" id="format-btn-online" data-value="online">Online</button>
          <button type="button" class="format-btn" id="format-btn-offline" data-value="offline">Offline</button>
        </div>
        <input type="hidden" id="form-mode" value="">
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
      onlineBtn.classList.remove('active');
      offlineBtn.classList.remove('active');
      btn.classList.add('active');
      modeInput.value = value;
    }
  };
  
  onlineBtn.addEventListener('click', () => handleFormatClick(onlineBtn, 'online'));
  offlineBtn.addEventListener('click', () => handleFormatClick(offlineBtn, 'offline'));
  
  document.getElementById('create-event-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('form-title').value.trim();
    const type = document.getElementById('form-type').value;
    const mode = document.getElementById('form-mode').value || null;
    const date = document.getElementById('form-date').value;
    const desc = document.getElementById('form-desc').value.trim();
    
    const newEvent = {
      id: Date.now(),
      title,
      type,
      mode,
      date,
      desc
    };
    
    calendarEvents.push(newEvent);
    saveEvents();
    hideEventModal();
    generateCalendarGrid();
    generateMiniCalendar();
  });
}

// Helper for secure client-side hashing
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
        <input type="password" id="admin-password" required placeholder="Enter Password" autocomplete="current-password">
      </div>
      <div id="login-error" class="login-error-msg"></div>
      <div class="form-submit-group">
        <button type="button" class="form-cancel-btn" onclick="hideEventModal()">Cancel</button>
        <button type="submit" class="form-submit-btn">Authenticate</button>
      </div>
    </form>
  `;
  modal.classList.add('active');
  
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('admin-id').value.trim();
    const password = document.getElementById('admin-password').value;
    const errorMsg = document.getElementById('login-error');
    
    // Compute input hashes
    const idHash = await sha256(id);
    const pwHash = await sha256(password);
    
    // Compare against pre-hashed credentials (mdadmin / placement123)
    if (idHash === 'd9dc51915ea0c76fb57eb5c5c720c941589548f4a1fd46d195d3d4da471dfb69' && 
        pwHash === '2a491a2a2a4c72fb484db9932f9dcb056da9fe3001324660d216fc242947cd5c') {
      isAdmin = true;
      hideEventModal();
      render(); // Re-render calendar page to update grid interactivity and toolbar logout button
    } else {
      errorMsg.textContent = 'Invalid Admin ID or Password.';
      errorMsg.classList.add('active');
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
    </div>
  `;

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

// Initial Boot
render();
