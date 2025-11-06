import React, { useEffect, useState } from 'react';
import { getPosts } from '../api';

const AVATAR_FALLBACK = '/default-avatar-icon-of-social-media-user-vector.jpg';

const cardStyle = {
  position: 'relative',
  border: '1px solid #ddd',
  borderRadius: '12px',
  padding: '1rem',
  marginBottom: '1rem',
  paddingRight: 130, 
};

const uploaderBox = {
  position: 'absolute',
  right: 16,
  top: '15%', 
  transform: 'translateY(-50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  background: 'transparent', 
  border: 'none',
  boxShadow: 'none',
  pointerEvents: 'none', 
};

const nameStyle = {
  fontWeight: 600,
  fontSize: 14,
  color: '#111827',
  whiteSpace: 'nowrap',
  maxWidth: 110,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  textAlign: 'center',
};

const avatarStyle = {
  width: 44,
  height: 44,
  borderRadius: '50%',
  objectFit: 'cover',
};

const AllSpots = () => {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('All');

  useEffect(() => {
    getPosts()
      .then(setPosts)
      .catch(err => console.error('Error fetching posts:', err));
  }, []);

  const extractCities = () => {
    const cities = new Set();
    posts.forEach(post => {
      const addr = post.address || '';
      const parts = addr.split(',');
      if (parts.length >= 2) cities.add(parts[parts.length - 2].trim());
    });
    return ['All', ...Array.from(cities)];
  };

  const filteredPosts = posts.filter(post => {
    const name = post.name?.toLowerCase() || '';
    const desc = post.description?.toLowerCase() || '';
    const address = post.address?.toLowerCase() || '';
    const q = search.toLowerCase();

    const matchKeyword = name.includes(q) || desc.includes(q) || address.includes(q);
    const matchCity = cityFilter === 'All' || (post.address && post.address.includes(cityFilter));
    return matchKeyword && matchCity;
  });

  return (
    <div style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2>📸 All Photography Spots</h2>

      <input
        type="text"
        placeholder="🔍 Search by keyword..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
      />

      <select
        value={cityFilter}
        onChange={(e) => setCityFilter(e.target.value)}
        style={{ marginBottom: '1rem', padding: '0.5rem' }}
      >
        {extractCities().map((city, idx) => (
          <option key={idx} value={city}>{city}</option>
        ))}
      </select>

      {filteredPosts.length > 0 ? (
        filteredPosts.map(post => {
          const author = post.user || {};
          const username = author.username || 'Unknown';
          const avatarUrl = author.avatarUrl || AVATAR_FALLBACK;

          return (
            <div key={post._id} style={cardStyle}>
              {}
              <div style={uploaderBox}>
                <img src={avatarUrl} alt={username} style={avatarStyle} />
                <div style={nameStyle}>{username}</div>
              </div>

              <h3>{post.name}</h3>
              <p><strong>Description:</strong> {post.description}</p>
              <p><strong>Address:</strong> {post.address}</p>
              <p><strong>Coordinates:</strong> {post.lat}, {post.lng}</p>

              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt="Spot"
                  style={{ maxWidth: '47%', marginTop: '0.5rem', borderRadius: '6px' }}
                />
              )}
            </div>
          );
        })
      ) : (
        <p>No matching posts found.</p>
      )}
    </div>
  );
};

export default AllSpots;
