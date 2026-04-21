import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useSearchParams } from "react-router-dom";
import "../../../style/mapview.css";
import { usePosts } from "../hooks/usePosts";
import { useUserLocation } from "../hooks/useUserLocation";

/* ─── Constants ─────────────────────────────────────────────────── */
const MAPBOX_TOKEN     = import.meta.env.VITE_MAPBOX_TOKEN;
const INITIAL_VIEW     = { longitude: -98.5795, latitude: 39.8283, zoom: 2 };
const USER_ZOOM        = 12;
const NEARBY_RADIUS_KM = 80;
const FOCUS_ZOOM       = 15;
const MAP_STYLE        = "mapbox://styles/mapbox/light-v11";

/* ─── Helpers ───────────────────────────────────────────────────── */
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function extractCityFromAddress(address = "") {
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : "";
}

/* ─── Mini card — bottom bar, tap anywhere outside to close ──────── */
function MiniCard({ post, onOpen, onClose }) {
  return (
    <div className="mini-card-overlay" onClick={onClose}>
      <div className="mini-card" onClick={(e) => e.stopPropagation()}>
        <div className="mini-card-image-wrap">
          {post.imageUrl ? (
            <img src={post.imageUrl} alt={post.name || "Spot"} className="mini-card-image" />
          ) : (
            <div className="mini-card-placeholder" />
          )}
        </div>
        <div className="mini-card-body">
          <p className="mini-card-title">{post.name || "Untitled Spot"}</p>
          {post.address && (
            <p className="mini-card-city">{extractCityFromAddress(post.address)}</p>
          )}
        </div>
        <button className="mini-card-open-btn" onClick={onOpen}>Open</button>
      </div>
    </div>
  );
}

/* ─── Full card ──────────────────────────────────────────────────── */
function FullCard({ post, onClose, onViewPost }) {
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [post]);

  return (
    <div className="fullcard-overlay" onClick={onClose}>
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h4 className="popup-title">{post.name || "Untitled Spot"}</h4>
          <button className="popup-close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="popup-body">
          <div className="popup-left">
            <div className="popup-image-frame">
              {post.imageUrl ? (
                <img src={post.imageUrl} alt={post.name || "Spot"} className="popup-image-contain" />
              ) : (
                <div className="popup-image-placeholder">No image</div>
              )}
            </div>
          </div>
          <div className="popup-right" ref={scrollRef}>
            {post.description && <p className="popup-desc">{post.description}</p>}
            {post.address && (
              <p className="popup-address"><strong>Address</strong><br />{post.address}</p>
            )}
            <p className="popup-coord">{post.lat.toFixed(5)}, {post.lng.toFixed(5)}</p>
          </div>
        </div>
        <div className="popup-footer">
          <button className="popup-view-btn" onClick={() => { onClose(); onViewPost(post._id); }}>
            View full post
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── MapView ────────────────────────────────────────────────────── */
export default function MapView() {
  const { posts, isLoading, error } = usePosts();
  const { userLocation, locationLoading, locationError } = useUserLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const focusPostId = searchParams.get("focusPost") || "";

  const [viewState, setViewState]           = useState(INITIAL_VIEW);
  const [popupStep, setPopupStep]           = useState(null);
  const [activePost, setActivePost]         = useState(null);
  const [showYouAreHere, setShowYouAreHere] = useState(false);

  const youAreHereShownRef = useRef(false);
  const previousViewRef    = useRef(null);
  const mapRef             = useRef(null);
  const mapLoadedRef       = useRef(false);
  const initialFlyDoneRef  = useRef(false);

  /* ── Derived ───────────────────────────────────────────────────── */
  const valid = useMemo(
    () => (posts || []).filter((p) => typeof p.lat === "number" && typeof p.lng === "number"),
    [posts]
  );

  const focusedPost = useMemo(
    () => !focusPostId ? null : valid.find((p) => p._id === focusPostId) || null,
    [focusPostId, valid]
  );

  const nearbyPosts = useMemo(() => {
    if (!userLocation || !valid.length) return [];
    return valid.filter(
      (p) => getDistanceKm(userLocation.lat, userLocation.lng, p.lat, p.lng) <= NEARBY_RADIUS_KM
    );
  }, [userLocation, valid]);

  const nearbyCity = useMemo(
    () => nearbyPosts.length ? extractCityFromAddress(nearbyPosts[0].address || "") : "",
    [nearbyPosts]
  );

  /* ── flyTo — smooth animated transition ────────────────────────── */
  const flyTo = useCallback((lng, lat, zoom, duration = 600) => {
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom,
      duration,
      essential: true,
    });
  }, []);

  /* ── Close popup + animate back to saved view ──────────────────── */
  const closePopup = useCallback(() => {
    setActivePost(null);
    setPopupStep(null);
    if (previousViewRef.current && mapRef.current) {
      const { longitude, latitude, zoom } = previousViewRef.current;
      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom,
        duration: 500,
        essential: true,
      });
      previousViewRef.current = null;
    }
  }, []);

  /* ── Open mini — save view first, then fly in ───────────────────── */
  const openMini = useCallback((post, saveView = true) => {
    if (saveView && mapRef.current && !previousViewRef.current) {
      const c = mapRef.current.getCenter();
      previousViewRef.current = {
        longitude: c.lng,
        latitude:  c.lat,
        zoom:      mapRef.current.getZoom(),
      };
    }
    setActivePost(post);
    setPopupStep("mini");
  }, []);

  const openFull = useCallback(() => setPopupStep("full"), []);

  /* ── Navigate to PostModal ──────────────────────────────────────── */
  const handleViewPost = useCallback((postId) => {
    const next = new URLSearchParams(searchParams);
    next.set("section", "posts");
    next.set("post", postId);
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  /* ── Marker click: fly with animation then show mini card ───────── */
  const handleMarkerClick = useCallback((post) => {
    const currentZoom = mapRef.current?.getZoom() ?? FOCUS_ZOOM;
    const targetZoom  = Math.max(currentZoom, FOCUS_ZOOM);

    // Save view before flying
    if (mapRef.current && !previousViewRef.current) {
      const c = mapRef.current.getCenter();
      previousViewRef.current = {
        longitude: c.lng,
        latitude:  c.lat,
        zoom:      mapRef.current.getZoom(),
      };
    }

    // Fly with smooth animation
    mapRef.current?.flyTo({
      center:   [post.lng, post.lat],
      zoom:     targetZoom,
      duration: 600,
      essential: true,
    });

    // Show mini card immediately (appears while flying)
    setActivePost(post);
    setPopupStep("mini");
  }, []);

  /* ── Map load ───────────────────────────────────────────────────── */
  const handleMapLoad = useCallback(() => {
    mapLoadedRef.current = true;
    if (userLocation && !initialFlyDoneRef.current && !focusPostId) {
      initialFlyDoneRef.current = true;
      flyTo(userLocation.lng, userLocation.lat, USER_ZOOM, 1200);
    }
  }, [userLocation, focusPostId, flyTo]);

  /* ── Location arrives after map load ───────────────────────────── */
  useEffect(() => {
    if (!userLocation || focusPostId || initialFlyDoneRef.current || !mapLoadedRef.current) return;
    initialFlyDoneRef.current = true;
    flyTo(userLocation.lng, userLocation.lat, USER_ZOOM, 1200);
    // Show pill briefly on first locate
    setShowYouAreHere(true);
    const t = setTimeout(() => setShowYouAreHere(false), 3000);
    return () => clearTimeout(t);
  }, [userLocation, focusPostId, flyTo]);

  /* ── FitBounds ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (userLocation || !valid.length || focusPostId || !mapLoadedRef.current) return;
    if (valid.length === 1) { flyTo(valid[0].lng, valid[0].lat, 10, 800); return; }
    const minLng = Math.min(...valid.map((p) => p.lng));
    const maxLng = Math.max(...valid.map((p) => p.lng));
    const minLat = Math.min(...valid.map((p) => p.lat));
    const maxLat = Math.max(...valid.map((p) => p.lat));
    mapRef.current?.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 80, maxZoom: 3, duration: 800 });
  }, [valid, userLocation, focusPostId, flyTo]);

  /* ── Focus post from URL ────────────────────────────────────────── */
  useEffect(() => {
    if (!focusedPost || !mapLoadedRef.current) return;
    const c = mapRef.current?.getCenter();
    if (c) previousViewRef.current = { longitude: c.lng, latitude: c.lat, zoom: mapRef.current.getZoom() };
    flyTo(focusedPost.lng, focusedPost.lat, FOCUS_ZOOM, 800);
    const t = setTimeout(() => openMini(focusedPost, false), 850);
    return () => clearTimeout(t);
  }, [focusedPost, flyTo, openMini]);

  /* ── Navigation handlers ────────────────────────────────────────── */
  const handleNearbyJump = () => {
    const params = new URLSearchParams();
    params.set("section", "posts");
    if (nearbyCity) { params.set("city", nearbyCity); params.set("q", nearbyCity); }
    setSearchParams(params);
  };

  const handleResetToMyLocation = () => {
    // Only flyTo — no URL changes that would trigger re-renders or re-locate logic
    if (userLocation) flyTo(userLocation.lng, userLocation.lat, USER_ZOOM, 1000);
  };

  /* ── Render ─────────────────────────────────────────────────────── */
  if (isLoading) return <p className="map-status" style={{ padding: "16px" }}>Loading map…</p>;
  if (error)     return <p className="map-status" style={{ padding: "16px" }}>Failed to load posts.</p>;

  return (
    <div className="mapview-wrapper">
      {!!userLocation && (
        <div className="map-action-row">
          <button type="button" className="map-chip map-chip--small" onClick={handleResetToMyLocation}>
            My location
          </button>
          <button type="button" className="map-chip map-chip--large" onClick={handleNearbyJump}>
            {nearbyCity
              ? `${nearbyPosts.length} spots near ${nearbyCity}`
              : `${nearbyPosts.length} photography spots nearby`}
          </button>
        </div>
      )}

      {locationLoading && <p className="map-status">Locating you…</p>}
      {!locationLoading && locationError && <p className="map-status map-status-muted">{locationError}</p>}

      <div className="mapview-stage">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(e) => setViewState(e.viewState)}
          onDragStart={() => {
            if (popupStep === "mini") {
              setActivePost(null);
              setPopupStep(null);
              previousViewRef.current = null;
            }
          }}
          onLoad={handleMapLoad}
          style={{ width: "100%", height: "100%" }}
          mapStyle={MAP_STYLE}
          mapboxAccessToken={MAPBOX_TOKEN}
          attributionControl={false}
          logoPosition="bottom-right"
          dragRotate={false}
          pitchWithRotate={false}
          fadeDuration={0}
          reuseMaps
        >
          {/* Post markers */}
          {valid.map((post) => {
            const id = post._id || `${post.lat}-${post.lng}`;
            const isActive = activePost && (activePost._id === post._id || (activePost.lat === post.lat && activePost.lng === post.lng));
            return (
              <Marker key={id} longitude={post.lng} latitude={post.lat} anchor="bottom" onClick={() => handleMarkerClick(post)}>
                <div className={`map-marker-pin${isActive ? " map-marker-pin--active" : ""}`}>
                  <img src="/icons8-map-pin-50.png" width={36} height={36} draggable={false} alt="" />
                </div>
              </Marker>
            );
          })}

          {/* User marker — click to toggle "You are here" pill */}
          {userLocation && (
            <>
              <Marker
                longitude={userLocation.lng}
                latitude={userLocation.lat}
                anchor="bottom"
              >
                <div
                  className="map-marker-user"
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowYouAreHere((v) => !v);
                  }}
                >
                  <img src="/spotmap-icon.svg" width={30} height={30} draggable={false} alt="You are here" />
                </div>
              </Marker>

              {showYouAreHere && (
                <Popup
                  longitude={userLocation.lng}
                  latitude={userLocation.lat}
                  anchor="bottom"
                  offset={[0, -34]}
                  closeButton={false}
                  closeOnClick={true}
                  onClose={() => setShowYouAreHere(false)}
                  className="user-popup"
                >
                  <div className="user-popup-content">You are here</div>
                </Popup>
              )}
            </>
          )}
        </Map>

        {/* Mini card — tap outside to close, no close button */}
        {activePost && popupStep === "mini" && (
          <MiniCard post={activePost} onOpen={openFull} onClose={closePopup} />
        )}

        {/* Full card */}
        {activePost && popupStep === "full" && (
          <FullCard post={activePost} onClose={closePopup} onViewPost={handleViewPost} />
        )}
      </div>
    </div>
  );
}