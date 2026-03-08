import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProfileImage from '../components/ProfileImage';

// Custom SVG: Birthday candle icon
const BirthdayCandleIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C12 2 10 5 10 6.5C10 7.88 11.12 9 12.5 9C12.5 9 12 9 12 9C13 9 14 7.88 14 6.5C14 5 12 2 12 2Z" fill="currentColor" opacity="0.8"/>
    <rect x="11" y="9" width="2" height="4" rx="0.5" fill="currentColor"/>
    <rect x="8" y="13" width="8" height="8" rx="2" fill="currentColor" opacity="0.6"/>
    <rect x="8" y="13" width="8" height="2" rx="0.5" fill="currentColor" opacity="0.8"/>
  </svg>
);

// Custom SVG: Fleur-de-lis icon (anniversary / NOLA roots)
const FleurDeLisIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C12 2 9.5 5.5 9.5 8C9.5 9.8 10.5 11 12 11.5C13.5 11 14.5 9.8 14.5 8C14.5 5.5 12 2 12 2Z" opacity="0.9"/>
    <path d="M5 10C5 10 3 12.5 4 14.5C4.8 16 6.5 16.5 8 16C8 16 7 14.5 7.5 13C8 11.5 9.5 11 9.5 11C7.5 11 5 10 5 10Z" opacity="0.7"/>
    <path d="M19 10C19 10 21 12.5 20 14.5C19.2 16 17.5 16.5 16 16C16 16 17 14.5 16.5 13C16 11.5 14.5 11 14.5 11C16.5 11 19 10 19 10Z" opacity="0.7"/>
    <path d="M12 12V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M9 18H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
  </svg>
);

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [spotlightEvent, setSpotlightEvent] = useState(null);

  // Close spotlight on Escape key
  const closeSpotlight = useCallback(() => setSpotlightEvent(null), []);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeSpotlight();
    };
    if (spotlightEvent) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [spotlightEvent, closeSpotlight]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API}/api/members`);
      const members = response.data;

      const calendarEvents = [];

      members.forEach(member => {
        const fullName = `${member.first_name} ${member.last_name}`;

        // Birthday events
        if (member.birth_date) {
          const birthDateStr = member.birth_date.split('T')[0];
          const [year, month, day] = birthDateStr.split('-').map(Number);
          const birthDate = new Date(year, month - 1, day);
          const isDeceased = member.is_alive === false;
          const deathYear = member.death_date ? Number(member.death_date.split('T')[0].split('-')[0]) : null;

          calendarEvents.push({
            type: 'birthday',
            date: birthDate,
            month: birthDate.getMonth(),
            day: birthDate.getDate(),
            year: birthDate.getFullYear(),
            description: `${fullName}'s Birthday`,
            subtitle: isDeceased ? `${year} – ${deathYear || '?'}` : `Born ${year}`,
            member: member,
            memberId: member.id,
            memberName: fullName,
            isDeceased,
            deathYear
          });
        }

        // Anniversary events
        if (member.is_married && member.marriage_date && member.spouse_id) {
          const spouse = members.find(m => m.id === member.spouse_id);

          if (!spouse || member.id < spouse.id) {
            const marriageDateStr = member.marriage_date.split('T')[0];
            const [year, month, day] = marriageDateStr.split('-').map(Number);
            const marriageDate = new Date(year, month - 1, day);
            const spouseName = spouse ? `${spouse.first_name} ${spouse.last_name}` : 'Unknown spouse';

            calendarEvents.push({
              type: 'anniversary',
              date: marriageDate,
              month: marriageDate.getMonth(),
              day: marriageDate.getDate(),
              year: marriageDate.getFullYear(),
              description: `${fullName} & ${spouseName}`,
              subtitle: `Anniversary (${year})`,
              member: member,
              spouse: spouse,
              memberId: member.id,
              memberName: fullName,
              spouseName: spouseName
            });
          }
        }
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      setError('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate turning age for birthday events
  const getTurningAge = (event) => {
    if (event.type !== 'birthday') return null;
    return currentYear - event.year;
  };

  // Calculate anniversary years
  const getAnniversaryYears = (event) => {
    if (event.type !== 'anniversary') return null;
    return currentYear - event.year;
  };

  // Filter events for current month
  const filteredEvents = events.filter(event => event.month === currentMonth);

  // Get upcoming events (next 30 days)
  const getUpcomingEvents = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    return events.filter(event => {
      const thisYearEvent = new Date(currentYear, event.month, event.day);
      return thisYearEvent >= now && thisYearEvent <= thirtyDaysFromNow;
    }).sort((a, b) => {
      const aDate = new Date(currentYear, a.month, a.day);
      const bDate = new Date(currentYear, b.month, b.day);
      return aDate - bDate;
    });
  };

  // Get days in month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday)
  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  // Check if a day is today
  const isToday = (day) => {
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  // Generate calendar grid
  const generateCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const grid = [];

    for (let i = 0; i < firstDay; i++) {
      grid.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = filteredEvents.filter(event => event.day === day);
      grid.push({ day, events: dayEvents });
    }

    return grid;
  };

  const previousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-transparent">
        <div className="relative z-10 flex justify-center items-center h-64">
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-vine-500 border-t-transparent mx-auto mb-4"></div>
            <div className="text-xl bg-gradient-to-r from-vine-600 to-vine-dark bg-clip-text text-transparent font-semibold font-heading">
              Loading Heritage Almanac...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-transparent">
        <div className="relative z-10 text-center text-red-600 mt-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-xl max-w-md mx-auto">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2 text-red-700 font-heading">
              Error Loading Almanac
            </h2>
            <p className="text-vine-sage">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const calendarGrid = generateCalendarGrid();
  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      {/* Subtle decorative blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-purple-200/10 to-vine-200/10 rounded-full blur-xl"></div>
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-bl from-amber-100/10 to-vine-100/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-80 h-40 bg-gradient-to-t from-vine-200/10 to-transparent rounded-full blur-xl"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full px-4 py-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <div className="almanac-container">
              {/* Gilded Vellum Header */}
              <div className="calendar-header-vellum">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                  <button
                    onClick={previousMonth}
                    className="nav-arrow"
                    aria-label="Previous month"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  <h2 className="calendar-header-title">
                    {months[currentMonth]} <span className="font-light opacity-50">{currentYear}</span>
                  </h2>

                  <button
                    onClick={nextMonth}
                    className="nav-arrow"
                    aria-label="Next month"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>

                <p className="mt-0.5 tracking-widest uppercase" style={{ fontFamily: 'var(--font-body)', color: 'var(--vine-sage)', fontSize: '0.55rem', letterSpacing: '1.5px' }}>
                  Heritage Almanac
                </p>

                {/* Return to Today */}
                {(currentMonth !== today.getMonth() || currentYear !== today.getFullYear()) && (
                  <div className="flex justify-center mt-2">
                    <button
                      onClick={goToToday}
                      className="text-xs px-3 py-1 rounded-full border transition-all"
                      style={{
                        fontFamily: 'var(--font-body)',
                        color: 'var(--vine-green)',
                        borderColor: 'rgba(46, 90, 46, 0.25)',
                      }}
                      onMouseEnter={e => { e.target.style.borderColor = 'var(--gold-accent)'; e.target.style.color = 'var(--gold-accent)'; }}
                      onMouseLeave={e => { e.target.style.borderColor = 'rgba(46, 90, 46, 0.25)'; e.target.style.color = 'var(--vine-green)'; }}
                    >
                      Return to Today
                    </button>
                  </div>
                )}
              </div>

              {/* Days of week header */}
              <div className="grid grid-cols-7 bg-vine-50 dark:bg-gray-800">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-3 text-center text-xs font-semibold text-vine-sage dark:text-gray-400 uppercase tracking-wider border-b border-vine-200/50 dark:border-gray-700">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 bg-white/50 dark:bg-gray-800/50">
                {calendarGrid.map((cell, index) => {
                  const isTodayCell = cell && isToday(cell.day);
                  const hasEvents = cell && cell.events.length > 0;

                  return (
                    <div
                      key={index}
                      className={`
                        h-[5.6rem] border-b border-r border-vine-200/40 dark:border-gray-700/50 p-1.5 relative
                        transition-colors duration-200
                        ${!cell ? 'bg-vine-50/30 dark:bg-gray-900/20' : ''}
                        ${isTodayCell ? 'almanac-today' : ''}
                        ${hasEvents && !isTodayCell ? 'almanac-event-day' : ''}
                      `}
                    >
                      {cell && (
                        <>
                          {/* Day number */}
                          <div className={`
                            text-sm font-medium mb-1
                            ${isTodayCell
                              ? 'font-bold'
                              : hasEvents
                                ? 'text-vine-dark dark:text-white font-semibold'
                                : 'text-vine-sage/70 dark:text-gray-500'
                            }
                          `}>
                            {isTodayCell ? (
                              <span className="almanac-today-number">
                                {cell.day}
                              </span>
                            ) : (
                              cell.day
                            )}
                          </div>

                          {/* Event avatar pips — click to open spotlight */}
                          <div className="flex flex-wrap gap-1">
                            {cell.events.slice(0, 4).map((event, eventIndex) => (
                              <button
                                key={eventIndex}
                                type="button"
                                className={`almanac-avatar-pip relative rounded-full ${
                                  event.type === 'birthday' ? 'pip-birthday' : 'pip-anniversary'
                                }${event.isDeceased ? ' pip-deceased' : ''}`}
                                title={`${event.description}${event.type === 'birthday' ? (event.isDeceased ? ` - Remembered ${getTurningAge(event)} years` : ` - Turning ${getTurningAge(event)}`) : ` - ${getAnniversaryYears(event)} years`}`}
                                onClick={() => setSpotlightEvent(event)}
                              >
                                <ProfileImage
                                  member={event.member}
                                  size="w-7 h-7"
                                  className="rounded-full"
                                />
                              </button>
                            ))}
                            {cell.events.length > 4 && (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-vine-100 dark:bg-gray-700 text-xs font-medium text-vine-600 dark:text-gray-300 border-2 border-vine-200/50 dark:border-gray-600">
                                +{cell.events.length - 4}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer legend */}
              <div className="flex items-center justify-center gap-6 py-3 bg-vine-50/50 dark:bg-gray-800/50 border-t border-vine-200/30 dark:border-gray-700/30">
                <span className="flex items-center gap-1.5 text-xs text-vine-sage dark:text-gray-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-vine-500" />
                  Birthday
                </span>
                <span className="flex items-center gap-1.5 text-xs text-vine-sage dark:text-gray-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  Anniversary
                </span>
                <span className="flex items-center gap-1.5 text-xs text-vine-sage dark:text-gray-400">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 text-[9px] font-bold" style={{ borderColor: 'var(--gold-accent)', color: '#8B6914', background: 'rgba(212, 160, 23, 0.08)' }}>{today.getDate()}</span>
                  Today
                </span>
              </div>
            </div>
          </div>

          {/* Legacy Timeline Sidebar */}
          <div className="space-y-6">

            {/* Family Almanac - Upcoming Events */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl border border-white/50 dark:border-gray-700 shadow-xl p-6">
              <h3 className="text-lg font-bold mb-1 text-vine-dark dark:text-white font-heading">
                Family Almanac
              </h3>
              <p className="text-xs text-vine-sage dark:text-gray-400 mb-5">
                Upcoming celebrations in the next 30 days
              </p>

              {upcomingEvents.length === 0 ? (
                <div className="text-center py-6">
                  <FleurDeLisIcon className="w-10 h-10 text-vine-200 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-vine-sage dark:text-gray-400 text-sm">No upcoming events in the next 30 days</p>
                </div>
              ) : (
                <div className="almanac-vine">
                  {upcomingEvents.slice(0, 8).map((event, index) => {
                    const turningAge = getTurningAge(event);
                    const anniversaryYears = getAnniversaryYears(event);

                    return (
                      <div
                        key={index}
                        className={`almanac-vine-node ${event.type === 'anniversary' ? 'anniversary' : ''} mb-5 last:mb-0`}
                      >
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-vine-50/80 to-transparent dark:from-gray-700/50 dark:to-transparent hover:from-vine-100/80 dark:hover:from-gray-700/80 transition-colors">
                          {/* Avatar */}
                          <Link to={`/members/${event.memberId}`} className="flex-shrink-0">
                            <ProfileImage
                              member={event.member}
                              size="w-10 h-10"
                              className="border-2 border-white dark:border-gray-600 shadow-sm rounded-full"
                            />
                          </Link>

                          {/* Event info */}
                          <div className="flex-1 min-w-0">
                            {event.type === 'anniversary' ? (
                              <div className="text-xs font-semibold text-vine-dark dark:text-white" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                <Link
                                  to={`/members/${event.memberId}`}
                                  className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                >
                                  {event.memberName}
                                </Link>
                                <span className="text-vine-sage dark:text-gray-400 mx-1">&amp;</span>
                                {event.spouse && (
                                  <Link
                                    to={`/members/${event.spouse.id}`}
                                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                  >
                                    {event.spouseName}
                                  </Link>
                                )}
                              </div>
                            ) : (
                              <Link
                                to={`/members/${event.memberId}`}
                                className="text-xs font-semibold text-vine-dark dark:text-white hover:text-vine-600 dark:hover:text-vine-400 transition-colors block"
                                style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
                              >
                                {event.memberName}
                                {turningAge !== null && (
                                  <span className="text-vine-sage dark:text-gray-400 font-normal"> - Turning {turningAge}</span>
                                )}
                              </Link>
                            )}

                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-vine-sage dark:text-gray-400">
                                {months[event.month]} {event.day}
                              </span>
                              {event.type === 'anniversary' && anniversaryYears !== null && (
                                <span className="text-xs text-purple-500 dark:text-purple-400 font-medium">
                                  {anniversaryYears} years
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Custom icon - anniversaries only */}
                          {event.type === 'anniversary' && (
                            <div className="flex-shrink-0">
                              <FleurDeLisIcon className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* This Month Stats */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl border border-white/50 dark:border-gray-700 shadow-xl p-6">
              <h3 className="text-lg font-bold mb-4 text-vine-dark dark:text-white font-heading">
                {months[currentMonth]} Overview
              </h3>

              <div className="space-y-4">
                {/* Birthdays count */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BirthdayCandleIcon className="w-4 h-4 text-vine-500" />
                    <span className="text-sm text-vine-sage dark:text-gray-400">Birthdays</span>
                  </div>
                  <span className="text-lg font-bold text-vine-600 dark:text-vine-400">
                    {filteredEvents.filter(e => e.type === 'birthday').length}
                  </span>
                </div>

                {/* Anniversaries count */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FleurDeLisIcon className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-vine-sage dark:text-gray-400">Anniversaries</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {filteredEvents.filter(e => e.type === 'anniversary').length}
                  </span>
                </div>

                {/* Divider + Total */}
                <div className="border-t border-vine-200 dark:border-gray-700 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-vine-dark dark:text-white">Total Celebrations</span>
                    <span className="text-lg font-bold bg-gradient-to-r from-vine-600 to-purple-600 bg-clip-text text-transparent">
                      {filteredEvents.length}
                    </span>
                  </div>
                </div>

                {/* Next upcoming event teaser */}
                {upcomingEvents.length > 0 && (
                  <div className="mt-2 pt-3 border-t border-vine-200/50 dark:border-gray-700/50">
                    <p className="text-xs text-vine-sage dark:text-gray-500 mb-1">Next up:</p>
                    <Link
                      to={`/members/${upcomingEvents[0].memberId}`}
                      className="text-sm font-medium text-vine-dark dark:text-white hover:text-vine-600 dark:hover:text-vine-400 transition-colors"
                    >
                      {upcomingEvents[0].description}
                    </Link>
                    <p className="text-xs text-vine-sage dark:text-gray-400">
                      {months[upcomingEvents[0].month]} {upcomingEvents[0].day}
                      {upcomingEvents[0].type === 'birthday' && (upcomingEvents[0].isDeceased ? ` - Remembered ${getTurningAge(upcomingEvents[0])} years` : ` - Turning ${getTurningAge(upcomingEvents[0])}`)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Birthday / Anniversary Spotlight Modal */}
      {spotlightEvent && (
        <div
          className="spotlight-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) closeSpotlight(); }}
          role="dialog"
          aria-modal="true"
          aria-label={`${spotlightEvent.description} spotlight`}
        >
          <div className="spotlight-card">
            {/* Close button */}
            <button className="spotlight-close" onClick={closeSpotlight} aria-label="Close spotlight">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Member photo */}
            <div className="flex justify-center mb-4">
              <ProfileImage
                member={spotlightEvent.member}
                size="w-[120px] h-[120px]"
                className="spotlight-photo"
              />
            </div>

            {/* Name */}
            <h3 className="text-xl font-bold text-vine-dark dark:text-white mb-1" style={{ fontFamily: 'var(--font-header)' }}>
              {spotlightEvent.memberName}
              {spotlightEvent.type === 'anniversary' && spotlightEvent.spouseName && (
                <span className="text-vine-sage dark:text-gray-400 font-normal"> & {spotlightEvent.spouseName}</span>
              )}
            </h3>

            {/* Celebration detail */}
            <p className="text-sm mb-1" style={{ color: spotlightEvent.isDeceased ? 'var(--vine-sage)' : 'var(--gold-accent)' }}>
              {spotlightEvent.type === 'birthday' ? (
                spotlightEvent.isDeceased ? (
                  <>Remembered for <strong>{getTurningAge(spotlightEvent)}</strong> Years</>
                ) : (
                  <>Celebrating <strong>{getTurningAge(spotlightEvent)}</strong> Years</>
                )
              ) : (
                <>{getAnniversaryYears(spotlightEvent)} Years Together</>
              )}
            </p>

            {/* Date */}
            <p className="text-xs text-vine-sage dark:text-gray-400 mb-4">
              {months[spotlightEvent.month]} {spotlightEvent.day}
              {spotlightEvent.type === 'birthday'
                ? spotlightEvent.isDeceased
                  ? ` \u2022 ${spotlightEvent.year} – ${spotlightEvent.deathYear || '?'}`
                  : ` \u2022 Born ${spotlightEvent.year}`
                : ` \u2022 Married ${spotlightEvent.year}`}
            </p>

            {/* Bio snippet (if member has notes or bio) */}
            {spotlightEvent.member.bio && (
              <p className="text-sm text-vine-sage dark:text-gray-400 mb-4 line-clamp-3 italic" style={{ fontFamily: 'var(--font-body)' }}>
                "{spotlightEvent.member.bio}"
              </p>
            )}

            {/* Type icon */}
            <div className="flex justify-center mb-4">
              {spotlightEvent.type === 'birthday' ? (
                spotlightEvent.isDeceased ? (
                  <svg className="w-6 h-6 text-vine-sage dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3c0 1.66 3 3 3 3s3-1.34 3-3a3 3 0 0 0-3-3z" />
                    <path d="M12 8v4" />
                    <path d="M6.5 14h11a1 1 0 0 1 1 1v1a3 3 0 0 1-3 3h-7a3 3 0 0 1-3-3v-1a1 1 0 0 1 1-1z" />
                    <path d="M8 22h8" />
                    <path d="M12 19v3" />
                  </svg>
                ) : (
                  <BirthdayCandleIcon className="w-6 h-6 text-vine-500 dark:text-vine-400" />
                )
              ) : (
                <FleurDeLisIcon className="w-6 h-6 text-purple-500 dark:text-purple-400" />
              )}
            </div>

            {/* View Full Archive */}
            <Link
              to={`/members/${spotlightEvent.memberId}`}
              onClick={closeSpotlight}
              className="inline-block px-5 py-2 text-sm font-medium rounded-full transition-all"
              style={{
                fontFamily: 'var(--font-body)',
                color: '#fffdf9',
                background: 'linear-gradient(135deg, var(--vine-green), var(--vine-dark))',
                boxShadow: '0 2px 8px rgba(45, 79, 30, 0.25)',
              }}
              onMouseEnter={e => { e.target.style.boxShadow = '0 4px 14px rgba(45, 79, 30, 0.35)'; e.target.style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { e.target.style.boxShadow = '0 2px 8px rgba(45, 79, 30, 0.25)'; e.target.style.transform = 'scale(1)'; }}
            >
              View Full Archive
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
