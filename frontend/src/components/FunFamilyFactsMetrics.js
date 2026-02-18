import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  Users,
  Heart,
  Baby,
  Clock,
  Award,
  Trophy,
  Leaf,
  Compass,
  Crown,
  TreePine
} from 'lucide-react';
import axios from 'axios';
import DecryptedText from './DecryptedText';
import { useTheme } from '../contexts/ThemeContext';

// Brand palette
const VINE_GREEN = '#2E5A2E';
const VINE_DARK = '#2D4F1E';
const VINE_SAGE = '#86A789';
const GOLD_LEAF = '#D4AF37';
const AMETHYST = '#7B2D8E';
const PARCHMENT = '#F9F8F3';
const DARK_CARD = '#1a1a2e';

const FunFamilyFactsMetrics = () => {
  const { isDark } = useTheme();
  const [data, setData] = useState({
    metrics: [],
    facts: [],
    loading: true
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [membersRes, unionsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API}/api/members`),
        axios.get(`${process.env.REACT_APP_API}/api/tree/unions`).catch(() => ({ data: [] }))
      ]);

      const members = membersRes.data;
      const unions = unionsRes.data || [];

      if (members.length === 0) {
        setData({ metrics: [], facts: [], loading: false });
        return;
      }

      const metrics = calculateMetrics(members);
      const facts = calculateFacts(members, unions);

      setData({ metrics, facts, loading: false });
    } catch (error) {
      console.error('Error fetching family data:', error);
      setData({ metrics: [], facts: [], loading: false });
    }
  };

  const calculateMetrics = (members) => {
    const metrics = [];
    const currentDate = new Date();

    // Filter out placeholder members
    const realMembers = members.filter(m =>
      !m.first_name?.toLowerCase().includes('unknown') &&
      !m.last_name?.toLowerCase().includes('unknown')
    );

    // Total members
    metrics.push({
      icon: Users,
      iconBg: VINE_GREEN,
      accentColor: VINE_GREEN,
      title: 'Total Members',
      value: realMembers.length.toLocaleString(),
      priority: 1
    });

    // Average age
    const membersWithAge = realMembers.filter(m => m.birth_date && !m.death_date);
    const ages = membersWithAge.map(m => {
      const birthDate = new Date(m.birth_date);
      return Math.floor((currentDate - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
    }).filter(age => age > 0 && age < 120);

    if (ages.length > 0) {
      const avgAge = Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length);
      metrics.push({
        icon: Calendar,
        iconBg: VINE_SAGE,
        accentColor: VINE_DARK,
        title: 'Average Age',
        value: `${avgAge} years`,
        priority: 2
      });
    }

    // Most common surname
    const surnames = {};
    realMembers.forEach(m => {
      if (m.last_name && m.last_name.trim()) {
        const surname = m.last_name.trim();
        surnames[surname] = (surnames[surname] || 0) + 1;
      }
    });

    if (Object.keys(surnames).length > 0) {
      const topSurname = Object.keys(surnames).reduce((a, b) =>
        surnames[a] > surnames[b] ? a : b
      );
      metrics.push({
        icon: Trophy,
        iconBg: GOLD_LEAF,
        accentColor: GOLD_LEAF,
        title: 'Top Surname',
        value: topSurname,
        priority: 3
      });
    }

    // Oldest living member
    const livingWithBirth = realMembers.filter(m => m.birth_date && !m.death_date);
    if (livingWithBirth.length > 0) {
      const oldest = livingWithBirth.reduce((prev, curr) => {
        const prevDate = new Date(prev.birth_date);
        const currDate = new Date(curr.birth_date);
        return prevDate < currDate ? prev : curr;
      });
      metrics.push({
        icon: Crown,
        iconBg: AMETHYST,
        accentColor: AMETHYST,
        title: 'Oldest Member',
        value: `${oldest.first_name} ${oldest.last_name}`,
        priority: 4
      });
    }

    return metrics.sort((a, b) => a.priority - b.priority);
  };

  const calculateFacts = (members, unions) => {
    const facts = [];

    // Filter out placeholder members
    const realMembers = members.filter(m =>
      !m.first_name?.toLowerCase().includes('unknown') &&
      !m.last_name?.toLowerCase().includes('unknown')
    );

    const membersWithBirthDate = realMembers.filter(m => m.birth_date);

    // Year span
    if (membersWithBirthDate.length >= 2) {
      const birthYears = membersWithBirthDate.map(m => new Date(m.birth_date).getFullYear());
      const oldestYear = Math.min(...birthYears);
      const youngestYear = Math.max(...birthYears);
      const span = youngestYear - oldestYear;

      if (span > 0) {
        facts.push({
          icon: Clock,
          iconBg: VINE_GREEN,
          accentColor: VINE_GREEN,
          title: `${span} Years of History`,
          description: `Family spans ${oldestYear} to ${youngestYear}`,
          priority: 1
        });

        // Generations preserved (estimated from year span)
        const generations = Math.max(2, Math.ceil(span / 25));
        facts.push({
          icon: TreePine,
          iconBg: VINE_GREEN,
          accentColor: VINE_GREEN,
          title: `${generations} Generations`,
          description: `Generations preserved in tree`,
          priority: 2
        });
      }
    }

    // Decade with most births
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
          iconBg: GOLD_LEAF,
          accentColor: GOLD_LEAF,
          title: `The ${topDecade[0]}s`,
          description: `${topDecade[1]} members born then`,
          priority: 3
        });
      }
    }

    // Most common birth month
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
          iconBg: AMETHYST,
          accentColor: AMETHYST,
          title: `${monthNames[parseInt(topMonth[0])]} Babies`,
          description: `${topMonth[1]} born in ${monthNames[parseInt(topMonth[0])]}`,
          priority: 4
        });
      }
    }

    // Most common first name
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
        iconBg: GOLD_LEAF,
        accentColor: GOLD_LEAF,
        title: `${topFirstName[1]} ${topFirstName[0]}s`,
        description: `Most popular first name`,
        priority: 5
      });
    }

    // Number of different surnames
    const surnames = new Set();
    realMembers.forEach(m => {
      if (m.last_name && m.last_name.trim()) {
        surnames.add(m.last_name.trim().toLowerCase());
      }
    });

    if (surnames.size >= 2) {
      facts.push({
        icon: Leaf,
        iconBg: VINE_GREEN,
        accentColor: VINE_GREEN,
        title: `${surnames.size} Family Names`,
        description: `Different surnames in tree`,
        priority: 6
      });
    }

    // Geographic spread
    const locations = new Set();
    realMembers.forEach(m => {
      if (m.birth_place && m.birth_place.trim()) {
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
        icon: Compass,
        iconBg: VINE_GREEN,
        accentColor: VINE_GREEN,
        title: `${locations.size} Locations`,
        description: `Places family has lived`,
        priority: 7,
        link: '/map'
      });
    }

    // Marriages/Unions count
    if (unions.length >= 2) {
      facts.push({
        icon: Heart,
        iconBg: AMETHYST,
        accentColor: AMETHYST,
        title: `${unions.length} Unions`,
        description: `Marriages & partnerships`,
        priority: 8
      });
    }

    return facts.sort((a, b) => a.priority - b.priority).slice(0, 6);
  };

  // Shared card style
  const cardStyle = {
    backgroundColor: isDark ? DARK_CARD : PARCHMENT,
    border: `1px solid rgba(212, 175, 55, ${isDark ? '0.15' : '0.35'})`,
  };

  const cardHoverStyle = {
    boxShadow: isDark
      ? '0 10px 20px rgba(0, 0, 0, 0.25)'
      : '0 10px 20px rgba(0, 0, 0, 0.05)',
    borderColor: GOLD_LEAF,
  };

  if (data.loading) {
    return (
      <div className="animate-pulse">
        <div className="h-7 rounded w-56 mb-5" style={{ backgroundColor: isDark ? '#2a2a3e' : '#e8e4d8' }} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 rounded-lg" style={{ backgroundColor: isDark ? '#1a1a2e' : '#F5F0E6' }} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-lg" style={{ backgroundColor: isDark ? '#1a1a2e' : '#F5F0E6' }} />
          ))}
        </div>
      </div>
    );
  }

  if (data.metrics.length === 0 && data.facts.length === 0) {
    return (
      <div
        className="text-center py-8 rounded-lg"
        style={cardStyle}
      >
        <Sparkles className="w-12 h-12 mx-auto mb-3" style={{ color: GOLD_LEAF }} />
        <p style={{ color: isDark ? '#9ca3af' : '#666' }}>Add family members to see facts & metrics!</p>
        <Link
          to="/add"
          className="inline-block mt-3 font-medium hover:opacity-80 transition-opacity"
          style={{ color: VINE_GREEN }}
        >
          Add a family member &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Section Header */}
      <h2
        className="mb-6 flex items-center gap-2.5"
        style={{
          fontFamily: 'var(--font-header, "Playfair Display", serif)',
          fontSize: '1.35rem',
          fontWeight: 700,
          color: isDark ? '#e0d5c1' : VINE_DARK,
        }}
      >
        <Sparkles className="w-5 h-5" style={{ color: GOLD_LEAF }} />
        <DecryptedText
          text="Family by the Numbers"
          animateOn="view"
          speed={60}
          maxIterations={25}
          revealDirection="start"
          className=""
          parentClassName=""
          encryptedClassName=""
          style={{
            fontFamily: 'var(--font-header, "Playfair Display", serif)',
            fontSize: '1.35rem',
            fontWeight: 700,
            color: isDark ? '#e0d5c1' : VINE_DARK,
          }}
        />
        {/* Decorative gold line */}
        <span
          className="flex-1 ml-3"
          style={{
            height: '1px',
            background: `linear-gradient(to right, rgba(212, 175, 55, ${isDark ? '0.2' : '0.4'}), transparent)`,
            display: 'block',
          }}
        />
      </h2>

      {/* Metrics Row */}
      {data.metrics.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {data.metrics.map((metric, index) => {
            const IconComponent = metric.icon;
            const cardDelay = 150 + (index * 100);

            return (
              <div
                key={index}
                className="group rounded-lg p-4 transition-all duration-300 transform hover:-translate-y-1 cursor-default"
                style={cardStyle}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, cardHoverStyle);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '';
                  e.currentTarget.style.borderColor = `rgba(212, 175, 55, ${isDark ? '0.15' : '0.35'})`;
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="p-2 rounded-md text-white shadow-sm group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: metric.iconBg }}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Archival label */}
                    <h4
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        fontSize: '0.65rem',
                        color: isDark ? '#9ca3af' : '#666',
                        marginBottom: '4px',
                      }}
                    >
                      <DecryptedText
                        text={metric.title}
                        animateOn="view"
                        speed={60}
                        maxIterations={25}
                        revealDirection="start"
                        delay={cardDelay}
                        className=""
                        encryptedClassName=""
                      />
                    </h4>
                    {/* Serif value */}
                    <p
                      className="truncate"
                      style={{
                        fontFamily: 'var(--font-header, "Playfair Display", serif)',
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        color: isDark ? '#e0d5c1' : metric.accentColor,
                        lineHeight: 1.2,
                      }}
                    >
                      <DecryptedText
                        text={metric.value}
                        animateOn="view"
                        speed={60}
                        maxIterations={25}
                        revealDirection="center"
                        delay={cardDelay + 80}
                        className=""
                        encryptedClassName=""
                        characters="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz "
                      />
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Facts Grid */}
      {data.facts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.facts.map((fact, index) => {
            const IconComponent = fact.icon;
            const cardDelay = 400 + (index * 120);

            const content = (
              <div
                className={`group rounded-lg p-5 transition-all duration-300 transform hover:-translate-y-1 ${fact.link ? 'cursor-pointer' : 'cursor-default'}`}
                style={cardStyle}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, cardHoverStyle);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '';
                  e.currentTarget.style.borderColor = `rgba(212, 175, 55, ${isDark ? '0.15' : '0.35'})`;
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="p-2.5 rounded-lg text-white shadow-sm group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: fact.iconBg }}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Serif title */}
                    <h4
                      style={{
                        fontFamily: 'var(--font-header, "Playfair Display", serif)',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: isDark ? '#e0d5c1' : VINE_DARK,
                        marginBottom: '2px',
                      }}
                    >
                      <DecryptedText
                        text={fact.title}
                        animateOn="view"
                        speed={60}
                        maxIterations={25}
                        revealDirection="start"
                        delay={cardDelay}
                        className=""
                        encryptedClassName=""
                        characters="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz "
                      />
                    </h4>
                    {/* Meta description */}
                    <p
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '0.75rem',
                        color: isDark ? '#9ca3af' : '#666',
                        letterSpacing: '0.5px',
                      }}
                    >
                      <DecryptedText
                        text={fact.description}
                        animateOn="view"
                        speed={50}
                        maxIterations={20}
                        revealDirection="start"
                        delay={cardDelay + 100}
                        className=""
                        encryptedClassName=""
                      />
                    </p>
                  </div>
                </div>
              </div>
            );

            return fact.link ? (
              <Link key={index} to={fact.link} className="block">
                {content}
              </Link>
            ) : (
              <div key={index}>
                {content}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FunFamilyFactsMetrics;
