import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';

/* ══════════════════════════════════════════════════════════
   Gilded Vellum Popup & Map Styles
   ══════════════════════════════════════════════════════════ */
const mapStyles = `
  /* CartoDB Voyager attribution */
  .leaflet-control-attribution {
    font-size: 9px !important;
    background: rgba(255, 253, 249, 0.85) !important;
  }

  /* Gilded Vellum Popup */
  .leaflet-popup-content-wrapper {
    border-radius: 10px !important;
    background-color: #fffdf9 !important;
    background-image:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E") !important;
    border: 1px solid rgba(212, 175, 55, 0.2) !important;
    box-shadow: 0 4px 16px rgba(45, 79, 30, 0.12) !important;
    max-width: 280px !important;
    min-width: 180px !important;
  }

  .leaflet-popup-content {
    margin: 14px !important;
    font-size: 13px !important;
    width: auto !important;
    overflow: visible !important;
    line-height: normal !important;
    white-space: normal !important;
    word-wrap: break-word !important;
  }

  .leaflet-popup-tip {
    background: #fffdf9 !important;
    border-right: 1px solid rgba(212, 175, 55, 0.15) !important;
    border-bottom: 1px solid rgba(212, 175, 55, 0.15) !important;
  }

  .leaflet-popup-close-btn {
    color: #86A789 !important;
  }

  /* Location header */
  .fv-popup {
    font-family: 'Inter', system-ui, sans-serif;
  }

  .fv-popup-header {
    text-align: center;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1.5px solid rgba(212, 175, 55, 0.25);
  }

  .fv-popup-title {
    font-family: 'Playfair Display', 'Georgia', serif;
    font-size: 15px;
    font-weight: 600;
    color: #2D4F1E;
    margin: 0;
    line-height: 1.3;
  }

  .fv-popup-count {
    display: inline-block;
    background: rgba(46, 90, 46, 0.1);
    color: #2E5A2E;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;
    margin-top: 4px;
    font-family: 'Inter', sans-serif;
  }

  .fv-popup-members {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .fv-popup-member {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    color: inherit;
    padding: 4px 6px;
    border-radius: 8px;
    transition: background-color 0.15s ease;
  }

  .fv-popup-member:hover {
    background-color: rgba(46, 90, 46, 0.06);
  }

  .fv-popup-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    border: 1.5px solid rgba(212, 175, 55, 0.3);
  }

  .fv-popup-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .fv-popup-initials {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #4A7C3F, #2E5A2E);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 10px;
  }

  .fv-popup-name {
    font-family: 'Playfair Display', 'Georgia', serif;
    font-weight: 600;
    font-size: 13px;
    color: #2D4F1E;
    line-height: 1.3;
  }

  .fv-popup-member:hover .fv-popup-name {
    color: #2E5A2E;
  }

  /* Cluster styling — Vine Green circles with Gold Leaf border */
  .marker-cluster {
    background: transparent !important;
  }

  .marker-cluster div {
    background-color: #2E5A2E !important;
    border: 3px solid #D4AF37 !important;
    color: #fff !important;
    font-family: 'Inter', sans-serif !important;
    font-weight: 700 !important;
    font-size: 12px !important;
    border-radius: 50% !important;
    width: 36px !important;
    height: 36px !important;
    line-height: 30px !important;
    margin-left: 2px !important;
    margin-top: 2px !important;
    text-align: center !important;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2) !important;
  }

  .marker-cluster-small {
    background: transparent !important;
  }

  .marker-cluster-small div {
    width: 34px !important;
    height: 34px !important;
    line-height: 28px !important;
  }

  .marker-cluster-medium {
    background: transparent !important;
  }

  .marker-cluster-medium div {
    width: 40px !important;
    height: 40px !important;
    line-height: 34px !important;
    font-size: 13px !important;
  }

  .marker-cluster-large {
    background: transparent !important;
  }

  .marker-cluster-large div {
    width: 46px !important;
    height: 46px !important;
    line-height: 40px !important;
    font-size: 14px !important;
  }

`;

// Inject styles
if (typeof document !== 'undefined') {
  const existing = document.getElementById('fv-map-styles');
  if (!existing) {
    const style = document.createElement('style');
    style.id = 'fv-map-styles';
    style.textContent = mapStyles;
    document.head.appendChild(style);
  }
}

/* ── Custom Vine Green Marker Icon ── */
const createFamilyIcon = (memberCount, isHometown = false) => {
  const size = memberCount > 1 ? 34 : 30;
  const glowFilter = isHometown
    ? 'filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.6)) drop-shadow(0 0 16px rgba(212, 175, 55, 0.3));'
    : 'filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));';
  return L.divIcon({
    className: 'individual-leaf-pin',
    html: `<div style="
      width: ${size}px; height: ${size * 1.35}px;
      position: relative; display: flex; align-items: flex-start; justify-content: center;
      ${glowFilter}
    ">
      <svg width="${size}" height="${size * 1.35}" viewBox="0 0 30 42">
        <defs>
          <linearGradient id="pin-grad-${memberCount}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#4A7C3F"/>
            <stop offset="100%" stop-color="#2E5A2E"/>
          </linearGradient>
        </defs>
        <path d="M15 0C8.4 0 3 5.4 3 12c0 8.1 12 28 12 28s12-19.9 12-28C27 5.4 21.6 0 15 0z"
              fill="url(#pin-grad-${memberCount})" stroke="#D4AF37" stroke-width="1.5"/>
        <circle cx="15" cy="12" r="5.5" fill="#fffdf9" opacity="0.9"/>
      </svg>
      ${memberCount > 1 ? `<span style="
        position: absolute; top: 5px; left: 50%; transform: translateX(-50%);
        font-size: 9px; font-weight: 700; color: #2E5A2E;
        font-family: 'Inter', sans-serif;
      ">${memberCount}</span>` : ''}
    </div>`,
    iconSize: [size, size * 1.35],
    iconAnchor: [size / 2, size * 1.35],
    popupAnchor: [0, -(size * 1.1)],
  });
};

/* ── Hometown detection (Picayune, MS) ── */
const isHometown = (locationName) => {
  if (!locationName) return false;
  const loc = locationName.toLowerCase();
  return loc.includes('picayune');
};


/* ── Persistent Geocode Cache ── */
const CACHE_KEY = 'familyVine_geocode_cache';
const CACHE_VERSION = '1.0';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000;

const loadCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      if (data.version === CACHE_VERSION && Date.now() - data.timestamp < CACHE_EXPIRY) {
        return new Map(data.cache);
      }
    }
  } catch (e) { /* ignore */ }
  return new Map();
};

const saveCache = (cache) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      version: CACHE_VERSION,
      timestamp: Date.now(),
      cache: Array.from(cache.entries()),
    }));
  } catch (e) { /* ignore */ }
};

let geocodeCache = loadCache();

/* ══════════════════════════════════════════════════════════
   MapPage Component
   ══════════════════════════════════════════════════════════ */
function MapPage() {
  const [locations, setLocations] = useState([]);
  const [migrationPaths, setMigrationPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMigration, setShowMigration] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState({ current: 0, total: 0 });

  // Compute total member count
  const totalMembers = useMemo(
    () => locations.reduce((sum, loc) => sum + (loc.members?.length || 0), 0),
    [locations]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${process.env.REACT_APP_API}/api/members/living-with-coordinates`
        );
        setLocations(response.data);

        // Cache for offline
        response.data.forEach(loc => {
          const key = loc.location.trim().toLowerCase();
          if (!geocodeCache.has(key)) {
            geocodeCache.set(key, { lat: loc.lat, lon: loc.lon, display_name: loc.display_name });
          }
        });
        saveCache(geocodeCache);
      } catch (err) {
        console.error('Error fetching member locations:', err);
        setError('Failed to load map data. Please try again.');
      } finally {
        setLoading(false);
        setGeocodingProgress({ current: 0, total: 0 });
      }
    };
    fetchData();
  }, []);

  // Fetch migration paths when toggle is enabled
  useEffect(() => {
    if (!showMigration || migrationPaths.length > 0) return;
    const fetchMigration = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API}/api/members/migration-paths`
        );
        setMigrationPaths(response.data);
      } catch (err) {
        console.error('Error fetching migration paths:', err);
      }
    };
    fetchMigration();
  }, [showMigration, migrationPaths.length]);

  /* ── Loading State ── */
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="flex justify-center space-x-2">
              {[0, 150, 300].map((d, i) => (
                <div key={i} className="animate-bounce" style={{ animationDelay: `${d}ms` }}>
                  <svg width="32" height="48" viewBox="0 0 24 36" className={['text-vine-600', 'text-vine-leaf', 'text-vine-sage'][i]}>
                    <path fill="currentColor" d="M12 0C7.6 0 4 3.6 4 8c0 5.4 8 20 8 20s8-14.6 8-20c0-4.4-3.6-8-8-8zm0 12c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" />
                  </svg>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 border-2 border-vine-300 rounded-full animate-ping opacity-20" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-vine-dark mb-2">Loading Family Map</h2>
          <p className="text-vine-sage mb-6">Placing your family on the world map...</p>
          {geocodingProgress.total > 0 ? (
            <div className="max-w-xs mx-auto bg-white/70 backdrop-blur-sm rounded-lg p-4 shadow-sm">
              <p className="text-sm text-vine-sage mb-2">
                Geocoding: {geocodingProgress.current} / {geocodingProgress.total}
              </p>
              <div className="w-full bg-vine-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-vine-500 to-vine-600 h-2 rounded-full transition-all"
                  style={{ width: `${(geocodingProgress.current / geocodingProgress.total) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-vine-600 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-vine-leaf rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-vine-sage rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              <span className="text-sm text-vine-sage ml-2">Processing locations</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Error State ── */
  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-vine-600 hover:bg-vine-dark text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ── Map Render ── */
  return (
    <div className="h-screen w-full relative">
      <MapContainer
        center={[29.95, -90.07]}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
        preferCanvas={true}
      >
        {/* CartoDB Voyager — warm heritage tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />


        {/* Migration Paths — Vine Green arcs */}
        {showMigration && migrationPaths.map((path, i) => (
          <Polyline
            key={`migration-${i}`}
            positions={[
              [path.birth_lat, path.birth_lon],
              [path.current_lat, path.current_lon],
            ]}
            pathOptions={{
              color: '#4A7C3F',
              weight: 1.5,
              opacity: 0.5,
              dashArray: '6, 8',
            }}
          >
            <Popup>
              <div className="fv-popup" style={{ fontSize: '11px' }}>
                <strong style={{ color: '#2D4F1E' }}>{path.name}</strong>
                <div style={{ color: '#86A789', marginTop: 2 }}>
                  {path.birth_place} → {path.current_location}
                </div>
              </div>
            </Popup>
          </Polyline>
        ))}

        {/* Clustered Markers */}
        <MarkerClusterGroup
          chunkedLoading
          showCoverageOnHover={false}
          spiderfyOnMaxZoom={true}
          maxClusterRadius={50}
          polygonOptions={{
            fillColor: '#2E5A2E',
            color: '#D4AF37',
            weight: 1,
            opacity: 0.4,
            fillOpacity: 0.06,
          }}
        >
          {locations.map((loc, index) => (
            <Marker
              key={index}
              position={[loc.lat, loc.lon]}
              icon={createFamilyIcon(loc.members.length, isHometown(loc.location))}
            >
              <Popup maxWidth={280} minWidth={180}>
                <div className="fv-popup">
                  <div className="fv-popup-header">
                    <h3 className="fv-popup-title">{loc.location}</h3>
                    {loc.members.length > 1 && (
                      <span className="fv-popup-count">{loc.members.length} members</span>
                    )}
                  </div>
                  <div className="fv-popup-members">
                    {loc.members.map((member) => (
                      <Link
                        key={member.id}
                        to={`/members/${member.id}`}
                        className="fv-popup-member"
                      >
                        <div className="fv-popup-avatar">
                          {member.photo ? (
                            <img
                              src={member.photo.startsWith('http') ? member.photo : `${process.env.REACT_APP_API}/${member.photo}`}
                              alt={member.name}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="fv-popup-initials" style={{ display: member.photo ? 'none' : 'flex' }}>
                            {member.name.charAt(0)}
                          </div>
                        </div>
                        <span className="fv-popup-name">{member.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* ── Info Panel — Gilded Vellum ── */}
      <div
        className="absolute bottom-20 left-4 z-[1000] rounded-xl p-2.5 max-w-[180px]"
        style={{
          backgroundColor: 'rgba(255, 253, 249, 0.92)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(212, 175, 55, 0.15)',
          boxShadow: '0 2px 12px rgba(45, 79, 30, 0.1)',
        }}
      >
        <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#2D4F1E', fontSize: '0.68rem', fontWeight: 700, marginBottom: 4 }}>
          Family Map
        </h3>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.58rem', color: '#86A789', lineHeight: 1.6 }}>
          <p>{totalMembers} members across {locations.length} locations</p>
        </div>

        {/* Migration Toggle */}
        <button
          onClick={() => setShowMigration(!showMigration)}
          className="mt-1.5 w-full flex items-center gap-1.5 text-[0.55rem] font-medium rounded-full px-2 py-0.5 transition-all"
          style={{
            fontFamily: "'Inter', sans-serif",
            color: showMigration ? '#fff' : '#2D4F1E',
            background: showMigration
              ? 'linear-gradient(135deg, #4A7C3F, #2D4F1E)'
              : 'rgba(134, 167, 137, 0.1)',
            border: `1px solid ${showMigration ? 'transparent' : 'rgba(134, 167, 137, 0.2)'}`,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          {showMigration ? 'Migration On' : 'Migration Paths'}
        </button>

        {locations.length === 0 && (
          <p style={{ color: '#dc2626', fontSize: '0.6rem', marginTop: 6 }}>
            No members have location data.
          </p>
        )}
      </div>
    </div>
  );
}

export default MapPage;
