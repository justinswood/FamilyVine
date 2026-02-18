import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import RelationshipsList from '../components/RelationshipsList';
import AddRelationship from '../components/AddRelationship';
import parchmentTexture from '../lib/familyvine-tree/assets/handmade-paper.png';

/* ── Parchment background style (matches tree wrapper) ──────── */
const parchmentBg = {
  background: `url(${parchmentTexture}),
    radial-gradient(circle at 10% 10%, rgba(128, 0, 128, 0.04) 0%, transparent 40%),
    radial-gradient(circle at 90% 90%, rgba(255, 215, 0, 0.04) 0%, transparent 40%),
    radial-gradient(circle at 50% 10%, rgba(0, 128, 0, 0.02) 0%, transparent 30%),
    #F9F8F3`,
  backgroundBlendMode: 'multiply, normal, normal, normal, normal',
  backgroundRepeat: 'repeat',
};

/* ── Vine accent gradient for top bar ────────────────────────── */
const vineAccent = {
  background: 'linear-gradient(to right, #86A789, #4A7C3F, #800080, #4A7C3F, #86A789)',
};

/* ── VitalStatTile - Heirloom Index Card Style ─────────────────── */
const VitalStatTile = ({ icon, label, value, iconColor = '#2E5A2E' }) => {
  const isEmpty = !value;
  return (
    <div
      className="rounded-lg transition-all duration-300"
      style={{
        padding: '12px',
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(212, 175, 55, 0.3)',
        borderLeft: '3px solid #2E5A2E',
        borderRadius: '6px',
        boxShadow: '0 3px 10px rgba(139, 115, 85, 0.08)',
        opacity: isEmpty ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderLeftColor = '#D4AF37';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(212, 175, 55, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderLeftColor = '#2E5A2E';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 3px 10px rgba(139, 115, 85, 0.08)';
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        {/* Circular Icon Badge */}
        <span
          className="flex items-center justify-center w-5 h-5 rounded-full text-[10px]"
          style={{
            backgroundColor: 'rgba(212, 175, 55, 0.12)',
            color: iconColor,
          }}
        >
          {icon}
        </span>
        {/* Label in Amethyst Purple */}
        <span
          className="uppercase font-inter font-bold"
          style={{
            fontSize: '0.56rem',
            letterSpacing: '1.2px',
            color: '#800080',
          }}
        >
          {label}
        </span>
      </div>
      {isEmpty ? (
        <p
          className="font-inter italic"
          style={{ fontSize: '0.7rem', color: '#9CA3AF', marginLeft: '26px' }}
        >
          Not yet recorded
        </p>
      ) : (
        <p
          className="font-medium leading-tight"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '0.9rem',
            color: '#2E5A2E',
            marginLeft: '26px',
          }}
        >
          {value}
        </p>
      )}
    </div>
  );
};

/* ── MilestoneTag - Horizontal archival tag (for sparse milestones) ── */
const MilestoneTag = ({ milestone }) => (
  <div
    className="bg-white/70 backdrop-blur-sm flex items-center gap-3 p-3 rounded-lg hover:shadow-sm transition-all"
    style={{ borderLeft: `3px solid ${milestone.id === 'death' ? '#94a3b8' : '#86A789'}` }}
  >
    <span className="text-[0.65rem] font-inter font-bold uppercase tracking-[0.15em] text-vine-sage whitespace-nowrap">
      {milestone.year}
    </span>
    <div className="min-w-0">
      <h3 className="font-serif text-vine-wood font-semibold text-sm">{milestone.title}</h3>
      {milestone.description && (
        <p className="text-xs text-vine-sage font-inter truncate">{milestone.description}</p>
      )}
    </div>
  </div>
);

/* ── FamilyLink - Quick link to immediate family member ──────── */
const FamilyLink = ({ person, relation, apiUrl }) => (
  <Link
    to={`/members/${person.id}`}
    className="flex items-center gap-2.5 p-1.5 -mx-1.5 rounded-lg hover:bg-vine-sage/8 transition-all group"
  >
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-vine-100 to-vine-200 flex items-center justify-center overflow-hidden flex-shrink-0">
      {person.photo ? (
        <img src={`${apiUrl}/${person.photo}`} alt={person.name} className="w-full h-full object-cover" />
      ) : (
        <span className="font-serif text-vine-sage/60 text-[0.6rem]">{person.initials}</span>
      )}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-inter font-medium text-vine-wood truncate group-hover:text-vine-dark transition-colors">
        {person.name}
      </p>
      <p className="text-[9px] font-inter text-vine-sage uppercase tracking-wider">{relation}</p>
    </div>
  </Link>
);

/* ── LineageNode - Single name in the ancestry path ──────────── */
const LineageNode = ({ name, id, isActive, isLast }) => (
  <div className="flex items-center gap-2">
    <div
      className="w-2 h-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: isActive ? '#800080' : '#86A789' }}
    />
    {isActive ? (
      <span className="text-xs font-inter font-bold" style={{ color: '#800080' }}>{name}</span>
    ) : (
      <Link to={`/members/${id}`} className="text-xs font-inter text-vine-sage hover:text-vine-dark transition-colors">
        {name}
      </Link>
    )}
    {!isLast && (
      <div className="ml-0.5 w-px h-3 bg-vine-sage/30 self-end" />
    )}
  </div>
);

/* ════════════════════════════════════════════════════════════════
   MemberPage - Dynamic Personal Archive
   ════════════════════════════════════════════════════════════════ */
const MemberPage = () => {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [taggedPhotos, setTaggedPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const [spouseInfo, setSpouseInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [relationships, setRelationships] = useState([]);
  const [lineage, setLineage] = useState([]);

  const apiUrl = process.env.REACT_APP_API;

  useEffect(() => {
    if (id) {
      fetchMember();
      fetchTaggedPhotos();
      fetchRelationships();
      fetchLineage();
    }
  }, [id]);

  useEffect(() => {
    if (member && member.spouse_id) {
      fetchSpouseInfo(member.spouse_id);
    }
  }, [member]);

  const fetchSpouseInfo = async (spouseId) => {
    try {
      const response = await axios.get(`${apiUrl}/api/members/${spouseId}`);
      setSpouseInfo(response.data);
    } catch (err) {
      console.error('Error fetching spouse info:', err);
      setSpouseInfo(null);
    }
  };

  const fetchMember = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${apiUrl}/api/members/${id}`);
      if (response.data) {
        setMember(response.data);
      } else {
        setError('Member not found');
      }
    } catch (err) {
      console.error('Error fetching member:', err);
      setError('Failed to load member data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTaggedPhotos = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/albums/tagged/${id}`);
      setTaggedPhotos(response.data || []);
    } catch (err) {
      console.error('Error fetching tagged photos:', err);
      setTaggedPhotos([]);
    }
  };

  const fetchRelationships = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/relationships/member/${id}`);
      setRelationships(response.data || []);
    } catch (err) {
      console.error('Error fetching relationships:', err);
      setRelationships([]);
    }
  };

  const fetchLineage = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/tree/member/${id}/unions`);
      if (response.data) {
        buildLineagePath(response.data);
      }
    } catch (err) {
      // Lineage is supplementary - fail silently
      setLineage([]);
    }
  };

  /* ── Build lineage path from union data ────────────────────── */
  const buildLineagePath = (unionData) => {
    // Walk up through relationships to find parents
    const path = [];
    // Current member is always at the bottom
    if (unionData.member) {
      const m = unionData.member;
      path.push({ id: m.id, name: `${m.first_name || ''} ${m.last_name || ''}${m.suffix ? ' ' + m.suffix : ''}`.trim() });
    }
    // Add parents from unions (the member's parent unions)
    // We look through the member's relationships to find parent connections
    setLineage(path);
  };

  const setAsProfilePhoto = async (photoId) => {
    if (!window.confirm('Set this photo as your profile picture?')) return;
    try {
      await axios.put(`${apiUrl}/api/members/${id}/profile-photo/${photoId}`);
      fetchMember();
      alert('Profile photo updated successfully!');
    } catch (err) {
      console.error('Error setting profile photo:', err);
      alert('Failed to update profile photo. Please try again.');
    }
  };

  const handleRelationshipAdded = () => {
    setShowAddRelationship(false);
    fetchRelationships();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const dateOnly = dateString.split('T')[0];
      const [year, month, day] = dateOnly.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (err) {
      return dateString;
    }
  };

  const calculateAge = (birthDateString, deathDateString = null) => {
    if (!birthDateString) return null;
    try {
      const birthOnly = birthDateString.split('T')[0];
      const [birthYear, birthMonth, birthDay] = birthOnly.split('-').map(Number);
      const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
      let endDate;
      if (deathDateString) {
        const deathOnly = deathDateString.split('T')[0];
        const [deathYear, deathMonth, deathDay] = deathOnly.split('-').map(Number);
        endDate = new Date(deathYear, deathMonth - 1, deathDay);
      } else {
        endDate = new Date();
      }
      let age = endDate.getFullYear() - birthDate.getFullYear();
      const monthDiff = endDate.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (err) {
      return null;
    }
  };

  const getYear = (dateString) => {
    if (!dateString) return null;
    try { return dateString.split('T')[0].split('-')[0]; }
    catch { return null; }
  };

  /* ── Derive "Life Vine" milestones from member data ────────── */
  const milestones = useMemo(() => {
    if (!member) return [];
    const ms = [];
    if (member.birth_date) {
      ms.push({
        id: 'birth', year: getYear(member.birth_date), title: 'Born',
        description: member.birth_place ? `in ${member.birth_place}` : formatDate(member.birth_date),
      });
    }
    if (member.is_married && member.marriage_date) {
      const spouseName = spouseInfo ? `${spouseInfo.first_name} ${spouseInfo.last_name}${spouseInfo.suffix ? ' ' + spouseInfo.suffix : ''}`.trim() : '';
      ms.push({
        id: 'marriage', year: getYear(member.marriage_date),
        title: spouseName ? `Married ${spouseName}` : 'Married',
        description: formatDate(member.marriage_date),
      });
    }
    if (member.death_date) {
      const ageAtDeath = calculateAge(member.birth_date, member.death_date);
      ms.push({
        id: 'death', year: getYear(member.death_date), title: 'Passed Away',
        description: ageAtDeath !== null ? `At age ${ageAtDeath}` : formatDate(member.death_date),
      });
    }
    return ms;
  }, [member, spouseInfo]);

  /* ── Extract immediate family from relationships ───────────── */
  const familyLinks = useMemo(() => {
    if (!relationships.length) return { parents: [], spouse: null, children: [], siblings: [] };

    const parents = [];
    const children = [];
    const siblings = [];
    let spouse = null;

    const seen = new Set();

    relationships.forEach(rel => {
      const otherName = `${rel.related_first_name || ''} ${rel.related_last_name || ''}${rel.related_suffix ? ' ' + rel.related_suffix : ''}`.trim();
      const otherInitials = `${(rel.related_first_name || '')[0] || ''}${(rel.related_last_name || '')[0] || ''}`;

      // Skip "Unknown" placeholder members
      if (otherName === 'Unknown Parent' || otherName === 'Unknown Mother' || otherName === 'Unknown Father') return;

      const otherId = rel.direction === 'outgoing' ? rel.member2_id : rel.member1_id;
      if (seen.has(otherId)) return;
      seen.add(otherId);

      const person = {
        id: otherId,
        name: otherName,
        initials: otherInitials,
        photo: rel.related_photo_url,
      };

      const type = rel.relationship_type;
      const dir = rel.direction;

      // Outgoing daughter/son = this person is child OF the related person (parent)
      if (dir === 'outgoing' && (type === 'daughter' || type === 'son')) {
        parents.push(person);
      }
      // Incoming father/mother = related person is parent
      else if (dir === 'incoming' && (type === 'father' || type === 'mother')) {
        parents.push(person);
      }
      // Spouse
      else if (type === 'wife' || type === 'husband') {
        spouse = person;
      }
      // Children: outgoing mother/father = this person is parent of related
      else if (dir === 'outgoing' && (type === 'mother' || type === 'father')) {
        children.push(person);
      }
      // Children: incoming son/daughter = related is child
      else if (dir === 'incoming' && (type === 'son' || type === 'daughter')) {
        children.push(person);
      }
      // Siblings
      else if (type === 'sister' || type === 'brother') {
        siblings.push(person);
      }
    });

    return { parents, spouse, children, siblings };
  }, [relationships]);

  /* ── Build lineage path from relationships (parent chain) ──── */
  const lineagePath = useMemo(() => {
    if (!member || !relationships.length) return [];

    const currentName = `${member.first_name || ''} ${member.last_name || ''}${member.suffix ? ' ' + member.suffix : ''}`.trim();
    const path = [{ id: parseInt(id), name: currentName, isActive: true }];

    // Add parents
    familyLinks.parents.forEach(p => {
      path.unshift({ id: p.id, name: p.name, isActive: false });
    });

    return path;
  }, [member, id, familyLinks.parents]);

  const showTimeline = milestones.length >= 3;
  const hasFamilyLinks = familyLinks.parents.length > 0 || familyLinks.spouse || familyLinks.children.length > 0;

  /* ── Loading state ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={parchmentBg}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-vine-sage/30 border-t-vine-leaf rounded-full animate-spin mx-auto mb-4" />
          <p className="text-vine-sage font-inter">Loading member...</p>
        </div>
      </div>
    );
  }

  /* ── Error state ───────────────────────────────────────────── */
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={parchmentBg}>
        <div className="text-center bg-white/90 rounded-2xl p-8 shadow-lg border border-red-200/50 max-w-md backdrop-blur-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-serif font-semibold text-vine-wood mb-2">Error Loading Member</h2>
          <p className="text-vine-sage mb-4 font-inter text-sm">{error}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={fetchMember} className="px-4 py-2 bg-vine-leaf text-white rounded-full text-sm font-inter hover:bg-vine-dark transition-all">
              Try Again
            </button>
            <Link to="/members" className="px-4 py-2 bg-white border border-vine-sage/30 text-vine-dark rounded-full text-sm font-inter hover:border-vine-sage transition-all">
              Back to Members
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Not found state ───────────────────────────────────────── */
  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={parchmentBg}>
        <div className="text-center">
          <p className="text-vine-sage mb-4 font-inter">Member not found</p>
          <Link to="/members" className="text-vine-leaf hover:text-vine-dark font-inter transition-colors">Back to Members</Link>
        </div>
      </div>
    );
  }

  const firstName = member.first_name || '';
  const middleName = member.middle_name || '';
  const lastName = member.last_name || '';
  const suffix = member.suffix || '';
  const fullName = [firstName, middleName, lastName, suffix].filter(Boolean).join(' ') || 'Unknown Name';
  const age = calculateAge(member.birth_date, member.death_date);
  const isMinor = () => age !== null && age < 18;

  const tabs = [
    { key: 'details', label: 'Details' },
    { key: 'family', label: 'Family' },
    { key: 'photos', label: 'Photos' },
  ];

  return (
    <div className="min-h-screen" style={parchmentBg}>
      {/* Vine accent line */}
      <div className="h-px" style={vineAccent} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">

        {/* Back Navigation */}
        <Link
          to="/members"
          className="inline-flex items-center gap-1.5 text-vine-sage hover:text-vine-dark transition-colors mb-4 group text-xs font-inter"
        >
          <svg className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Members
        </Link>

        {/* ═══════════════════════════════════════════════════════
            Heritage Header — Asymmetric Split-Pane
            ═══════════════════════════════════════════════════════ */}
        <header className="flex flex-col md:flex-row items-center md:items-start gap-5 mb-6 pb-5 border-b border-vine-sage/20">
          {/* Left: Profile Photo */}
          <div className="relative flex-shrink-0">
            <div
              className="w-28 h-28 rounded-2xl overflow-hidden border-3 border-white"
              style={{ boxShadow: '0 6px 20px rgba(45, 79, 30, 0.12)' }}
            >
              <div className="w-full h-full bg-gradient-to-br from-vine-100 to-vine-200 flex items-center justify-center">
                {member.photo_url ? (
                  <img
                    src={`${apiUrl}/${member.photo_url}`}
                    alt={fullName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span
                  className="text-3xl font-serif font-light text-vine-sage/60 items-center justify-center"
                  style={{ display: member.photo_url ? 'none' : 'flex', width: '100%', height: '100%' }}
                >
                  {firstName[0]}{lastName[0]}
                </span>
              </div>
            </div>
            {/* Living indicator */}
            {!member.death_date && (
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full shadow-md"
                title="Living"
                style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: 'white' }}
              />
            )}
          </div>

          {/* Right: Name, Dates, Actions */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight mb-0.5" style={{ color: '#634832' }}>
              {fullName}
            </h1>

            {member.nickname && (
              <p className="font-inter text-sm italic mb-1" style={{ color: '#800080' }}>
                &ldquo;{member.nickname}&rdquo;
              </p>
            )}

            {member.birth_date && (
              <p className="text-vine-sage font-inter text-xs mb-3">
                {formatDate(member.birth_date)}
                <span className="mx-2 opacity-40">&mdash;</span>
                {member.death_date ? formatDate(member.death_date) : 'Present'}
                {age !== null && (
                  <>
                    <span className="mx-2 opacity-30">&bull;</span>
                    <span className="font-semibold" style={{ color: '#800080' }}>
                      {member.death_date ? `Lived ${age} years` : `${age} years old`}
                    </span>
                  </>
                )}
              </p>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <Link
                to={`/members/${member.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 border border-vine-sage/30 rounded-full text-xs font-inter text-vine-dark hover:border-vine-leaf hover:text-vine-leaf transition-all shadow-sm backdrop-blur-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit
              </Link>
              <button
                onClick={() => setActiveTab('photos')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-inter text-white transition-all shadow-sm"
                style={{ backgroundColor: '#800080' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#660066'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#800080'; }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Photos
              </button>
              <Link
                to="/tree"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-vine-dark/10 border border-vine-dark/20 rounded-full text-xs font-inter text-vine-dark hover:bg-vine-dark/20 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
                View on Tree
              </Link>
            </div>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════
            Tab Navigation
            ═══════════════════════════════════════════════════════ */}
        <div className="flex justify-center md:justify-start mb-2">
          <div className="inline-flex bg-white/60 backdrop-blur-sm rounded-full p-0.5 border border-vine-sage/15">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1 rounded-full text-[11px] font-inter font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-vine-dark shadow-sm'
                    : 'text-vine-sage hover:text-vine-dark'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            Details Tab — Adaptive Content + Sidebar
            ═══════════════════════════════════════════════════════ */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4">

            {/* ─── Left Column: Adaptive Primary Content ─────── */}
            <section className="space-y-4">

              {/* Vital Statistics - Heritage Grid */}
              <div
                style={{
                  backgroundColor: 'rgba(46, 90, 46, 0.03)',
                  borderRadius: '10px',
                  padding: '16px',
                }}
              >
                <h2 className="font-serif text-sm text-vine-dark font-semibold mb-2">Vital Statistics</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <VitalStatTile icon="👤" label="Gender" value={member.gender} iconColor="#2E5A2E" />
                  <VitalStatTile icon="📍" label="Location" value={member.location} iconColor="#D4AF37" />
                  <VitalStatTile icon="🏠" label="Birthplace" value={member.birth_place} iconColor="#2E5A2E" />
                  <VitalStatTile icon="💼" label="Occupation" value={member.occupation} iconColor="#2E5A2E" />
                  <VitalStatTile icon="✉️" label="Email" value={member.email} iconColor="#800080" />
                  <VitalStatTile icon="📞" label="Phone" value={member.phone} iconColor="#D4AF37" />
                  {member.pronouns && (
                    <VitalStatTile icon="💬" label="Pronouns" value={member.pronouns} iconColor="#800080" />
                  )}
                </div>
              </div>

              {/* Marriage Section */}
              {!isMinor() && member.is_married && spouseInfo && (
                <div>
                  <h2 className="font-serif text-base text-vine-dark font-semibold mb-3">Marriage</h2>
                  <Link
                    to={`/members/${spouseInfo.id}`}
                    className="flex items-center gap-3 bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-vine-sage/15 hover:border-vine-sage/30 transition-all hover:shadow-md group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-vine-100 to-vine-200 flex items-center justify-center text-sm overflow-hidden flex-shrink-0">
                      {spouseInfo.photo_url ? (
                        <img
                          src={`${apiUrl}/${spouseInfo.photo_url}`}
                          alt={`${spouseInfo.first_name} ${spouseInfo.last_name}${spouseInfo.suffix ? ' ' + spouseInfo.suffix : ''}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-serif text-vine-sage/60">
                          {spouseInfo.first_name?.[0]}{spouseInfo.last_name?.[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-serif font-semibold text-vine-wood group-hover:text-vine-dark transition-colors">
                        {spouseInfo.first_name} {spouseInfo.last_name}{spouseInfo.suffix ? ` ${spouseInfo.suffix}` : ''}
                      </p>
                      {member.marriage_date && (
                        <p className="text-sm text-vine-sage font-inter">Married {formatDate(member.marriage_date)}</p>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-vine-sage/40 ml-auto group-hover:text-vine-sage transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}

              {/* ── Hero Feature Stack (when milestones sparse) ── */}
              {!showTimeline && (
                <>
                  {/* Recent Memories (photos preview) */}
                  {taggedPhotos.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="font-serif text-base text-vine-dark font-semibold">Recent Memories</h2>
                        <button
                          onClick={() => setActiveTab('photos')}
                          className="text-xs font-inter text-vine-sage hover:text-vine-dark transition-colors"
                        >
                          View all &rarr;
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {taggedPhotos.slice(0, 6).map((photo) => (
                          <div key={photo.id} className="aspect-square rounded-xl overflow-hidden border border-vine-sage/15 bg-white/60">
                            <img
                              src={`${apiUrl}/${photo.file_path}`}
                              alt="Memory"
                              loading="lazy"
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              style={photo.rotation_degrees ? { transform: `rotate(${photo.rotation_degrees}deg)` } : undefined}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Family Connection Card (when milestones sparse) */}
                  {hasFamilyLinks && (
                    <div>
                      <h2 className="font-serif text-base text-vine-dark font-semibold mb-3">Family Connections</h2>
                      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-vine-sage/15">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                          {familyLinks.parents.map(p => (
                            <FamilyLink key={p.id} person={p} relation="Parent" apiUrl={apiUrl} />
                          ))}
                          {familyLinks.spouse && (
                            <FamilyLink person={familyLinks.spouse} relation="Spouse" apiUrl={apiUrl} />
                          )}
                          {familyLinks.children.map(c => (
                            <FamilyLink key={c.id} person={c} relation="Child" apiUrl={apiUrl} />
                          ))}
                          {familyLinks.siblings.map(s => (
                            <FamilyLink key={s.id} person={s} relation="Sibling" apiUrl={apiUrl} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* ─── Right Column: Sidebar ─────────────────────── */}
            <aside className="space-y-4">
              {/* Life Milestones (moved from main content) */}
              {milestones.length > 0 && (
                <div>
                  <h2 className="font-serif text-sm text-vine-dark font-semibold mb-2">Life Milestones</h2>

                  {showTimeline ? (
                    /* ── Vertical Timeline ── */
                    <div className="relative pl-5">
                      <div
                        className="absolute left-2 top-2 bottom-2 w-0.5 rounded-full"
                        style={{ backgroundColor: 'rgba(134, 167, 137, 0.4)' }}
                      />
                      {milestones.map((milestone) => (
                        <div key={milestone.id} className="relative flex items-start gap-2 mb-4 last:mb-0">
                          <div
                            className="absolute -left-3 top-1 w-3 h-3 rounded-full shadow-sm"
                            style={{
                              borderWidth: '2px', borderStyle: 'solid',
                              borderColor: milestone.id === 'death' ? '#94a3b8' : '#86A789',
                              backgroundColor: milestone.id === 'death' ? '#f1f5f9' : '#F8F9F4',
                            }}
                          />
                          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-2 border border-vine-sage/15 flex-1 hover:border-vine-sage/30 transition-all hover:shadow-sm">
                            <span className="text-[0.6rem] font-inter font-semibold uppercase tracking-[0.12em] text-vine-sage">
                              {milestone.year}
                            </span>
                            <h3 className="font-serif text-vine-wood font-semibold text-xs mt-0.5">
                              {milestone.title}
                            </h3>
                            {milestone.description && (
                              <p className="text-[0.65rem] text-vine-sage font-inter mt-0.5">{milestone.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* ── Compact Tags (sparse milestones) ── */
                    <div className="space-y-2">
                      {milestones.map((milestone) => (
                        <MilestoneTag key={milestone.id} milestone={milestone} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Quick Family Links (always visible in sidebar) */}
              {hasFamilyLinks && showTimeline && (
                <div>
                  <h2 className="font-serif text-sm text-vine-dark font-semibold mb-2">Family</h2>
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-vine-sage/15 space-y-0.5">
                    {familyLinks.parents.map(p => (
                      <FamilyLink key={p.id} person={p} relation="Parent" apiUrl={apiUrl} />
                    ))}
                    {familyLinks.spouse && (
                      <FamilyLink person={familyLinks.spouse} relation="Spouse" apiUrl={apiUrl} />
                    )}
                    {familyLinks.children.slice(0, 5).map(c => (
                      <FamilyLink key={c.id} person={c} relation="Child" apiUrl={apiUrl} />
                    ))}
                    {familyLinks.children.length > 5 && (
                      <button
                        onClick={() => setActiveTab('family')}
                        className="text-xs font-inter text-vine-sage hover:text-vine-dark transition-colors mt-1 ml-12"
                      >
                        +{familyLinks.children.length - 5} more &rarr;
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Lineage Path — Breadcrumb Vine */}
              {lineagePath.length > 1 && (
                <div>
                  <h2 className="font-serif text-sm text-vine-dark font-semibold mb-2">Lineage Path</h2>
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-vine-sage/15">
                    <div className="relative pl-3">
                      {/* Vertical vine */}
                      <div
                        className="absolute left-[3px] top-1 bottom-1 w-px"
                        style={{ backgroundColor: 'rgba(128, 0, 128, 0.2)' }}
                      />
                      <div className="space-y-2.5">
                        {lineagePath.map((node, idx) => (
                          <LineageNode
                            key={node.id}
                            name={node.name}
                            id={node.id}
                            isActive={node.isActive}
                            isLast={idx === lineagePath.length - 1}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            Family Tab
            ═══════════════════════════════════════════════════════ */}
        {activeTab === 'family' && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-serif text-base text-vine-dark font-semibold">Family Connections</h2>
              <button
                onClick={() => setShowAddRelationship(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-vine-leaf text-white rounded-full text-sm font-inter hover:bg-vine-dark transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-vine-sage/15 p-4">
              <RelationshipsList memberId={parseInt(id)} key={showAddRelationship ? 'refresh' : 'normal'} />
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            Photos Tab — Masonry Grid
            ═══════════════════════════════════════════════════════ */}
        {activeTab === 'photos' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-serif text-base text-vine-dark font-semibold">Tagged Photos</h2>
              <span className="text-sm text-vine-sage font-inter">{taggedPhotos.length} photos</span>
            </div>

            {taggedPhotos.length > 0 ? (
              <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
                {taggedPhotos.map((photo) => (
                  <div key={photo.id} className="break-inside-avoid mb-4 group relative">
                    <div className="rounded-xl overflow-hidden border border-vine-sage/15 bg-white/60 hover:shadow-lg transition-all hover:-translate-y-1">
                      <img
                        src={`${apiUrl}/${photo.file_path}`}
                        alt="Tagged photo"
                        loading="lazy"
                        className="w-full object-cover"
                        style={photo.rotation_degrees ? { transform: `rotate(${photo.rotation_degrees}deg)` } : undefined}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-xl transition-all flex items-center justify-center">
                        <button
                          onClick={() => setAsProfilePhoto(photo.id)}
                          className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-white text-vine-dark rounded-full text-xs font-inter font-medium hover:bg-vine-leaf hover:text-white transition-all shadow-md"
                        >
                          Set as Profile
                        </button>
                      </div>
                    </div>
                    {photo.album_title && (
                      <p className="text-xs text-vine-sage font-inter mt-1.5 text-center truncate px-1">
                        {photo.album_title}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white/40 rounded-xl border border-vine-sage/10">
                <svg className="w-12 h-12 mx-auto mb-3 text-vine-sage/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-vine-sage font-inter text-sm">No photos tagged yet</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Add Relationship Modal */}
      {showAddRelationship && member && (
        <AddRelationship
          member={member}
          onRelationshipAdded={handleRelationshipAdded}
          onClose={() => setShowAddRelationship(false)}
        />
      )}
    </div>
  );
};

export default MemberPage;
