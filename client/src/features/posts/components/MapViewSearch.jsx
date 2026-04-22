import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, X } from "lucide-react";
import "../../../style/mapview-search.css";

export default function MapViewSearch({ posts, onSelectPost }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Debounce search
  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIdx(-1);
    
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // Results will be computed by useMemo below
      if (val.trim()) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }, 150);
  };

  // Filter posts in real-time (no debounce on filtering, just on opening)
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return posts.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const addr = (p.address || "").toLowerCase();
      return name.includes(q) || addr.includes(q);
    }).slice(0, 8); // Max 8 results
  }, [query, posts]);

  // Handle keyboard nav
  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) {
      if (e.key === "Enter" && query.trim()) {
        // No selection, just clear or close
        setIsOpen(false);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIdx((i) => (i < results.length - 1 ? i + 1 : i));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIdx((i) => (i > 0 ? i - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIdx >= 0) {
          handleSelectPost(results[selectedIdx]);
        } else if (results.length > 0) {
          handleSelectPost(results[0]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setQuery("");
        break;
      default:
        break;
    }
  };

  const handleSelectPost = (post) => {
    onSelectPost?.(post);
    setQuery("");
    setIsOpen(false);
    setSelectedIdx(-1);
  };

  const handleClear = () => {
    setQuery("");
    setIsOpen(false);
    setSelectedIdx(-1);
    inputRef.current?.focus();
  };

  return (
    <div className="mapview-search-container">
      <div className="mapview-search-box">
        <Search size={18} className="mapview-search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="mapview-search-input"
          placeholder="Search spots…"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setIsOpen(true)}
        />
        {query && (
          <button
            className="mapview-search-clear"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="mapview-search-results" ref={listRef}>
          {results.map((post, idx) => (
            <button
              key={post._id || idx}
              className={`mapview-search-result-item${
                selectedIdx === idx ? " active" : ""
              }`}
              onClick={() => handleSelectPost(post)}
            >
              <div className="result-item-name">{post.name || "Untitled"}</div>
              <div className="result-item-addr">
                {post.address || "No address"}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {isOpen && query.trim() && results.length === 0 && (
        <div className="mapview-search-empty">
          <p>No spots found</p>
        </div>
      )}
    </div>
  );
}