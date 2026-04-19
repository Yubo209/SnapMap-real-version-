import React, { useEffect } from "react";
import { ArrowLeft, X, MapPinned } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import "../../../style/PostModal.css";

const AVATAR_FALLBACK = "/default-avatar-icon-of-social-media-user-vector.jpg";

export default function PostModal({ post, onClose }) {
  const [, setSearchParams] = useSearchParams();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  if (!post) return null;

  const author = post.user || {};
  const username = author.username || "Unknown";
  const avatarUrl = author.avatarUrl || AVATAR_FALLBACK;

  const handleViewOnMap = () => {
    const next = new URLSearchParams();
    next.set("section", "map");
    next.set("focusPost", post._id);
    setSearchParams(next);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-mobile-topbar">
          <button className="modal-icon-btn" onClick={onClose} aria-label="Go back">
            <ArrowLeft size={24} />
          </button>
          <h3 className="modal-mobile-title">Post</h3>
          <button className="modal-icon-btn" onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </div>

        <div className="modal-header">
          <div className="modal-user">
            <img
              src={avatarUrl}
              alt={username}
              className="modal-avatar"
            />
            <div className="modal-user-meta">
              <span className="modal-username">{username}</span>
              <span className="modal-submeta">{post.address || "Unknown location"}</span>
            </div>
          </div>

          <button className="modal-close desktop-only" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className="modal-main">
          <div className="modal-left">
            {post.imageUrl ? (
              <img
                src={post.imageUrl}
                alt={post.name || "Post image"}
                className="modal-image"
              />
            ) : (
              <div className="modal-placeholder">No Image</div>
            )}
          </div>

          <div className="modal-right">
            <div className="modal-body">
              <h2 className="modal-title">{post.name || "Untitled Spot"}</h2>
              <p className="modal-description">
                {post.description || "No description yet."}
              </p>
              <p className="modal-address">
                {post.address || "No address available."}
              </p>
            </div>

            <div className="modal-actions">
              <button className="modal-action-btn" type="button">♡ Like</button>
              <button className="modal-action-btn" type="button">Comment</button>
              <button className="modal-action-btn" type="button">Save</button>
              <button
                className="modal-action-btn modal-action-btn--map"
                onClick={handleViewOnMap}
                type="button"
              >
                <MapPinned size={16} />
                <span>View on map</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}