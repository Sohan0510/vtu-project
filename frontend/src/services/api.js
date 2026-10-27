export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function getAdminToken() {
  return sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '';
}


function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAdminToken()}`,
  };
}

// ----------------- CALENDAR EVENTS -----------------

export async function fetchEventsApi() {
  const url = `${API_BASE_URL}/api/events?_t=${Date.now()}&_r=${Math.random().toString(36).substring(2, 7)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data)) {
    data.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
    return data;
  }
  return [];
}

export async function createEventApi(newEvent) {
  const res = await fetch(`${API_BASE_URL}/api/events`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(newEvent),
  });
  if (!res.ok) {
    let errData = {};
    try { errData = await res.json(); } catch {}
    throw new Error(errData.detail || `Server returned ${res.status}`);
  }
  return res.json().catch(() => newEvent);
}

export async function updateEventApi(updatedEvent) {
  const res = await fetch(`${API_BASE_URL}/api/events`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updatedEvent),
  });
  if (!res.ok) {
    let errData = {};
    try { errData = await res.json(); } catch {}
    throw new Error(errData.detail || `Server returned ${res.status}`);
  }
  return res.json().catch(() => updatedEvent);
}

export async function deleteEventApi(eventId) {
  const res = await fetch(`${API_BASE_URL}/api/events`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify({ id: eventId }),
  });
  if (!res.ok) throw new Error('Delete failed');
  return true;
}

// ----------------- MARKS & REGISTRY -----------------

export async function fetchStudentResultApi(usn) {
  const res = await fetch(`${API_BASE_URL}/api/results/${usn}`);
  if (!res.ok) {
    throw new Error('Student record not found in registry database.');
  }
  return res.json();
}

export async function fetchECEStudentsApi() {
  const res = await fetch('/ece_students.json');
  if (!res.ok) {
    throw new Error('Failed to load ECE registry.');
  }
  return res.json();
}

// ----------------- AUTH & ADMIN -----------------

export async function verifyAdminTokenApi(token) {
  const res = await fetch(`${API_BASE_URL}/api/verify`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Verification failed');
  return res.json();
}

export async function adminLoginApi({ id, password }) {
  const res = await fetch(`${API_BASE_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, password }),
  });
  const data = await res.json();
  if (res.ok && data.token) {
    return data;
  }
  throw new Error('Authentication rejected');
}

// ----------------- AI PARSER -----------------

export async function aiParseTextApi(text) {
  const res = await fetch(`${API_BASE_URL}/api/ai/parse`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('AI parser service returned an error status');
  const parsedEvents = await res.json();
  if (!Array.isArray(parsedEvents)) {
    throw new Error('AI response was not a JSON array of events');
  }
  return parsedEvents;
}
