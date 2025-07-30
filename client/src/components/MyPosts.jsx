import React, { useEffect, useState } from 'react';

const MyPosts = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5174/api/posts')
      .then(res => res.json())
      .then(data => setPosts(data))
      .catch(err => console.error('Failed to fetch posts', err));
  }, []);

  return (
    <div className="photo-grid">
      {posts.map((post, index) => (
        <div key={index}>
          <h4>{post.title}</h4>
          <img src={post.imageUrl} alt={post.name} style={{ width: '200px' }} />

          <p>{post.description}</p>
          <p>{post.address}</p>
        </div>
      ))}
    </div>
  );
};

export default MyPosts;
