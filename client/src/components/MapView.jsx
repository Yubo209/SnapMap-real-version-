import React, { useEffect, useState } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { API_BASE } from '../api';
const customIcon = new L.Icon({
  iconUrl: '/icons8-map-pin-50.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const MapView = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/login`)
      .then(res => res.json())
      .then(data => {
        const validPosts = data.filter(p => typeof p.lat === 'number' && typeof p.lng === 'number');
        setPosts(validPosts);
      })
      .catch(err => console.error('Error loading posts:', err));
  }, []);

  const center = posts.length > 0 ? [posts[0].lat, posts[0].lng] : [40.7033, -73.9894];

  return (
    <MapContainer center={center} zoom={3} style={{ height: '500px', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {posts.map((post, index) => (
        <Marker key={index} position={[post.lat, post.lng]} icon={customIcon}>
          <Popup>
            <div style={{ textAlign: 'center' }}>
              
              <h3>{post.name}</h3>
              <img src={post.imageUrl} alt={post.title} width="120" />
              <p>📍 {post.lat.toFixed(4)}, {post.lng.toFixed(4)}</p>
              <p>{post.description}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;
