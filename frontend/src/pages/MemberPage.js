import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
            fontSize: '0.65rem',
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

/* ── SocialTile — VitalStatTile-style card for social links ────────── */
const SOCIAL_CONFIG = {
  Facebook: {
    color: '#1877F2',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    extract: (url) => {
      const m = url.match(/facebook\.com\/(?:profile\.php\?id=)?([^/?&#]+)/i);
      return m ? m[1] : url.replace(/^https?:\/\/(www\.)?/i, '');
    },
  },
  Instagram: {
    color: '#E4405F',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="#E4405F">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
    extract: (url) => {
      const m = url.match(/instagram\.com\/([^/?&#]+)/i);
      return m ? `@${m[1]}` : url.replace(/^https?:\/\/(www\.)?/i, '');
    },
  },
  LinkedIn: {
    color: '#0A66C2',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="#0A66C2">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    extract: (url) => {
      const m = url.match(/linkedin\.com\/in\/([^/?&#]+)/i);
      return m ? m[1] : url.replace(/^https?:\/\/(www\.)?/i, '');
    },
  },
};

const SocialTile = ({ platform, url }) => {
  const config = SOCIAL_CONFIG[platform];
  if (!config) return null;
  const displayName = config.extract(url);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-lg transition-all duration-300 block no-underline"
      style={{
        padding: '12px',
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(212, 175, 55, 0.3)',
        borderLeft: `3px solid ${config.color}`,
        borderRadius: '6px',
        boxShadow: '0 3px 10px rgba(139, 115, 85, 0.08)',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderLeftColor = config.color;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 6px 16px ${config.color}33`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderLeftColor = config.color;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 3px 10px rgba(139, 115, 85, 0.08)';
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="flex items-center justify-center w-5 h-5 rounded-full"
          style={{ backgroundColor: `${config.color}18` }}
        >
          {config.icon}
        </span>
        <span
          className="uppercase font-inter font-bold"
          style={{ fontSize: '0.65rem', letterSpacing: '1.2px', color: config.color }}
        >
          {platform}
        </span>
      </div>
      <p
        className="font-medium leading-tight truncate"
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '0.9rem',
          color: '#2E5A2E',
          marginLeft: '26px',
        }}
      >
        {displayName}
      </p>
    </a>
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

/* ── PhotoLightbox — iOS-compatible fullscreen viewer ──────────── */
const PhotoLightbox = ({ photos, currentIndex, onClose, onNavigate, apiUrl }) => {
  const touchStart = useRef(null);
  const touchDelta = useRef(0);
  const overlayRef = useRef(null);
  const savedScrollY = useRef(0);

  // Lock body scroll on mount (iOS Safari compatible)
  useEffect(() => {
    savedScrollY.current = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY.current}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, savedScrollY.current);
    };
  }, []);

  // Focus for keyboard support
  useEffect(() => {
    overlayRef.current?.focus();
  }, [currentIndex]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
    if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
  }, [currentIndex, photos.length, onClose, onNavigate]);

  // Touch handlers for swipe navigation
  const handleTouchStart = useCallback((e) => {
    touchStart.current = e.touches[0].clientX;
    touchDelta.current = 0;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (touchStart.current === null) return;
    touchDelta.current = e.touches[0].clientX - touchStart.current;
    // Prevent iOS pull-to-refresh / overscroll
    e.preventDefault();
  }, []);

  const handleTouchEnd = useCallback(() => {
    const SWIPE_THRESHOLD = 50;
    if (touchDelta.current > SWIPE_THRESHOLD && currentIndex > 0) {
      onNavigate(currentIndex - 1);
    } else if (touchDelta.current < -SWIPE_THRESHOLD && currentIndex < photos.length - 1) {
      onNavigate(currentIndex + 1);
    }
    touchStart.current = null;
    touchDelta.current = 0;
  }, [currentIndex, photos.length, onNavigate]);

  const photo = photos[currentIndex];
  const rotationStyle = photo.rotation_degrees ? { transform: `rotate(${photo.rotation_degrees}deg)` } : undefined;

  return (
    <div
      ref={overlayRef}
      className="lightbox-overlay"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
      role="dialog"
      aria-modal="true"
      aria-label="Photo lightbox"
    >
      {/* Close button — large touch target */}
      <button
        className="lightbox-close"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Previous arrow — always visible on mobile */}
      {currentIndex > 0 && (
        <button
          className="lightbox-nav lightbox-nav-prev"
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
          aria-label="Previous photo"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {/* Photo */}
      <img
        src={`${apiUrl}/${photo.file_path}`}
        alt={photo.album_title || 'Tagged photo'}
        className="lightbox-image"
        style={rotationStyle}
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />

      {/* Next arrow — always visible on mobile */}
      {currentIndex < photos.length - 1 && (
        <button
          className="lightbox-nav lightbox-nav-next"
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
          aria-label="Next photo"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}

      {/* Caption + swipe hint */}
      <div className="lightbox-caption">
        {photo.album_title && (
          <p className="text-white/90 text-sm font-inter">{photo.album_title}</p>
        )}
        <p className="text-white/50 text-xs font-inter mt-1">{currentIndex + 1} / {photos.length}</p>
        {photos.length > 1 && (
          <p className="lightbox-swipe-hint">Swipe to navigate</p>
        )}
      </div>
    </div>
  );
};

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
  const [lightboxIndex, setLightboxIndex] = useState(null);
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

  const hasSocials = member.facebook_url || member.instagram_url || member.linkedin_url;
  const tabs = [
    { key: 'details', label: 'Details' },
    { key: 'family', label: 'Family' },
    { key: 'photos', label: 'Photos' },
    ...(hasSocials ? [{ key: 'socials', label: 'Socials' }] : []),
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
        <header className="flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-5 mb-6 pb-5 border-b border-vine-sage/20">
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
                        {taggedPhotos.slice(0, 6).map((photo, index) => (
                          <div
                            key={photo.id}
                            className="aspect-square rounded-xl overflow-hidden border border-vine-sage/15 bg-white/60 cursor-pointer"
                            onClick={() => setLightboxIndex(index)}
                          >
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
                {taggedPhotos.map((photo, index) => (
                  <div key={photo.id} className="break-inside-avoid mb-4 group relative">
                    <div
                      className="photo-grid-item rounded-xl overflow-hidden border border-vine-sage/15 bg-white/60 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer"
                      onClick={() => setLightboxIndex(index)}
                    >
                      <img
                        src={`${apiUrl}/${photo.file_path}`}
                        alt="Tagged photo"
                        loading="lazy"
                        className="w-full object-cover"
                        style={photo.rotation_degrees ? { transform: `rotate(${photo.rotation_degrees}deg)` } : undefined}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      {/* Set as Profile — desktop hover only */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-xl transition-all flex items-center justify-center pointer-events-none">
                        <button
                          onClick={(e) => { e.stopPropagation(); setAsProfilePhoto(photo.id); }}
                          className="pointer-events-auto opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-white text-vine-dark rounded-full text-xs font-inter font-medium hover:bg-vine-leaf hover:text-white transition-all shadow-md hidden md:block"
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

        {/* ═══════════════════════════════════════════════════════
            Socials Tab
            ═══════════════════════════════════════════════════════ */}
        {activeTab === 'socials' && hasSocials && (
          <div
            style={{
              backgroundColor: 'rgba(46, 90, 46, 0.03)',
              borderRadius: '10px',
              padding: '16px',
            }}
          >
            <h2 className="font-serif text-sm text-vine-dark font-semibold mb-2">Social Media</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {member.facebook_url && <SocialTile platform="Facebook" url={member.facebook_url} />}
              {member.instagram_url && <SocialTile platform="Instagram" url={member.instagram_url} />}
              {member.linkedin_url && <SocialTile platform="LinkedIn" url={member.linkedin_url} />}
            </div>
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

      {/* Photo Lightbox — iOS-compatible with swipe + scroll lock */}
      {lightboxIndex !== null && taggedPhotos[lightboxIndex] && (
        <PhotoLightbox
          photos={taggedPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
          apiUrl={apiUrl}
        />
      )}
    </div>
  );
};

export default MemberPage;
