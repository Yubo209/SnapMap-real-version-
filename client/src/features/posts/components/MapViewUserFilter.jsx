import React, { useState, useEffect, useRef } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { searchUsers } from "../../../api";
import "../../../style/mapview-user-filter.css";

export default function MapViewUserFilter({ userFilter, onUserFilterChange }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);  // ✅ 独立的状态，只在真正选择时更新
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  // 实时搜索 - debounce 300ms
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    clearTimeout(debounceRef.current);
    setIsSearching(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchUsers(searchQuery);
        setSearchResults(results || []);
        setShowDropdown(true);
      } catch (err) {
        console.error("Search users error:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const handleSelectUser = (userId) => {
    // ✅ 立即更新头像显示
    if (userId === 'all' || userId === 'mymap') {
      setSelectedUser(null);
    } else {
      // 从搜索结果中找到选中的用户信息，保存到selectedUser
      const user = searchResults.find(u => u._id === userId);
      setSelectedUser(user || null);
    }
    
    // 更新全局的userFilter
    onUserFilterChange(userId);
    
    // 清空搜索
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // 点击外部关闭dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="mvuf-container" ref={wrapperRef}>
      {/* 搜索框 */}
      <div className="mvuf-search-box">
        <Search size={16} className="mvuf-search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="mvuf-search-input"
          placeholder="Search spots..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowDropdown(true)}
        />
        {searchQuery && (
          <button
            className="mvuf-search-clear"
            onClick={handleClearSearch}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
        {isSearching && <div className="mvuf-loading">⏳</div>}
      </div>

      {/* 分隔线 */}
      <div className="mvuf-divider-line" />

      {/* 用户过滤框 */}
      <div className="mvuf-filter-box">
        <button
          className="mvuf-filter-button"
          onClick={toggleDropdown}
          aria-expanded={showDropdown}
        >
          {selectedUser ? (
            <>
              <img
                src={selectedUser.avatarUrl}
                alt={selectedUser.username}
                className="mvuf-selected-avatar"
                title={selectedUser.username}
              />
              <span className="mvuf-selected-username">{selectedUser.username}</span>
            </>
          ) : userFilter === 'mymap' ? (
            <>
              <span className="mvuf-filter-icon">👤</span>
              <span className="mvuf-filter-label">MyMap</span>
            </>
          ) : (
            <>
              <span className="mvuf-filter-icon">👥</span>
              <span className="mvuf-filter-label">All</span>
            </>
          )}
          <ChevronDown size={14} className="mvuf-filter-chevron" />
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <div className="mvuf-dropdown">
            {/* All选项 */}
            <button
              className={`mvuf-dropdown-item ${userFilter === 'all' ? 'selected' : ''}`}
              onClick={() => handleSelectUser('all')}
            >
              <span className="mvuf-dropdown-label">👥 All</span>
              <span className="mvuf-dropdown-desc">All users' posts</span>
            </button>

            {/* MyMap选项 */}
            <button
              className={`mvuf-dropdown-item ${userFilter === 'mymap' ? 'selected' : ''}`}
              onClick={() => handleSelectUser('mymap')}
            >
              <span className="mvuf-dropdown-label">👤 MyMap</span>
              <span className="mvuf-dropdown-desc">Your posts only</span>
            </button>

            {/* 分隔线 */}
            {searchResults.length > 0 && <div className="mvuf-divider" />}

            {/* 搜索结果 */}
            {searchResults.map((user) => (
              <button
                key={user._id}
                className={`mvuf-dropdown-item ${userFilter === user._id ? 'selected' : ''}`}
                onClick={() => handleSelectUser(user._id)}
              >
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="mvuf-dropdown-avatar"
                />
                <span className="mvuf-dropdown-username">{user.username}</span>
              </button>
            ))}
          </div>
        )}

        {/* 无结果提示 */}
        {showDropdown && searchQuery.trim() && searchResults.length === 0 && !isSearching && (
          <div className="mvuf-empty">No users found</div>
        )}
      </div>
    </div>
  );
}