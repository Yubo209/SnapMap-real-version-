import React, { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "@luomus/leaflet-smooth-wheel-zoom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useSearchParams } from "react-router-dom";
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
const NEARBY_RADIUS_KM = 80;
const FOCUS_ZOOM = 14;

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function extractCityFromAddress(address = "") {
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 2];
  return "";
}

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

function FlyToUserLocation({ userLocation, triggerKey }) {
  const map = useMap();

  useEffect(() => {
    if (!userLocation) return;

    map.flyTo([userLocation.lat, userLocation.lng], USER_ZOOM, {
      duration: 1.2,
    });
  }, [userLocation, triggerKey, map]);

  return null;
}

function MapResizeFix() {
  const map = useMap();
  const timeoutRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    let isUnmounted = false;

    const clearPending = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const safeInvalidate = () => {
      if (isUnmounted || !map) return;

      let container = null;
      try {
        container = map.getContainer();
      } catch {
        return;
      }

      if (!container || !container.isConnected) return;

      try {
        map.invalidateSize({ pan: false, animate: false });
      } catch (err) {
        console.warn("map.invalidateSize skipped:", err);
      }
    };

    const refresh = () => {
      clearPending();

      rafRef.current = window.requestAnimationFrame(() => {
        timeoutRef.current = window.setTimeout(() => {
          safeInvalidate();
        }, 0);
      });
    };

    refresh();
    window.addEventListener("resize", refresh);

    let observer;
    const container = map?.getContainer?.();
    const parent = container?.parentElement;

    if (parent && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        refresh();
      });
      observer.observe(parent);
    }

    return () => {
      isUnmounted = true;
      window.removeEventListener("resize", refresh);
      if (observer) observer.disconnect();
      clearPending();
    };
  }, [map]);

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

function MarkerWithPopup({ post, shouldOpen }) {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    if (!shouldOpen || !markerRef.current) return;

    map.flyTo([post.lat, post.lng], FOCUS_ZOOM, {
      animate: true,
      duration: 1,
    });

    const timer = window.setTimeout(() => {
      if (markerRef.current) {
        markerRef.current.openPopup();
      }
    }, 800);

    return () => window.clearTimeout(timer);
  }, [shouldOpen, map, post]);

  return (
    <Marker
      position={[post.lat, post.lng]}
      icon={customIcon}
      ref={markerRef}
      eventHandlers={{
        click: (e) => {
          map.panTo([post.lat, post.lng], {
            animate: true,
            duration: 0.6,
          });
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
      <Popup className="user-popup" closeButton={false}>
        <div className="user-popup-content">You are here</div>
      </Popup>
    </Marker>
  );
}

export default function MapView() {
  const { posts, isLoading, error } = usePosts();
  const { userLocation, locationLoading, locationError } = useUserLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const focusPostId = searchParams.get("focusPost") || "";
  const resetKeyRef = useRef(0);

  const initialCenter = useMemo(() => [39.8283, -98.5795], []);

  const valid = useMemo(
    () =>
      (posts || []).filter(
        (p) => typeof p.lat === "number" && typeof p.lng === "number"
      ),
    [posts]
  );

  const focusedPost = useMemo(() => {
    if (!focusPostId) return null;
    return valid.find((post) => post._id === focusPostId) || null;
  }, [focusPostId, valid]);

  const nearbyPosts = useMemo(() => {
    if (!userLocation || !valid.length) return [];

    return valid.filter((post) => {
      const distance = getDistanceKm(
        userLocation.lat,
        userLocation.lng,
        post.lat,
        post.lng
      );
      return distance <= NEARBY_RADIUS_KM;
    });
  }, [userLocation, valid]);

  const nearbyCity = useMemo(() => {
    if (!nearbyPosts.length) return "";
    return extractCityFromAddress(nearbyPosts[0].address || "");
  }, [nearbyPosts]);

  const handleNearbyJump = () => {
    const params = new URLSearchParams();
    params.set("section", "posts");

    if (nearbyCity) {
      params.set("city", nearbyCity);
      params.set("q", nearbyCity);
    }

    setSearchParams(params);
  };

  const handleResetToMyLocation = () => {
    const next = new URLSearchParams(searchParams);
    next.set("section", "map");
    next.delete("focusPost");
    setSearchParams(next);
    resetKeyRef.current += 1;
  };

  if (isLoading) {
    return <p>Loading map...</p>;
  }

  if (error) {
    return <p>Failed to load posts for map.</p>;
  }

  return (
    <div className="mapview-wrapper">
      {!!userLocation && (
        <div className="map-action-row">
          <button
            type="button"
            className="map-chip map-chip--small"
            onClick={handleResetToMyLocation}
          >
            My Location
          </button>

          <button
            type="button"
            className="map-chip map-chip--large"
            onClick={handleNearbyJump}
          >
            {nearbyCity
              ? `${nearbyPosts.length} spots near ${nearbyCity}`
              : `${nearbyPosts.length} photography spots nearby`}
          </button>
        </div>
      )}

      {locationLoading && <p className="map-status">Locating you...</p>}
      {!locationLoading && locationError && (
        <p className="map-status map-status-muted">{locationError}</p>
      )}

      <div className="mapview-stage">
        <MapContainer
          center={initialCenter}
          zoom={INITIAL_ZOOM}
          className="modern-map"
          style={{ width: "100%", height: "100%", borderRadius: 16 }}
          dragging={true}
          doubleClickZoom={false}
          touchZoom={true}
          keyboard={false}
          bounceAtZoomLimits={false}
          zoomSnap={0}
          scrollWheelZoom={false}
          smoothWheelZoom={true}
          smoothSensitivity={8}
          zoomControl={false}
        >
          <MapResizeFix />

          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={20}
            keepBuffer={20}
            maxNativeZoom={20}
            updateWhenZooming={true}
            updateWhenIdle={true}
          />

          {!focusedPost && userLocation ? (
            <>
              <FlyToUserLocation
                userLocation={userLocation}
                triggerKey={`${focusPostId}-${resetKeyRef.current}`}
              />
              <UserMarker userLocation={userLocation} />
            </>
          ) : !focusedPost ? (
            <FitBoundsOnPosts posts={valid} />
          ) : null}

          {valid.map((post) => (
            <MarkerWithPopup
              key={post._id || `${post.lat}-${post.lng}`}
              post={post}
              shouldOpen={focusPostId === post._id}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}