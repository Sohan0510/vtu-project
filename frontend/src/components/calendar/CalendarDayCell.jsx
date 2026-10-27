import React from 'react';
import EventPill from './EventPill.jsx';

export default function CalendarDayCell({
  day,
  isCurrentMonth,
  isPrevMonth,
  isNextMonth,
  isToday,
  isSelected,
  isAdmin,
  events,
  dateStr,
  onSelectDate,
  onEventClick,
}) {
  let cellClass = 'calendar-day-cell';
  if (isPrevMonth) cellClass += ' prev-month';
  if (isNextMonth) cellClass += ' next-month';
  if (isToday) cellClass += ' today';
  if (isSelected) cellClass += ' selected-day';
  if (isAdmin) cellClass += ' admin-active';

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const isVerySmall = typeof window !== 'undefined' && window.innerWidth < 480;
  const maxVisible = isMobile && isVerySmall ? 1 : 2;
  const visibleEvents = events ? events.slice(0, maxVisible) : [];
  const extraCount = events ? events.length - maxVisible : 0;

  return (
    <div
      className={cellClass}
      onClick={() => {
        if (isCurrentMonth) {
          onSelectDate(dateStr);
        }
      }}
    >
      <span className="day-number">{day}</span>
      {isCurrentMonth && events && events.length > 0 && (
        <div className="day-events">
          {visibleEvents.map((ev) => (
            <EventPill key={ev.id} event={ev} onClick={onEventClick} />
          ))}
          {extraCount > 0 && (
            <div className="calendar-event-more">+{extraCount} more</div>
          )}
        </div>
      )}
    </div>
  );
}
