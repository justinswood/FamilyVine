import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  MapPin,
  Users,
  Heart,
  Baby,
  Clock,
  Globe,
  TrendingUp,
  Award
} from 'lucide-react';
import axios from 'axios';

const FunFamilyFacts = () => {
  const [facts, setFacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFamilyFacts();
  }, []);

  const fetchFamilyFacts = async () => {
    try {
      const [membersRes, unionsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API}/api/members`),
        axios.get(`${process.env.REACT_APP_API}/api/tree/unions`).catch(() => ({ data: [] }))
      ]);

      const members = membersRes.data;
      const unions = unionsRes.data || [];

      if (members.length === 0) {
        setFacts([]);
        setLoading(false);
        return;
      }

      const calculatedFacts = calculateFacts(members, unions);
      setFacts(calculatedFacts);
    } catch (error) {
      console.error('Error fetching family facts:', error);
      setFacts([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateFacts = (members, unions) => {
    const facts = [];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    // Filter out placeholder members (Unknown Parent, etc.)
    const realMembers = members.filter(m =>
      !m.first_name?.toLowerCase().includes('unknown') &&
      !m.last_name?.toLowerCase().includes('unknown')
    );

    const livingMembers = realMembers.filter(m => !m.death_date);
    const membersWithBirthDate = realMembers.filter(m => m.birth_date);

    // 1. Year span - oldest to youngest birth
    if (membersWithBirthDate.length >= 2) {
      const birthYears = membersWithBirthDate.map(m => new Date(m.birth_date).getFullYear());
      const oldestYear = Math.min(...birthYears);
      const youngestYear = Math.max(...birthYears);
      const span = youngestYear - oldestYear;

      if (span > 0) {
        facts.push({
          icon: Clock,
          color: 'from-purple-500 to-indigo-600',
          bgColor: 'bg-purple-50',
          title: `${span} Years of History`,
          description: `Your family spans from ${oldestYear} to ${youngestYear}`,
          priority: 1
        });
      }
    }

    // 2. Most common birth month
    if (membersWithBirthDate.length >= 3) {
      const monthCounts = {};
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];

      membersWithBirthDate.forEach(m => {
        const month = new Date(m.birth_date).getMonth();
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      });

      const topMonth = Object.entries(monthCounts)
        .sort((a, b) => b[1] - a[1])[0];

      if (topMonth && topMonth[1] >= 2) {
        facts.push({
          icon: Baby,
          color: 'from-pink-500 to-rose-600',
          bgColor: 'bg-pink-50',
          title: `${monthNames[parseInt(topMonth[0])]} Babies`,
          description: `${topMonth[1]} family members were born in ${monthNames[parseInt(topMonth[0])]}`,
          priority: 3
        });
      }
    }

    // 3. Most common first name
    const firstNameCounts = {};
    realMembers.forEach(m => {
      if (m.first_name && m.first_name.trim()) {
        const name = m.first_name.trim();
        firstNameCounts[name] = (firstNameCounts[name] || 0) + 1;
      }
    });

    const topFirstName = Object.entries(firstNameCounts)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])[0];

    if (topFirstName) {
      facts.push({
        icon: Award,
        color: 'from-amber-500 to-orange-600',
        bgColor: 'bg-amber-50',
        title: `${topFirstName[1]} ${topFirstName[0]}s`,
        description: `"${topFirstName[0]}" is the most popular first name in your family`,
        priority: 4
      });
    }

    // 4. Number of different surnames
    const surnames = new Set();
    realMembers.forEach(m => {
      if (m.last_name && m.last_name.trim()) {
        surnames.add(m.last_name.trim().toLowerCase());
      }
    });

    if (surnames.size >= 2) {
      facts.push({
        icon: Users,
        color: 'from-blue-500 to-cyan-600',
        bgColor: 'bg-blue-50',
        title: `${surnames.size} Family Names`,
        description: `Your family tree includes ${surnames.size} different surnames`,
        priority: 5
      });
    }

    // 5. Geographic spread
    const locations = new Set();
    realMembers.forEach(m => {
      if (m.birth_place && m.birth_place.trim()) {
        // Extract city or state
        const place = m.birth_place.trim().split(',')[0].trim();
        if (place) locations.add(place.toLowerCase());
      }
      if (m.current_location && m.current_location.trim()) {
        const place = m.current_location.trim().split(',')[0].trim();
        if (place) locations.add(place.toLowerCase());
      }
    });

    if (locations.size >= 3) {
      facts.push({
        icon: Globe,
        color: 'from-emerald-500 to-teal-600',
        bgColor: 'bg-emerald-50',
        title: `${locations.size} Locations`,
        description: `Family members have lived in ${locations.size} different places`,
        priority: 6,
        link: '/map'
      });
    }

    // 6. Marriages/Unions count
    if (unions.length >= 2) {
      facts.push({
        icon: Heart,
        color: 'from-red-500 to-pink-600',
        bgColor: 'bg-red-50',
        title: `${unions.length} Unions`,
        description: `${unions.length} marriages and partnerships in your family`,
        priority: 7
      });
    }

    // 7. Living members percentage
    if (realMembers.length >= 5) {
      const livingPercent = Math.round((livingMembers.length / realMembers.length) * 100);
      facts.push({
        icon: TrendingUp,
        color: 'from-green-500 to-emerald-600',
        bgColor: 'bg-green-50',
        title: `${livingMembers.length} Living Members`,
        description: `${livingPercent}% of your documented family is still with us`,
        priority: 8
      });
    }

    // 8. Decade with most births
    if (membersWithBirthDate.length >= 5) {
      const decadeCounts = {};
      membersWithBirthDate.forEach(m => {
        const year = new Date(m.birth_date).getFullYear();
        const decade = Math.floor(year / 10) * 10;
        decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
      });

      const topDecade = Object.entries(decadeCounts)
        .sort((a, b) => b[1] - a[1])[0];

      if (topDecade && topDecade[1] >= 2) {
        facts.push({
          icon: Calendar,
          color: 'from-indigo-500 to-purple-600',
          bgColor: 'bg-indigo-50',
          title: `The ${topDecade[0]}s`,
          description: `${topDecade[1]} family members were born in the ${topDecade[0]}s`,
          priority: 2
        });
      }
    }

    // 9. Age range of living members
    if (livingMembers.length >= 3) {
      const livingWithAge = livingMembers.filter(m => m.birth_date);
      if (livingWithAge.length >= 3) {
        const ages = livingWithAge.map(m => {
          const birth = new Date(m.birth_date);
          return Math.floor((new Date() - birth) / (365.25 * 24 * 60 * 60 * 1000));
        }).filter(age => age > 0 && age < 120);

        if (ages.length >= 3) {
          const youngest = Math.min(...ages);
          const oldest = Math.max(...ages);
          facts.push({
            icon: Sparkles,
            color: 'from-violet-500 to-fuchsia-600',
            bgColor: 'bg-violet-50',
            title: `Ages ${youngest} to ${oldest}`,
            description: `Living family members span ${oldest - youngest} years in age`,
            priority: 9
          });
        }
      }
    }

    // Sort by priority and return top facts
    return facts.sort((a, b) => a.priority - b.priority).slice(0, 6);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (facts.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Add more family members to see fun facts!</p>
        <Link
          to="/add"
          className="inline-block mt-3 text-blue-600 hover:text-blue-700 font-medium"
        >
          Add a family member →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-amber-500" />
        Fun Family Facts
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {facts.map((fact, index) => {
          const IconComponent = fact.icon;
          const content = (
            <div
              className={`group ${fact.bgColor} border border-gray-200 rounded-xl p-5
                         hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1
                         ${fact.link ? 'cursor-pointer' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${fact.color} text-white
                                shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-gray-700">
                    {fact.title}
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {fact.description}
                  </p>
                </div>
              </div>
            </div>
          );

          return fact.link ? (
            <Link key={index} to={fact.link}>
              {content}
            </Link>
          ) : (
            <div key={index}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FunFamilyFacts;
