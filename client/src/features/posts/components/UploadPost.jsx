import React, { useEffect, useRef, useState } from 'react';
import { useCreatePost } from '../hooks/useCreatePost';
import { useUserLocation } from '../hooks/useUserLocation';
import AddressSearcher from './AddressSearcher';
import './UploadPost.css';

const UploadPost = ({ onSuccess, prefilledAddress = '', onAddressUsed }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    image: null,
  });
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
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
    setIsUploading(true);
    setProgress(0);

    // Fake progress animation
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 30;
      setProgress(Math.min(p, 85));
      if (p >= 85) clearInterval(iv);
    }, 200);

    try {
      await submitPost(formData);
      clearInterval(iv);
      setProgress(100);
      setMessage('✓ Upload successful! Reloading…');
      
      // Wait for upload to complete, then reload
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      clearInterval(iv);
      setIsUploading(false);
      setProgress(0);
      setMessage('Upload failed. Please try again.');
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        <h1 className="upload-title">Upload Photography Spot</h1>
        <p className="upload-subtitle">Share your favorite location with the community</p>

        <form className="upload-form" onSubmit={handleSubmit}>
          {/* Image Preview */}
          {preview && (
            <div className="upload-preview-section">
              <img src={preview} alt="Preview" className="upload-preview-img" />
              <button
                type="button"
                className="upload-preview-remove"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, image: null }));
                  setPreview(null);
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Location Name */}
          <div className="upload-field">
            <label className="upload-label">Location Name</label>
            <input
              type="text"
              name="name"
              placeholder="e.g., Oak Street Beach"
              value={formData.name}
              onChange={handleChange}
              className="upload-input"
              required
            />
          </div>

          {/* Address */}
          <div className="upload-field">
            <label className="upload-label">Address</label>
            <div ref={addressSearchRef}>
              <AddressSearcher
                currentLocation={userLocation}
                prefillAddress={formData.address}
                onSelect={handleAddressSelect}
              />
            </div>
          </div>

          {/* Description */}
          <div className="upload-field">
            <label className="upload-label">Description</label>
            <textarea
              name="description"
              placeholder="Tell us about this spot…"
              value={formData.description}
              onChange={handleChange}
              className="upload-textarea"
              rows={5}
              required
            />
          </div>

          {/* Image Upload */}
          <div className="upload-field">
            <label className="upload-label">Upload Image</label>
            <label className="upload-file-input">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="upload-file-hidden"
                required={!formData.image}
              />
              <span className="upload-file-label">
                {formData.image ? formData.image.name : 'Choose image or drag here'}
              </span>
            </label>
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="upload-progress-section">
              <div className="upload-progress-track">
                <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="upload-progress-text">
                {progress < 100 ? `Uploading… ${Math.floor(progress)}%` : '✓ Done!'}
              </p>
            </div>
          )}

          {/* Messages */}
          {message && (
            <p className={`upload-message ${message.includes('✓') ? 'upload-message--success' : 'upload-message--error'}`}>
              {message}
            </p>
          )}
          {error && (
            <p className="upload-message upload-message--error">
              {error.message}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || isUploading || !formData.image}
            className="upload-button"
          >
            {isUploading ? `Uploading ${progress}%` : loading ? 'Processing…' : 'Upload Spot'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadPost;