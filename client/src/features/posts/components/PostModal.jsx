import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, X, MapPinned, MessageCircle } from "lucide-react";
import { addComment, toggleLike } from "../../../api";
import "../../../style/PostModal.css";

const AVATAR_FALLBACK = "/default-avatar-icon-of-social-media-user-vector.jpg";

export default function PostModal({ post, onClose, onViewOnMap }) {
    const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [likePop, setLikePop] = useState(false);
  const [localLikes, setLocalLikes] = useState([]);
  const [localComments, setLocalComments] = useState([]);

  useEffect(() => {
    setLocalLikes(Array.isArray(post?.likes) ? post.likes : []);
    setLocalComments(Array.isArray(post?.comments) ? post.comments : []);
    setCommentText("");
    setActionError("");
  }, [post]);

  useEffect(() => {
    if (!post) return;

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
  }, [post, onClose]);

  useEffect(() => {
    if (!likePop) return;
    const timer = setTimeout(() => setLikePop(false), 220);
    return () => clearTimeout(timer);
  }, [likePop]);

  let currentUserId = "";
  try {
    const meRaw = localStorage.getItem("me");
    const me = meRaw ? JSON.parse(meRaw) : null;
    currentUserId = String(me?.id || me?._id || "");
  } catch {
    currentUserId = "";
  }

  const likes = Array.isArray(localLikes) ? localLikes : [];
  const comments = Array.isArray(localComments) ? localComments : [];

  const isLiked = useMemo(() => {
    return likes.some((like) => {
      if (!like) return false;
      if (typeof like === "string") return String(like) === currentUserId;
      if (typeof like === "object" && like._id) return String(like._id) === currentUserId;
      if (typeof like === "object" && like.id) return String(like.id) === currentUserId;
      if (typeof like === "object" && like.toString) return String(like.toString()) === currentUserId;
      return String(like) === currentUserId;
    });
  }, [likes, currentUserId]);

  if (!post) return null;

  const author = post.user || {};
  const username = author.username || "Unknown";
  const avatarUrl = author.avatarUrl || AVATAR_FALLBACK;

  const handleViewOnMap = () => {
    onClose();                          // close modal first
    onViewOnMap?.(post._id);            // let Dashboard handle navigation
  };

  const handleToggleLike = async () => {
    if (!currentUserId) {
      setActionError("Please log in first.");
      return;
    }

    setActionError("");

    const prevLikes = [...likes];

    const alreadyLiked = prevLikes.some((like) => {
      if (!like) return false;
      if (typeof like === "string") return String(like) === currentUserId;
      if (typeof like === "object" && like._id) return String(like._id) === currentUserId;
      if (typeof like === "object" && like.id) return String(like.id) === currentUserId;
      if (typeof like === "object" && like.toString) return String(like.toString()) === currentUserId;
      return String(like) === currentUserId;
    });

    const optimisticLikes = alreadyLiked
      ? prevLikes.filter((like) => {
          if (!like) return false;
          if (typeof like === "string") return String(like) !== currentUserId;
          if (typeof like === "object" && like._id) return String(like._id) !== currentUserId;
          if (typeof like === "object" && like.id) return String(like.id) !== currentUserId;
          if (typeof like === "object" && like.toString) return String(like.toString()) !== currentUserId;
          return String(like) !== currentUserId;
        })
      : [...prevLikes, currentUserId];

    setLocalLikes(optimisticLikes);
    setLikePop(true);

    try {
      const data = await toggleLike(post._id);
      if (data?.post?.likes) {
        setLocalLikes(data.post.likes);
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
      setActionError(err.message || "Failed to update like.");
      setLocalLikes(prevLikes);
    }
  };

  const handleAddComment = async () => {
    if (isCommenting) return;
    if (!commentText.trim()) return;

    try {
      setActionError("");
      setIsCommenting(true);

      const data = await addComment(post._id, commentText.trim());

      if (data?.post?.comments) {
        setLocalComments(data.post.comments);
        setCommentText("");
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
      setActionError(err.message || "Failed to add comment.");
    } finally {
      setIsCommenting(false);
    }
  };

  const modalNode = (
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
            <img src={avatarUrl} alt={username} className="modal-avatar" />
            <div className="modal-user-meta">
              <span className="modal-username">{username}</span>
              <span className="modal-submeta">
                {post.address || "Unknown location"}
              </span>
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
              <button
                className={`modal-action-btn modal-like-btn ${isLiked ? "is-liked" : ""} ${likePop ? "like-pop" : ""}`}
                type="button"
                onClick={handleToggleLike}
              >
                <span
                  className={`modal-heart-wrap ${isLiked ? "liked" : ""}`}
                  aria-hidden="true"
                >
                  <span className="modal-heart-text">
                    {isLiked ? "♥" : "♡"}
                  </span>
                </span>
                <span className="modal-btn-label">
                  {isLiked ? "Liked" : "Like"} {likes.length}
                </span>
              </button>

              <button
                className="modal-action-btn"
                type="button"
                onClick={() => {
                  const input = document.getElementById("post-comment-input");
                  if (input) input.focus();
                }}
              >
                <MessageCircle size={15} className="modal-action-icon" />
                <span className="modal-btn-label">Comment {comments.length}</span>
              </button>

              <button
                className="modal-action-btn modal-action-btn--map"
                onClick={handleViewOnMap}
                type="button"
              >
                <MapPinned size={16} />
                <span className="modal-btn-label">On Map</span>
              </button>
            </div>

            {actionError ? <p className="modal-error-message">{actionError}</p> : null}

            <div className="modal-comments-section">
              <h3 className="modal-comments-title">Comments</h3>

              <div className="modal-comment-form">
                <input
                  id="post-comment-input"
                  type="text"
                  className="modal-comment-input"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={500}
                />
                <button
                  type="button"
                  className="modal-comment-submit"
                  onClick={handleAddComment}
                  disabled={isCommenting || !commentText.trim()}
                >
                  {isCommenting ? "Posting..." : "Post"}
                </button>
              </div>

              <div className="modal-comments-list">
                {comments.length > 0 ? (
                  comments.map((comment) => {
                    const commentUser = comment.user || {};
                    const commentUsername = commentUser.username || "Unknown";
                    const commentAvatar = commentUser.avatarUrl || AVATAR_FALLBACK;

                    return (
                      <div
                        className="modal-comment-item"
                        key={comment._id || `${commentUsername}-${comment.text}`}
                      >
                        <img
                          src={commentAvatar}
                          alt={commentUsername}
                          className="modal-comment-avatar"
                        />
                        <div className="modal-comment-content">
                          <div className="modal-comment-top">
                            <span className="modal-comment-username">
                              {commentUsername}
                            </span>
                          </div>
                          <p className="modal-comment-text">{comment.text}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="modal-no-comments">No comments yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}