import React, { useState } from 'react';
import { useCreatePost } from '../hooks/useCreatePost';

const UploadPost = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    image: null,
  });

  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');

  const { submitPost, loading, error } = useCreatePost();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    setFormData((prev) => ({ ...prev, image: file || null }));
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.image) {
      setMessage('Please select an image.');
      return;
    }

    setMessage('');

    try {
      await submitPost(formData);
      setMessage('Post uploaded successfully!');
      setFormData({ name: '', description: '', address: '', image: null });
      setPreview(null);

      // Trigger AllSpots refresh without navigating away
      onSuccess?.();
    } catch (err) {
      setMessage('Failed to upload.');
    }
  };

  return (
    <div className="upload-form" style={{ maxWidth: '500px', margin: '2rem auto' }}>
      <h2>Upload New Photography Spot</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Location Name:
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </label>
        <br />
        <label>
          Description:
          <textarea name="description" value={formData.description} onChange={handleChange} required />
        </label>
        <br />
        <label>
          Address (or place name):
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            placeholder="e.g. Yosemite National Park, Tunnel View, California"
          />
          <small style={{ color: '#666' }}>
            Please include full location info (e.g. name + city + national park or region)
          </small>
        </label>
        <br />
        <label>
          Upload Image:
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </label>
        {preview && (
          <img src={preview} alt="Preview" style={{ width: '100%', marginTop: '10px' }} />
        )}
        <br />
        <button type="submit" disabled={loading}>
          {loading ? 'Uploading…' : 'Submit Post'}
        </button>
      </form>

      {message && <p style={{ marginTop: '1rem' }}>{message}</p>}
      {error && <p style={{ marginTop: '0.5rem', color: 'red' }}>{error.message}</p>}
    </div>
  );
};

export default UploadPost;