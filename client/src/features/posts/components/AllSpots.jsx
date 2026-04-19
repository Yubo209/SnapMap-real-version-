import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usePosts } from "../hooks/usePosts";
import "../../../style/AllSpots.css";

const AVATAR_FALLBACK = "/default-avatar-icon-of-social-media-user-vector.jpg";

function extractCityFromAddress(address = "") {
  const parts = address
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }

  return "Unknown";
}

export default function AllSpots({ onOpenPost }) {
  const { posts, isLoading, error } = usePosts();
  const [searchParams, setSearchParams] = useSearchParams();

  const cityFromUrl = searchParams.get("city") || "All";
  const keywordFromUrl = searchParams.get("q") || "";

  const [search, setSearch] = useState(keywordFromUrl);
  const [cityFilter, setCityFilter] = useState(cityFromUrl);

  useEffect(() => {
    setSearch(keywordFromUrl);
    setCityFilter(cityFromUrl);
  }, [cityFromUrl, keywordFromUrl]);

  const cityOptions = useMemo(() => {
    const cities = new Set();

    (posts || []).forEach((post) => {
      const city = extractCityFromAddress(post.address || "");
      if (city && city !== "Unknown") {
        cities.add(city);
      }
    });

    return ["All", ...Array.from(cities).sort()];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return (posts || []).filter((post) => {
      const name = (post.name || "").toLowerCase();
      const desc = (post.description || "").toLowerCase();
      const address = (post.address || "").toLowerCase();
      const city = extractCityFromAddress(post.address || "");
      const q = search.trim().toLowerCase();

      const matchKeyword =
        !q || name.includes(q) || desc.includes(q) || address.includes(q);

      const matchCity = cityFilter === "All" || city === cityFilter;

      return matchKeyword && matchCity;
    });
  }, [posts, search, cityFilter]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);

    const next = new URLSearchParams(searchParams);
    if (value.trim()) {
      next.set("q", value);
    } else {
      next.delete("q");
    }
    setSearchParams(next);
  };

  const handleCityChange = (e) => {
    const value = e.target.value;
    setCityFilter(value);

    const next = new URLSearchParams(searchParams);
    if (value !== "All") {
      next.set("city", value);
    } else {
      next.delete("city");
    }
    setSearchParams(next);
  };

  if (isLoading) {
    return (
      <div className="allspots-page">
        <h2 className="allspots-title">All Photography Spots</h2>
        <p>Loading posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="allspots-page">
        <h2 className="allspots-title">All Photography Spots</h2>
        <p>Failed to load posts.</p>
      </div>
    );
  }

  return (
    <div className="allspots-page">
      <div className="allspots-header">
        <div>
          <h2 className="allspots-title">All Photography Spots</h2>
          <p className="allspots-subtitle">
            Explore photo spots shared by the community.
          </p>
        </div>
      </div>

      <div className="allspots-controls">
        <input
          type="text"
          placeholder="Search by name, description, or address..."
          value={search}
          onChange={handleSearchChange}
          className="allspots-search"
        />

        <select
          value={cityFilter}
          onChange={handleCityChange}
          className="allspots-select"
        >
          {cityOptions.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      {filteredPosts.length > 0 ? (
        <div className="allspots-grid">
          {filteredPosts.map((post) => {
            const author = post.user || {};
            const username = author.username || "Unknown";
            const avatarUrl = author.avatarUrl || AVATAR_FALLBACK;
            const city = extractCityFromAddress(post.address || "");

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
                  <h3 className="spot-card-title">
                    {post.name || "Untitled Spot"}
                  </h3>

                  <p className="spot-card-city">{city}</p>

                  <div className="spot-card-author">
                    <img
                      src={avatarUrl}
                      alt={username}
                      className="spot-card-avatar"
                    />
                    <span className="spot-card-username">{username}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <p>No matching posts found.</p>
      )}
    </div>
  );
}