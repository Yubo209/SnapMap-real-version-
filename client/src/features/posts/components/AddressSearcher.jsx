import React, { useState, useEffect, useRef, useMemo } from "react";
import { MapPin, X, Loader } from "lucide-react";
import "../../../style/address-searcher.css";

export default function AddressSearcher({ 
  onSelect, 
  currentLocation,
  prefillAddress = ""
}) {
  const [query, setQuery] = useState(prefillAddress);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [userCoords, setUserCoords] = useState(currentLocation || null);
  const [suggestions, setSuggestions] = useState([]);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Get user location (GPS only)
  useEffect(() => {
    if (currentLocation) {
      setUserCoords(currentLocation);
      console.log('📍 Using GPS location');
    }
  }, [currentLocation]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIdx(-1);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.trim().length >= 2) { // Only search if 2+ chars
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }, 150);
  };

  const handleInputBlur = () => {
    if (query.trim()) {
      setTimeout(() => {
        if (onSelect) {
          onSelect(query);
        }
      }, 50);
    }
  };

  // Fetch from Mapbox Autocomplete API
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setIsOpen(false);
      return;
    }

    const fetchAutocomplete = async () => {
      setLoading(true);
      try {
        const token = import.meta.env.VITE_MAPBOX_TOKEN;
        
        // Build proximity from user coords
        let proximityParam = '';
        if (userCoords) {
          proximityParam = `&proximity=${userCoords.lng},${userCoords.lat}`;
        }

        // Mapbox Autocomplete endpoint (part of Geocoding API)
        // autocomplete=true enables autocomplete mode
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&autocomplete=true&limit=8${proximityParam}&types=address,place,region,poi`;

        console.log('🔍 Searching:', query);
        const res = await fetch(url);
        const data = await res.json();

        if (data.features && data.features.length > 0) {
          console.log('✅ Found', data.features.length, 'suggestions');
          setSuggestions(data.features);
          setIsOpen(true);
        } else {
          console.log('❌ No suggestions found');
          setSuggestions([]);
          setIsOpen(false);
        }
      } catch (err) {
        console.error('Autocomplete error:', err);
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchAutocomplete, 300);
    return () => clearTimeout(timer);
  }, [query, userCoords]);

  // Click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "Enter" && query.trim()) {
        handleSelectAddress(query);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIdx((i) => (i < suggestions.length - 1 ? i + 1 : i));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIdx((i) => (i > 0 ? i - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIdx >= 0) {
          handleSelectAddress(suggestions[selectedIdx].place_name);
        } else if (suggestions.length > 0) {
          handleSelectAddress(suggestions[0].place_name);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const handleSelectAddress = (address) => {
    setQuery(address);
    setIsOpen(false);
    setSelectedIdx(-1);
    if (onSelect) {
      onSelect(address);
    }
  };

  const handleCurrentLocation = async () => {
    if (!userCoords) return;
    
    try {
      const token = import.meta.env.VITE_MAPBOX_TOKEN;
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${userCoords.lng},${userCoords.lat}.json?access_token=${token}&types=address&limit=1`
      );
      const data = await res.json();
      
      if (data.features && data.features.length > 0) {
        const address = data.features[0].place_name;
        handleSelectAddress(address);
      } else {
        const addr = `${userCoords.lat.toFixed(5)}, ${userCoords.lng.toFixed(5)}`;
        handleSelectAddress(addr);
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
      const addr = `${userCoords.lat.toFixed(5)}, ${userCoords.lng.toFixed(5)}`;
      handleSelectAddress(addr);
    }
  };

  const handleClear = () => {
    setQuery("");
    setIsOpen(false);
    setSelectedIdx(-1);
    inputRef.current?.focus();
  };

  return (
    <div className="address-searcher-container" ref={containerRef}>
      <div className="address-searcher-box">
        <MapPin size={16} className="address-searcher-icon" />
        <input
          ref={inputRef}
          type="text"
          className="address-searcher-input"
          placeholder="Search address…"
          value={query}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && suggestions.length > 0 && setIsOpen(true)}
        />
        {loading && <Loader size={16} className="address-searcher-loading" />}
        {query && !loading && (
          <button
            className="address-searcher-clear"
            onClick={handleClear}
            aria-label="Clear"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {userCoords && !query && (
        <button 
          className="address-current-location"
          onClick={handleCurrentLocation}
        >
          <MapPin size={14} />
          Use current location
        </button>
      )}

      {isOpen && suggestions.length > 0 && (
        <div className="address-searcher-results">
          {suggestions.map((feature, idx) => (
            <button
              key={feature.id}
              className={`address-result-item${selectedIdx === idx ? " active" : ""}`}
              onClick={() => handleSelectAddress(feature.place_name)}
            >
              <MapPin size={14} className="address-result-icon" />
              <div className="address-result-text">
                <div className="address-result-name">{feature.place_name}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.trim() && suggestions.length === 0 && !loading && (
        <div className="address-searcher-empty">
          <p>No addresses found</p>
        </div>
      )}
    </div>
  );
}