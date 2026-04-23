import React from "react";

/**
 * ClusteredMarker — shows a cluster of posts at same location
 * Can display as:
 * 1. Single post: thumbnail card
 * 2. Multiple posts: stacked cards or number badge
 */
export default function ClusteredMarker({ 
  posts,           // array of posts at this location
  isActive,        // is this cluster selected
  onClick,         // callback on click
  displayMode = "card" // "card" or "badge"
}) {
  const count = posts.length;
  const firstPost = posts[0];

  if (displayMode === "badge") {
    // Show badge with count
    return (
      <div 
        className={`clustered-marker-badge${isActive ? " active" : ""}`}
        onClick={onClick}
        style={{ cursor: "pointer" }}
      >
        {count > 1 && <span className="cluster-count">{count}</span>}
        {firstPost.imageUrl ? (
          <img src={firstPost.imageUrl} alt={firstPost.name} className="cluster-image" />
        ) : (
          <div className="cluster-placeholder" />
        )}
      </div>
    );
  }

  // Card mode
  return (
    <div 
      className={`clustered-marker-card${isActive ? " active" : ""}`}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <div className="cluster-card-image-wrap">
        {firstPost.imageUrl ? (
          <>
            <img src={firstPost.imageUrl} alt={firstPost.name} className="cluster-card-image" />
            {count > 1 && (
              <div className="cluster-card-count">{count}</div>
            )}
          </>
        ) : (
          <div className="cluster-placeholder" />
        )}
      </div>
      <div className="cluster-card-body">
        <p className="cluster-card-name">{firstPost.name}</p>
        {count > 1 && <p className="cluster-card-more">+{count - 1} more</p>}
      </div>
    </div>
  );
}