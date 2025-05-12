import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapPage() {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API}/api/members`).then(async (res) => {
      const members = res.data;

      const geocoded = await Promise.all(
        members.map(async (member) => {
          if (!member.location) return null;
          try {
            const geo = await axios.get('https://nominatim.openstreetmap.org/search', {
              params: { format: 'json', q: member.location },
              headers: { 'User-Agent': 'FamilyVineApp/1.0 (familyvine@example.com)' }
            });

            if (geo.data.length === 0) return null;

            return {
              id: member.id,
              name: member.name,
              photo: member.photo_url,
              lat: parseFloat(geo.data[0].lat),
              lon: parseFloat(geo.data[0].lon),
            };
          } catch (error) {
            console.error('Geocoding error for', member.location, error.message);
            return null;
          }
        })
      );

      setLocations(geocoded.filter(Boolean));
    });
  }, []);

  return (
    <div className="h-screen w-full">
      <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {locations.map((loc) => (
          <Marker key={loc.id} position={[loc.lat, loc.lon]}>
            <Popup>
              <strong>{loc.name}</strong>
              {loc.photo && (
                <div>
                  <img
                    src={`${process.env.REACT_APP_API}${loc.photo}`}
                    alt={loc.name}
                    style={{ width: '100px', marginTop: '5px' }}
                  />
                </div>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MapPage;
