import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { API_BASE } from "../api";

const customIcon = new L.Icon({
  iconUrl: "/icons8-map-pin-50.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const POPUP_MAX_WIDTH = 880;
const LEFT_W = 200;
const IMAGE_BOX_H = 320;

const INITIAL_ZOOM = 3;
const FIT_MAX_ZOOM = 3;
const CLICK_ZOOM = null;

function FitBoundsOnPosts({ posts, padding = [40, 40], maxZoom = FIT_MAX_ZOOM }) {
  const map = useMap();
  useEffect(() => {
    if (!posts || posts.length === 0) return;
    if (posts.length === 1) {
      const p = posts[0];
      map.setView([p.lat, p.lng], 10, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(posts.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding, maxZoom, animate: true });
  }, [posts, map, padding, maxZoom]);
  return null;
}

function TwoColContent({ post }) {
  const rightRef = useRef(null);
  useEffect(() => { if (rightRef.current) rightRef.current.scrollTop = 40; }, []);
  return (
    <div className="popup-two-col" style={{ height: IMAGE_BOX_H }}>
      <div className="popup-left" style={{ width: LEFT_W }}>
        <div className="popup-image-frame" style={{ height: IMAGE_BOX_H }}>
          {post.imageUrl ? (
            <img src={post.imageUrl} alt={post.title || post.name || "Spot"} className="popup-image-contain" />
          ) : (
            <div className="popup-image-placeholder">No Image</div>
          )}
        </div>
      </div>
      <div className="popup-right" ref={rightRef} style={{ maxHeight: IMAGE_BOX_H }}>
        <p className="popup-coord">📍 <b>{post.lat.toFixed(4)}, {post.lng.toFixed(4)}</b></p>
        {post.description && <p className="popup-desc">{post.description}</p>}
      </div>
    </div>
  );
}

function MarkerWithPopup({ post }) {
  const map = useMap();
  return (
    <Marker
      position={[post.lat, post.lng]}
      icon={customIcon}
      eventHandlers={{
        click: (e) => {
          const targetZoom = CLICK_ZOOM ?? map.getZoom();
          map.flyTo([post.lat, post.lng], targetZoom, { duration: 0.8 });
          e.target.openPopup();
        },
      }}
    >
      <Popup
        maxWidth={POPUP_MAX_WIDTH}
        keepInView
        autoPan
        autoPanPaddingTopLeft={[16, 32]}
        autoPanPaddingBottomRight={[16, 32]}
      >
        <TwoColContent post={post} />
      </Popup>
    </Marker>
  );
}

export default function MapView() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    fetch(`${API_BASE}/api/posts`)
      .then((res) => res.json())
      .then((data) => {
        const valid = (data || []).filter((p) => typeof p.lat === "number" && typeof p.lng === "number");
        setPosts(valid);
      })
      .catch((err) => console.error("Error loading posts:", err));
  }, []);

  const initialCenter = useMemo(() => [39.8283, -98.5795], []);

  return (
    <MapContainer
      center={initialCenter}
      zoom={INITIAL_ZOOM}
      className="map-responsive"
      style={{ height: "560px", width: "100%", borderRadius: 12 }}
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <FitBoundsOnPosts posts={posts} />
      {posts.map((post, i) => <MarkerWithPopup key={i} post={post} />)}
    </MapContainer>
  );
}

