import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProfileImage from '../components/ProfileImage';
import './Timeline.css';

const Timeline = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [viewOrientation, setViewOrientation] = useState('vertical');

  // STEP 1: First, fetch the data when component loads
  useEffect(() => {
    fetchTimelineData();
  }, []);

  // STEP 2: Calculate filtered events and decades
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

  // STEP 3: Now we can safely use filteredEvents and decades in useEffect
  useEffect(() => {
    if (viewOrientation === 'horizontal' && filteredEvents.length > 0) {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        const container = document.querySelector('.timeline-container.horizontal');
        if (container) {
          // Reset scroll position when switching to horizontal
          container.scrollLeft = 0;
          
          // Calculate width based on actual decades
          const numberOfDecades = decades.length;
          const sectionWidth = 350; // Each decade section width
          const gapWidth = 64; // Gap between sections (4rem = 64px)
          const paddingWidth = 160; // Total padding (2rem on each side = 160px)
          
          const totalWidth = (numberOfDecades * sectionWidth) + 
                           ((numberOfDecades - 1) * gapWidth) + 
                           paddingWidth + 
                           200; // Extra padding for scroll space
          
          console.log('Decades found:', numberOfDecades);
          console.log('Total width calculated:', totalWidth);
          
          // Force single row layout
          const content = container.querySelector('.timeline-content.horizontal');
          if (content) {
            content.style.width = `${totalWidth}px`;
            content.style.minWidth = `${totalWidth}px`;
            
            // Also update the timeline line to span full width
            const timelineLine = container.querySelector('.timeline-line.horizontal');
            if (timelineLine) {
              timelineLine.style.width = `${totalWidth}px`;
              timelineLine.style.minWidth = `${totalWidth}px`;
            }
          }
        }
      }, 300);
    }
  }, [viewOrientation, filteredEvents.length, decades.length]); // Use .length to avoid dependency issues

  const fetchTimelineData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API}/api/members`);
      const members = response.data;
      
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
      });
      
      timelineEvents.sort((a, b) => a.date - b.date);
      setEvents(timelineEvents);
    } catch (error) {
      console.error('Error fetching timeline data:', error);
      setError('Failed to load timeline data');
    } finally {
      setLoading(false);
    }
  };

  // Scroll functions for horizontal view
  const scrollToEnd = () => {
    const container = document.querySelector('.timeline-container.horizontal');
    if (container) {
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      console.log('Scrolling to:', maxScrollLeft, 'of total:', container.scrollWidth);
      
      container.scrollTo({
        left: maxScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const scrollToBeginning = () => {
    const container = document.querySelector('.timeline-container.horizontal');
    if (container) {
      container.scrollTo({
        left: 0,
        behavior: 'smooth'
      });
    }
  };

  // STEP 4: Handle loading and error states
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading timeline...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 mt-8">
        <p>{error}</p>
      </div>
    );
  }

  // STEP 5: Render the timeline
  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-4 text-center">Family Timeline</h1>
      
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
        {/* Filter buttons */}
        <div className="inline-flex rounded-md shadow-sm">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-300`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilter('birth')}
            className={`px-4 py-2 text-sm font-medium ${
              filter === 'birth' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border-t border-b border-gray-300`}
          >
            Births
          </button>
          <button
            onClick={() => setFilter('death')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              filter === 'death' 
                ? 'bg-gray-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-300`}
          >
            Deaths
          </button>
        </div>

        {/* View orientation buttons */}
        <div className="inline-flex rounded-md shadow-sm">
          <button
            onClick={() => setViewOrientation('vertical')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              viewOrientation === 'vertical' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-300 flex items-center gap-2`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Vertical
          </button>
          <button
            onClick={() => setViewOrientation('horizontal')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              viewOrientation === 'horizontal' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-300 flex items-center gap-2`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 7l4-4M4 7l4 4m12 6H8m8 0l-4-4m4 4l-4 4" />
            </svg>
            Horizontal
          </button>
        </div>

        {/* Scroll controls for horizontal view */}
        {viewOrientation === 'horizontal' && filteredEvents.length > 0 && (
          <div className="inline-flex rounded-md shadow-sm">
            <button
              onClick={scrollToBeginning}
              className="px-3 py-2 text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-l-lg"
              title="Scroll to beginning"
            >
              ⟪ Start
            </button>
            <button
              onClick={scrollToEnd}
              className="px-3 py-2 text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-r-lg"
              title="Scroll to end"
            >
              End ⟫
            </button>
          </div>
        )}
      </div>
      
      {/* Timeline content */}
      {filteredEvents.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          <p>No events to display.</p>
          <p className="text-sm mt-2">Try adding birth dates to family members.</p>
        </div>
      ) : (
        <div className={`timeline-container ${viewOrientation}`}>
          <div className={`timeline-line ${viewOrientation}`}></div>
          <div className={`timeline-content ${viewOrientation}`}>
            {decades.map(decade => (
              <div key={decade} className={`decade-section ${viewOrientation}`}>
                <div className={`decade-marker ${viewOrientation}`}>
                  <div className="decade-label">
                    {decade}s
                  </div>
                </div>
                <div className={`events-container ${viewOrientation}`}>
                  {groupedByDecade[decade].map((event, index) => (
                    <div key={index} className={`event-item ${viewOrientation}`}>
                      <div className={`timeline-dot ${event.type} ${viewOrientation}`}></div>
                      <div className={`event-card ${viewOrientation} ${index % 2 === 0 ? 'even' : 'odd'}`}>
                        <div className="event-content">
                          <div className="flex items-center mb-3">
                            <div className="mr-4">
                              <ProfileImage 
                                member={event.member} 
                                size="small" 
                                className="border-2 border-gray-200" 
                              />
                            </div>
                            <div>
                              <span className="text-lg font-semibold text-gray-700">{event.year}</span>
                              <div className={`text-sm px-3 py-1 rounded-full inline-block ml-2 font-medium ${
                                event.type === 'birth' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {event.type === 'birth' ? 'Birth' : 'Death'}
                              </div>
                            </div>
                          </div>
                          <h3 className="font-semibold text-lg mb-2">{event.description}</h3>
                          <p className="text-base text-gray-600 mb-3">{event.location}</p>
                          <Link 
                            to={`/members/${event.memberId}`}
                            className="text-blue-600 hover:underline text-base font-medium inline-block"
                          >
                            View Profile
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

      {/* Help text for horizontal scrolling */}
      {viewOrientation === 'horizontal' && filteredEvents.length > 0 && (
        <div className="text-center mt-4 text-sm text-gray-500">
          <p>💡 Tip: Use the scroll buttons above or drag the scrollbar to navigate through time</p>
        </div>
      )}
    </div>
  );
};

export default Timeline;