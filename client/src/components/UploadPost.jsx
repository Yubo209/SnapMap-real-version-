
import React, { useState } from 'react';

const UploadPost = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    image: null
  });

  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({ ...prev, image: file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let lat = null;
    let lng = null;

    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${formData.address}`);
      const geoData = await geoRes.json();
      if (geoData.length > 0) {
        lat = parseFloat(geoData[0].lat);
        lng = parseFloat(geoData[0].lon);
      }
    } catch (geoErr) {
      console.error("Geocoding failed:", geoErr);
      setMessage("Failed to resolve address to coordinates.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result;

      const payload = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        imageBase64: base64Image,
        lat,
        lng
      };

      try {
        const res = await fetch('http://localhost:5174/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          setMessage('✅ Post uploaded successfully!');
          setFormData({ name: '', description: '', address: '', image: null });
          setPreview(null);
        } else {
          setMessage('❌ Failed to upload.');
        }
      } catch (err) {
        console.error(err);
        setMessage('❌ Error uploading post.');
      }
    };

    if (formData.image) {
      reader.readAsDataURL(formData.image);
    } else {
      setMessage('Please select an image.');
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
        <button type="submit">Submit Post</button>
      </form>
      {message && <p style={{ marginTop: '1rem' }}>{message}</p>}
    </div>
  );
};

export default UploadPost;

