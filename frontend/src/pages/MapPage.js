import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';

// Fix for default markers using CDN URLs instead of require
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAndGeocodeMembers = async () => {
      try {
        console.log('Fetching members...');
        const response = await axios.get(`${process.env.REACT_APP_API}/api/members`);
        const members = response.data;
        console.log('Members fetched:', members);

        // Filter members with valid locations
        const membersWithLocations = members.filter(member => 
          member.location && member.location.trim() !== ''
        );
        console.log('Members with locations:', membersWithLocations);

        if (membersWithLocations.length === 0) {
          console.log('No members have location data');
          setLocations([]);
          setLoading(false);
          return;
        }

        // Geocode each member's location
        const geocoded = await Promise.all(
          membersWithLocations.map(async (member) => {
            try {
              console.log(`Geocoding location for ${member.first_name} ${member.last_name}: ${member.location}`);
              
              // Using a more reliable geocoding service
              const geo = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: { 
                  format: 'json', 
                  q: member.location,
                  limit: 1,
                  addressdetails: 1
                },
                headers: { 
                  'User-Agent': 'FamilyVineApp/1.0 (contact@familyvine.app)',
                  'Accept': 'application/json'
                }
              });

              console.log(`Geocoding response for ${member.location}:`, geo.data);

              if (!geo.data || geo.data.length === 0) {
                console.log(`No geocoding results for: ${member.location}`);
                return null;
              }

              const result = {
                id: member.id,
                name: `${member.first_name} ${member.last_name}`,
                photo: member.photo_url,
                lat: parseFloat(geo.data[0].lat),
                lon: parseFloat(geo.data[0].lon),
                location: member.location
              };
              
              console.log('Successfully geocoded:', result);
              return result;
            } catch (error) {
              console.error('Geocoding error for', member.location, ':', error);
              return null;
            }
          })
        );

        const validLocations = geocoded.filter(Boolean);
        console.log('Final locations to display:', validLocations);
        setLocations(validLocations);
      } catch (error) {
        console.error('Error fetching members:', error);
        setError('Failed to load member data');
      } finally {
        setLoading(false);
      }
    };

    fetchAndGeocodeMembers();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <p className="text-xl">Loading map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <p className="text-xl text-red-600">{error}</p>
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
        {locations.map((loc) => (
          <Marker key={loc.id} position={[loc.lat, loc.lon]}>
            <Popup>
              <div className="text-center" style={{ minWidth: '150px' }}>
                <strong>{loc.name}</strong>
                <p className="text-sm text-gray-600 mt-1">{loc.location}</p>
                {loc.photo && (
                  <div className="mt-2">
                    <img
                      src={
                        loc.photo.startsWith('http') 
                          ? loc.photo  
                          : `${process.env.REACT_APP_API}${loc.photo}`
                      }
                      alt={loc.name}
                      style={{ 
                        width: '80px', 
                        height: '80px', 
                        objectFit: 'cover', 
                        borderRadius: '8px',
                        margin: '0 auto'
                      }}
                    />
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Debug info */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded shadow text-sm z-1000">
        <p><strong>Map Status:</strong></p>
        <p>Members with valid locations: {locations.length}</p>
        {locations.length === 0 && (
          <p className="text-red-600 mt-1">
            No members have location data.<br />
            Add locations to see pins on the map.
          </p>
        )}
        {locations.length > 0 && (
          <div className="mt-1">
            <p className="text-green-600">✓ Map should show pins</p>
            <p className="text-xs">Check console for detailed logs</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MapPage;