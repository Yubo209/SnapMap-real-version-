import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useCreatePost } from '../hooks/useCreatePost';
import { useUserLocation } from '../hooks/useUserLocation';
import AddressSearcher from './AddressSearcher';
import './MobileUploadSheet.css';

const STEP_PICK    = 'pick';
const STEP_CROP    = 'crop';
const STEP_DETAILS = 'details';
const STEP_DONE    = 'done';

/* ── Crop canvas → blob ─────────────────────────────────────────── */
function getCroppedBlob(image, crop) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth  / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width  = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      image,
      crop.x * scaleX, crop.y * scaleY,
      crop.width * scaleX, crop.height * scaleY,
      0, 0, crop.width, crop.height
    );
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Canvas empty')),
      'image/jpeg', 0.92
    );
  });
}

function centerAspectCrop(w, h, aspect) {
  return centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, w, h), w, h);
}

/* ── Component ──────────────────────────────────────────────────── */
export default function MobileUploadSheet({ isOpen, onClose, onSuccess, prefilledAddress = '' }) {
  const [step,           setStep]           = useState(STEP_PICK);
  const [rawSrc,         setRawSrc]         = useState(null);
  const [rawFileName,    setRawFileName]    = useState('photo.jpg');
  const [crop,           setCrop]           = useState(null);
  const [completedCrop,  setCompletedCrop]  = useState(null);
  const [croppedBlob,    setCroppedBlob]    = useState(null);
  const [croppedPreview, setCroppedPreview] = useState(null);
  const [progress,       setProgress]       = useState(0);
  const [form,           setForm]           = useState({ name: '', description: '', address: '' });
  const [errorMsg,       setErrorMsg]       = useState('');

  const imgRef      = useRef(null);
  const albumRef    = useRef(null);
  const cameraRef   = useRef(null);
  const addressSearchRef = useRef(null);

  const { submitPost } = useCreatePost();
  const { userLocation } = useUserLocation();

  /* ── Reset ────────────────────────────────────────────────────── */
  const reset = useCallback(() => {
    setStep(STEP_PICK);
    setRawSrc(null);
    setCrop(null);
    setCompletedCrop(null);
    setCroppedBlob(null);
    setCroppedPreview(null);
    setProgress(0);
    setForm({ name: '', description: '', address: '' });
    setErrorMsg('');
  }, []);

  const handleClose = () => { reset(); onClose(); };

  /* ── Click outside to close address dropdown ────────────────────── */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (addressSearchRef.current && !addressSearchRef.current.contains(e.target)) {
        // Dispatch custom event to close dropdown
        const event = new CustomEvent('closeAddressDropdown');
        window.dispatchEvent(event);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ── Pick file ────────────────────────────────────────────────── */
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRawFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => { setRawSrc(reader.result); setStep(STEP_CROP); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const onImageLoad = (e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    // Initialize crop to full image (not constrained to 1:1)
    setCrop({
      unit: '%',
      width: 100,
      height: 100,
      x: 0,
      y: 0,
    });
  };

  const handleAddressSelect = (address) => {
    setForm((p) => ({ ...p, address }));
  };

  /* ── Confirm crop → details ───────────────────────────────────── */
  const handleConfirmCrop = async () => {
    if (!completedCrop || !imgRef.current) return;
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop);
      setCroppedBlob(blob);
      setCroppedPreview(URL.createObjectURL(blob));
      // Apply prefilled address (prop or sessionStorage)
      const addr = prefilledAddress || sessionStorage.getItem('snapmap_prefill_address') || '';
      if (addr) {
        sessionStorage.removeItem('snapmap_prefill_address');
        setForm((p) => ({ ...p, address: addr }));
      }
      setStep(STEP_DETAILS);
    } catch { setErrorMsg('Crop failed. Try again.'); }
  };

  /* ── Submit ───────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    const trimmedName = form.name.trim();
    const trimmedAddress = form.address.trim();
    
    if (!trimmedName) { setErrorMsg('Please add a location name.'); return; }
    if (!trimmedAddress) { setErrorMsg('Please add an address.'); return; }
    if (!croppedBlob) { setErrorMsg('No image.'); return; }
    setErrorMsg('');

    const imageFile = new File([croppedBlob], rawFileName, { type: 'image/jpeg' });
    setStep(STEP_DONE);

    // Fake progress animation
    let p = 0;
    const iv = setInterval(() => {
      p += 12;
      setProgress(Math.min(p, 88));
      if (p >= 88) clearInterval(iv);
    }, 120);

    try {
      await submitPost({ 
        name: trimmedName, 
        description: form.description.trim(), 
        address: trimmedAddress, 
        image: imageFile 
      });
      clearInterval(iv);
      setProgress(100);
      // Wait for upload to complete, then reload
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch {
      clearInterval(iv);
      setStep(STEP_DETAILS);
      setErrorMsg('Upload failed. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="mus-backdrop" onClick={handleClose}>
      <div className="mus-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="mus-handle" />

        {/* ═══════ PICK ═══════ */}
        {step === STEP_PICK && (
          <div className="mus-pick">
            <p className="mus-pick-title">New Spot</p>

            <button className="mus-pick-row" onClick={() => albumRef.current?.click()}>
              <span className="mus-pick-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </span>
              <span className="mus-pick-label">Choose from album</span>
              <svg className="mus-pick-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            <button className="mus-pick-row" onClick={() => cameraRef.current?.click()}>
              <span className="mus-pick-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </span>
              <div className="mus-pick-label-wrap">
                <span className="mus-pick-label">Camera</span>
                <span className="mus-pick-sub">Capture &amp; upload</span>
              </div>
              <svg className="mus-pick-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            <button className="mus-cancel" onClick={handleClose}>Cancel</button>

            <input ref={albumRef}  type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={handleFile} />
          </div>
        )}

        {/* ═══════ CROP ═══════ */}
        {step === STEP_CROP && rawSrc && (
          <div className="mus-crop">
            <div className="mus-nav">
              <button className="mus-nav-back" onClick={() => setStep(STEP_PICK)}>Back</button>
              <span className="mus-nav-title">Crop photo</span>
              <button className="mus-nav-next" onClick={handleConfirmCrop}>Next</button>
            </div>
            <div className="mus-crop-stage">
              <ReactCrop crop={crop} onChange={setCrop} onComplete={setCompletedCrop}>
                <img ref={imgRef} src={rawSrc} alt="crop" className="mus-crop-img" onLoad={onImageLoad} />
              </ReactCrop>
            </div>
            <p className="mus-crop-hint">Drag corners to adjust any shape</p>
          </div>
        )}

        {/* ═══════ DETAILS ═══════ */}
        {step === STEP_DETAILS && (
          <div className="mus-details">
            <div className="mus-nav">
              <button className="mus-nav-back" onClick={() => setStep(STEP_CROP)}>Back</button>
              <span className="mus-nav-title">Add details</span>
              <button className="mus-nav-next" onClick={handleSubmit}>Share</button>
            </div>
            <div className="mus-details-scroll" onClick={(e) => e.stopPropagation()}>  {/* ✅ 新增 */}
              {croppedPreview && (
                <div className="mus-details-top" onClick={(e) => e.stopPropagation()}>  {/* ✅ 新增 */}
                  <img src={croppedPreview} alt="preview" className="mus-thumb" />
                  <div className="mus-fields">
                    <input
                      className="mus-input mus-input--name"
                      type="text"
                      placeholder="Location name…"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      onClick={(e) => e.stopPropagation()}  // ✅ 新增
                    />
                  </div>
                </div>
              )}
              
              {/* Address Searcher with debounce + current location */}
              <div ref={addressSearchRef} onClick={(e) => e.stopPropagation()}>  {/* ✅ 新增 */}
                <AddressSearcher
                  currentLocation={userLocation}
                  prefillAddress={form.address}
                  onSelect={handleAddressSelect}
                />
              </div>
              
              <textarea
                className="mus-input mus-textarea"
                placeholder="Write a description…"
                rows={4}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                onClick={(e) => e.stopPropagation()}  // ✅ 新增
              />
              {errorMsg && <p className="mus-error">{errorMsg}</p>}
            </div>
          </div>
        )}

        {/* ═══════ UPLOADING ═══════ */}
        {step === STEP_DONE && (
          <div className="mus-uploading">
            {croppedPreview && <img src={croppedPreview} alt="" className="mus-upload-thumb" />}
            <p className="mus-upload-label">{progress < 100 ? 'Uploading…' : '✓ Done!'}</p>
            <div className="mus-progress-track">
              <div className="mus-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}