import { useEffect, useState } from 'react';
import './Feed.css';
import { getPhotos } from '../api';

const Feed = () => {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    getPhotos().then(setPhotos).catch(console.error);
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
