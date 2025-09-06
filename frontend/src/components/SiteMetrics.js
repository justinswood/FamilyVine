import React, { useState, useEffect } from 'react';
import { Users, Trophy, Calendar, TrendingUp } from 'lucide-react';
import axios from 'axios';
import DecryptedText from './DecryptedText';

const SiteMetrics = () => {
  const [metrics, setMetrics] = useState({
    totalMembers: 0,
    averageAge: 0,
    mostCommonSurname: 'Loading...',
    oldestMember: null,
    loading: true
  });

  useEffect(() => {
    fetchSiteMetrics();
  }, []);

  const fetchSiteMetrics = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/api/members`);
      const members = response.data;

      if (members.length === 0) {
        setMetrics({
          totalMembers: 0,
          averageAge: 0,
          mostCommonSurname: 'No data',
          oldestMember: null,
          loading: false
        });
        return;
      }

      // Calculate total members
      const totalMembers = members.length;

      // Calculate average age
      const currentDate = new Date();
      const membersWithAge = members.filter(member => member.birth_date);
      const ages = membersWithAge.map(member => {
        const birthDate = new Date(member.birth_date);
        const age = Math.floor((currentDate - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
        return age > 0 ? age : 0;
      });
      
      const averageAge = ages.length > 0 
        ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length)
        : 0;

      // Find most common surname
      const surnames = {};
      members.forEach(member => {
        if (member.last_name && member.last_name.trim()) {
          const surname = member.last_name.trim();
          surnames[surname] = (surnames[surname] || 0) + 1;
        }
      });
      
      const mostCommonSurname = Object.keys(surnames).length > 0
        ? Object.keys(surnames).reduce((a, b) => surnames[a] > surnames[b] ? a : b)
        : 'No data';

      // Find oldest member
      const livingMembersWithAge = members.filter(member => 
        member.birth_date && !member.death_date
      );
      
      let oldestMember = null;
      if (livingMembersWithAge.length > 0) {
        oldestMember = livingMembersWithAge.reduce((oldest, member) => {
          const memberDate = new Date(member.birth_date);
          const oldestDate = new Date(oldest.birth_date);
          return memberDate < oldestDate ? member : oldest;
        });
      }

      setMetrics({
        totalMembers,
        averageAge,
        mostCommonSurname,
        oldestMember,
        loading: false
      });

    } catch (error) {
      console.error('Error fetching site metrics:', error);
      setMetrics({
        totalMembers: 0,
        averageAge: 0,
        mostCommonSurname: 'Error loading',
        oldestMember: null,
        loading: false
      });
    }
  };

  const metricsData = [
    {
      title: 'Total Members',
      value: metrics.loading ? '...' : metrics.totalMembers.toLocaleString(),
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-700'
    },
    {
      title: 'Average Age',
      value: metrics.loading ? '...' : `${metrics.averageAge} years`,
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-700'
    },
    {
      title: 'Most Common Surname',
      value: metrics.loading ? '...' : metrics.mostCommonSurname,
      icon: Trophy,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-700'
    },
    {
      title: 'Oldest Living Member',
      value: metrics.loading ? '...' : (
        metrics.oldestMember 
          ? `${metrics.oldestMember.first_name} ${metrics.oldestMember.last_name}`
          : 'No data'
      ),
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-700'
    }
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green-600" />
        <DecryptedText 
          text="Family Metrics"
          animateOn="view"
          speed={60}
          maxIterations={12}
          revealDirection="start"
          className="text-lg font-semibold text-gray-900 dark:text-gray-100"
          encryptedClassName="text-lg font-semibold text-gray-400 dark:text-gray-500"
        />
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsData.map((metric, index) => {
          const IconComponent = metric.icon;
          // Calculate stagger delay: 200ms base + 150ms per card
          const cardDelay = 200 + (index * 150);
          
          return (
            <div
              key={index}
              className={`group ${metric.bgColor} ${metric.borderColor} border rounded-lg p-4 
                         hover:shadow-md transition-all duration-300 transform hover:-translate-y-1
                         hover:border-opacity-75 dark:hover:border-opacity-75`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${metric.color} text-white 
                                group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 text-sm mb-1">
                    <DecryptedText 
                      text={metric.title}
                      animateOn="view"
                      speed={30}
                      maxIterations={8}
                      revealDirection="start"
                      delay={cardDelay}
                      className="font-medium text-gray-700 dark:text-gray-300"
                      encryptedClassName="font-medium text-gray-400 dark:text-gray-500"
                    />
                  </h4>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                    <DecryptedText 
                      text={metric.value}
                      animateOn="view"
                      speed={40}
                      maxIterations={10}
                      revealDirection="center"
                      delay={cardDelay + 100}
                      className="text-lg font-bold text-gray-900 dark:text-gray-100"
                      encryptedClassName="text-lg font-bold text-gray-500 dark:text-gray-600"
                      characters="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz "
                    />
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SiteMetrics;