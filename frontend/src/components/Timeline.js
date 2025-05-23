import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Timeline.css'; // Import the CSS

const Timeline = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'births', 'deaths'

  useEffect(() => {
    fetchTimelineData();
  }, []);

  const fetchTimelineData = async () => {
    try {
      setLoading(true);
      // Fetch all members to extract timeline events
      const response = await axios.get(`${process.env.REACT_APP_API}/api/members`);
      const members = response.data;
      
      // Extract events from member data
      const timelineEvents = [];
      
      members.forEach(member => {
        const fullName = `${member.first_name} ${member.last_name}`;
        
        // Add birth events
        if (member.birth_date) {
          timelineEvents.push({
            type: 'birth',
            date: new Date(member.birth_date),
            year: new Date(member.birth_date).getFullYear(),
            description: `${fullName} was born`,
            location: member.birth_place || 'Unknown location',
            memberId: member.id,
            memberName: fullName,
            photoUrl: member.photo_url
          });
        }
        
        // Add death events
        if (member.death_date) {
          timelineEvents.push({
            type: 'death',
            date: new Date(member.death_date),
            year: new Date(member.death_date).getFullYear(),
            description: `${fullName} passed away`,
            location: member.death_place || 'Unknown location',
            memberId: member.id,
            memberName: fullName,
            photoUrl: member.photo_url
          });
        }
      });
      
      // Sort events chronologically
      timelineEvents.sort((a, b) => a.date - b.date);
      
      setEvents(timelineEvents);
    } catch (error) {
      console.error('Error fetching timeline data:', error);
      setError('Failed to load timeline data');
    } finally {
      setLoading(false);
    }
  };

  // Filter events based on user selection
  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(event => event.type === filter);

  // Group events by decade for better organization
  const groupedByDecade = filteredEvents.reduce((groups, event) => {
    const decade = Math.floor(event.year / 10) * 10;
    if (!groups[decade]) {
      groups[decade] = [];
    }
    groups[decade].push(event);
    return groups;
  }, {});

  // Convert to array and sort decades
  const decades = Object.keys(groupedByDecade)
    .map(Number)
    .sort((a, b) => a - b);

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
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Family Timeline</h1>
      
      {/* Filter Controls */}
      <div className="flex justify-center mb-8">
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
      
      {/* Timeline Display */}
      {filteredEvents.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          <p>No events to display.</p>
          <p className="text-sm mt-2">Try adding birth dates to family members.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gray-200"></div>
          
          {/* Decades and events */}
          <div className="space-y-8">
            {decades.map(decade => (
              <div key={decade} className="mb-12">
                {/* Decade marker */}
                <div className="flex justify-center mb-8">
                  <div className="bg-blue-100 text-blue-800 font-bold py-2 px-6 rounded-full border-2 border-white shadow-md z-10">
                    {decade}s
                  </div>
                </div>
                
                {/* Events in this decade */}
                <div className="space-y-8">
                  {groupedByDecade[decade].map((event, index) => (
                    <div key={index} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full z-10 border-2 border-white shadow-sm"
                        style={{ 
                          backgroundColor: event.type === 'birth' ? '#10b981' : '#6b7280',
                          top: '50%',
                          marginTop: '-8px'
                        }}>
                      </div>
                      
                      {/* Event card - alternate sides */}
                      <div className={`w-5/12 ${
                        index % 2 === 0 ? 'ml-auto pl-8' : 'mr-auto pr-8 text-right'
                      }`}>
                        <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                          <div className="flex items-center mb-3">
                            {/* Photo - Made bigger */}
                            {event.photoUrl && (
                              <div className={`${index % 2 === 0 ? 'mr-4' : 'ml-4 order-last'}`}>
                                <img 
                                  src={`${process.env.REACT_APP_API}/${event.photoUrl}`}
                                  alt={event.memberName}
                                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/64';
                                  }}
                                />
                              </div>
                            )}
                            
                            {/* Year and type - Made bigger */}
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
                          
                          {/* Description - Made bigger */}
                          <h3 className="font-semibold text-lg mb-2">{event.description}</h3>
                          
                          {/* Location - Made bigger */}
                          <p className="text-base text-gray-600 mb-3">{event.location}</p>
                          
                          {/* Link - Made bigger */}
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