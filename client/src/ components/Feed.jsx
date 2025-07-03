import { useEffect, useState } from 'react';
import './Feed.css';

const Feed = () => {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/photos')
      .then(res => res.json())
      .then(data => setPhotos(data));
  }, []);

  return (
    <div className="feed">
      {photos.map((photo) => (
        <div className="photo-card" key={photo._id}>
          <img src={photo.imageUrl} alt="User Upload" />
          <p>{photo.caption}</p>
        </div>
      ))}
    </div>
  );
};
export default Feed;
