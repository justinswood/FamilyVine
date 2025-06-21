import React, { useState, useEffect } from 'react';
import { Users, MapPin, Calendar, Heart, TrendingUp, Globe } from 'lucide-react';
import axios from 'axios';

const FamilyStatistics = () => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    livingMembers: 0,
    generations: 0,
    locations: [],
    ageGroups: {
      children: 0,
      adults: 0,
      seniors: 0
    },
    recentAdditions: 0,
    marriages: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/api/members`);
      const members = response.data;
      
      calculateStatistics(members);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (members) => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    // Basic counts
    const totalMembers = members.length;
    const livingMembers = members.filter(m => m.is_alive).length;
    const marriages = members.filter(m => m.is_married).length;

    // Recent additions (members added in last month)
    const recentAdditions = members.filter(m => {
      const addedDate = new Date(m.created_at || m.birth_date);
      return addedDate >= oneMonthAgo;
    }).length;

    // Age groups calculation
    const ageGroups = { children: 0, adults: 0, seniors: 0 };
    
    members.forEach(member => {
      if (member.birth_date && member.is_alive) {
        const birthDate = new Date(member.birth_date);
        const age = now.getFullYear() - birthDate.getFullYear();
        
        if (age < 18) ageGroups.children++;
        else if (age < 65) ageGroups.adults++;
        else ageGroups.seniors++;
      }
    });

    // Locations analysis
    const locationCounts = {};
    members.forEach(member => {
      if (member.location || member.birth_place) {
        const location = member.location || member.birth_place;
        locationCounts[location] = (locationCounts[location] || 0) + 1;
      }
    });

    const locations = Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }));

    // Simple generation calculation (this is a basic estimation)
    const generations = Math.max(1, Math.ceil(totalMembers / 8)); // Rough estimate

    setStats({
      totalMembers,
      livingMembers,
      generations,
      locations,
      ageGroups,
      recentAdditions,
      marriages
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => (
    <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-${color}-900/20 dark:to-${color}-800/20 
                     rounded-lg p-4 border border-${color}-200 dark:border-${color}-700/50`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
        <span className={`text-2xl font-bold text-${color}-700 dark:text-${color}-300`}>
          {value}
        </span>
      </div>
      <h3 className={`font-semibold text-${color}-800 dark:text-${color}-200 mb-1`}>
        {title}
      </h3>
      {subtitle && (
        <p className={`text-sm text-${color}-600 dark:text-${color}-400`}>
          {subtitle}
        </p>
      )}
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-blue-600" />
        Family Statistics
      </h2>

      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Users}
          title="Total Members"
          value={stats.totalMembers}
          subtitle={`${stats.livingMembers} living`}
          color="blue"
        />
        
        <StatCard
          icon={Calendar}
          title="Generations"
          value={stats.generations}
          subtitle="Estimated count"
          color="green"
        />
        
        <StatCard
          icon={Heart}
          title="Marriages"
          value={stats.marriages}
          subtitle="Recorded unions"
          color="red"
        />
        
        <StatCard
          icon={TrendingUp}
          title="Recent Additions"
          value={stats.recentAdditions}
          subtitle="Last 30 days"
          color="purple"
        />
      </div>

      {/* Age Distribution */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Age Distribution (Living Members)
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 
                          rounded-lg p-3 text-center border border-yellow-200 dark:border-yellow-700/50">
            <div className="text-xl font-bold text-yellow-700 dark:text-yellow-300">
              {stats.ageGroups.children}
            </div>
            <div className="text-sm text-yellow-600 dark:text-yellow-400">
              Children (0-17)
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 
                          rounded-lg p-3 text-center border border-blue-200 dark:border-blue-700/50">
            <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
              {stats.ageGroups.adults}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              Adults (18-64)
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 
                          rounded-lg p-3 text-center border border-purple-200 dark:border-purple-700/50">
            <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
              {stats.ageGroups.seniors}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400">
              Seniors (65+)
            </div>
          </div>
        </div>
      </div>

      {/* Top Locations */}
      {stats.locations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-600" />
            Top Family Locations
          </h3>
          <div className="space-y-2">
            {stats.locations.map((loc, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 
                                          rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {loc.location}
                  </span>
                </div>
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 
                                 px-2 py-1 rounded-full text-sm font-semibold">
                  {loc.count} {loc.count === 1 ? 'member' : 'members'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.totalMembers === 0 && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Family Data Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Start adding family members to see statistics and insights
          </p>
        </div>
      )}
    </div>
  );
};

export default FamilyStatistics;