import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProfileImage from '../components/ProfileImage';

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [filter, setFilter] = useState('all');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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
          const birthDate = new Date(member.birth_date);
          calendarEvents.push({
            type: 'birthday',
            date: birthDate,
            month: birthDate.getMonth(),
            day: birthDate.getDate(),
            year: birthDate.getFullYear(),
            description: `${fullName}'s Birthday`,
            subtitle: `Born ${birthDate.getFullYear()}`,
            member: member,
            memberId: member.id,
            memberName: fullName
          });
        }

        // Anniversary events
        if (member.is_married && member.marriage_date && member.spouse_id) {
          const spouse = members.find(m => m.id === member.spouse_id);
          
          // Only create one anniversary per couple (like we did with timeline)
          if (!spouse || member.id < spouse.id) {
            const marriageDate = new Date(member.marriage_date);
            const spouseName = spouse ? `${spouse.first_name} ${spouse.last_name}` : 'Unknown spouse';
            
            calendarEvents.push({
              type: 'anniversary',
              date: marriageDate,
              month: marriageDate.getMonth(),
              day: marriageDate.getDate(),
              year: marriageDate.getFullYear(),
              description: `${fullName} & ${spouseName}`,
              subtitle: `Anniversary (${marriageDate.getFullYear()})`,
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

  // Filter events based on current filter and month/year
  const filteredEvents = events.filter(event => {
    const matchesFilter = filter === 'all' || event.type === filter;
    const matchesMonth = event.month === currentMonth;
    return matchesFilter && matchesMonth;
  });

  // Get upcoming events (next 30 days)
  const getUpcomingEvents = () => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    return events.filter(event => {
      // Create this year's version of the event
      const thisYearEvent = new Date(currentYear, event.month, event.day);
      return thisYearEvent >= today && thisYearEvent <= thirtyDaysFromNow;
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

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  // Generate calendar grid
  const generateCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const grid = [];

    // Add empty cells for days before the first day
    for (let i = 0; i < firstDay; i++) {
      grid.push(null);
    }

    // Add all days of the month
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

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="absolute inset-0 opacity-30">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="calendar-pattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                <rect x="10" y="10" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1" className="text-blue-200" />
                <line x1="15" y1="5" x2="15" y2="15" stroke="currentColor" strokeWidth="1" className="text-purple-200" />
                <line x1="35" y1="5" x2="35" y2="15" stroke="currentColor" strokeWidth="1" className="text-purple-200" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#calendar-pattern)" />
          </svg>
        </div>

        <div className="relative z-10 flex justify-center items-center h-64">
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
            <div className="text-xl bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent font-semibold">
              Loading calendar...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="relative z-10 text-center text-red-600 mt-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-xl max-w-md mx-auto">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2 bg-gradient-to-r from-red-700 to-pink-700 bg-clip-text text-transparent">
              Error Loading Calendar
            </h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const calendarGrid = generateCalendarGrid();
  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="family-calendar-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <rect x="10" y="10" width="40" height="30" fill="none" stroke="currentColor" strokeWidth="1" className="text-blue-200" />
              <line x1="20" y1="5" x2="20" y2="15" stroke="currentColor" strokeWidth="1" className="text-purple-200" />
              <line x1="40" y1="5" x2="40" y2="15" stroke="currentColor" strokeWidth="1" className="text-purple-200" />
              <circle cx="25" cy="25" r="2" fill="currentColor" className="text-pink-200" />
              <circle cx="35" cy="30" r="2" fill="currentColor" className="text-green-200" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#family-calendar-pattern)" />
        </svg>
      </div>

      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-full blur-xl"></div>
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-bl from-blue-200/30 to-cyan-200/30 rounded-full blur-xl"></div>
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-80 h-40 bg-gradient-to-t from-purple-200/30 to-pink-200/30 rounded-full blur-xl"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full px-4 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-xl max-w-xl mx-auto relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <span className="text-6xl font-black text-gray-400 transform rotate-12">CALENDAR</span>
            </div>

            <div className="relative z-10 flex items-center justify-center mb-2">
              <div className="mr-3">
                <svg width="32" height="32" viewBox="0 0 32 32" className="text-purple-600">
                  <defs>
                    <linearGradient id="calendarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="50%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  <rect x="6" y="8" width="20" height="18" rx="2" fill="url(#calendarGradient)" />
                  <rect x="6" y="8" width="20" height="6" rx="2" fill="url(#calendarGradient)" />
                  <line x1="10" y1="4" x2="10" y2="12" stroke="url(#calendarGradient)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="22" y1="4" x2="22" y2="12" stroke="url(#calendarGradient)" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="18" r="1.5" fill="white" />
                  <circle cx="20" cy="22" r="1.5" fill="white" />
                </svg>
              </div>

              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-700 via-blue-700 to-cyan-700 bg-clip-text text-transparent drop-shadow-sm">
                Family Calendar
              </h1>
            </div>

            <p className="text-gray-600 text-base font-medium relative z-10">
              Birthdays, anniversaries, and special family moments
            </p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex justify-center items-center gap-3 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-white/50 shadow-xl">
            <div className="inline-flex rounded-lg shadow-sm">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-xs font-medium rounded-l-lg transition-all ${filter === 'all'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                  : 'bg-white/60 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50'
                  } border border-white/50`}
              >
                📅 All Events
              </button>
              <button
                onClick={() => setFilter('birthday')}
                className={`px-4 py-2 text-xs font-medium transition-all ${filter === 'birthday'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg transform scale-105'
                  : 'bg-white/60 text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50'
                  } border-t border-b border-white/50`}
              >
                🎂 Birthdays
              </button>
              <button
                onClick={() => setFilter('anniversary')}
                className={`px-4 py-2 text-xs font-medium rounded-r-lg transition-all ${filter === 'anniversary'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg transform scale-105'
                  : 'bg-white/60 text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50'
                  } border border-white/50`}
              >
                💍 Anniversaries
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-white/50 shadow-xl overflow-hidden">
              {/* Calendar Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={previousMonth}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <h2 className="text-xl font-bold">
                    {months[currentMonth]} {currentYear}
                  </h2>
                  
                  <button
                    onClick={nextMonth}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Days of week header */}
              <div className="grid grid-cols-7 bg-gray-50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-3 text-center font-semibold text-gray-600 border-b">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {calendarGrid.map((cell, index) => (
                  <div key={index} className="h-24 border-b border-r border-gray-200 p-1">
                    {cell && (
                      <>
                        <div className="font-semibold text-gray-800 mb-1">{cell.day}</div>
                        <div className="space-y-1">
                          {cell.events.slice(0, 2).map((event, eventIndex) => (
                            <div
                              key={eventIndex}
                              className={`text-xs px-2 py-1 rounded text-white truncate ${
                                event.type === 'birthday' 
                                  ? 'bg-green-500' 
                                  : 'bg-pink-500'
                              }`}
                              title={event.description}
                            >
                              {event.type === 'birthday' ? '🎂' : '💍'} {event.member.first_name}
                            </div>
                          ))}
                          {cell.events.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{cell.events.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Events Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Events */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-white/50 shadow-xl p-6">
              <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">
                🎉 Upcoming Events
              </h3>
              
              {upcomingEvents.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No upcoming events in the next 30 days</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.slice(0, 5).map((event, index) => (
                    <div key={index} className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                      <div className="mr-3">
                        <ProfileImage
                          member={event.member}
                          size="w-10 h-10"
                          className="border-2 border-white shadow-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{event.description}</div>
                        <div className="text-sm text-gray-600">{event.subtitle}</div>
                        <div className="text-xs text-gray-500">
                          {months[event.month]} {event.day}
                        </div>
                      </div>
                      <div className={`text-lg ${event.type === 'birthday' ? 'text-green-500' : 'text-pink-500'}`}>
                        {event.type === 'birthday' ? '🎂' : '💍'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick stats */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-white/50 shadow-xl p-6">
              <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">
                📊 This Month
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">🎂 Birthdays</span>
                  <span className="font-bold text-green-600">
                    {filteredEvents.filter(e => e.type === 'birthday').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">💍 Anniversaries</span>
                  <span className="font-bold text-pink-600">
                    {filteredEvents.filter(e => e.type === 'anniversary').length}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-semibold">Total Events</span>
                    <span className="font-bold text-blue-600">
                      {filteredEvents.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;