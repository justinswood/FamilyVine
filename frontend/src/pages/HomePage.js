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

/* ── Vine Garland Border (horizontal — top/bottom) ── */
const VineGarlandH = () => (
  <svg viewBox="0 0 1200 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="vine-garland-svg">
    {/* Main flowing vine stem */}
    <path d="M0 30 Q50 10, 100 28 T200 25 T300 32 T400 22 T500 30 T600 26 T700 32 T800 24 T900 30 T1000 27 T1100 32 T1200 28" stroke="#2E5A2E" strokeWidth="2" strokeLinecap="round" fill="none"/>
    {/* Secondary vine tendrils */}
    <path d="M80 28 Q90 15, 105 20" stroke="#3a6e3a" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    <path d="M250 30 Q260 45, 278 38" stroke="#3a6e3a" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    <path d="M420 24 Q430 10, 448 16" stroke="#3a6e3a" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    <path d="M620 28 Q635 45, 650 36" stroke="#3a6e3a" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    <path d="M830 26 Q840 12, 858 18" stroke="#3a6e3a" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    <path d="M1020 30 Q1035 46, 1048 38" stroke="#3a6e3a" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    {/* Leaves — alternating sides */}
    <path d="M60 28 C50 18, 40 16, 38 24 C36 30, 48 32, 60 28Z" fill="#2E5A2E"/>
    <path d="M70 30 C65 38, 58 42, 56 36 C54 30, 62 28, 70 30Z" fill="#3a6e3a"/>
    <path d="M150 26 C140 16, 130 14, 128 22 C126 28, 138 30, 150 26Z" fill="#2E5A2E"/>
    <path d="M160 28 C155 36, 148 40, 146 34 C144 28, 152 26, 160 28Z" fill="#3a6e3a"/>
    <path d="M280 32 C270 22, 260 20, 258 28 C256 34, 268 36, 280 32Z" fill="#2E5A2E"/>
    <path d="M290 30 C285 38, 278 42, 276 36 C274 30, 282 28, 290 30Z" fill="#3a6e3a"/>
    <path d="M380 24 C370 14, 360 12, 358 20 C356 26, 368 28, 380 24Z" fill="#2E5A2E"/>
    <path d="M470 28 C460 18, 450 16, 448 24 C446 30, 458 32, 470 28Z" fill="#2E5A2E"/>
    <path d="M480 30 C475 38, 468 42, 466 36 C464 30, 472 28, 480 30Z" fill="#3a6e3a"/>
    <path d="M570 26 C560 16, 550 14, 548 22 C546 28, 558 30, 570 26Z" fill="#2E5A2E"/>
    <path d="M680 32 C670 22, 660 20, 658 28 C656 34, 668 36, 680 32Z" fill="#2E5A2E"/>
    <path d="M690 30 C685 38, 678 42, 676 36 C674 30, 682 28, 690 30Z" fill="#3a6e3a"/>
    <path d="M780 24 C770 14, 760 12, 758 20 C756 26, 768 28, 780 24Z" fill="#2E5A2E"/>
    <path d="M870 28 C860 18, 850 16, 848 24 C846 30, 858 32, 870 28Z" fill="#2E5A2E"/>
    <path d="M880 30 C875 38, 868 42, 866 36 C864 30, 872 28, 880 30Z" fill="#3a6e3a"/>
    <path d="M970 26 C960 16, 950 14, 948 22 C946 28, 958 30, 970 26Z" fill="#2E5A2E"/>
    <path d="M1080 32 C1070 22, 1060 20, 1058 28 C1056 34, 1068 36, 1080 32Z" fill="#2E5A2E"/>
    <path d="M1150 26 C1140 16, 1130 14, 1128 22 C1126 28, 1138 30, 1150 26Z" fill="#2E5A2E"/>
    {/* Berries — amethyst purple */}
    <circle cx="120" cy="20" r="3" fill="#800080" opacity="0.8"/>
    <circle cx="125" cy="24" r="2.5" fill="#9a339a" opacity="0.7"/>
    <circle cx="320" cy="36" r="3" fill="#800080" opacity="0.8"/>
    <circle cx="325" cy="32" r="2.5" fill="#9a339a" opacity="0.7"/>
    <circle cx="530" cy="20" r="3" fill="#800080" opacity="0.8"/>
    <circle cx="535" cy="24" r="2.5" fill="#9a339a" opacity="0.7"/>
    <circle cx="730" cy="36" r="3" fill="#800080" opacity="0.8"/>
    <circle cx="735" cy="32" r="2.5" fill="#9a339a" opacity="0.7"/>
    <circle cx="930" cy="20" r="3" fill="#800080" opacity="0.8"/>
    <circle cx="935" cy="24" r="2.5" fill="#9a339a" opacity="0.7"/>
    <circle cx="1120" cy="36" r="3" fill="#800080" opacity="0.8"/>
    <circle cx="1125" cy="32" r="2.5" fill="#9a339a" opacity="0.7"/>
  </svg>
);

/* ── Vine Garland Border (vertical — left/right) ── */
const VineGarlandV = () => (
  <svg viewBox="0 0 60 1200" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="vine-garland-svg">
    {/* Main flowing vine stem */}
    <path d="M30 0 Q10 50, 28 100 T25 200 T32 300 T22 400 T30 500 T26 600 T32 700 T24 800 T30 900 T27 1000 T32 1100 T28 1200" stroke="#2E5A2E" strokeWidth="2" strokeLinecap="round" fill="none"/>
    {/* Tendrils */}
    <path d="M28 80 Q15 90, 20 105" stroke="#3a6e3a" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    <path d="M30 250 Q45 260, 38 278" stroke="#3a6e3a" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    <path d="M24 420 Q10 430, 16 448" stroke="#3a6e3a" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    <path d="M28 620 Q45 635, 36 650" stroke="#3a6e3a" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    <path d="M26 830 Q12 840, 18 858" stroke="#3a6e3a" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    <path d="M30 1020 Q46 1035, 38 1048" stroke="#3a6e3a" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    {/* Leaves */}
    <path d="M28 60 C18 50, 16 40, 24 38 C30 36, 32 48, 28 60Z" fill="#2E5A2E"/>
    <path d="M30 70 C38 65, 42 58, 36 56 C30 54, 28 62, 30 70Z" fill="#3a6e3a"/>
    <path d="M26 150 C16 140, 14 130, 22 128 C28 126, 30 138, 26 150Z" fill="#2E5A2E"/>
    <path d="M32 280 C22 270, 20 260, 28 258 C34 256, 36 268, 32 280Z" fill="#2E5A2E"/>
    <path d="M30 290 C38 285, 42 278, 36 276 C30 274, 28 282, 30 290Z" fill="#3a6e3a"/>
    <path d="M24 380 C14 370, 12 360, 20 358 C26 356, 28 368, 24 380Z" fill="#2E5A2E"/>
    <path d="M28 470 C18 460, 16 450, 24 448 C30 446, 32 458, 28 470Z" fill="#2E5A2E"/>
    <path d="M30 480 C38 475, 42 468, 36 466 C30 464, 28 472, 30 480Z" fill="#3a6e3a"/>
    <path d="M26 570 C16 560, 14 550, 22 548 C28 546, 30 558, 26 570Z" fill="#2E5A2E"/>
    <path d="M32 680 C22 670, 20 660, 28 658 C34 656, 36 668, 32 680Z" fill="#2E5A2E"/>
    <path d="M30 690 C38 685, 42 678, 36 676 C30 674, 28 682, 30 690Z" fill="#3a6e3a"/>
    <path d="M24 780 C14 770, 12 760, 20 758 C26 756, 28 768, 24 780Z" fill="#2E5A2E"/>
    <path d="M28 870 C18 860, 16 850, 24 848 C30 846, 32 858, 28 870Z" fill="#2E5A2E"/>
    <path d="M26 970 C16 960, 14 950, 22 948 C28 946, 30 958, 26 970Z" fill="#2E5A2E"/>
    <path d="M32 1080 C22 1070, 20 1060, 28 1058 C34 1056, 36 1068, 32 1080Z" fill="#2E5A2E"/>
    <path d="M26 1150 C16 1140, 14 1130, 22 1128 C28 1126, 30 1138, 26 1150Z" fill="#2E5A2E"/>
    {/* Berries */}
    <circle cx="20" cy="120" r="3" fill="#800080" opacity="0.8"/>
    <circle cx="24" cy="125" r="2.5" fill="#9a339a" opacity="0.7"/>
    <circle cx="36" cy="320" r="3" fill="#800080" opacity="0.8"/>
    <circle cx="32" cy="325" r="2.5" fill="#9a339a" opacity="0.7"/>
    <circle cx="20" cy="530" r="3" fill="#800080" opacity="0.8"/>
    <circle cx="24" cy="535" r="2.5" fill="#9a339a" opacity="0.7"/>
    <circle cx="36" cy="730" r="3" fill="#800080" opacity="0.8"/>
    <circle cx="32" cy="735" r="2.5" fill="#9a339a" opacity="0.7"/>
    <circle cx="20" cy="930" r="3" fill="#800080" opacity="0.8"/>
    <circle cx="24" cy="935" r="2.5" fill="#9a339a" opacity="0.7"/>
    <circle cx="36" cy="1120" r="3" fill="#800080" opacity="0.8"/>
    <circle cx="32" cy="1125" r="2.5" fill="#9a339a" opacity="0.7"/>
  </svg>
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

        {/* Hero — Gilded Storybook with Vine Flourish Frame */}
        <section className="hero-storybook-container">

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
                  <div className="storybook-context-item storybook-context-amethyst">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{activePhoto.hero_location_override}</span>
                  </div>
                )}

                {activePhoto?.event_date && (
                  <div className="storybook-context-item storybook-context-amethyst">
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

        </section>
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
