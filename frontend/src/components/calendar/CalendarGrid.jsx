import React, { useEffect, useRef } from 'react';
import CalendarDayCell from './CalendarDayCell.jsx';

function getMonthData(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  return { firstDay, daysInMonth, daysInPrevMonth };
}

export default function CalendarGrid({
  currentCalendarDate,
  selectedCalendarDate,
  isAdmin,
  events,
  filters,
  onSelectDate,
  onEventClick,
}) {
  const scrollWrapperRef = useRef(null);
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const today = new Date();

  const { firstDay, daysInMonth, daysInPrevMonth } = getMonthData(year, month);

  // Auto-scroll to today on initial mount
  useEffect(() => {
    if (scrollWrapperRef.current && window.innerWidth <= 768) {
      const todayCell = scrollWrapperRef.current.querySelector('.today');
      if (todayCell) {
        todayCell.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, []);

  const cells = [];

  // Prev month filler cells
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push(
      <CalendarDayCell
        key={`prev-${i}`}
        day={daysInPrevMonth - i}
        isPrevMonth={true}
        isCurrentMonth={false}
      />
    );
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday =
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();
    const isSelected =
      d === selectedCalendarDate.getDate() &&
      month === selectedCalendarDate.getMonth() &&
      year === selectedCalendarDate.getFullYear();

    // Filter events for this day
    const dayEvents = (events || []).filter((ev) => {
      if (ev.date !== dateStr) return false;
      if (!filters[ev.type]) return false;
      if (ev.mode === 'online' && !filters.online) return false;
      if (ev.mode === 'offline' && !filters.offline) return false;

      const isRVCE = ev.location === 'rvce' || ev.location === 'offcampus';
      const isRVITM = ev.location === 'rvitm' || ev.location === 'oncampus';
      const isWorksite = ev.location === 'worksite';

      if (isRVCE && !filters.oncampus) return false;
      if (isRVITM && !filters.offcampus) return false;
      if (isWorksite && !filters.worksite) return false;
      return true;
    });

    cells.push(
      <CalendarDayCell
        key={`curr-${d}`}
        day={d}
        isCurrentMonth={true}
        isToday={isToday}
        isSelected={isSelected}
        isAdmin={isAdmin}
        events={dayEvents}
        dateStr={dateStr}
        onSelectDate={onSelectDate}
        onEventClick={onEventClick}
      />
    );
  }

  // Next month filler cells
  const remainingCells = 42 - (firstDay + daysInMonth);
  for (let d = 1; d <= remainingCells; d++) {
    cells.push(
      <CalendarDayCell
        key={`next-${d}`}
        day={d}
        isNextMonth={true}
        isCurrentMonth={false}
      />
    );
  }

  return (
    <div className="calendar-grid-scroll-wrapper" ref={scrollWrapperRef}>
      <div className="calendar-grid-header">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>
      <div className="calendar-grid-body" id="calendar-days-grid">
        {cells}
      </div>
    </div>
  );
}
