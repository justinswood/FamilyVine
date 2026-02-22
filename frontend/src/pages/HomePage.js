import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Github, Calendar, MapPin, BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import FunFamilyFactsMetrics from '../components/FunFamilyFactsMetrics';

/* ── Heritage Watermark (large faint background logo) ── */
const HeritageWatermark = () => (
  <div className="heritage-watermark">
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Stylized vine/tree watermark */}
      <path
        d="M100 180 L100 80 M100 80 Q60 60 40 30 M100 80 Q140 60 160 30"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Leaves */}
      <ellipse cx="55" cy="50" rx="15" ry="22" fill="currentColor" transform="rotate(-30, 55, 50)" />
      <ellipse cx="145" cy="50" rx="15" ry="22" fill="currentColor" transform="rotate(30, 145, 50)" />
      <ellipse cx="70" cy="75" rx="12" ry="18" fill="currentColor" transform="rotate(-20, 70, 75)" />
      <ellipse cx="130" cy="75" rx="12" ry="18" fill="currentColor" transform="rotate(20, 130, 75)" />
      <ellipse cx="100" cy="55" rx="14" ry="20" fill="currentColor" />
      {/* Roots */}
      <path
        d="M100 180 Q80 190 60 195 M100 180 Q120 190 140 195 M100 180 Q100 195 100 200"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  </div>
);

/* ── Organic Section Divider with Fleur-de-lis Logo ── */
const VineDivider = () => (
  <div className="vine-divider">
    <img
      src="/FamilyVine_homepage_logo.png?v=2"
      alt="FamilyVine divider"
      className="vine-divider-logo"
    />
  </div>
);

/* ── Marginal Artifact Icons (desktop only) ── */
const MarginalArtifacts = () => (
  <div className="marginal-artifacts">
    {/* Left margin artifacts */}
    <div className="marginal-artifact marginal-artifact-left marginal-artifact-1">
      {/* Fountain Pen */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
      </svg>
    </div>
    <div className="marginal-artifact marginal-artifact-left marginal-artifact-2">
      {/* Wax Seal */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <path d="M12 7v5l3 3" />
      </svg>
    </div>

    {/* Right margin artifacts */}
    <div className="marginal-artifact marginal-artifact-right marginal-artifact-3">
      {/* Antique Key */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7.5" cy="7.5" r="5.5" />
        <path d="m21 21-5.197-5.197" />
        <path d="M15.803 15.803 21 21" />
        <path d="m11.5 11.5 4-4" />
        <path d="m18 15 3 3" />
        <path d="m15 18 3 3" />
      </svg>
    </div>
    <div className="marginal-artifact marginal-artifact-right marginal-artifact-4">
      {/* Postage Stamp */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2" />
        <circle cx="12" cy="14" r="3" />
      </svg>
    </div>
  </div>
);

const SLIDE_INTERVAL = 6000; // 6 seconds per slide

const HomePage = () => {
  const [heroImages, setHeroImages] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const slideTimer = useRef(null);

  useEffect(() => {
    fetchHeroImages();
    return () => {
      clearInterval(slideTimer.current);
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

  return (
    <div className="homepage-heritage min-h-screen">
      {/* Heritage Watermark - large faint background logo */}
      <HeritageWatermark />

      {/* Marginal Artifacts - decorative icons in margins (desktop only) */}
      <MarginalArtifacts />

      <div className="max-w-7xl mx-auto px-4 py-3 relative z-10">

        {/* Hero — Interactive Storybook (60/40 Split) */}
        {loading ? (
          <div className="storybook-hero" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <div className="w-10 h-10 border-3 border-vine-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="storybook-hero" role="region" aria-label="Family photo slideshow">
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

      </div>

      {/* Fun Family Facts & Metrics Section */}
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <FunFamilyFactsMetrics />
      </div>

      {/* Organic Section Divider */}
      <VineDivider />

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
