import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchEventsApi,
  createEventApi,
  updateEventApi,
  deleteEventApi,
  fetchStudentResultApi,
  fetchECEStudentsApi,
  verifyAdminTokenApi,
  adminLoginApi,
  aiParseTextApi,
} from '../services/api.js';
import {
  loadCachedEvents,
  saveCachedEvents,
  areEventsDifferent,
  EVENTS_CACHE_KEY,
  calendarSyncBus,
  notifySyncBus,
} from '../services/events.js';
import { useEffect, useRef, useState } from 'react';

// =================== EVENTS HOOK (WITH TANSTACK QUERY) ===================

export function useCalendarEventsQuery(isCalendarView = false) {
  const queryClient = useQueryClient();
  const [lastUpdatedEvent, setLastUpdatedEvent] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const prevEventsRef = useRef(loadCachedEvents());

  const query = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const freshEvents = await fetchEventsApi();
      const prev = prevEventsRef.current;

      if (areEventsDifferent(prev, freshEvents)) {
        const prevIds = new Set(prev.map((e) => Number(e.id)));
        const newlyAdded = freshEvents.filter((e) => !prevIds.has(Number(e.id)));

        prevEventsRef.current = freshEvents;
        saveCachedEvents(freshEvents, false); // Do not broadcast on passive poll

        if (newlyAdded.length > 0 && prevIds.size > 0) {
          setLastUpdatedEvent(newlyAdded[newlyAdded.length - 1]);
        }

        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 500);
      }
      return freshEvents;
    },
    initialData: () => loadCachedEvents(),
    staleTime: 10000, // Consider fresh for 10 seconds
    refetchInterval: () => (isCalendarView && typeof document !== 'undefined' && !document.hidden ? 15000 : 30000), // 15s when active on calendar, 30s elsewhere
    refetchOnWindowFocus: false, // Prevent re-fetch spam when switching tabs
  });

  // Cross-tab storage event synchronization
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === EVENTS_CACHE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            parsed.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
            prevEventsRef.current = parsed;
            queryClient.setQueryData(['events'], parsed);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [queryClient]);

  // BroadcastChannel listener (only responds to user mutations from OTHER tabs)
  useEffect(() => {
    if (!calendarSyncBus) return;
    const handleBus = (e) => {
      if (e.data?.type === 'CALENDAR_MUTATION') {
        queryClient.invalidateQueries({ queryKey: ['events'] });
      }
    };
    calendarSyncBus.addEventListener('message', handleBus);
    return () => calendarSyncBus.removeEventListener('message', handleBus);
  }, [queryClient]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createEventApi,
    onSuccess: (newEvent) => {
      queryClient.setQueryData(['events'], (old = []) => {
        const next = [...old, newEvent].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
        saveCachedEvents(next, true);
        prevEventsRef.current = next;
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });


  const updateMutation = useMutation({
    mutationFn: updateEventApi,
    onSuccess: (updatedEvent) => {
      queryClient.setQueryData(['events'], (old = []) => {
        const next = old.map((ev) => (ev.id === updatedEvent.id ? updatedEvent : ev));
        saveCachedEvents(next, true);
        prevEventsRef.current = next;
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEventApi,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(['events'], (old = []) => {
        const next = old.filter((ev) => ev.id !== deletedId);
        saveCachedEvents(next, true);
        prevEventsRef.current = next;
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });


  return {
    events: query.data || [],
    isLoading: query.isLoading,
    isSyncing,
    isEventsFetched: !!query.data && query.data.length > 0,
    refetchEvents: query.refetch,
    lastUpdatedEvent,
    clearLastUpdatedEvent: () => setLastUpdatedEvent(null),
    createEvent: createMutation.mutateAsync,
    updateEvent: updateMutation.mutateAsync,
    deleteEvent: deleteMutation.mutateAsync,
  };
}

// =================== CSE MARKS QUERY ===================

export function useStudentResultQuery(usn) {
  return useQuery({
    queryKey: ['studentResult', usn],
    queryFn: () => fetchStudentResultApi(usn),
    enabled: !!usn,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// =================== ECE MARKS QUERY ===================

export function useECEStudentsQuery() {
  return useQuery({
    queryKey: ['eceStudents'],
    queryFn: fetchECEStudentsApi,
    staleTime: 10 * 60 * 1000,
  });
}

// =================== AI PARSE MUTATION ===================

export function useAIParseMutation() {
  return useMutation({
    mutationFn: aiParseTextApi,
  });
}

// =================== ADMIN LOGIN MUTATION ===================

export function useAdminLoginMutation() {
  return useMutation({
    mutationFn: adminLoginApi,
  });
}
