import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProfileImage from '../components/ProfileImage';

const TimelinePage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTimelineData();
  }, []);

  const filteredEvents = filter === 'all'
    ? events
    : events.filter(event => event.type === filter);

  const groupedByDecade = filteredEvents.reduce((groups, event) => {
    const decade = Math.floor(event.year / 10) * 10;
    if (!groups[decade]) {
      groups[decade] = [];
    }
    groups[decade].push(event);
    return groups;
  }, {});

  const decades = Object.keys(groupedByDecade)
    .map(Number)
    .sort((a, b) => a - b);

  const fetchTimelineData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API}/api/members`);
      const members = response.data;

      const timelineEvents = [];

      members.forEach(member => {
        const fullName = `${member.first_name} ${member.last_name}`;

        // Birth events
        if (member.birth_date) {
          timelineEvents.push({
            type: 'birth',
            date: new Date(member.birth_date),
            year: new Date(member.birth_date).getFullYear(),
            description: `${fullName} was born`,
            location: member.birth_place || 'Unknown location',
            memberId: member.id,
            memberName: fullName,
            member: member
          });
        }

        // Death events
        if (member.death_date) {
          timelineEvents.push({
            type: 'death',
            date: new Date(member.death_date),
            year: new Date(member.death_date).getFullYear(),
            description: `${fullName} passed away`,
            location: member.death_place || 'Unknown location',
            memberId: member.id,
            memberName: fullName,
            member: member
          });
        }

        // NEW: Marriage events (avoid duplicates by only creating for the person with lower ID)
        if (member.is_married && member.marriage_date && member.spouse_id) {
          // Find the spouse's information
          const spouse = members.find(m => m.id === member.spouse_id);
          
          // Only create the marriage event if this member has a lower ID than their spouse
          // This prevents duplicate marriage events for the same couple
          if (!spouse || member.id < spouse.id) {
            const spouseName = spouse ? `${spouse.first_name} ${spouse.last_name}` : 'Unknown spouse';

            timelineEvents.push({
              type: 'marriage',
              date: new Date(member.marriage_date),
              year: new Date(member.marriage_date).getFullYear(),
              description: `${fullName} married ${spouseName}`,
              location: 'Unknown location', // We could add a marriage_place field later
              memberId: member.id,
              memberName: fullName,
              member: member,
              spouse: spouse, // Store spouse info for display
              spouseName: spouseName
            });
          }
        }
      });

      // Sort all events by date
      timelineEvents.sort((a, b) => a.date - b.date);
      setEvents(timelineEvents);
    } catch (error) {
      console.error('Error fetching timeline data:', error);
      setError('Failed to load timeline data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-3">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="timeline-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M30,10 L30,50 M10,30 L50,30" stroke="currentColor" strokeWidth="1" className="text-blue-200" />
                <circle cx="30" cy="30" r="3" fill="currentColor" className="text-purple-200" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#timeline-pattern)" />
          </svg>
        </div>

        {/* Floating decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-full blur-xl"></div>
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-bl from-blue-200/30 to-cyan-200/30 rounded-full blur-xl"></div>
        </div>

        <div className="relative z-10 flex justify-center items-center h-64">
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
            <div className="text-xl bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent font-semibold">
              Loading timeline...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="absolute inset-0 opacity-3">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="error-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M30,10 L30,50 M10,30 L50,30" stroke="currentColor" strokeWidth="1" className="text-red-200" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#error-pattern)" />
          </svg>
        </div>

        <div className="relative z-10 text-center text-red-600 mt-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-xl max-w-md mx-auto">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2 bg-gradient-to-r from-red-700 to-pink-700 bg-clip-text text-transparent">
              Error Loading Timeline
            </h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-3">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="family-timeline-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              {/* Timeline branches */}
              <path d="M30,10 L30,50 M10,30 L50,30 M20,20 L40,40 M40,20 L20,40"
                stroke="currentColor" strokeWidth="1" className="text-blue-200" />
              {/* Timeline dots */}
              <circle cx="15" cy="15" r="2" fill="currentColor" className="text-green-200" />
              <circle cx="45" cy="45" r="2" fill="currentColor" className="text-purple-200" />
              {/* Small calendar icons */}
              <rect x="40" y="12" width="8" height="6" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-blue-200" />
              <line x1="42" y1="10" x2="42" y2="14" stroke="currentColor" strokeWidth="0.5" className="text-blue-200" />
              <line x1="46" y1="10" x2="46" y2="14" stroke="currentColor" strokeWidth="0.5" className="text-blue-200" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#family-timeline-pattern)" />
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
        {/* UPDATED: Enhanced header with timeline icon and text effects */}
        <div className="text-center mb-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-xl max-w-xl mx-auto relative overflow-hidden">
            {/* Background text effect */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <span className="text-6xl font-black text-gray-400 transform rotate-12">TIMELINE</span>
            </div>

            <div className="relative z-10 flex items-center justify-center mb-2">
              {/* Custom timeline icon */}
              <div className="mr-3">
                <svg width="32" height="32" viewBox="0 0 32 32" className="text-purple-600">
                  <defs>
                    <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="50%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  {/* Timeline line */}
                  <line x1="16" y1="4" x2="16" y2="28" stroke="url(#timelineGradient)" strokeWidth="3" strokeLinecap="round" />
                  {/* Timeline dots */}
                  <circle cx="16" cy="8" r="3" fill="url(#timelineGradient)" />
                  <circle cx="16" cy="16" r="4" fill="url(#timelineGradient)" />
                  <circle cx="16" cy="24" r="3" fill="url(#timelineGradient)" />
                  {/* Side branches */}
                  <line x1="8" y1="8" x2="13" y2="8" stroke="url(#timelineGradient)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="19" y1="16" x2="24" y2="16" stroke="url(#timelineGradient)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="8" y1="24" x2="13" y2="24" stroke="url(#timelineGradient)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-700 via-blue-700 to-cyan-700 bg-clip-text text-transparent drop-shadow-sm"
                style={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                  WebkitTextStroke: '0.5px rgba(147, 51, 234, 0.1)'
                }}>
                Family Timeline
              </h1>
            </div>

            <p className="text-gray-600 text-base font-medium relative z-10">
              Journey through your family's most important moments
            </p>
          </div>
        </div>

        {/* UPDATED: Smaller filter buttons with marriage option */}
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
                🌟 All Events
              </button>
              <button
                onClick={() => setFilter('birth')}
                className={`px-4 py-2 text-xs font-medium transition-all ${filter === 'birth'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg transform scale-105'
                  : 'bg-white/60 text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50'
                  } border-t border-b border-white/50`}
              >
                🎂 Births
              </button>
              <button
                onClick={() => setFilter('marriage')}
                className={`px-4 py-2 text-xs font-medium transition-all ${filter === 'marriage'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg transform scale-105'
                  : 'bg-white/60 text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50'
                  } border-t border-b border-white/50`}
              >
                💍 Marriages
              </button>
              <button
                onClick={() => setFilter('death')}
                className={`px-4 py-2 text-xs font-medium rounded-r-lg transition-all ${filter === 'death'
                  ? 'bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-lg transform scale-105'
                  : 'bg-white/60 text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50'
                  } border border-white/50`}
              >
                🕊️ Deaths
              </button>
            </div>
          </div>
        </div>

        {/* Timeline content */}
        {filteredEvents.length === 0 ? (
          <div className="text-center mt-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-xl max-w-md mx-auto">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-gray-700 to-slate-700 bg-clip-text text-transparent">
                No events to display
              </h3>
              <p className="text-gray-600 mb-4">Try adding birth dates and marriage information to family members.</p>
              <Link
                to="/members"
                className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-full hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all shadow-lg font-medium"
              >
                View Members
              </Link>
            </div>
          </div>
        ) : (
          <div className="relative max-w-4xl mx-auto">
            {/* Central timeline line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-200 via-purple-200 to-pink-200 transform -translate-x-1/2"></div>

            {/* Timeline content */}
            <div className="space-y-16">
              {decades.map(decade => (
                <div key={decade} className="relative">
                  {/* Decade marker */}
                  <div className="flex justify-center mb-8">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-full shadow-xl border-4 border-white text-lg font-bold z-10 relative">
                      {decade}s
                    </div>
                  </div>

                  {/* Events in this decade */}
                  <div className="space-y-8">
                    {groupedByDecade[decade].map((event, index) => (
                      <div key={index} className="relative flex items-center">
                        {/* UPDATED: Timeline dot with different colors for different event types */}
                        <div className={`absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full border-4 border-white shadow-lg z-10 ${event.type === 'birth' ? 'bg-green-500' :
                          event.type === 'marriage' ? 'bg-pink-500' :
                            'bg-gray-500'
                          }`}></div>

                        {/* Event card */}
                        <div className={`w-5/12 ${index % 2 === 0 ? 'mr-auto pr-8' : 'ml-auto pl-8'}`}>
                          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all hover:scale-105">
                            <div className="flex items-center mb-4">
                              <div className="mr-4">
                                <div className="relative">
                                  <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 rounded-full opacity-75 blur-sm"></div>
                                  <div className="relative bg-white rounded-full p-1">
                                    <ProfileImage
                                      member={event.member}
                                      size="small"
                                      className="border-2 border-gray-200"
                                    />
                                  </div>
                                </div>
                              </div>
                              <div>
                                <span className="text-xl font-bold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">
                                  {event.year}
                                </span>
                                {/* UPDATED: Event type badge with different colors */}
                                <div className={`text-sm px-4 py-2 rounded-full inline-block ml-3 font-medium shadow-lg ${event.type === 'birth'
                                  ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white'
                                  : event.type === 'marriage'
                                    ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white'
                                    : 'bg-gradient-to-r from-gray-400 to-slate-400 text-white'
                                  }`}>
                                  {event.type === 'birth' ? '🎂 Birth' :
                                    event.type === 'marriage' ? '💍 Marriage' :
                                      '🕊️ Passing'}
                                </div>
                              </div>
                            </div>
                            <h3 className="font-bold text-xl mb-3 bg-gradient-to-r from-gray-800 to-slate-700 bg-clip-text text-transparent">
                              {event.description}
                            </h3>

                            {/* UPDATED: Special handling for marriage events to show both spouses */}
                            {event.type === 'marriage' && event.spouse && (
                              <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg p-3 mb-4 border border-pink-100">
                                <div className="flex items-center space-x-3">
                                  {event.spouse.photo_url && (
                                    <ProfileImage
                                      member={event.spouse}
                                      size="w-8 h-8"
                                      className="border border-pink-200"
                                    />
                                  )}
                                  <div>
                                    <p className="text-sm font-medium text-gray-700">
                                      Spouse: <Link
                                        to={`/members/${event.spouse.id}`}
                                        className="text-pink-600 hover:text-pink-800 hover:underline font-semibold"
                                      >
                                        {event.spouseName}
                                      </Link>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 mb-4 border border-blue-100">
                              <p className="text-base text-gray-700 font-medium">📍 {event.location}</p>
                            </div>
                            <Link
                              to={`/members/${event.memberId}`}
                              className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-full hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all shadow-lg font-medium"
                            >
                              👤 View Profile
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelinePage;