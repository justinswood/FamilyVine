import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  MapPin, 
  Heart, 
  Gift,
  Star,
  Clock
} from 'lucide-react';
import axios from 'axios';
import { LoadingSpinner, ErrorMessage } from './LoadingStates';

const FamilyInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${process.env.REACT_APP_API}/api/members`);
      const members = response.data;
      
      const calculatedInsights = calculateInsights(members);
      setInsights(calculatedInsights);
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('Failed to load family insights');
    } finally {
      setLoading(false);
    }
  };

  const calculateInsights = (members) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    // Upcoming birthdays (next 30 days)
    const upcomingBirthdays = members
      .filter(member => member.birth_date && member.is_alive)
      .map(member => {
        const birthDate = new Date(member.birth_date);
        const thisYear = now.getFullYear();
        const birthdayThisYear = new Date(thisYear, birthDate.getMonth(), birthDate.getDate());
        
        // If birthday already passed this year, check next year
        if (birthdayThisYear < now) {
          birthdayThisYear.setFullYear(thisYear + 1);
        }
        
        const daysUntil = Math.ceil((birthdayThisYear - now) / (1000 * 60 * 60 * 24));
        
        return {
          ...member,
          daysUntil,
          age: thisYear - birthDate.getFullYear()
        };
      })
      .filter(member => member.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    // Name analysis
    const firstNames = {};
    const lastNames = {};
    members.forEach(member => {
      if (member.first_name) {
        firstNames[member.first_name] = (firstNames[member.first_name] || 0) + 1;
      }
      if (member.last_name) {
        lastNames[member.last_name] = (lastNames[member.last_name] || 0) + 1;
      }
    });

    const popularFirstNames = Object.entries(firstNames)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .filter(([name, count]) => count > 1);

    const familyNames = Object.entries(lastNames)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    // Age statistics
    const livingMembers = members.filter(m => m.is_alive && m.birth_date);
    const ages = livingMembers.map(member => {
      const birthDate = new Date(member.birth_date);
      return now.getFullYear() - birthDate.getFullYear();
    });

    const averageAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
    const oldestMember = livingMembers.reduce((oldest, member) => {
      const memberAge = now.getFullYear() - new Date(member.birth_date).getFullYear();
      const oldestAge = oldest ? now.getFullYear() - new Date(oldest.birth_date).getFullYear() : 0;
      return memberAge > oldestAge ? member : oldest;
    }, null);

    const youngestMember = livingMembers.reduce((youngest, member) => {
      const memberAge = now.getFullYear() - new Date(member.birth_date).getFullYear();
      const youngestAge = youngest ? now.getFullYear() - new Date(youngest.birth_date).getFullYear() : Infinity;
      return memberAge < youngestAge ? member : youngest;
    }, null);

    // Recent additions
    const recentMembers = members
      .filter(member => {
        const addedDate = new Date(member.created_at || member.birth_date);
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        return addedDate >= thirtyDaysAgo;
      })
      .sort((a, b) => new Date(b.created_at || b.birth_date) - new Date(a.created_at || a.birth_date));

    // Geographic distribution
    const locations = {};
    members.forEach(member => {
      const location = member.location || member.birth_place;
      if (location) {
        locations[location] = (locations[location] || 0) + 1;
      }
    });

    const topLocations = Object.entries(locations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    return {
      upcomingBirthdays,
      popularFirstNames,
      familyNames,
      averageAge,
      oldestMember,
      youngestMember,
      recentMembers,
      topLocations,
      totalMembers: members.length,
      livingMembers: livingMembers.length
    };
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <LoadingSpinner message="Analyzing family data..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage 
        title="Unable to load insights"
        message={error}
        onRetry={fetchInsights}
      />
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-500" />
          Family Insights
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Discover interesting patterns and upcoming events in your family tree
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Birthdays */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-500" />
            Upcoming Birthdays
          </h3>
          
          {insights.upcomingBirthdays.length > 0 ? (
            <div className="space-y-3">
              {insights.upcomingBirthdays.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {member.first_name} {member.last_name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Turning {member.age + 1}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      member.daysUntil === 0 ? 'text-purple-600 dark:text-purple-400' :
                      member.daysUntil <= 7 ? 'text-orange-600 dark:text-orange-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {member.daysUntil === 0 ? 'Today!' :
                       member.daysUntil === 1 ? 'Tomorrow' :
                       `${member.daysUntil} days`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No upcoming birthdays in the next 30 days
            </p>
          )}
        </div>

        {/* Family Name Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Name Patterns
          </h3>
          
          <div className="space-y-4">
            {insights.popularFirstNames.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Popular First Names
                </h4>
                <div className="space-y-1">
                  {insights.popularFirstNames.map(([name, count]) => (
                    <div key={name} className="flex justify-between text-sm">
                      <span className="text-gray-900 dark:text-gray-100">{name}</span>
                      <span className="text-gray-500 dark:text-gray-400">{count} people</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                Family Names
              </h4>
              <div className="space-y-1">
                {insights.familyNames.slice(0, 3).map(([name, count]) => (
                  <div key={name} className="flex justify-between text-sm">
                    <span className="text-gray-900 dark:text-gray-100">{name}</span>
                    <span className="text-gray-500 dark:text-gray-400">{count} people</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Age Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-500" />
            Age Statistics
          </h3>
          
          <div className="space-y-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {insights.averageAge}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">
                Average Age
              </div>
            </div>
            
            {insights.oldestMember && (
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Oldest Member
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {insights.oldestMember.first_name} {insights.oldestMember.last_name}
                  </div>
                </div>
                <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  {new Date().getFullYear() - new Date(insights.oldestMember.birth_date).getFullYear()}
                </div>
              </div>
            )}
            
            {insights.youngestMember && (
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Youngest Member
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {insights.youngestMember.first_name} {insights.youngestMember.last_name}
                  </div>
                </div>
                <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  {new Date().getFullYear() - new Date(insights.youngestMember.birth_date).getFullYear()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            Geographic Spread
          </h3>
          
          {insights.topLocations.length > 0 ? (
            <div className="space-y-3">
              {insights.topLocations.map(([location, count]) => (
                <div key={location} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {location}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {count} {count === 1 ? 'member' : 'members'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No location data available
            </p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {insights.recentMembers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            Recent Additions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.recentMembers.slice(0, 6).map((member) => (
              <div key={member.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {member.first_name} {member.last_name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Added recently
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyInsights;