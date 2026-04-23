import React, { useEffect, useRef, useState } from 'react';
import { useCreatePost } from '../hooks/useCreatePost';
import { useUserLocation } from '../hooks/useUserLocation';
import AddressSearcher from './AddressSearcher';

const UploadPost = ({ onSuccess, prefilledAddress = '', onAddressUsed }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    image: null,
  });
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const { submitPost, loading, error } = useCreatePost();
  const { userLocation } = useUserLocation();

  // Track whether we've already applied this particular prefilledAddress
  const lastAppliedRef = useRef('');
  const addressSearchRef = useRef(null);

  useEffect(() => {
    // Try prop first, then sessionStorage fallback
    const addr = prefilledAddress || sessionStorage.getItem('snapmap_prefill_address') || '';
    if (addr && addr !== lastAppliedRef.current) {
      lastAppliedRef.current = addr;
      setFormData((prev) => ({ ...prev, address: addr }));
      sessionStorage.removeItem('snapmap_prefill_address');
      onAddressUsed?.();
    }
  }, [prefilledAddress, onAddressUsed]);

  // Click outside to close address dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (addressSearchRef.current && !addressSearchRef.current.contains(e.target)) {
        // Trigger close by dispatching custom event
        const event = new CustomEvent('closeAddressDropdown');
        window.dispatchEvent(event);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    setFormData((prev) => ({ ...prev, image: file || null }));
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleAddressSelect = (address) => {
    setFormData((prev) => ({ ...prev, address }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) { setMessage('Please select an image.'); return; }
    setMessage('');
    try {
      await submitPost(formData);
      setMessage('Post uploaded successfully!');
      setFormData({ name: '', description: '', address: '', image: null });
      setPreview(null);
      lastAppliedRef.current = '';
      onSuccess?.();
    } catch {
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
        
        {/* Address Searcher with debounce + current location */}
        <label style={{ display: 'block', marginBottom: '1rem' }}>
          Address:
          <div ref={addressSearchRef}>
            <AddressSearcher
              currentLocation={userLocation}
              prefillAddress={formData.address}
              onSelect={handleAddressSelect}
            />
          </div>
        </label>

        <label>
          Upload Image:
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </label>
        {preview && <img src={preview} alt="Preview" style={{ width: '100%', marginTop: '10px' }} />}
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