import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { searchUsers } from "../../../api";
import "../../../style/mapview-search-user.css";

/**
 * MapViewSearchUser - 融合的搜索+过滤组件
 * 左侧：搜索地点（从 MapViewSearch）
 * 右侧：搜索+过滤用户（从 MapViewUserFilter）
 */
export default function MapViewSearchUser({ 
  posts,                    // 所有posts
  onSelectPost,            // 选择地点回调
  userFilter,              // 当前用户过滤状态
  onUserFilterChange       // 用户过滤回调
}) {
  // ━━━ 搜索地点相关状态 ━━━
  const [spotQuery, setSpotQuery] = useState("");
  const [selectedSpotIdx, setSelectedSpotIdx] = useState(-1);
  const [showSpotDropdown, setShowSpotDropdown] = useState(false);
  const spotInputRef = useRef(null);
  const spotDebounceRef = useRef(null);

  // ━━━ 搜索用户相关状态 ━━━
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const userInputRef = useRef(null);
  const userDebounceRef = useRef(null);

  const wrapperRef = useRef(null);

  // ━━━ 搜索地点 - 实时过滤（参考 MapViewSearch） ━━━
  const spotResults = useMemo(() => {
    if (!spotQuery.trim()) return [];
    const q = spotQuery.toLowerCase();
    return posts.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const addr = (p.address || "").toLowerCase();
      return name.includes(q) || addr.includes(q);
    }).slice(0, 8);
  }, [spotQuery, posts]);

  // ━━━ 搜索用户 - debounce 300ms（参考 MapViewUserFilter） ━━━
  useEffect(() => {
    if (!userQuery.trim()) {
      setUserResults([]);
      setShowUserDropdown(false);
      return;
    }

    clearTimeout(userDebounceRef.current);
    setIsSearchingUser(true);

    userDebounceRef.current = setTimeout(async () => {
      try {
        const results = await searchUsers(userQuery);
        setUserResults(results || []);
        setShowUserDropdown(true);
      } catch (err) {
        console.error("Search users error:", err);
        setUserResults([]);
      } finally {
        setIsSearchingUser(false);
      }
    }, 300);

    return () => clearTimeout(userDebounceRef.current);
  }, [userQuery]);

  // ━━━ 地点搜索 - debounce 打开dropdown ━━━
  const handleSpotInputChange = (e) => {
    const val = e.target.value;
    setSpotQuery(val);
    setSelectedSpotIdx(-1);
    
    clearTimeout(spotDebounceRef.current);
    spotDebounceRef.current = setTimeout(() => {
      if (val.trim()) {
        setShowSpotDropdown(true);
      } else {
        setShowSpotDropdown(false);
      }
    }, 150);
  };

  // ━━━ 键盘导航（地点）━━━
  const handleSpotKeyDown = (e) => {
    if (!showSpotDropdown || spotResults.length === 0) {
      if (e.key === "Enter" && spotQuery.trim()) {
        setShowSpotDropdown(false);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedSpotIdx((i) => (i < spotResults.length - 1 ? i + 1 : i));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedSpotIdx((i) => (i > 0 ? i - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedSpotIdx >= 0) {
          handleSelectSpot(spotResults[selectedSpotIdx]);
        } else if (spotResults.length > 0) {
          handleSelectSpot(spotResults[0]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowSpotDropdown(false);
        setSpotQuery("");
        break;
      default:
        break; 
    }
  };

  // ━━━ 选择地点 ━━━
  const handleSelectSpot = (post) => {
    onSelectPost?.(post);
    setSpotQuery("");
    setShowSpotDropdown(false);
    setSelectedSpotIdx(-1);
  };

  const handleClearSpot = () => {
    setSpotQuery("");
    setShowSpotDropdown(false);
    setSelectedSpotIdx(-1);
    spotInputRef.current?.focus();
  };

  // ━━━ 选择用户 ━━━
  const handleSelectUser = (userId) => {
    if (userId === 'all' || userId === 'mymap') {
      setSelectedUser(null);
    } else {
      const user = userResults.find(u => u._id === userId);
      setSelectedUser(user || null);
    }
    
    onUserFilterChange(userId);
    setUserQuery("");
    setUserResults([]);
    setShowUserDropdown(false);
  };

  const handleClearUser = () => {
    setUserQuery("");
    setUserResults([]);
    setShowUserDropdown(false);
    userInputRef.current?.focus();
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  // ━━━ 点击外部关闭 ━━━
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSpotDropdown(false);
        setShowUserDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="mvsu-container" ref={wrapperRef}>
      {/* ━━━ 左侧：搜索地点（from MapViewSearch） ━━━ */}
      <div className="mvsu-search-box">
        <Search size={16} className="mvsu-search-icon" />
        <input
          ref={spotInputRef}
          type="text"
          className="mvsu-search-input"
          placeholder="Search spots…"
          value={spotQuery}
          onChange={handleSpotInputChange}
          onKeyDown={handleSpotKeyDown}
          onFocus={() => spotQuery.trim() && setShowSpotDropdown(true)}
        />
        {spotQuery && (
          <button
            className="mvsu-search-clear"
            onClick={handleClearSpot}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}

        {/* 地点 dropdown */}
        {showSpotDropdown && spotResults.length > 0 && (
          <div className="mvsu-dropdown mvsu-dropdown-spot">
            {spotResults.map((post, idx) => (
              <button
                key={post._id || idx}
                className={`mvsu-dropdown-item ${selectedSpotIdx === idx ? 'active' : ''}`}
                onClick={() => handleSelectSpot(post)}
              >
                <div className="mvsu-result-name">{post.name || "Untitled"}</div>
                <div className="mvsu-result-addr">{post.address || "No address"}</div>
              </button>
            ))}
          </div>
        )}

        {/* 地点空结果 */}
        {showSpotDropdown && spotQuery.trim() && spotResults.length === 0 && (
          <div className="mvsu-empty">No spots found</div>
        )}
      </div>

      {/* ━━━ 分隔线 ━━━ */}
      <div className="mvsu-divider" />

      {/* ━━━ 右侧：搜索+过滤用户（from MapViewUserFilter） ━━━ */}
      <div className="mvsu-user-box">
        <input
          ref={userInputRef}
          type="text"
          className="mvsu-user-input"
          placeholder="Search user…"
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          onFocus={() => setShowUserDropdown(true)}
        />
        {userQuery && (
          <button
            className="mvsu-search-clear"
            onClick={handleClearUser}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
        {isSearchingUser && <div className="mvsu-loading">⏳</div>}

        {/* 用户 filter 按钮 */}
        <div className="mvsu-filter-button-wrapper">
          <button
            className="mvsu-filter-button"
            onClick={toggleUserDropdown}
            aria-expanded={showUserDropdown}
          >
            {selectedUser ? (
              <>
                <img
                  src={selectedUser.avatarUrl}
                  alt={selectedUser.username}
                  className="mvsu-avatar"
                />
                <span className="mvsu-username">{selectedUser.username}</span>
              </>
            ) : userFilter === 'mymap' ? (
              <>
                <span className="mvsu-icon">👤</span>
                <span className="mvsu-label">MyMap</span>
              </>
            ) : (
              <>
                <span className="mvsu-icon">👥</span>
                <span className="mvsu-label">All</span>
              </>
            )}
            <ChevronDown size={14} />
          </button>

          {/* 用户 dropdown */}
          {showUserDropdown && (
            <div className="mvsu-dropdown mvsu-dropdown-user">
              {/* All 选项 */}
              <button
                className={`mvsu-dropdown-item ${userFilter === 'all' ? 'selected' : ''}`}
                onClick={() => handleSelectUser('all')}
              >
                <span className="mvsu-label">👥 All</span>
                <span className="mvsu-desc">All users' posts</span>
              </button>

              {/* MyMap 选项 */}
              <button
                className={`mvsu-dropdown-item ${userFilter === 'mymap' ? 'selected' : ''}`}
                onClick={() => handleSelectUser('mymap')}
              >
                <span className="mvsu-label">👤 MyMap</span>
                <span className="mvsu-desc">Your posts only</span>
              </button>

              {/* 分隔线 */}
              {userResults.length > 0 && <div className="mvsu-divider-line" />}

              {/* 搜索结果 */}
              {userResults.map((user) => (
                <button
                  key={user._id}
                  className={`mvsu-dropdown-item ${userFilter === user._id ? 'selected' : ''}`}
                  onClick={() => handleSelectUser(user._id)}
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="mvsu-avatar-small"
                  />
                  <span className="mvsu-username-small">{user.username}</span>
                </button>
              ))}
            </div>
          )}

          {/* 用户搜索无结果 */}
          {showUserDropdown && userQuery.trim() && userResults.length === 0 && !isSearchingUser && (
            <div className="mvsu-empty">No users found</div>
          )}
        </div>
      </div>
    </div>
  );
}