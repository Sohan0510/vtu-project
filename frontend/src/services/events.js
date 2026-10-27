import { API_BASE_URL } from './api.js';

export const EVENTS_CACHE_KEY = 'vtu_calendar_events_cache';

export function loadCachedEvents() {
  try {
    const raw = localStorage.getItem(EVENTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse cached events:', e);
  }
  return [];
}

export function saveCachedEvents(events, notify = false) {
  try {
    if (Array.isArray(events)) {
      localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(events));
      if (notify) {
        notifySyncBus();
      }
    }
  } catch (e) {
    console.warn('Failed to save events to cache:', e);
  }
}


export const calendarSyncBus = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('vtu_calendar_sync_bus')
  : null;

export function notifySyncBus() {
  try {
    calendarSyncBus?.postMessage({ type: 'CALENDAR_MUTATION', t: Date.now() });
  } catch {}
}

export function areEventsDifferent(prevList, nextList) {
  if (!Array.isArray(prevList) || !Array.isArray(nextList)) return true;
  if (prevList.length !== nextList.length) return true;
  
  const norm = (v) => (v === null || v === undefined ? '' : String(v).trim());
  const prevMap = new Map();
  for (const e of prevList) {
    if (e && e.id !== undefined) prevMap.set(Number(e.id), e);
  }
  
  for (const next of nextList) {
    const prev = prevMap.get(Number(next.id));
    if (!prev) return true;
    if (norm(prev.title) !== norm(next.title)) return true;
    if (norm(prev.date) !== norm(next.date)) return true;
    if (norm(prev.type) !== norm(next.type)) return true;
    if (norm(prev.mode) !== norm(next.mode)) return true;
    if (norm(prev.location) !== norm(next.location)) return true;
    if (norm(prev.studentType) !== norm(next.studentType)) return true;
    if (norm(prev.desc) !== norm(next.desc)) return true;
    const prevSubs = Array.isArray(prev.subtypes) ? prev.subtypes.map(s => String(s).trim()).join(',') : '';
    const nextSubs = Array.isArray(next.subtypes) ? next.subtypes.map(s => String(s).trim()).join(',') : '';
    if (prevSubs !== nextSubs) return true;
  }
  return false;
}

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
