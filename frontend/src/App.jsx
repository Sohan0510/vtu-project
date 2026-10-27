import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import { useCalendarEventsQuery } from './hooks/useApiQueries.js';
import { useCalendarFilters } from './hooks/useCalendarFilters.js';
import { verifyAdminTokenApi } from './services/api.js';

import LoginGate from './pages/LoginGate.jsx';
import Home from './pages/Home.jsx';
import RegistrySelector from './pages/RegistrySelector.jsx';
import CSEMarks from './pages/CSEMarks.jsx';
import ECEMarks from './pages/ECEMarks.jsx';
import Calendar from './pages/Calendar.jsx';
import SPCPanel from './pages/SPCPanel.jsx';

import Modal from './components/common/Modal.jsx';
import SPCPasswordModal from './components/modals/SPCPasswordModal.jsx';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, isAuthenticated, isAdmin, setIsAdmin, login, logout } = useAuth();

  const isCalendarView = location.pathname === '/calendar';
  const {
    events,
    isSyncing,
    isEventsFetched,
    refetchEvents,
    lastUpdatedEvent,
    clearLastUpdatedEvent,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useCalendarEventsQuery(isCalendarView);

  const { filters, toggleFilter } = useCalendarFilters();

  const [isSPCModalOpen, setIsSPCModalOpen] = useState(false);

  // Re-verify stored admin token on boot
  useEffect(() => {
    const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
    if (token) {
      verifyAdminTokenApi(token)
        .then((data) => {
          if (data?.valid && data?.admin) {
            setIsAdmin(true);
          } else {
            sessionStorage.removeItem('adminToken');
            localStorage.removeItem('adminToken');
            setIsAdmin(false);
          }
        })
        .catch(() => {
          sessionStorage.removeItem('adminToken');
          localStorage.removeItem('adminToken');
          setIsAdmin(false);
        });
    }
  }, [setIsAdmin]);


  // If not authenticated, render Login Gate
  if (!isAuthenticated) {
    return <LoginGate onLoginSuccess={(s) => login(s.token, s)} />;
  }

  // Derive root container view class name to maintain exact original CSS styles
  let viewClass = 'view-home';
  if (location.pathname === '/registry-selector') viewClass = 'view-registry-selector';
  else if (location.pathname === '/cse') viewClass = 'view-cse';
  else if (location.pathname === '/ece') viewClass = 'view-ece';
  else if (location.pathname === '/calendar') viewClass = 'view-calendar';
  else if (location.pathname === '/spc') viewClass = 'view-spc';

  return (
    <div id="student-app" className={viewClass}>
      <Routes>
        <Route
          path="/"
          element={
            <Home
              session={session}
              onLogout={logout}
              events={events}
              isEventsFetched={isEventsFetched}
              onOpenSPCModal={() => setIsSPCModalOpen(true)}
            />
          }
        />
        <Route path="/registry-selector" element={<RegistrySelector />} />
        <Route path="/cse" element={<CSEMarks />} />
        <Route path="/ece" element={<ECEMarks />} />
        <Route
          path="/calendar"
          element={
            <Calendar
              events={events}
              isEventsFetched={isEventsFetched}
              isSyncing={isSyncing}
              fetchEvents={refetchEvents}
              createEvent={createEvent}
              updateEvent={updateEvent}
              deleteEvent={deleteEvent}
              lastUpdatedEvent={lastUpdatedEvent}
              clearLastUpdatedEvent={clearLastUpdatedEvent}
              filters={filters}
              toggleFilter={toggleFilter}
              isAdmin={isAdmin}
              setIsAdmin={setIsAdmin}
            />
          }
        />
        <Route path="/spc" element={<SPCPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global SPC Password Authorization Modal */}
      <Modal isOpen={isSPCModalOpen} onClose={() => setIsSPCModalOpen(false)}>
        <SPCPasswordModal
          onClose={() => setIsSPCModalOpen(false)}
          onSuccess={() => {
            navigate('/spc');
          }}
        />
      </Modal>
    </div>
  );
}
