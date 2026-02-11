import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProfileImage from '../components/ProfileImage';

// Decade descriptions — poetic one-liners
const decadeDescriptions = {
  1900: "A new century dawned, humming with engines, lightbulbs, and quiet wonder.",
  1910: "Storm clouds gathered, and the world learned how fragile peace could be.",
  1920: "Jazz spilled into the streets as hearts lifted and nights sparkled.",
  1930: "Hope learned to whisper, carried in shared meals and steady hands.",
  1940: "Fire and courage reshaped the world, followed by the slow work of healing.",
  1950: "Warm kitchens glowed with promise, televisions flickered, and dreams felt reachable.",
  1960: "Voices rose, colors bloomed, and humanity touched the moon.",
  1970: "The world exhaled, searching inward for meaning and peace.",
  1980: "Neon dreams pulsed with confidence, ambition, and electric joy.",
  1990: "Wires connected distant souls as optimism rode the digital breeze.",
  2000: "Time sped up, screens lit faces, and possibility felt endless.",
  2010: "Stories overlapped, voices multiplied, and the world spoke at once.",
  2020: "Through loss and learning, resilience took root and hope quietly endured through 2025"
};

// Leaf icon SVGs for vine nodes
const LeafIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.5 2.5C13.5 2.5 11 3.5 9 5.5C7 7.5 6.5 10 6.5 10C6.5 10 6 7.5 4 5.5C2 3.5 2.5 2.5 2.5 2.5C2.5 2.5 1 6 3 9C4.5 11.2 6.5 12 8 13.5C9.5 12 11.5 11.2 13 9C15 6 13.5 2.5 13.5 2.5Z" />
  </svg>
);

/**
 * Decade Almanac Summary — Gilded Vellum card anchoring each decade
 */
const DecadeAlmanac = ({ decade, events }) => {
  const births = events.filter(e => e.type === 'birth' && !e.isWorldEvent).length;
  const marriages = events.filter(e => e.type === 'marriage' && !e.isWorldEvent).length;
  const passings = events.filter(e => e.type === 'death' && !e.isWorldEvent).length;
  const worldCount = events.filter(e => e.isWorldEvent).length;
  const description = decadeDescriptions[decade] || '';

  return (
    <div className="decade-almanac">
      <h2 className="decade-almanac-title">The {decade}s</h2>
      <div className="gilded-divider"></div>
      {description && (
        <p className="decade-almanac-description">{description}</p>
      )}
      <div className="decade-almanac-stats">
        {births > 0 && <span><strong>{births}</strong> {births === 1 ? 'birth' : 'births'}</span>}
        {marriages > 0 && <span><strong>{marriages}</strong> {marriages === 1 ? 'union' : 'unions'}</span>}
        {passings > 0 && <span><strong>{passings}</strong> {passings === 1 ? 'passing' : 'passings'}</span>}
        {worldCount > 0 && <span><strong>{worldCount}</strong> world {worldCount === 1 ? 'event' : 'events'}</span>}
      </div>
    </div>
  );
};

/**
 * Generates a "generational echo" — a contextual link between family and world events.
 */
function getGenerationalEcho(event, allEvents) {
  if (event.isWorldEvent) return null;

  // Find a world event in the same year
  const worldEvent = allEvents.find(
    e => e.isWorldEvent && e.year === event.year
  );
  if (worldEvent) {
    return `In the same year: ${worldEvent.description}`;
  }

  return null;
}

const TimelinePage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showWorldEvents, setShowWorldEvents] = useState(true);

  useEffect(() => {
    fetchTimelineData();
  }, []);

  const filteredEvents = events.filter(event => {
    if (!showWorldEvents && event.isWorldEvent) return false;
    if (filter === 'all') return true;
    if (filter === 'world') return event.isWorldEvent;
    return event.type === filter && !event.isWorldEvent;
  });

  const groupedByDecade = filteredEvents.reduce((groups, event) => {
    const decade = Math.floor(event.year / 10) * 10;
    if (!groups[decade]) groups[decade] = [];
    groups[decade].push(event);
    return groups;
  }, {});

  const decades = Object.keys(groupedByDecade).map(Number).sort((a, b) => a - b);

  // Also group ALL events by decade (unfiltered) for decade stats
  const allByDecade = events.reduce((groups, event) => {
    const decade = Math.floor(event.year / 10) * 10;
    if (!groups[decade]) groups[decade] = [];
    groups[decade].push(event);
    return groups;
  }, {});

  const fetchTimelineData = async () => {
    try {
      setLoading(true);
      const [membersResponse, worldEventsResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API}/api/members`),
        axios.get(`${process.env.REACT_APP_API}/api/world-events`)
      ]);

      const members = membersResponse.data;
      const worldEvents = worldEventsResponse.data;
      const timelineEvents = [];

      members.forEach(member => {
        const fullName = `${member.first_name} ${member.last_name}`;

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

        if (member.is_married && member.marriage_date && member.spouse_id) {
          const spouse = members.find(m => m.id === member.spouse_id);
          if (!spouse || member.id < spouse.id) {
            const spouseName = spouse ? `${spouse.first_name} ${spouse.last_name}` : 'Unknown spouse';
            timelineEvents.push({
              type: 'marriage',
              date: new Date(member.marriage_date),
              year: new Date(member.marriage_date).getFullYear(),
              description: `${fullName} married ${spouseName}`,
              location: 'Unknown location',
              memberId: member.id,
              memberName: fullName,
              member: member,
              spouse: spouse,
              spouseName: spouseName
            });
          }
        }
      });

      worldEvents.forEach(worldEvent => {
        const eventDate = new Date(worldEvent.event_date);
        timelineEvents.push({
          type: 'world',
          date: eventDate,
          year: eventDate.getFullYear(),
          description: worldEvent.title,
          location: worldEvent.description || '',
          category: worldEvent.category,
          icon: worldEvent.icon,
          isWorldEvent: true
        });
      });

      timelineEvents.sort((a, b) => a.date - b.date);
      setEvents(timelineEvents);
    } catch (err) {
      console.error('Error fetching timeline data:', err);
      setError('Failed to load timeline data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-transparent">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-vine-200/10 to-vine-300/10 rounded-full blur-xl"></div>
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-bl from-amber-100/10 to-vine-100/10 rounded-full blur-xl"></div>
        </div>
        <div className="relative z-10 flex justify-center items-center h-64">
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-vine-500 border-t-transparent mx-auto mb-4"></div>
            <div className="text-xl bg-gradient-to-r from-vine-600 to-vine-dark bg-clip-text text-transparent font-semibold font-heading">
              Loading Chronicle...
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
              Error Loading Chronicle
            </h2>
            <p className="text-vine-sage">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      {/* Subtle decorative blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-purple-200/10 to-vine-200/10 rounded-full blur-xl"></div>
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-bl from-amber-100/10 to-vine-100/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-80 h-40 bg-gradient-to-t from-vine-200/10 to-transparent rounded-full blur-xl"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full px-4 py-6">

        {/* Chronicle Header — Gilded Vellum */}
        <div className="max-w-xl mx-auto mb-5">
          <div className="chronicle-header">
            <h1 className="chronicle-header-title">Family Chronicle</h1>

            <p className="mt-0.5 tracking-widest uppercase" style={{ fontFamily: 'var(--font-body)', color: 'var(--vine-sage)', fontSize: '0.6rem' }}>
              A living record of generations
            </p>

            {/* Filter pills */}
            <div className="mt-3 flex flex-col items-center gap-2">
              <div className="chronicle-filters">
                {[
                  { key: 'all', label: 'All Events' },
                  { key: 'birth', label: 'Births' },
                  { key: 'marriage', label: 'Marriages' },
                  { key: 'death', label: 'Passings' },
                  { key: 'world', label: 'World Events' },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`chronicle-filter-btn ${
                      filter === f.key
                        ? f.key === 'world' ? 'active-world' : 'active'
                        : ''
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowWorldEvents(!showWorldEvents)}
                className={`chronicle-toggle ${showWorldEvents ? 'active' : ''}`}
              >
                {showWorldEvents ? 'Hide World Events' : 'Show World Events'}
              </button>
            </div>
          </div>
        </div>

        {/* Timeline content */}
        {filteredEvents.length === 0 ? (
          <div className="text-center mt-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-xl max-w-md mx-auto">
              <div className="text-vine-sage mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-vine-dark font-heading">
                No events to display
              </h3>
              <p className="text-vine-sage mb-4">Try adding birth dates and marriage information to family members.</p>
              <Link
                to="/members"
                className="chronicle-profile-link"
              >
                View Members
              </Link>
            </div>
          </div>
        ) : (
          <div className="chronicle-container">
            {/* The Central Vine */}
            <div className="chronicle-vine"></div>

            {decades.map((decade, decadeIndex) => {
              const eventsBeforeThisDecade = decades
                .slice(0, decadeIndex)
                .reduce((sum, d) => sum + groupedByDecade[d].length, 0);

              return (
                <div key={decade} className="relative mb-12">
                  {/* Decade Almanac Summary */}
                  <DecadeAlmanac
                    decade={decade}
                    events={allByDecade[decade] || []}
                  />

                  {/* Events in this decade */}
                  <div className="space-y-10">
                    {groupedByDecade[decade].map((event, localIndex) => {
                      const globalIndex = eventsBeforeThisDecade + localIndex;
                      const isLeft = globalIndex % 2 === 0;
                      const side = isLeft ? 'left' : 'right';
                      const cardType = event.isWorldEvent ? 'world' : 'family';
                      const leafType = event.isWorldEvent ? 'world' : event.type;

                      // Generational echo
                      const echo = getGenerationalEcho(event, events);

                      // Age calculation for personal events
                      let ageLabel = null;
                      if (!event.isWorldEvent) {
                        if (event.type === 'birth') {
                          ageLabel = 'Born';
                        } else if (event.member?.birth_date) {
                          const birthYear = new Date(event.member.birth_date).getFullYear();
                          const age = event.year - birthYear;
                          if (age >= 0) ageLabel = `Age ${age}`;
                        }
                      }

                      return (
                        <div key={localIndex} className={`chronicle-item ${side}`}>
                          {/* Leaf node on the vine */}
                          <div className={`chronicle-leaf ${leafType}`}>
                            <LeafIcon className="w-3.5 h-3.5 text-white" />
                          </div>

                          {/* Event card */}
                          <div className={`chronicle-card ${cardType}`}>
                            {/* Top row: profile/icon + year + badge + age */}
                            <div className="flex items-center gap-3 mb-3">
                              {!event.isWorldEvent ? (
                                <div className="flex-shrink-0">
                                  <ProfileImage
                                    member={event.member}
                                    size="w-10 h-10"
                                    className="rounded-full border-2 border-white shadow-sm"
                                  />
                                </div>
                              ) : event.icon ? (
                                <span className="text-2xl flex-shrink-0">{event.icon}</span>
                              ) : null}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                  <span className="chronicle-year">{event.year}</span>
                                  <span className={`chronicle-badge ${event.isWorldEvent ? 'world-badge' : event.type}`}>
                                    {event.isWorldEvent
                                      ? event.category?.charAt(0).toUpperCase() + event.category?.slice(1)
                                      : event.type === 'birth' ? 'Birth'
                                      : event.type === 'marriage' ? 'Marriage'
                                      : 'Passing'}
                                  </span>
                                </div>
                              </div>

                              {ageLabel && (
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                                  event.type === 'birth' ? 'text-emerald-700 bg-emerald-50' :
                                  event.type === 'marriage' ? 'text-pink-700 bg-pink-50' :
                                  'text-vine-600 bg-vine-50'
                                }`}>
                                  {ageLabel}
                                </span>
                              )}
                            </div>

                            {/* Description */}
                            <h3 className="font-bold text-sm mb-1.5 text-vine-dark dark:text-white leading-snug">
                              {event.description}
                            </h3>

                            {/* Marriage spouse info */}
                            {!event.isWorldEvent && event.type === 'marriage' && event.spouse && (
                              <div className="flex items-center gap-1.5 mb-2.5 p-1.5 rounded-lg bg-pink-50/60 dark:bg-pink-900/10 border border-pink-100 dark:border-pink-900/20">
                                {event.spouse.photo_url && (
                                  <ProfileImage
                                    member={event.spouse}
                                    size="w-7 h-7"
                                    className="rounded-full border border-pink-200"
                                  />
                                )}
                                <span className="text-xs text-vine-dark dark:text-gray-300">
                                  Spouse:{' '}
                                  <Link
                                    to={`/members/${event.spouse.id}`}
                                    className="font-semibold text-pink-600 dark:text-pink-400 hover:underline"
                                  >
                                    {event.spouseName}
                                  </Link>
                                </span>
                              </div>
                            )}

                            {/* Location */}
                            {event.location && event.location !== 'Unknown location' && (
                              <div className="chronicle-location mb-2.5">
                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}

                            {/* World event description (stored in location field) */}
                            {event.isWorldEvent && event.location && (
                              <p className="text-xs text-vine-sage dark:text-gray-400 mb-2.5 leading-relaxed">
                                {event.location}
                              </p>
                            )}

                            {/* Generational echo */}
                            {echo && (
                              <p className="chronicle-echo">{echo}</p>
                            )}

                            {/* View Profile link — family events only */}
                            {!event.isWorldEvent && (
                              <div className="mt-2.5">
                                <Link
                                  to={`/members/${event.memberId}`}
                                  className="chronicle-profile-link"
                                >
                                  View Profile
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelinePage;
