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

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-4 text-center">Family Timeline</h1>
      
      <div className="flex justify-center items-center gap-4 mb-6">
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
      </div>
      
      {/* Timeline content - always vertical */}
      {filteredEvents.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          <p>No events to display.</p>
          <p className="text-sm mt-2">Try adding birth dates to family members.</p>
        </div>
      ) : (
        <div className="timeline-container vertical">
          <div className="timeline-line vertical"></div>
          <div className="timeline-content vertical">
            {decades.map(decade => (
              <div key={decade} className="decade-section vertical">
                <div className="decade-marker vertical">
                  <div className="decade-label">
                    {decade}s
                  </div>
                </div>
                <div className="events-container vertical">
                  {groupedByDecade[decade].map((event, index) => (
                    <div key={index} className="event-item vertical">
                      <div className={`timeline-dot ${event.type} vertical`}></div>
                      <div className={`event-card vertical ${index % 2 === 0 ? 'even' : 'odd'}`}>
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
    </div>
  );
};

export default Timeline;