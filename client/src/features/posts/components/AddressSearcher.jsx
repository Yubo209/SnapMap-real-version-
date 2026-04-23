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
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Debounce address search
  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIdx(-1);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.trim()) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }, 150);
  };

  // When input loses focus, submit the typed address
  const handleInputBlur = () => {
    if (query.trim()) {
      // Delay slightly to let click-outside handler run first
      setTimeout(() => {
        console.log('Input blur - submitting typed address:', query);
        if (onSelect) {
          onSelect(query);
        }
      }, 50);
    }
  };

  // Real search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setIsOpen(false);
      return;
    }

    const fetchAddresses = async () => {
      setLoading(true);
      try {
        const token = import.meta.env.VITE_MAPBOX_TOKEN;
        
        const searches = [];
        searches.push(
          fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=5&types=address,place,poi`)
        );
        
        if (/\d/.test(query)) {
          searches.push(
            fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query + ' street')}.json?access_token=${token}&limit=5&types=address`)
          );
        }
        
        searches.push(
          fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=5&types=place,region`)
        );
        
        const responses = await Promise.all(searches);
        const allFeatures = [];
        const seenIds = new Set();
        
        for (const res of responses) {
          const data = await res.json();
          if (data.features) {
            for (const feature of data.features) {
              if (!seenIds.has(feature.id)) {
                allFeatures.push(feature);
                seenIds.add(feature.id);
              }
            }
          }
        }
        
        // Smart ranking
        const ranked = allFeatures.sort((a, b) => {
          const aText = (a.place_name || '').toLowerCase();
          const bText = (b.place_name || '').toLowerCase();
          const q = query.toLowerCase();
          
          const aStartsWith = aText.startsWith(q) ? 1 : 0;
          const bStartsWith = bText.startsWith(q) ? 1 : 0;
          if (aStartsWith !== bStartsWith) return bStartsWith - aStartsWith;
          
          const aIsAddress = a.place_type?.includes('address') ? 1 : 0;
          const bIsAddress = b.place_type?.includes('address') ? 1 : 0;
          if (aIsAddress !== bIsAddress) return bIsAddress - aIsAddress;
          
          const aRelevance = a.relevance || 0;
          const bRelevance = b.relevance || 0;
          if (Math.abs(aRelevance - bRelevance) > 0.01) return bRelevance - aRelevance;
          
          return aText.length - bText.length;
        });
        
        const topResults = ranked.slice(0, 8);
        
        if (topResults.length > 0) {
          sessionStorage.setItem('__address_suggestions', JSON.stringify(topResults));
          setIsOpen(true);
        } else {
          setIsOpen(false);
        }
      } catch (err) {
        console.error('Address search error:', err);
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchAddresses, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get suggestions from sessionStorage
  const suggestions = useMemo(() => {
    try {
      const stored = sessionStorage.getItem('__address_suggestions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [isOpen]);

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
    console.log('Selected address:', address);
    setQuery(address);
    setIsOpen(false);
    setSelectedIdx(-1);
    // Make sure onSelect is called
    if (onSelect) {
      onSelect(address);
    }
  };

  const handleCurrentLocation = async () => {
    if (!currentLocation) return;
    
    try {
      const token = import.meta.env.VITE_MAPBOX_TOKEN;
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${currentLocation.lng},${currentLocation.lat}.json?access_token=${token}&types=address&limit=1`
      );
      const data = await res.json();
      
      if (data.features && data.features.length > 0) {
        const address = data.features[0].place_name;
        handleSelectAddress(address);
      } else {
        const addr = `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}`;
        handleSelectAddress(addr);
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
      const addr = `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}`;
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
          placeholder="Search address..."
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

      {currentLocation && (
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