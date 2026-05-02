import React, { useRef, useEffect } from 'react';
import PostModal from './PostModal';
import '../../../style/location-big-card.css';

/**
 * LocationBigCard - 显示一个位置的所有post（网格卡片形式）
 * 
 * Props:
 *   location: { address, posts: [...], photoCount, ... } | null（loading 时）
 *   onClose: 关闭回调
 *   isLoading: 是否加载中
 */
export default function LocationBigCard({ location, onClose, isLoading = false }) {
  const [selectedPost, setSelectedPost] = React.useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [location]);

  // ✅ Loading 状态
  if (isLoading || !location) {
    return (
      <div className="location-big-card-overlay" onClick={onClose}>
        <div className="location-big-card" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="lbc-header">
            <div className="lbc-header-left">
              <h3 className="lbc-title">{location?.address || 'Loading location…'}</h3>
              <p className="lbc-count">{location?.posts?.length || 0} photos</p>
            </div>
            <button className="lbc-close-btn" onClick={onClose}>
              ×
            </button>
          </div>

          {/* Loading Skeleton */}
          <div className="lbc-photos-grid" ref={scrollRef}>
            {isLoading ? (
              <>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={`skeleton-${i}`} className="lbc-photo-item lbc-photo-skeleton">
                    <div className="lbc-photo-overlay">
                      <div className="skeleton-image" />
                    </div>
                    <div className="lbc-photo-info">
                      <div className="skeleton-title" />
                      <div className="skeleton-author" />
                      <div className="skeleton-desc" />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                {/* Empty state */}
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px' }}>
                  <p style={{ color: 'var(--fg-3)', margin: 0 }}>No photos found</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ✅ Data loaded 状态
  if (!location || !location.posts || location.posts.length === 0) {
    return (
      <div className="location-big-card-overlay" onClick={onClose}>
        <div className="location-big-card" onClick={(e) => e.stopPropagation()}>
          <div className="lbc-header">
            <div className="lbc-header-left">
              <h3 className="lbc-title">{location?.address || 'Location'}</h3>
              <p className="lbc-count">0 photos</p>
            </div>
            <button className="lbc-close-btn" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="lbc-photos-grid" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ color: 'var(--fg-3)', margin: 0 }}>No photos at this location</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="location-big-card-overlay" onClick={onClose}>
        <div className="location-big-card" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="lbc-header">
            <div className="lbc-header-left">
              <h3 className="lbc-title">{location.address || 'Location'}</h3>
              <p className="lbc-count">{location.posts.length} photos</p>
            </div>
            <button className="lbc-close-btn" onClick={onClose}>
              ×
            </button>
          </div>

          {/* Posts Grid - 一行3个card */}
          <div className="lbc-photos-grid" ref={scrollRef}>
            {location.posts.map((post) => (
              <div
                key={post._id}
                className="lbc-photo-item"
                onClick={() => setSelectedPost(post)}
              >
                {/* 图片部分 */}
                <div className="lbc-photo-overlay">
                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl}
                      alt={post.name || 'Photo'}
                      className="lbc-photo"
                    />
                  ) : (
                    <div className="lbc-photo-placeholder">No image</div>
                  )}
                </div>

                {/* 卡片内容 */}
                <div className="lbc-photo-info">
                  <h4 className="lbc-photo-name">{post.name || 'Untitled'}</h4>
                  {post.user && (
                    <p className="lbc-photo-author">by {post.user.username || 'Unknown'}</p>
                  )}
                  {post.description && (
                    <p className="lbc-photo-desc">{post.description}</p>
                  )}
                  <div className="lbc-photo-likes">
                    ♥ {Array.isArray(post.likes) ? post.likes.length : 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PostModal - 点击卡片进入详情 */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onViewOnMap={() => setSelectedPost(null)}
        />
      )}
    </>
  );
}