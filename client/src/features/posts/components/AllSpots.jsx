import React, { useMemo, useState } from "react";
import "../../../style/AllSpots.css";

const AVATAR_FALLBACK = "/default-avatar-icon-of-social-media-user-vector.jpg";

function extractCityFromAddress(address = "") {
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 2];
  return "Unknown";
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
  const [cityFilter, setCityFilter] = useState(initialCity);

  const handleClearFilters = () => {
    setSearch("");
    setCityFilter("All");
  };

  /* ── Derived data ───────────────────────────────────────────────── */
  const cityOptions = useMemo(() => {
    const cities = new Set();
    (posts || []).forEach((post) => {
      const city = extractCityFromAddress(post.address || "");
      if (city && city !== "Unknown") cities.add(city);
    });
    return ["All", ...Array.from(cities).sort()];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return (posts || []).filter((post) => {
      const name    = (post.name        || "").toLowerCase();
      const desc    = (post.description || "").toLowerCase();
      const address = (post.address     || "").toLowerCase();
      const city    = extractCityFromAddress(post.address || "");
      const q       = search.trim().toLowerCase();
      const matchKeyword = !q || name.includes(q) || desc.includes(q) || address.includes(q);
      const matchCity    = cityFilter === "All" || city === cityFilter;
      return matchKeyword && matchCity;
    });
  }, [posts, search, cityFilter]);

  const hasActiveFilters = search.trim() !== "" || cityFilter !== "All";

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
        <input
          type="text"
          placeholder="Search by name, description, or address…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="allspots-search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />

        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="allspots-select"
        >
          {cityOptions.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button type="button" className="allspots-clear-btn" onClick={handleClearFilters}>
            × Clear
          </button>
        )}
      </div>

      {filteredPosts.length > 0 ? (
        <div className="allspots-grid">
          {filteredPosts.map((post) => {
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