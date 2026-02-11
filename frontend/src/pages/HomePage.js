import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Github, Calendar, MapPin, BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import FunFamilyFactsMetrics from '../components/FunFamilyFactsMetrics';

/* ── Leaf SVG Icon ── */
const LeafIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-3.5 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

const SLIDE_INTERVAL = 6000; // 6 seconds per slide

const HomePage = () => {
  const [heroImages, setHeroImages] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [facts, setFacts] = useState([]);
  const [currentFact, setCurrentFact] = useState(0);
  const slideTimer = useRef(null);
  const factTimer = useRef(null);

  useEffect(() => {
    fetchHeroImages();
    fetchFacts();
    return () => {
      clearInterval(slideTimer.current);
      clearInterval(factTimer.current);
    };
  }, []);

  /* Start slide auto-rotation when images are ready */
  useEffect(() => {
    if (heroImages.length > 1) {
      slideTimer.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % heroImages.length);
      }, SLIDE_INTERVAL);
    }
    return () => clearInterval(slideTimer.current);
  }, [heroImages]);

  /* Rotate facts every 8 seconds */
  useEffect(() => {
    if (facts.length > 1) {
      factTimer.current = setInterval(() => {
        setCurrentFact(prev => (prev + 1) % facts.length);
      }, 8000);
    }
    return () => clearInterval(factTimer.current);
  }, [facts]);

  const fetchHeroImages = async () => {
    try {
      // API first
      try {
        const response = await axios.get(`${process.env.REACT_APP_API}/api/hero-images`);
        if (response.data && response.data.length > 0) {
          setHeroImages(response.data);
          return;
        }
      } catch (error) {
        console.error('Error loading hero images from API:', error);
      }

      // localStorage fallback
      const savedHeroImages = localStorage.getItem('familyVine_heroImages');
      if (savedHeroImages) {
        try {
          const heroImgs = JSON.parse(savedHeroImages);
          if (heroImgs && heroImgs.length > 0) {
            setHeroImages(heroImgs);
            return;
          }
        } catch (error) {
          console.error('Error loading hero images from localStorage:', error);
        }
      }

      // Album photos fallback
      const response = await axios.get(`${process.env.REACT_APP_API}/api/albums`);
      const albums = response.data;
      if (albums.length > 0) {
        const allPhotos = [];
        for (const album of albums.slice(0, 3)) {
          try {
            const albumResponse = await axios.get(`${process.env.REACT_APP_API}/api/albums/${album.id}`);
            if (albumResponse.data.photos && albumResponse.data.photos.length > 0) {
              allPhotos.push(...albumResponse.data.photos.slice(0, 2).map(photo => ({
                ...photo,
                albumTitle: album.title
              })));
            }
          } catch (err) {
            console.error(`Error fetching album ${album.id}:`, err);
          }
        }
        setHeroImages(allPhotos.slice(0, 6));
      }
    } catch (err) {
      console.error("Error fetching photos:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacts = async () => {
    try {
      const [membersRes, unionsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API}/api/members`),
        axios.get(`${process.env.REACT_APP_API}/api/tree/unions`).catch(() => ({ data: [] }))
      ]);
      const members = membersRes.data || [];
      const unions = unionsRes.data || [];

      if (members.length === 0) return;

      const realMembers = members.filter(m =>
        !m.first_name?.toLowerCase().includes('unknown') &&
        !m.last_name?.toLowerCase().includes('unknown')
      );

      const computed = [];
      const currentDate = new Date();

      // Total members
      computed.push({ label: 'Family Size', text: `${realMembers.length} members across the vine` });

      // Year span
      const withBirth = realMembers.filter(m => m.birth_date);
      if (withBirth.length >= 2) {
        const years = withBirth.map(m => new Date(m.birth_date).getFullYear());
        const span = Math.max(...years) - Math.min(...years);
        if (span > 0) computed.push({ label: `${span} Years`, text: `of shared family history` });
      }

      // Most common surname
      const surnames = {};
      realMembers.forEach(m => { if (m.last_name?.trim()) surnames[m.last_name.trim()] = (surnames[m.last_name.trim()] || 0) + 1; });
      const topSurname = Object.entries(surnames).sort((a, b) => b[1] - a[1])[0];
      if (topSurname) computed.push({ label: topSurname[0], text: `is the most common surname (${topSurname[1]} members)` });

      // Oldest living
      const living = realMembers.filter(m => m.birth_date && !m.death_date);
      if (living.length > 0) {
        const oldest = living.reduce((a, b) => new Date(a.birth_date) < new Date(b.birth_date) ? a : b);
        const age = Math.floor((currentDate - new Date(oldest.birth_date)) / (365.25 * 24 * 60 * 60 * 1000));
        if (age > 0 && age < 120) computed.push({ label: `${oldest.first_name}`, text: `is the eldest at ${age} years` });
      }

      // Locations
      const locs = new Set();
      realMembers.forEach(m => {
        if (m.birth_place?.trim()) locs.add(m.birth_place.trim().split(',')[0].trim());
        if (m.current_location?.trim()) locs.add(m.current_location.trim().split(',')[0].trim());
      });
      if (locs.size >= 2) computed.push({ label: `${locs.size} Places`, text: `the family has called home` });

      // Unions
      if (unions.length >= 2) computed.push({ label: `${unions.length} Unions`, text: `marriages & partnerships recorded` });

      setFacts(computed);
    } catch (error) {
      console.error('Error fetching facts:', error);
    }
  };

  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
    // Reset timer
    clearInterval(slideTimer.current);
    if (heroImages.length > 1) {
      slideTimer.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % heroImages.length);
      }, SLIDE_INTERVAL);
    }
  }, [heroImages]);

  // Default photos fallback
  const defaultPhotos = [
    { id: 1, file_path: 'https://images.unsplash.com/photo-1511895426328-dc8714aecd1f?w=1200', caption: 'Family Moments', albumTitle: 'Memories' },
    { id: 2, file_path: 'https://images.unsplash.com/photo-1544968503-f06c29d5ee4d?w=1200', caption: 'Cherished Memories', albumTitle: 'Together' },
    { id: 3, file_path: 'https://images.unsplash.com/photo-1546015720-b8b30df5aa27?w=1200', caption: 'Special Occasions', albumTitle: 'Celebrations' }
  ];

  const photos = heroImages.length > 0 ? heroImages : defaultPhotos;
  const activePhoto = photos[currentSlide] || photos[0];

  // Build narrative content for the active photo
  const hasCaption = activePhoto?.caption || activePhoto?.albumTitle;
  const narrativeFact = facts.length > 0 ? facts[currentFact] : null;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-3 relative z-10">

        {/* Hero — Interactive Storybook (60/40 Split) */}
        {loading ? (
          <div className="storybook-hero" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <div className="w-10 h-10 border-3 border-vine-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="storybook-hero">
              {/* Left: Visual Column (60%) */}
              <div className="storybook-visual">
                {/* Slide counter pill */}
                {photos.length > 1 && (
                  <div className="storybook-slide-counter">
                    {currentSlide + 1} / {photos.length}
                  </div>
                )}

                {/* Page-turn slides */}
                {photos.map((photo, index) => (
                  <div
                    key={photo.id || index}
                    className={`storybook-slide ${index === currentSlide ? 'storybook-slide-active' : ''}`}
                  >
                    <img
                      src={photo.file_path?.startsWith('http') ?
                        photo.file_path :
                        `${process.env.REACT_APP_API}/${photo.file_path}`
                      }
                      alt={photo.caption || photo.albumTitle || 'Family photo'}
                      className="storybook-artifact-img"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1511895426328-dc8714aecd1f?w=1200';
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Right: Narrative Column (40%) */}
              <div className="storybook-narrative">
                {/* Overline — era or album */}
                <div className="storybook-overline">
                  {activePhoto?.albumTitle || 'Family Album'}
                </div>

                {/* Title — caption or fallback */}
                <h2 className="storybook-title">
                  {activePhoto?.caption || activePhoto?.albumTitle || 'A Moment in Time'}
                </h2>

                {/* Gold divider */}
                <div className="storybook-divider" />

                {/* Context items — location override, date, album */}
                {activePhoto?.hero_location_override && (
                  <div className="storybook-context-item">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{activePhoto.hero_location_override}</span>
                  </div>
                )}

                {activePhoto?.event_date && (
                  <div className="storybook-context-item">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(activePhoto.event_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}

                {activePhoto?.albumTitle && activePhoto?.caption && (
                  <div className="storybook-context-item">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>From the {activePhoto.albumTitle} collection</span>
                  </div>
                )}

                {/* Body text — curator blurb > description > family fact */}
                {activePhoto?.hero_blurb ? (
                  <p className="storybook-body">
                    {activePhoto.hero_blurb}
                  </p>
                ) : activePhoto?.description ? (
                  <p className="storybook-body">
                    {activePhoto.description}
                  </p>
                ) : narrativeFact ? (
                  <div className="storybook-body">
                    <span className="storybook-empty-fact">
                      {narrativeFact.label} — {narrativeFact.text}
                    </span>
                  </div>
                ) : (
                  <p className="storybook-body">
                    Every photograph holds a story waiting to be told. These are the moments that weave our family together.
                  </p>
                )}

                {/* Tagged members (cast ribbon) — curator tagged_members first, then photo tags */}
                {activePhoto?.tagged_members && activePhoto.tagged_members.length > 0 ? (
                  <div className="storybook-cast-ribbon">
                    <span className="storybook-cast-label">In this photo</span>
                    <div className="storybook-cast-avatars">
                      {activePhoto.tagged_members.slice(0, 5).map((member) => (
                        <div
                          key={member.id}
                          className="storybook-cast-avatar"
                          title={`${member.first_name} ${member.last_name}`}
                        >
                          {member.photo_url ? (
                            <img
                              src={`${process.env.REACT_APP_API}/${member.photo_url}`}
                              alt={`${member.first_name} ${member.last_name}`}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span>{member.first_name?.charAt(0)}</span>
                          )}
                        </div>
                      ))}
                      {activePhoto.tagged_members.length > 5 && (
                        <div className="storybook-cast-avatar" style={{ background: 'var(--vine-dark)' }}>
                          +{activePhoto.tagged_members.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                ) : activePhoto?.tags && activePhoto.tags.length > 0 ? (
                  <div className="storybook-cast-ribbon">
                    <span className="storybook-cast-label">In this photo</span>
                    <div className="storybook-cast-avatars">
                      {activePhoto.tags.slice(0, 5).map((tag, idx) => (
                        <div
                          key={tag.member_id || idx}
                          className="storybook-cast-avatar"
                          title={tag.member_name || 'Family member'}
                        >
                          {tag.photo_url ? (
                            <img
                              src={`${process.env.REACT_APP_API}/${tag.photo_url}`}
                              alt={tag.member_name || ''}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span>{(tag.member_name || '?').charAt(0)}</span>
                          )}
                        </div>
                      ))}
                      {activePhoto.tags.length > 5 && (
                        <div className="storybook-cast-avatar" style={{ background: 'var(--vine-dark)' }}>
                          +{activePhoto.tags.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* "Explore Gallery" link */}
                <Link to="/gallery" className="storybook-read-more">
                  Explore the Gallery
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Leaf Dot Pagination */}
            {photos.length > 1 && (
              <div className="hero-leaf-dots">
                {photos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`hero-leaf-dot ${index === currentSlide ? 'hero-leaf-dot-active' : ''}`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Live Facts Ticker */}
        {facts.length > 0 && (
          <div className="hero-facts-ticker" key={currentFact}>
            <div className="hero-ticker-icon">
              <LeafIcon className="w-4 h-4" />
            </div>
            <div className="hero-ticker-text hero-ticker-fact">
              <span className="hero-ticker-label">{facts[currentFact]?.label}</span>
              <span className="hero-ticker-description">{facts[currentFact]?.text}</span>
            </div>
          </div>
        )}
      </div>

      {/* Fun Family Facts & Metrics Section */}
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <FunFamilyFactsMetrics />
      </div>

      {/* Heirloom Footer */}
      <div className="heirloom-footer">
        <p className="heirloom-footer-text">
          <span className="heirloom-footer-brand">FamilyVine</span> · Built with love by Justin Woods · © {new Date().getFullYear()}
          <a
            href="https://github.com/justinswood/FamilyVine"
            target="_blank"
            rel="noopener noreferrer"
            className="heirloom-footer-github"
            title="View on GitHub"
          >
            <Github className="w-3.5 h-3.5" />
          </a>
        </p>
      </div>
    </div>
  );
};

export default HomePage;
