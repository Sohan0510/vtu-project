import { useState, useEffect, useRef, useCallback } from 'react';
import {
  loadCachedEvents,
  saveCachedEvents,
  fetchEventsApi,
  areEventsDifferent,
  EVENTS_CACHE_KEY,
  calendarSyncBus,
} from '../services/events.js';

export function useEvents(isCalendarView = false) {
  const [events, setEvents] = useState(() => loadCachedEvents());
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdatedEvent, setLastUpdatedEvent] = useState(null);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  const fetchEvents = useCallback(async (force = false) => {
    try {
      const freshEvents = await fetchEventsApi();
      const prev = eventsRef.current;
      const hasChanged = areEventsDifferent(prev, freshEvents);

      if (hasChanged || force || prev.length === 0) {
        const prevIds = new Set(prev.map(e => Number(e.id)));
        const newlyAdded = freshEvents.filter(e => !prevIds.has(Number(e.id)));

        eventsRef.current = freshEvents;
        setEvents(freshEvents);
        saveCachedEvents(freshEvents);

        if (newlyAdded.length > 0 && !force && prevIds.size > 0) {
          const latest = newlyAdded[newlyAdded.length - 1];
          setLastUpdatedEvent(latest);
        }

        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 600);
      }
      return freshEvents;
    } catch (err) {
      console.warn('Failed to fetch events from backend:', err);
      return eventsRef.current;
    }
  }, []);

  // Sync with storage events from other tabs
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === EVENTS_CACHE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            parsed.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
            eventsRef.current = parsed;
            setEvents(parsed);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // BroadcastChannel listener
  useEffect(() => {
    if (!calendarSyncBus) return;
    const handleBus = (e) => {
      if (e.data?.type === 'CALENDAR_MUTATION') {
        fetchEvents(true);
      }
    };
    calendarSyncBus.addEventListener('message', handleBus);
    return () => {
      calendarSyncBus.removeEventListener('message', handleBus);
    };
  }, [fetchEvents]);

  // High-frequency adaptive background polling
  useEffect(() => {
    let timer = null;
    let isCancelled = false;

    const poll = async () => {
      if (isCancelled) return;
      const interval = isCalendarView && !document.hidden ? 2500 : 6000;
      await fetchEvents(false);
      if (!isCancelled) {
        timer = setTimeout(poll, interval);
      }
    };

    timer = setTimeout(poll, 2500);

    const handleVisibility = () => {
      if (!document.hidden) fetchEvents(true);
    };
    const handleFocus = () => fetchEvents(true);

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isCalendarView, fetchEvents]);

  // Initial fetch on mount
  useEffect(() => {
    fetchEvents(false);
  }, [fetchEvents]);

  const mutateEvents = useCallback((updater) => {
    setEvents((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (Array.isArray(next)) {
        next.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
        saveCachedEvents(next);
        eventsRef.current = next;
      }
      return next;
    });
  }, []);

  return {
    events,
    fetchEvents,
    mutateEvents,
    isSyncing,
    lastUpdatedEvent,
    clearLastUpdatedEvent: () => setLastUpdatedEvent(null),
  };
}
