import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ViewHeaderBar from '../components/layout/ViewHeaderBar.jsx';
import CalendarSidebar from '../components/calendar/CalendarSidebar.jsx';
import CalendarToolbar from '../components/calendar/CalendarToolbar.jsx';
import CalendarGrid from '../components/calendar/CalendarGrid.jsx';
import AgendaView from '../components/calendar/AgendaView.jsx';
import TbdDrives from '../components/calendar/TbdDrives.jsx';
import CompanySearch from '../components/calendar/CompanySearch.jsx';
import LiveUpdateToast from '../components/common/LiveUpdateToast.jsx';
import Modal from '../components/common/Modal.jsx';
import EventDetailModal from '../components/modals/EventDetailModal.jsx';
import EventDetailAdminModal from '../components/modals/EventDetailAdminModal.jsx';
import EditEventModal from '../components/modals/EditEventModal.jsx';
import CreateEventModal from '../components/modals/CreateEventModal.jsx';
import ScheduleRoundsModal from '../components/modals/ScheduleRoundsModal.jsx';
import AIPostModal from '../components/modals/AIPostModal.jsx';
import AIPreviewModal from '../components/modals/AIPreviewModal.jsx';
import AdminLoginModal from '../components/modals/AdminLoginModal.jsx';
import SubscribeModal from '../components/modals/SubscribeModal.jsx';

import { formatLocalDate } from '../utils/formatDate.js';

export default function Calendar({
  events,
  isEventsFetched,
  isSyncing,
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  lastUpdatedEvent,
  clearLastUpdatedEvent,
  filters,
  toggleFilter,
  isAdmin,
  setIsAdmin,
}) {
  const navigate = useNavigate();

  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Modal active states
  const [activeModal, setActiveModal] = useState(null);
  const [modalEvent, setModalEvent] = useState(null);
  const [createDate, setCreateDate] = useState('');
  const [aiParsedEvents, setAiParsedEvents] = useState([]);

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  const handleToday = () => {
    setCurrentCalendarDate(new Date());
    setSelectedCalendarDate(new Date());
  };

  const handleSyncRefresh = async () => {
    await fetchEvents();
  };

  const handleSelectDate = (dateStr) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      setCurrentCalendarDate(new Date(year, month, 1));
      setSelectedCalendarDate(new Date(year, month, day));
    }
  };

  const handleCellClick = (dateStr) => {
    handleSelectDate(dateStr);
    if (isAdmin) {
      setCreateDate(dateStr);
      setActiveModal('create');
    } else {
      const agendaEl = document.getElementById('calendar-agenda-view');
      if (agendaEl) {
        setTimeout(() => {
          agendaEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      }
    }
  };

  const handleEventClick = (event) => {
    setModalEvent(event);
    if (isAdmin) {
      setActiveModal('detail-admin');
    } else {
      setActiveModal('detail-visitor');
    }
  };

  const handleDeleteEvent = async (event) => {
    if (window.confirm(`Are you sure you want to delete the placement update for "${event.title}"?`)) {
      try {
        await deleteEvent(event.id);
        setActiveModal(null);
      } catch (err) {
        alert('Failed to delete event. Please check your connection.');
      }
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalEvent(null);
  };

  return (
    <div className="calendar-container">
      <ViewHeaderBar
        onBack={() => navigate('/')}
        backLabel="Return to Registry"
        title="Placement Calendar"
        subtitle="Outlook Registry Format"
        rightElement={
          <div className="calendar-auth-control">
            {isAdmin ? (
              <button
                className="btn-auth admin-active"
                id="btn-admin-logout"
                onClick={() => {
                  setIsAdmin(false);
                  sessionStorage.removeItem('adminToken');
                  localStorage.removeItem('adminToken');
                }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                </svg>
                Admin Mode (Logout)
              </button>
            ) : (
              <button
                className="btn-auth"
                id="btn-admin-login"
                onClick={() => setActiveModal('admin-login')}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Admin Login
              </button>
            )}
          </div>
        }
      />

      {/* Live update cross-tab toast */}
      <LiveUpdateToast
        event={lastUpdatedEvent}
        onClose={clearLastUpdatedEvent}
        onSelectDate={(d) => handleSelectDate(d)}
      />

      <div className="calendar-workspace">
        {/* Left Sidebar */}
        <CalendarSidebar
          filters={filters}
          onToggleFilter={toggleFilter}
          tbdChildren={
            <TbdDrives
              events={events}
              filters={filters}
              isAdmin={isAdmin}
              isEventsFetched={isEventsFetched}
              onAddTbd={() => {
                setCreateDate('TBD');
                setActiveModal('create');
              }}
              onEventClick={handleEventClick}
              onScheduleEvent={(ev) => {
                setModalEvent(ev);
                setActiveModal('schedule');
              }}
              onEditEvent={(ev) => {
                setModalEvent(ev);
                setActiveModal('edit');
              }}
              onDeleteEvent={handleDeleteEvent}
            />
          }
        />

        {/* Main Calendar Desk */}
        <main className="calendar-main">
          <CalendarToolbar
            currentDate={currentCalendarDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
            onSyncRefresh={handleSyncRefresh}
            isSyncing={isSyncing}
            onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
            isSearchActive={isSearchOpen}
            onSubscribeClick={() => setActiveModal('subscribe')}
          />

          <CompanySearch
            isOpen={isSearchOpen}
            events={events}
            onClose={() => setIsSearchOpen(false)}
            onSelectEvent={(ev) => {
              if (ev.date && ev.date !== 'TBD') {
                handleSelectDate(ev.date);
              }
              handleEventClick(ev);
            }}
          />

          <CalendarGrid
            currentCalendarDate={currentCalendarDate}
            selectedCalendarDate={selectedCalendarDate}
            isAdmin={isAdmin}
            events={events}
            filters={filters}
            onSelectDate={handleCellClick}
            onEventClick={handleEventClick}
          />

          <AgendaView
            selectedCalendarDate={selectedCalendarDate}
            isAdmin={isAdmin}
            events={events}
            filters={filters}
            isEventsFetched={isEventsFetched}
            onAddEvent={() => {
              setCreateDate(formatLocalDate(selectedCalendarDate));
              setActiveModal('create');
            }}
            onAIPost={() => setActiveModal('ai-post')}
            onEventClick={handleEventClick}
            onEditEvent={(ev) => {
              setModalEvent(ev);
              setActiveModal('edit');
            }}
            onDeleteEvent={handleDeleteEvent}
          />
        </main>
      </div>

      {/* Reusable Modal Layer */}
      <Modal isOpen={!!activeModal} onClose={closeModal}>
        {activeModal === 'detail-visitor' && (
          <EventDetailModal event={modalEvent} onClose={closeModal} />
        )}

        {activeModal === 'detail-admin' && (
          <EventDetailAdminModal
            event={modalEvent}
            onClose={closeModal}
            onSchedule={(ev) => {
              setModalEvent(ev);
              setActiveModal('schedule');
            }}
            onEdit={(ev) => {
              setModalEvent(ev);
              setActiveModal('edit');
            }}
            onDelete={handleDeleteEvent}
          />
        )}

        {activeModal === 'edit' && (
          <EditEventModal
            event={modalEvent}
            onClose={closeModal}
            onSaved={async (updated) => {
              await updateEvent(updated);
            }}
            onCancelToDetail={() => setActiveModal(isAdmin ? 'detail-admin' : 'detail-visitor')}
          />
        )}

        {activeModal === 'create' && (
          <CreateEventModal
            defaultDate={createDate}
            onClose={closeModal}
            onCreated={async (newEvent) => {
              await createEvent(newEvent);
              if (newEvent.date && newEvent.date !== 'TBD') {
                handleSelectDate(newEvent.date);
              }
            }}
          />
        )}

        {activeModal === 'schedule' && (
          <ScheduleRoundsModal
            event={modalEvent}
            onClose={closeModal}
            onScheduled={() => {
              fetchEvents();
            }}
          />
        )}

        {activeModal === 'ai-post' && (
          <AIPostModal
            onClose={closeModal}
            onParsed={(parsed) => {
              setAiParsedEvents(parsed);
              setActiveModal('ai-preview');
            }}
          />
        )}

        {activeModal === 'ai-preview' && (
          <AIPreviewModal
            initialEvents={aiParsedEvents}
            onClose={closeModal}
            onBack={() => setActiveModal('ai-post')}
            onConfirmed={async (created) => {
              for (const ev of created) {
                await createEvent(ev);
              }
            }}
          />
        )}

        {activeModal === 'admin-login' && (
          <AdminLoginModal
            onClose={closeModal}
            onAuthenticated={() => {
              setIsAdmin(true);
            }}
          />
        )}

        {activeModal === 'subscribe' && <SubscribeModal onClose={closeModal} />}
      </Modal>
    </div>
  );
}
