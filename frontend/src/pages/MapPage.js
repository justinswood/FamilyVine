import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';

// Custom popup styles
const popupStyles = `
  .leaflet-popup-content-wrapper {
    border-radius: 12px !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
    max-width: 300px !important;
    min-width: 200px !important;
  }
  
  .leaflet-popup-content {
    margin: 16px !important;
    font-size: 14px !important;
    width: auto !important;
    overflow: visible !important;
    line-height: normal !important;
    white-space: normal !important;
    word-wrap: break-word !important;
    font-family: system-ui, -apple-system, sans-serif !important;
  }
  
  .leaflet-popup-tip {
    background: white !important;
  }
  
  .family-location-popup {
    font-family: system-ui, -apple-system, sans-serif !important;
    width: 100% !important;
    max-width: 280px !important;
    overflow: visible !important;
    white-space: normal !important;
  }
  
  .location-header {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    margin-bottom: 12px !important;
    padding-bottom: 8px !important;
    border-bottom: 1px solid #e5e7eb !important;
    flex-direction: row !important;
    white-space: normal !important;
  }
  
  .location-title {
    font-size: 16px !important;
    font-weight: 600 !important;
    color: #374151 !important;
    margin: 0 !important;
    flex: 1 !important;
    white-space: normal !important;
    word-wrap: break-word !important;
    line-height: 1.2 !important;
  }
  
  .member-count {
    background: #dbeafe !important;
    color: #1e40af !important;
    padding: 2px 8px !important;
    border-radius: 12px !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    white-space: nowrap !important;
    margin-left: 8px !important;
  }
  
  .members-list {
    display: flex !important;
    flex-direction: column !important;
    gap: 8px !important;
    width: 100% !important;
  }
  
  .member-item {
    transition: transform 0.2s !important;
    width: 100% !important;
  }
  
  .member-item:hover {
    transform: translateX(2px) !important;
  }
  
  .member-link {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    text-decoration: none !important;
    color: inherit !important;
    width: 100% !important;
    flex-direction: row !important;
  }
  
  .member-link:hover {
    text-decoration: none !important;
  }
  
  .member-photo {
    width: 32px !important;
    height: 32px !important;
    border-radius: 50% !important;
    overflow: hidden !important;
    flex-shrink: 0 !important;
    position: relative !important;
    min-width: 32px !important;
  }
  
  .member-photo img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
  }
  
  .photo-placeholder {
    width: 100% !important;
    height: 100% !important;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: white !important;
    font-weight: bold !important;
    font-size: 14px !important;
  }
  
  .member-info {
    flex: 1 !important;
    min-width: 0 !important;
  }
  
  .member-name {
    font-weight: 500 !important;
    color: #374151 !important;
    display: block !important;
    text-decoration: none !important;
    white-space: normal !important;
    word-wrap: break-word !important;
    line-height: 1.3 !important;
  }
  
  .member-link:hover .member-name {
    color: #2563eb !important;
  }
  
  /* Override any global styles that might interfere */
  .leaflet-popup-content * {
    box-sizing: border-box !important;
  }
  
  /* Ensure no text rotation or transforms */
  .leaflet-popup .family-location-popup * {
    transform: none !important;
    writing-mode: horizontal-tb !important;
    text-orientation: mixed !important;
  }
`;

// Inject styles into the head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = popupStyles;
  document.head.appendChild(style);
}

// Fix for default markers using CDN URLs instead of require
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Add rate limiting delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Persistent cache for geocoded locations (survives page reloads)
const CACHE_KEY = 'familyVine_geocode_cache';
const CACHE_VERSION = '1.0'; // Increment to invalidate cache when needed
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Load cache from localStorage
const loadCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      if (data.version === CACHE_VERSION && Date.now() - data.timestamp < CACHE_EXPIRY) {
        return new Map(data.cache);
      }
    }
  } catch (error) {
    console.error('Error loading geocode cache:', error);
  }
  return new Map();
};

// Save cache to localStorage
const saveCache = (cache) => {
  try {
    const data = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      cache: Array.from(cache.entries())
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving geocode cache:', error);
  }
};

let geocodeCache = loadCache();

function MapPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [geocodingProgress, setGeocodingProgress] = useState({ current: 0, total: 0 });

  // Batch geocoding function with concurrent requests (respecting rate limits)
  const batchGeocodeLocations = async (locationGroups, originalCaseMap) => {
    const uniqueLocations = Object.keys(locationGroups);
    const batchSize = 3; // Process 3 locations concurrently
    const delayBetweenBatches = 2000; // 2 seconds between batches
    const geocodedLocations = [];
    
    // Filter out already cached locations for better progress tracking
    const uncachedLocations = uniqueLocations.filter(loc => !geocodeCache.has(loc));
    const totalToGeocode = uncachedLocations.length;
    
    setGeocodingProgress({ current: 0, total: totalToGeocode });
    
    let processedCount = 0;    
    // Process in batches to respect rate limits
    for (let i = 0; i < uniqueLocations.length; i += batchSize) {
      const batch = uniqueLocations.slice(i, i + batchSize);
      
      // Process batch concurrently
      const batchPromises = batch.map(async (location) => {
        const geoResult = await geocodeLocation(location);
        
        // Only increment progress for non-cached items
        if (!geocodeCache.has(location) || !geocodeCache.get(location)) {
          processedCount++;
          setGeocodingProgress({ current: processedCount, total: totalToGeocode });
        }
        
        if (geoResult) {
          const membersAtLocation = locationGroups[location].map(member => ({
            id: member.id,
            name: `${member.first_name} ${member.last_name}`,
            photo: member.photo_url,
            location: member.location
          }));

          return {
            lat: geoResult.lat,
            lon: geoResult.lon,
            location: originalCaseMap[location], // Use original case instead of member location
            display_name: geoResult.display_name,
            members: membersAtLocation
          };
        }
        return null;
      });
      
      const batchResults = await Promise.all(batchPromises);
      geocodedLocations.push(...batchResults.filter(Boolean));
      
      // Add delay between batches (except for the last batch)
      if (i + batchSize < uniqueLocations.length) {
        await delay(delayBetweenBatches);
      }
    }
    
    // Save cache after geocoding
    saveCache(geocodeCache);
    
    return geocodedLocations;
  };

  // Enhanced geocoding function with better error handling and reduced delays
  const geocodeLocation = async (location) => {
    // Check cache first
    if (geocodeCache.has(location)) {
      console.log(`Using cached result for: ${location}`);
      return geocodeCache.get(location);
    }

    try {
      // Reduced delay for free tier (500ms between concurrent requests)
      await delay(500);
      
      console.log(`Geocoding: ${location}`);
      
      const geo = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { 
          format: 'json', 
          q: location,
          limit: 1,
          addressdetails: 1
        },
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'FamilyVine App (Genealogy)'
        },
        timeout: 10000 // Increased timeout to 10 seconds
      });

      if (!geo.data || geo.data.length === 0) {
        console.log(`No results for: ${location}`);
        geocodeCache.set(location, null);
        return null;
      }

      const result = {
        lat: parseFloat(geo.data[0].lat),
        lon: parseFloat(geo.data[0].lon),
        display_name: geo.data[0].display_name
      };
      
      // Cache the result
      geocodeCache.set(location, result);
      console.log(`Successfully geocoded: ${location}`);
      return result;
    } catch (error) {
      console.error(`Geocoding error for ${location}:`, error.message);
      
      // Don't cache errors immediately - retry on next load
      // geocodeCache.set(location, null);
      
      return null;
    }
  };

  useEffect(() => {
    const fetchAndGeocodeMembers = async () => {
      try {
        console.log('Fetching members...');
        const response = await axios.get(`${process.env.REACT_APP_API}/api/members`);
        const members = response.data;
        
        // Filter members with valid locations (exclude deceased members)
        const membersWithLocations = members.filter(member => 
          member.location && 
          member.location.trim() !== '' &&
          !member.death_date // Exclude members who have a death date
        );
        
        console.log(`Found ${membersWithLocations.length} members with locations`);
        
        if (membersWithLocations.length === 0) {
          setLocations([]);
          setLoading(false);
          return;
        }

        // Group members by location to reduce geocoding calls
        const locationGroups = {};
        const originalCaseMap = {}; // Keep track of original case
        membersWithLocations.forEach(member => {
          const loc = member.location.trim().toLowerCase();
          const originalCase = member.location.trim();
          
          if (!locationGroups[loc]) {
            locationGroups[loc] = [];
            originalCaseMap[loc] = originalCase; // Store the first occurrence's original case
          }
          locationGroups[loc].push(member);
        });

        const uniqueLocations = Object.keys(locationGroups);
        console.log(`${uniqueLocations.length} unique locations to process`);
        
        // Check how many are already cached
        const cachedCount = uniqueLocations.filter(loc => geocodeCache.has(loc)).length;
        const needsGeocoding = uniqueLocations.length - cachedCount;
        
        console.log(`${cachedCount} locations cached, ${needsGeocoding} need geocoding`);
        
        // Process all locations (cached + new)
        const geocodedLocations = await batchGeocodeLocations(locationGroups, originalCaseMap);
        
        console.log(`Successfully processed ${geocodedLocations.length} member locations`);
        setLocations(geocodedLocations);
      } catch (error) {
        console.error('Error fetching members:', error);
        setError('Failed to load member data');
      } finally {
        setLoading(false);
        setGeocodingProgress({ current: 0, total: 0 });
      }
    };

    fetchAndGeocodeMembers();
  }, []);

  // Clear cache function (can be called manually if needed)
  const clearGeocodeCache = () => {
    geocodeCache.clear();
    localStorage.removeItem(CACHE_KEY);
    console.log('Geocode cache cleared');
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          {/* Cute map pin animation */}
          <div className="relative mb-6">
            <div className="flex justify-center space-x-2">
              {/* Animated map pins */}
              <div className="animate-bounce" style={{ animationDelay: '0ms' }}>
                <svg width="32" height="48" viewBox="0 0 24 36" className="text-red-500">
                  <path fill="currentColor" d="M12 0C7.6 0 4 3.6 4 8c0 5.4 8 20 8 20s8-14.6 8-20c0-4.4-3.6-8-8-8zm0 12c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/>
                </svg>
              </div>
              <div className="animate-bounce" style={{ animationDelay: '150ms' }}>
                <svg width="32" height="48" viewBox="0 0 24 36" className="text-blue-500">
                  <path fill="currentColor" d="M12 0C7.6 0 4 3.6 4 8c0 5.4 8 20 8 20s8-14.6 8-20c0-4.4-3.6-8-8-8zm0 12c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/>
                </svg>
              </div>
              <div className="animate-bounce" style={{ animationDelay: '300ms' }}>
                <svg width="32" height="48" viewBox="0 0 24 36" className="text-green-500">
                  <path fill="currentColor" d="M12 0C7.6 0 4 3.6 4 8c0 5.4 8 20 8 20s8-14.6 8-20c0-4.4-3.6-8-8-8zm0 12c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/>
                </svg>
              </div>
            </div>
            
            {/* Ripple effect behind pins */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 border-2 border-blue-200 rounded-full animate-ping opacity-20"></div>
              <div className="absolute w-16 h-16 border-2 border-green-200 rounded-full animate-ping opacity-30" style={{ animationDelay: '1s' }}></div>
              <div className="absolute w-12 h-12 border-2 border-red-200 rounded-full animate-ping opacity-40" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Loading Family Map</h2>
          <p className="text-gray-500 mb-6">Placing your family on the world map...</p>
          
          {/* Progress info (only show if geocoding is happening) */}
          {geocodingProgress.total > 0 ? (
            <div className="max-w-xs mx-auto bg-white/70 backdrop-blur-sm rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-2">
                Geocoding new locations: {geocodingProgress.current} / {geocodingProgress.total}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(geocodingProgress.current / geocodingProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              <span className="text-sm text-gray-500 ml-2">Processing cached locations</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative">
      <MapContainer 
        center={[29.95, -90.07]} // Centered on New Orleans
        zoom={4} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {locations.map((loc, index) => (
          <Marker key={index} position={[loc.lat, loc.lon]}>
            <Popup maxWidth={300} minWidth={200}>
              <div className="family-location-popup">
                <div className="location-header">
                  <h3 className="location-title">{loc.location}</h3>
                  {loc.members.length > 1 && (
                    <span className="member-count">{loc.members.length} people</span>
                  )}
                </div>
                
                <div className="members-list">
                  {loc.members.map((member) => (
                    <div key={member.id} className="member-item">
                      <Link to={`/members/${member.id}`} className="member-link">
                        <div className="member-photo">
                          {member.photo ? (
                            <img
                              src={
                                member.photo.startsWith('http') 
                                  ? member.photo  
                                  : `${process.env.REACT_APP_API}/${member.photo}`
                              }
                              alt={member.name}
                              onError={(e) => {
                                e.target.parentNode.innerHTML = `<div class="photo-placeholder">${member.name.charAt(0)}</div>`;
                              }}
                            />
                          ) : (
                            <div className="photo-placeholder">
                              {member.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="member-info">
                          <span className="member-name">{member.name}</span>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Enhanced info panel */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded shadow text-sm z-1000 max-w-xs">
        <p><strong>Map Status:</strong></p>
        <p>Members with locations: {locations.length}</p>
        <p>Cached locations: {geocodeCache.size}</p>
        {locations.length === 0 && (
          <p className="text-red-600 mt-1">
            No members have location data.<br />
            Add locations to member profiles to see pins.
          </p>
        )}
        {locations.length > 0 && (
          <div className="mt-1">
            <p className="text-green-600">✓ {locations.length} pins displayed</p>
            <p className="text-xs text-gray-500">
              Tip: Identical locations share the same pin
            </p>
          </div>
        )}
        {/* Debug: Add cache clear button (can be removed in production) */}
        <button 
          onClick={clearGeocodeCache}
          className="text-xs text-blue-600 underline mt-2"
          title="Clear geocode cache"
        >
          Clear Cache
        </button>
      </div>
    </div>
  );
}

export default MapPage;