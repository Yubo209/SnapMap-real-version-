import React, { useMemo, useState, useRef, useEffect } from "react";
import "../../../style/AllSpots.css";

const AVATAR_FALLBACK = "/default-avatar-icon-of-social-media-user-vector.jpg";

function extractCityFromAddress(address = "") {
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  // Try to find city (usually second-to-last part before state/country)
  if (parts.length >= 2) return parts[parts.length - 2];
  if (parts.length === 1) return parts[0];
  return "";
}

function extractLandmarks(address = "") {
  // Extract key landmarks: National Parks, State Parks, Cities, etc.
  const keywords = [
    'National Park', 'State Park', 'Provincial Park',
    'Park', 'Forest', 'Monument', 'Preserve',
    'Beach', 'Canyon', 'Lake', 'Mountain',
  ];
  const found = [];
  for (const kw of keywords) {
    if (address.includes(kw)) found.push(kw);
  }
  return found;
}

export default function AllSpots({
  posts = [],
  isLoading = false,
  error = null,
  onOpenPost,
  initialCity = "All",
  initialSearch = "",
}) {
  /* ── Purely local state — never touches URL ─────────────────────
     Any URL write causes Dashboard to re-render → AllSpots re-mounts
     → input loses focus. Keep search 100% in component memory.     */
  const [search,     setSearch]     = useState(initialSearch);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [currentPage, setCurrentPage] = useState(1);
  const debounceRef = useRef(null);
  const searchWrapperRef = useRef(null);
  const ITEMS_PER_PAGE = 20;

  const handleClearFilters = () => {
    setSearch("");
    setShowDropdown(false);
    setSelectedIdx(-1);
    setCurrentPage(1);
  };

  /* ── Search recommendations ─────────────────────────────────────── */
  const recommendations = useMemo(() => {
    if (!search.trim()) return [];
    
    const q = search.trim().toLowerCase();
    const seen = new Set();
    const recs = [];

    // Extract unique spot names, cities, and landmarks
    for (const post of posts) {
      // By spot name
      const name = (post.name || "").trim();
      if (name && name.toLowerCase().includes(q) && !seen.has(name)) {
        seen.add(name);
        recs.push({ type: 'spot', text: name, value: name });
      }

      // By city
      const city = extractCityFromAddress(post.address || "");
      if (city && city.toLowerCase().includes(q) && !seen.has(city)) {
        seen.add(city);
        recs.push({ type: 'city', text: city, value: city });
      }

      // By landmarks
      const landmarks = extractLandmarks(post.address || "");
      for (const landmark of landmarks) {
        if (landmark.toLowerCase().includes(q) && !seen.has(landmark)) {
          seen.add(landmark);
          recs.push({ type: 'landmark', text: landmark, value: landmark });
        }
      }
    }

    return recs.slice(0, 8); // Limit to 8 results
  }, [posts, search]);

  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setSelectedIdx(-1);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.trim()) {
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
      }
    }, 150);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || recommendations.length === 0) {
      if (e.key === "Enter" && search.trim()) {
        setShowDropdown(false);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIdx((i) => (i < recommendations.length - 1 ? i + 1 : i));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIdx((i) => (i > 0 ? i - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIdx >= 0) {
          const rec = recommendations[selectedIdx];
          setSearch(rec.value);
          setShowDropdown(false);
          setSelectedIdx(-1);
        } else if (recommendations.length > 0) {
          setSearch(recommendations[0].value);
          setShowDropdown(false);
          setSelectedIdx(-1);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowDropdown(false);
        break;
      default:
        break;
    }
  };

  const handleSelectRecommendation = (rec) => {
    setSearch(rec.value);
    setShowDropdown(false);
    setSelectedIdx(-1);
  };

  /* ── Derived data ───────────────────────────────────────────────── */

  const filteredPosts = useMemo(() => {
    const filtered = (posts || []).filter((post) => {
      const name    = (post.name        || "").toLowerCase();
      const desc    = (post.description || "").toLowerCase();
      const address = (post.address     || "").toLowerCase();
      const q       = search.trim().toLowerCase();
      // Match by name, description, or address
      return !q || name.includes(q) || desc.includes(q) || address.includes(q);
    });
    
    // Sort by like count (highest first)
    return filtered.sort((a, b) => {
      const aLikes = Array.isArray(a.likes) ? a.likes.length : 0;
      const bLikes = Array.isArray(b.likes) ? b.likes.length : 0;
      return bLikes - aLikes; // Descending order
    });
  }, [posts, search]);

  const hasActiveFilters = search.trim() !== "";

  /* ── Pagination ──────────────────────────────────────────────────── */
  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredPosts.slice(start, end);
  }, [filteredPosts, currentPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ── Render ─────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="allspots-page">
        <h2 className="allspots-title">All Photography Spots</h2>
        <p style={{ color: "var(--fg-3)", fontSize: "14px", marginTop: "8px" }}>Loading posts…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="allspots-page">
        <h2 className="allspots-title">All Photography Spots</h2>
        <p style={{ color: "var(--fg-3)", fontSize: "14px", marginTop: "8px" }}>Failed to load posts.</p>
      </div>
    );
  }

  return (
    <div className="allspots-page">

      <div className="allspots-header">
        <h2 className="allspots-title">All Photography Spots</h2>
        <p className="allspots-subtitle">Explore photo spots shared by the community.</p>
      </div>

      <div className="allspots-controls">
        <div className="allspots-search-wrapper" ref={searchWrapperRef}>
          <input
            type="text"
            placeholder="Search by name, description, or address…"
            value={search}
            onChange={handleSearchInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => search.trim() && recommendations.length > 0 && setShowDropdown(true)}
            className="allspots-search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />

          {/* Clear button inside search bar */}
          {hasActiveFilters && (
            <button 
              type="button" 
              className="allspots-clear-btn-inside" 
              onClick={handleClearFilters}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}

          {/* Recommendations dropdown */}
          {showDropdown && recommendations.length > 0 && (
            <div className="allspots-dropdown">
              {recommendations.map((rec, idx) => (
                <button
                  key={`${rec.type}-${rec.text}`}
                  type="button"
                  className={`allspots-dropdown-item${selectedIdx === idx ? ' active' : ''}`}
                  onClick={() => handleSelectRecommendation(rec)}
                >
                  <span className="allspots-dropdown-type">
                    {rec.type === 'spot' && '📍'}
                    {rec.type === 'city' && '🏙️'}
                    {rec.type === 'landmark' && '🏔️'}
                  </span>
                  <span className="allspots-dropdown-text">{rec.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {showDropdown && search.trim() && recommendations.length === 0 && (
            <div className="allspots-dropdown-empty">
              <p>No recommendations found</p>
            </div>
          )}
        </div>
      </div>

      {filteredPosts.length > 0 ? (
        <>
          <div className="allspots-grid">
            {paginatedPosts.map((post) => {
              const author    = post.user || {};
              const username  = author.username  || "Unknown";
              const avatarUrl = author.avatarUrl || AVATAR_FALLBACK;
              const city      = extractCityFromAddress(post.address || "");
              const likeCount = Array.isArray(post.likes) ? post.likes.length : 0;

              return (
                <button
                  key={post._id}
                  type="button"
                  className="spot-card"
                  onClick={() => onOpenPost(post._id)}
                >
                  <div className="spot-card-image-wrap">
                    {post.imageUrl ? (
                      <img
                        src={post.imageUrl}
                        alt={post.name || "Spot"}
                        className="spot-card-image"
                      />
                    ) : (
                      <div className="spot-card-placeholder">No Image</div>
                    )}
                  </div>
                  <div className="spot-card-body">
                    <h3 className="spot-card-title">{post.name || "Untitled Spot"}</h3>
                    <p className="spot-card-city">{city}</p>
                    <div className="spot-card-author">
                      <img src={avatarUrl} alt={username} className="spot-card-avatar" />
                      <div className="spot-card-author-meta">
                        <span className="spot-card-username">{username}</span>
                        <span className="spot-card-like-count">
                          <span className="spot-card-like-icon">♥</span>
                          <span className="spot-card-like-number">{likeCount}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="allspots-pagination">
              <button
                type="button"
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                ← Previous
              </button>
              
              <div className="pagination-info">
                Page <span className="pagination-current">{currentPage}</span> of <span className="pagination-total">{totalPages}</span>
              </div>

              <button
                type="button"
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <p style={{ color: "var(--fg-3)", fontSize: "14px", marginTop: "8px" }}>
          No matching spots found.
          {hasActiveFilters && (
            <button
              type="button"
              className="allspots-clear-btn"
              onClick={handleClearFilters}
              style={{ marginLeft: "12px" }}
            >
              × Clear filters
            </button>
          )}
        </p>
      )}
    </div>
  );
}