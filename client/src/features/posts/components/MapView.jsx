import React, { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "@luomus/leaflet-smooth-wheel-zoom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../../../style/mapview.css";
import { usePosts } from "../hooks/usePosts";
import { useUserLocation } from "../hooks/useUserLocation";

const customIcon = new L.Icon({
  iconUrl: "/icons8-map-pin-50.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const userIcon = new L.Icon({
  iconUrl: "/spotmap-icon.svg",
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
});

const POPUP_MAX_WIDTH = 880;

const INITIAL_ZOOM = 3;
const FIT_MAX_ZOOM = 3;
const USER_ZOOM = 11;

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

function FlyToUserLocation({ userLocation }) {
  const map = useMap();

  useEffect(() => {
    if (!userLocation) return;

    map.flyTo([userLocation.lat, userLocation.lng], USER_ZOOM, {
      duration: 1.2,
    });
  }, [userLocation, map]);

  return null;
}

function TwoColContent({ post }) {
  const rightRef = useRef(null);

  useEffect(() => {
    if (rightRef.current) {
      rightRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <div className="popup-card">
      <div className="popup-header">
        <h4 className="popup-title">{post.name || "Untitled Spot"}</h4>
      </div>

      <div className="popup-body">
        <div className="popup-left">
          <div className="popup-image-frame">
            {post.imageUrl ? (
              <img
                src={post.imageUrl}
                alt={post.name || "Spot"}
                className="popup-image-contain"
              />
            ) : (
              <div className="popup-image-placeholder">No Image</div>
            )}
          </div>
        </div>

        <div className="popup-right" ref={rightRef}>
          {post.description && <p className="popup-desc">{post.description}</p>}

          {post.address && (
            <p className="popup-address">
              <strong>Address:</strong> {post.address}
            </p>
          )}

          <p className="popup-coord">
            <strong>Coordinates:</strong> {post.lat.toFixed(4)}, {post.lng.toFixed(4)}
          </p>
        </div>
      </div>
    </div>
  );
}

function MarkerWithPopup({ post }) {
  const map = useMap();
  const previousViewRef = useRef(null);

  return (
    <Marker
      position={[post.lat, post.lng]}
      icon={customIcon}
      eventHandlers={{
        click: (e) => {
          previousViewRef.current = {
            center: map.getCenter(),
            zoom: map.getZoom(),
          };

          map.panTo([post.lat, post.lng], {
            animate: true,
            duration: 0.6,
          });

          e.target.openPopup();
        },

        popupclose: () => {
          if (!previousViewRef.current) return;

          const { center, zoom } = previousViewRef.current;

          map.flyTo(center, zoom, {
            animate: true,
            duration: 0.5,
          });

          previousViewRef.current = null;
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

function UserMarker({ userLocation }) {
  const markerRef = useRef(null);
  const openedOnceRef = useRef(false);

  useEffect(() => {
    if (markerRef.current && !openedOnceRef.current) {
      markerRef.current.openPopup();
      openedOnceRef.current = true;
    }
  }, []);

  return (
    <Marker
      position={[userLocation.lat, userLocation.lng]}
      icon={userIcon}
      ref={markerRef}
    >
      <Popup
        className="user-popup"
        closeButton={false}
      >
        <div className="user-popup-content">You are here</div>
      </Popup>
    </Marker>
  );
}

export default function MapView() {
  const { posts, isLoading, error } = usePosts();
  const { userLocation, locationLoading, locationError } = useUserLocation();

  const initialCenter = useMemo(() => [39.8283, -98.5795], []);

  if (isLoading) {
    return <p>Loading map...</p>;
  }

  if (error) {
    return <p>Failed to load posts for map.</p>;
  }

  const valid = (posts || []).filter(
    (p) => typeof p.lat === "number" && typeof p.lng === "number"
  );

  return (
    <div className="mapview-wrapper">
      {locationLoading && <p className="map-status">Locating you...</p>}
      {!locationLoading && locationError && (
        <p className="map-status map-status-muted">{locationError}</p>
      )}

      <MapContainer
        center={initialCenter}
        zoom={INITIAL_ZOOM}
        className="map-responsive modern-map"
        style={{ height: "560px", width: "100%", borderRadius: 16 }}
        dragging={true}
        doubleClickZoom={false}
        touchZoom={true}
        keyboard={false}
        bounceAtZoomLimits={false}
        zoomSnap={0}
        scrollWheelZoom={false}
        smoothWheelZoom={true}
        smoothSensitivity={8}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
          keepBuffer={8}
          updateWhenZooming={false}
          updateWhenIdle={false}
        />

        {userLocation ? (
          <>
            <FlyToUserLocation userLocation={userLocation} />
            <UserMarker userLocation={userLocation} />
          </>
        ) : (
          <FitBoundsOnPosts posts={valid} />
        )}

        {valid.map((post) => (
          <MarkerWithPopup key={post._id || `${post.lat}-${post.lng}`} post={post} />
        ))}
      </MapContainer>
    </div>
  );
}