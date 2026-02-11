/**
 * Geocoding Service
 * Handles location geocoding with database caching and rate limiting
 * Converts location strings (e.g., "New Orleans, LA") to lat/lon coordinates
 *
 * Features:
 * - Cache-first lookup from database
 * - Nominatim API integration with rate limiting
 * - Automatic retry logic
 * - Error handling and logging
 * - Batch processing support
 */

const axios = require('axios');
const pool = require('../config/database');

// ============================================================================
// CONFIGURATION
// ============================================================================

const GEOCODING_CONFIG = {
  DELAY_MS: 1000,                // 1 second between requests (Nominatim policy compliant)
  TIMEOUT_MS: 10000,              // 10 second timeout per request
  MAX_RETRIES: 2,                 // Retry failed requests up to 2 times
  USER_AGENT: 'FamilyVine Genealogy App (family.techwoods.cc)',
  NOMINATIM_URL: 'https://nominatim.openstreetmap.org/search'
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Delay execution for specified milliseconds
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Resolves after delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Normalize location string for cache lookup
 * @param {string} location - Raw location string
 * @returns {string} Normalized location (lowercase, trimmed)
 */
function normalizeLocation(location) {
  if (!location) return '';
  return location.trim().toLowerCase();
}

// ============================================================================
// CACHE FUNCTIONS
// ============================================================================

/**
 * Get geocoded coordinates from database cache
 * @param {string} location - Location string to lookup
 * @returns {Promise<Object|null>} Cached geocoding data or null if not found
 */
async function getFromCache(location) {
  const normalized = normalizeLocation(location);
  if (!normalized) return null;

  try {
    const result = await pool.query(
      `UPDATE geocode_cache
       SET last_used_at = CURRENT_TIMESTAMP
       WHERE location_string = $1
       RETURNING *`,
      [normalized]
    );

    if (result.rows.length > 0) {
      console.log(`[Geocoding] Cache hit: ${location}`);
      return result.rows[0];
    }

    console.log(`[Geocoding] Cache miss: ${location}`);
    return null;
  } catch (error) {
    console.error('[Geocoding] Cache lookup error:', error.message);
    return null;
  }
}

/**
 * Save geocoding result to database cache
 * @param {string} location - Original location string
 * @param {Object} geocodeResult - Geocoding result from Nominatim
 * @param {number} geocodeResult.lat - Latitude
 * @param {number} geocodeResult.lon - Longitude
 * @param {string} geocodeResult.display_name - Full display name
 * @param {string} [geocodeResult.quality='exact'] - Geocoding quality
 */
async function saveToCache(location, geocodeResult) {
  const normalized = normalizeLocation(location);
  if (!normalized) return;

  try {
    await pool.query(
      `INSERT INTO geocode_cache
        (location_string, original_location, latitude, longitude, display_name, geocoding_quality)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (location_string)
       DO UPDATE SET
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         display_name = EXCLUDED.display_name,
         geocoding_quality = EXCLUDED.geocoding_quality,
         updated_at = CURRENT_TIMESTAMP`,
      [
        normalized,
        location.trim(),
        geocodeResult.lat,
        geocodeResult.lon,
        geocodeResult.display_name || location,
        geocodeResult.quality || 'exact'
      ]
    );

    console.log(`[Geocoding] Cached: ${location} → (${geocodeResult.lat}, ${geocodeResult.lon})`);
  } catch (error) {
    console.error('[Geocoding] Cache save error:', error.message);
  }
}

// ============================================================================
// EXTERNAL API FUNCTIONS
// ============================================================================

/**
 * Geocode location using Nominatim API
 * @param {string} location - Location to geocode
 * @param {number} [retryCount=0] - Current retry attempt
 * @returns {Promise<Object|null>} Geocoding result or null if failed
 */
async function geocodeWithNominatim(location, retryCount = 0) {
  try {
    // Rate limiting delay
    await delay(GEOCODING_CONFIG.DELAY_MS);

    console.log(`[Geocoding] Requesting from Nominatim: ${location} (attempt ${retryCount + 1})`);

    const response = await axios.get(GEOCODING_CONFIG.NOMINATIM_URL, {
      params: {
        format: 'json',
        q: location,
        limit: 1,
        addressdetails: 1
      },
      headers: {
        'User-Agent': GEOCODING_CONFIG.USER_AGENT,
        'Accept': 'application/json'
      },
      timeout: GEOCODING_CONFIG.TIMEOUT_MS
    });

    if (!response.data || response.data.length === 0) {
      console.warn(`[Geocoding] No results from Nominatim for: ${location}`);
      return null;
    }

    const result = response.data[0];
    console.log(`[Geocoding] Nominatim success: ${location} → ${result.display_name}`);

    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      display_name: result.display_name,
      quality: 'exact'
    };

  } catch (error) {
    // Retry logic for transient errors
    if (retryCount < GEOCODING_CONFIG.MAX_RETRIES) {
      console.warn(`[Geocoding] Retry ${retryCount + 1}/${GEOCODING_CONFIG.MAX_RETRIES} for: ${location}`);
      await delay(1000 * Math.pow(2, retryCount)); // Exponential backoff
      return geocodeWithNominatim(location, retryCount + 1);
    }

    console.error(`[Geocoding] Failed after ${GEOCODING_CONFIG.MAX_RETRIES} retries: ${location}`, error.message);
    return null;
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Geocode a single location (cache-first)
 * @param {string} location - Location string to geocode
 * @returns {Promise<Object|null>} Geocoding result with lat, lon, display_name, and cached flag
 */
async function geocodeLocation(location) {
  if (!location || location.trim() === '') {
    return null;
  }

  // Check cache first
  const cached = await getFromCache(location);
  if (cached) {
    return {
      lat: parseFloat(cached.latitude),
      lon: parseFloat(cached.longitude),
      display_name: cached.display_name,
      cached: true
    };
  }

  // Geocode with external API
  const result = await geocodeWithNominatim(location);

  // Save to cache if successful
  if (result) {
    await saveToCache(location, result);
    return { ...result, cached: false };
  }

  return null;
}

/**
 * Batch geocode multiple locations
 * @param {Array<string>} locations - Array of location strings
 * @returns {Promise<Map>} Map of location → geocoding result
 */
async function batchGeocodeLocations(locations) {
  const results = new Map();
  let cachedCount = 0;
  let geocodedCount = 0;
  let failedCount = 0;

  console.log(`[Geocoding] Batch geocoding ${locations.length} locations`);

  for (const location of locations) {
    try {
      const result = await geocodeLocation(location);
      if (result) {
        results.set(location, result);
        if (result.cached) {
          cachedCount++;
        } else {
          geocodedCount++;
        }
      } else {
        failedCount++;
        console.warn(`[Geocoding] Failed to geocode: ${location}`);
      }
    } catch (error) {
      failedCount++;
      console.error(`[Geocoding] Error geocoding ${location}:`, error.message);
    }
  }

  console.log(`[Geocoding] Batch complete: ${cachedCount} cached, ${geocodedCount} geocoded, ${failedCount} failed`);

  return results;
}

/**
 * Update member count for all cached locations
 * Useful for maintenance and analytics
 * @returns {Promise<number>} Number of cache entries updated
 */
async function updateMemberCounts() {
  try {
    const result = await pool.query(`
      UPDATE geocode_cache gc
      SET member_count = (
        SELECT COUNT(DISTINCT m.id)
        FROM members m
        WHERE LOWER(TRIM(m.location)) = gc.location_string
          AND m.death_date IS NULL
          AND m.location IS NOT NULL
          AND m.location != ''
      )
    `);

    console.log(`[Geocoding] Updated member counts for ${result.rowCount} cache entries`);
    return result.rowCount;
  } catch (error) {
    console.error('[Geocoding] Error updating member counts:', error.message);
    return 0;
  }
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache statistics
 */
async function getCacheStats() {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_cached,
        SUM(member_count) as total_members_using_cache,
        AVG(member_count) as avg_members_per_location,
        COUNT(*) FILTER (WHERE last_used_at > NOW() - INTERVAL '7 days') as used_recently,
        COUNT(*) FILTER (WHERE geocoding_quality = 'exact') as exact_count,
        COUNT(*) FILTER (WHERE geocoding_quality = 'approximate') as approx_count
      FROM geocode_cache
    `);

    return result.rows[0];
  } catch (error) {
    console.error('[Geocoding] Error getting cache stats:', error.message);
    return null;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  geocodeLocation,
  batchGeocodeLocations,
  getFromCache,
  normalizeLocation,
  updateMemberCounts,
  getCacheStats
};
