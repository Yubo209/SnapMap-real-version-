import React, { useState } from 'react';
import { uploadImage, createPost } from '../api';

const UploadPost = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    image: null
  });

  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    setFormData(prev => ({ ...prev, image: file || null }));
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.image) {
      setMessage('Please select an image.');
      return;
    }

    setLoading(true);
    setMessage('');

    
    let lat = null, lng = null;
    try {
      if (formData.address) {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}`);
        const geoData = await geoRes.json();
        if (Array.isArray(geoData) && geoData.length > 0) {
          lat = parseFloat(geoData[0].lat);
          lng = parseFloat(geoData[0].lon);
        }
      }
    } catch (geoErr) {
      console.error("Geocoding failed:", geoErr);
      setMessage("Failed to resolve address to coordinates.");
      setLoading(false);
      return;
    }

    try {
      
      const up = await uploadImage(formData.image); // { url, public_id }

     
      await createPost({
        name: formData.name,
        description: formData.description,
        address: formData.address,
        imageUrl: up.url,
        imagePublicId: up.public_id,
        lat,
        lng
      });

      setMessage('✅ Post uploaded successfully!');
      setFormData({ name: '', description: '', address: '', image: null });
      setPreview(null);
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to upload.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-form" style={{ maxWidth: '500px', margin: '2rem auto' }}>
      <h2>Upload New Photography Spot</h2>
      <form onSubmit={handleSubmit}>
        <label>
          📍 Location Name:
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </label>
        <br />
        <label>
          📝 Description:
          <textarea name="description" value={formData.description} onChange={handleChange} required />
        </label>
        <br />
        <label>
          🗺️ Address (or place name):
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
          🖼️ Upload Image:
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </label>
        {preview && <img src={preview} alt="Preview" style={{ width: '100%', marginTop: '10px' }} />}
        <br />
        <button type="submit" disabled={loading}>{loading ? 'Uploading…' : 'Submit Post'}</button>
      </form>
      {message && <p style={{ marginTop: '1rem' }}>{message}</p>}
    </div>
  );
};

export default UploadPost;

