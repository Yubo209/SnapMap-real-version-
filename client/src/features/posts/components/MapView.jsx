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
import MapViewSearch from "./MapViewSearch";
import ClusteredMarker from "./ClusteredMarker";
import { useUserLocation } from "../hooks/useUserLocation";


const MAPBOX_TOKEN     = import.meta.env.VITE_MAPBOX_TOKEN;
const INITIAL_VIEW     = { longitude: -98.5795, latitude: 39.8283, zoom: 2 };
const USER_ZOOM        = 12;
const NEARBY_RADIUS_KM = 80;
const FOCUS_ZOOM       = 15;
const MAP_STYLES = {
  light:    "mapbox://styles/mapbox/light-v11",
  dark:     "mapbox://styles/mapbox/dark-v11",
  street:   "mapbox://styles/mapbox/streets-v12",
  outdoor:  "mapbox://styles/mapbox/outdoors-v12",
  satell:   "mapbox://styles/mapbox/satellite-v9",
  hybrid:   "mapbox://styles/mapbox/satellite-streets-v12",
};
const MAP_STYLE_DEFAULT = "street";

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function extractCityFromAddress(address = "") {
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : "";
}

async function reverseGeocode(lng, lat, token) {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=address,poi,place&limit=1`
    );
    const data = await res.json();
    if (data.features?.length > 0) return data.features[0].place_name || "";
  } catch {}
  return "";
}

/* ── Mini card ──────────────────────────────────────────────────── */
function MiniCard({ post, onOpen, onClose, userLocation }) {
  const distance = userLocation 
    ? getDistanceKm(userLocation.lat, userLocation.lng, post.lat, post.lng)
    : null;
  
  return (
    <div className="mini-card-overlay" onClick={onClose}>
      <div className="mini-card" onClick={(e) => e.stopPropagation()}>
        <div className="mini-card-image-wrap">
          {post.imageUrl
            ? <img src={post.imageUrl} alt={post.name || "Spot"} className="mini-card-image" />
            : <div className="mini-card-placeholder" />}
        </div>
        <div className="mini-card-body">
          <p className="mini-card-title">{post.name || "Untitled Spot"}</p>
          {post.address && <p className="mini-card-city">{extractCityFromAddress(post.address)}</p>}
          {distance !== null && <p className="mini-card-distance">{distance.toFixed(1)} km away</p>}
        </div>
        <button className="mini-card-open-btn" onClick={onOpen}>Open</button>
      </div>
    </div>
  );
}

/* ── Full card ──────────────────────────────────────────────────── */
function FullCard({ post, onClose, onViewPost }) {
  const scrollRef = useRef(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [post]);
  return (
    <div className="fullcard-overlay" onClick={onClose}>
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h4 className="popup-title">{post.name || "Untitled Spot"}</h4>
          <button className="popup-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="popup-body">
          <div className="popup-left">
            <div className="popup-image-frame">
              {post.imageUrl
                ? <img src={post.imageUrl} alt={post.name} className="popup-image-contain" />
                : <div className="popup-image-placeholder">No image</div>}
            </div>
          </div>
          <div className="popup-right" ref={scrollRef}>
            {post.description && <p className="popup-desc">{post.description}</p>}
            {post.address && <p className="popup-address"><strong>Address</strong><br />{post.address}</p>}
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

/* ── Create pin tooltip ─────────────────────────────────────────── */
function CreatePinTooltip({ address, loading, onConfirm, onCancel }) {
  return (
    <div className="create-pin-overlay">
      <div className="create-pin-tooltip" onClick={(e) => e.stopPropagation()}>
        <p className="create-pin-address">
          {loading ? "Resolving address…" : (address || "Drag pin to set location")}
        </p>
        <div className="create-pin-actions">
          <button className="create-pin-confirm" onClick={onConfirm} disabled={loading}>
            Create post here
          </button>
          <button className="create-pin-cancel" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ── MapView ────────────────────────────────────────────────────── */
export default function MapView({ onCreateFromMap }) {
  const { posts, isLoading, error } = usePosts();
  const { userLocation, locationLoading, locationError } = useUserLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const focusPostId = searchParams.get("focusPost") || "";

  const [mapStyle, setMapStyle] = useState(MAP_STYLE_DEFAULT);
  const [viewState,       setViewState]       = useState(INITIAL_VIEW);
  const [popupStep,       setPopupStep]       = useState(null);
  const [activePost,      setActivePost]      = useState(null);
  const [showYouAreHere,  setShowYouAreHere]  = useState(false);
  const [createPin,       setCreatePin]       = useState(null);
  const [pinAddress,      setPinAddress]      = useState("");
  const [pinAddrLoading,  setPinAddrLoading]  = useState(false);
  const [showPinTooltip,  setShowPinTooltip]  = useState(false);
  const [is3DMode,        setIs3DMode]        = useState(false);
  const [markerStyle,     setMarkerStyle]     = useState("card"); // "pin" or "card"
  const [showNearbyConnections, setShowNearbyConnections] = useState(false);

  /* ── Refs ──────────────────────────────────────────────────────── */
  const previousViewRef   = useRef(null);
  const mapRef            = useRef(null);
  const mapLoadedRef      = useRef(false);
  const pendingFocusRef   = useRef(null);
  
  // Track if we've done the first auto-fly to user location
  const hasAutoFlyToUserRef = useRef(
    typeof window !== 'undefined' 
      ? window.__snapmap_has_auto_fly_to_user__ 
      : false
  );

  /* ── Derived ──────────────────────────────────────────────────── */
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

  /* ── flyTo ────────────────────────────────────────────────────── */
  const flyTo = useCallback((lng, lat, zoom, duration = 900) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom, duration, essential: true });
  }, []);

  /* ── Close popup ──────────────────────────────────────────────── */
  const closePopup = useCallback(() => {
    setActivePost(null);
    setPopupStep(null);
    if (previousViewRef.current && mapRef.current) {
      const { longitude, latitude, zoom } = previousViewRef.current;
      mapRef.current.flyTo({ center: [longitude, latitude], zoom, duration: 500, essential: true });
      previousViewRef.current = null;
    }
  }, []);

  /* ── Open mini ────────────────────────────────────────────────── */
  const openMini = useCallback((post, saveView = true) => {
    if (saveView && mapRef.current && !previousViewRef.current) {
      const c = mapRef.current.getCenter();
      previousViewRef.current = { longitude: c.lng, latitude: c.lat, zoom: mapRef.current.getZoom() };
    }
    setActivePost(post);
    setPopupStep("mini");
  }, []);

  const openFull = useCallback(() => setPopupStep("full"), []);

  /* ── Navigate to PostModal ────────────────────────────────────── */
  const handleViewPost = useCallback((postId) => {
    const next = new URLSearchParams(searchParams);
    next.set("section", "posts");
    next.set("post", postId);
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  /* ── Marker click ─────────────────────────────────────────────── */
  const handleMarkerClick = useCallback((post) => {
    setCreatePin(null);
    setShowPinTooltip(false);
    const currentZoom = mapRef.current?.getZoom() ?? FOCUS_ZOOM;
    if (mapRef.current && !previousViewRef.current) {
      const c = mapRef.current.getCenter();
      previousViewRef.current = { longitude: c.lng, latitude: c.lat, zoom: mapRef.current.getZoom() };
    }
    mapRef.current?.flyTo({ center: [post.lng, post.lat], zoom: Math.max(currentZoom, FOCUS_ZOOM), duration: 600, essential: true });
    setActivePost(post);
    setPopupStep("mini");
  }, []);

  /* ── Map load ──────────────────────────────────────────────────── */
  const handleMapLoad = useCallback(() => {
    mapLoadedRef.current = true;

    // Handle pending focusPost (navigated from PostModal "On Map")
    if (pendingFocusRef.current) {
      const post = pendingFocusRef.current;
      pendingFocusRef.current = null;
      const c = mapRef.current?.getCenter();
      if (c) previousViewRef.current = { longitude: c.lng, latitude: c.lat, zoom: mapRef.current.getZoom() };
      flyTo(post.lng, post.lat, FOCUS_ZOOM, 800);
      setTimeout(() => openMini(post, false), 850);
    }
  }, [flyTo, openMini]);

  /* ── Auto fly to user on first app load (when location ready) ───── */
  useEffect(() => {
    if (!userLocation || !mapLoadedRef.current || hasAutoFlyToUserRef.current) return;
    
    hasAutoFlyToUserRef.current = true;
    if (typeof window !== 'undefined') {
      window.__snapmap_has_auto_fly_to_user__ = true;
    }
    
    mapRef.current?.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: USER_ZOOM,
      duration: 1200,
      essential: true,
    });
    setShowYouAreHere(true);
    setTimeout(() => setShowYouAreHere(false), 3000);
  }, [userLocation]);

  /* ── FitBounds ────────────────────────────────────────────────── */
  useEffect(() => {
    if (userLocation || !valid.length || focusPostId || !mapLoadedRef.current) return;
    if (valid.length === 1) { flyTo(valid[0].lng, valid[0].lat, 10, 800); return; }
    const minLng = Math.min(...valid.map((p) => p.lng));
    const maxLng = Math.max(...valid.map((p) => p.lng));
    const minLat = Math.min(...valid.map((p) => p.lat));
    const maxLat = Math.max(...valid.map((p) => p.lat));
    mapRef.current?.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 80, maxZoom: 3, duration: 800 });
  }, [valid, userLocation, focusPostId, flyTo]);

  /* ── Focus post from URL — fly + open mini card ───────────────── */
  useEffect(() => {
    if (!focusedPost) return;
    if (mapLoadedRef.current) {
      // Map already loaded — execute immediately
      const c = mapRef.current?.getCenter();
      if (c) previousViewRef.current = { longitude: c.lng, latitude: c.lat, zoom: mapRef.current.getZoom() };
      flyTo(focusedPost.lng, focusedPost.lat, FOCUS_ZOOM, 800);
      const t = setTimeout(() => openMini(focusedPost, false), 850);
      return () => clearTimeout(t);
    } else {
      // Map not loaded yet — store for onLoad to execute
      pendingFocusRef.current = focusedPost;
    }
  }, [focusedPost, flyTo, openMini]);

  /* ── Reverse geocode create pin ───────────────────────────────── */
  useEffect(() => {
    if (!createPin) return;
    let cancelled = false;
    setPinAddrLoading(true);
    setPinAddress("");
    reverseGeocode(createPin.lng, createPin.lat, MAPBOX_TOKEN).then((addr) => {
      if (!cancelled) { setPinAddress(addr); setPinAddrLoading(false); }
    });
    return () => { cancelled = true; };
  }, [createPin]);

  /* ── Toggle create pin ────────────────────────────────────────── */
  const handleToggleCreatePin = () => {
    if (createPin) {
      setCreatePin(null);
      setShowPinTooltip(false);
    } else {
      const center = mapRef.current?.getCenter();
      if (center) {
        setCreatePin({ lng: center.lng, lat: center.lat });
        setShowPinTooltip(true);
        setActivePost(null);
        setPopupStep(null);
        previousViewRef.current = null;
      }
    }
  };

  const handleConfirmCreate = () => {
    onCreateFromMap?.(pinAddress);
    setCreatePin(null);
    setShowPinTooltip(false);
  };

  const handleDragStart = () => {
    if (popupStep === "mini") { setActivePost(null); setPopupStep(null); previousViewRef.current = null; }
  };

  const handleNearbyJump = () => {
    if (nearbyPosts.length === 0) return;
    
    // Toggle nearby view
    if (showNearbyConnections) {
      setShowNearbyConnections(false);
    } else {
      setShowNearbyConnections(true);
      // Fit map to show all nearby posts + user location
      if (userLocation && nearbyPosts.length > 0) {
        const allLngs = [userLocation.lng, ...nearbyPosts.map(p => p.lng)];
        const allLats = [userLocation.lat, ...nearbyPosts.map(p => p.lat)];
        const minLng = Math.min(...allLngs);
        const maxLng = Math.max(...allLngs);
        const minLat = Math.min(...allLats);
        const maxLat = Math.max(...allLats);
        mapRef.current?.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 80, duration: 800 });
      }
    }
  };

  const handleResetToMyLocation = () => {
    if (userLocation) flyTo(userLocation.lng, userLocation.lat, USER_ZOOM, 1000);
  };

  const handleToggle3D = () => {
    if (!mapRef.current) return;
    
    const newMode = !is3DMode;
    setIs3DMode(newMode);
    
    if (newMode) {
      // Enable 3D: set pitch to 65 and rotate 45
      mapRef.current.easeTo({
        pitch: 65,
        bearing: 45,
        duration: 1200
      });
    } else {
      // Disable 3D: reset to flat
      mapRef.current.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 1200
      });
    }
  };

  const handleSearchSelectPost = (post) => {
    // Fly to post and open mini card
    if (mapRef.current && !previousViewRef.current) {
      const c = mapRef.current.getCenter();
      previousViewRef.current = { longitude: c.lng, latitude: c.lat, zoom: mapRef.current.getZoom() };
    }
    mapRef.current?.flyTo({ center: [post.lng, post.lat], zoom: FOCUS_ZOOM, duration: 800, essential: true });
    setTimeout(() => { setActivePost(post); setPopupStep("mini"); }, 850);
  };

  if (isLoading) return <p className="map-status" style={{ padding: "16px" }}>Loading map…</p>;
  if (error)     return <p className="map-status" style={{ padding: "16px" }}>Failed to load posts.</p>;

  return (
    <div className="mapview-wrapper">

      {/* ── Desktop action chips (text) ── */}
      {!!userLocation && (
        <div className="map-action-row map-action-row--desktop">
          <button type="button" className="map-chip map-chip--small" onClick={handleResetToMyLocation}>
            My location
          </button>
          <button type="button" className="map-chip map-chip--large" onClick={handleNearbyJump}>
            {nearbyCity ? `${nearbyPosts.length} spots near ${nearbyCity}` : `${nearbyPosts.length} photography spots nearby`}
          </button>
          <button
            type="button"
            className={`map-chip map-chip--small${is3DMode ? " map-chip--active" : ""}`}
            onClick={handleToggle3D}
          >
            {is3DMode ? "Exit 3D" : "3D View"}
          </button>
          <button
            type="button"
            className={`map-chip map-chip--small${markerStyle === "card" ? " map-chip--active" : ""}`}
            onClick={() => setMarkerStyle(markerStyle === "card" ? "pin" : "card")}
          >
            {markerStyle === "card" ? "Cards" : "Pins"}
          </button>
          <button
            type="button"
            className={`map-chip map-chip--small${createPin ? " map-chip--active" : ""}`}
            onClick={handleToggleCreatePin}
          >
            {createPin ? "Cancel pin" : "+ Create here"}
          </button>
        </div>
      )}

      {locationLoading && <p className="map-status">Locating you…</p>}
      {!locationLoading && locationError && <p className="map-status map-status-muted">{locationError}</p>}

      <div className="mapview-stage">
        {/* Map style picker — hidden but available via keyboard */}
        <div className="map-style-picker" style={{ display: 'none' }}>
          {Object.entries(MAP_STYLES).map(([key, url]) => (
            <button
              key={key}
              className={`map-style-btn${mapStyle === key ? ' active' : ''}`}
              onClick={() => setMapStyle(key)}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <MapViewSearch posts={valid} onSelectPost={handleSearchSelectPost} />
        
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(e) => setViewState(e.viewState)}
          onDragStart={handleDragStart}
          onLoad={handleMapLoad}
          onStyleLoad={(map) => {
            // Wait for style to fully load
            setTimeout(() => {
              if (map.getLayer('3d-buildings')) return;
              
              try {
                const style = map.getStyle();
                const layers = style.layers;
                const sources = style.sources;
                
                // Find a good insertion point (before label layers)
                const labelLayerId = layers.find(layer => 
                  layer.type === 'symbol' && layer.layout?.['text-field']
                )?.id;
                
                // Try multiple building layer names
                const buildingLayers = ['building', 'building-v2', 'buildings'];
                const sourceLayers = buildingLayers;
                
                let layerAdded = false;
                
                for (const sourceLayer of sourceLayers) {
                  try {
                    map.addLayer(
                      {
                        id: '3d-buildings',
                        source: 'composite',
                        'source-layer': sourceLayer,
                        type: 'fill-extrusion',
                        minzoom: 15,
                        paint: {
                          'fill-extrusion-color': [
                            'interpolate',
                            ['linear'],
                            ['get', 'height'],
                            0, '#999',
                            100, '#888',
                            500, '#777'
                          ],
                          'fill-extrusion-height': ['get', 'height'],
                          'fill-extrusion-base': ['get', 'min_height'],
                          'fill-extrusion-opacity': 0.8
                        }
                      },
                      labelLayerId
                    );
                    console.log(`✓ 3D buildings layer added (source-layer: ${sourceLayer})`);
                    layerAdded = true;
                    break;
                  } catch (e) {
                    // Try next source layer
                  }
                }
                
                if (!layerAdded) {
                  console.log('⚠ Could not add 3D buildings - source layer not found');
                }
              } catch (err) {
                console.error('3D buildings error:', err.message);
              }
            }, 800);
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={MAP_STYLES[mapStyle]}
          mapboxAccessToken={MAPBOX_TOKEN}
          attributionControl={false}
          logoPosition="bottom-right"
          dragRotate={true}
          pitchWithRotate={true}
          fadeDuration={0}
          reuseMaps
        >
          {/* Connection lines for nearby posts */}
          {showNearbyConnections && userLocation && nearbyPosts.length > 0 && (
            <svg 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 5
              }}
            >
              {nearbyPosts.map((post, idx) => {
                // Calculate pixel positions for user and post
                const userCanvas = mapRef.current?.project([userLocation.lng, userLocation.lat]);
                const postCanvas = mapRef.current?.project([post.lng, post.lat]);
                
                if (!userCanvas || !postCanvas) return null;
                
                return (
                  <line
                    key={`line-${idx}`}
                    x1={userCanvas.x}
                    y1={userCanvas.y}
                    x2={postCanvas.x}
                    y2={postCanvas.y}
                    stroke="#0066ff"
                    strokeWidth="2"
                    opacity="0.5"
                    strokeDasharray="5,5"
                    className="nearby-connection-line"
                  />
                );
              })}
            </svg>
          )}
          
          {/* Post markers - grouped by location */}
          {(() => {
            // Group posts by location (same address or coordinates)
            const grouped = {};
            valid.forEach((post) => {
              const key = `${post.lat.toFixed(5)}-${post.lng.toFixed(5)}`;
              if (!grouped[key]) grouped[key] = [];
              grouped[key].push(post);
            });

            return Object.entries(grouped).map(([key, posts]) => {
              const post = posts[0]; // First post for coordinates
              const id = `marker-${key}`;
              const isActive = activePost && posts.some(p => 
                p._id === activePost._id || (p.lat === activePost.lat && p.lng === activePost.lng)
              );
              const isNearby = showNearbyConnections && nearbyPosts.some(p => 
                p.lat === post.lat && p.lng === post.lng
              );

              return (
                <Marker key={id} longitude={post.lng} latitude={post.lat} anchor="bottom">
                  <div 
                    onClick={() => handleMarkerClick(post)}
                    style={{
                      position: 'relative',
                      display: 'inline-block'
                    }}
                  >
                    {/* Highlight border for nearby */}
                    {isNearby && (
                      <div
                        style={{
                          position: 'absolute',
                          top: -8,
                          left: -8,
                          right: -8,
                          bottom: -8,
                          border: '3px solid #0066ff',
                          borderRadius: markerStyle === "card" ? '8px' : '50%',
                          pointerEvents: 'none',
                          animation: 'pulse-border 2s ease-in-out infinite'
                        }}
                      />
                    )}
                    
                    {markerStyle === "card" ? (
                      <ClusteredMarker 
                        posts={posts}
                        isActive={isActive}
                        onClick={() => handleMarkerClick(post)}
                        displayMode="card"
                      />
                    ) : (
                      <div className={`map-marker-pin${isActive ? " map-marker-pin--active" : ""}`}>
                        {posts.length > 1 && <span className="map-marker-count">{posts.length}</span>}
                        <img src="/icons8-map-pin-50.png" width={36} height={36} draggable={false} alt="" />
                      </div>
                    )}
                  </div>
                </Marker>
              );
            });
          })()}

          {/* User marker */}
          {userLocation && (
            <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="bottom">
              <div
                className="map-marker-user"
                style={{ cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); setShowYouAreHere((v) => !v); }}
              >
                <img src="/spotmap-icon.svg" width={30} height={30} draggable={false} alt="You are here" />
              </div>
            </Marker>
          )}

          {/* "You are here" pill */}
          {userLocation && showYouAreHere && (
            <Popup longitude={userLocation.lng} latitude={userLocation.lat} anchor="bottom"
              offset={[0, -34]} closeButton={false} closeOnClick={true}
              onClose={() => setShowYouAreHere(false)} className="user-popup">
              <div className="user-popup-content">You are here</div>
            </Popup>
          )}

          {/* Draggable create pin */}
          {createPin && (
            <Marker
              longitude={createPin.lng}
              latitude={createPin.lat}
              anchor="bottom"
              draggable
              onDrag={(e) => setCreatePin({ lng: e.lngLat.lng, lat: e.lngLat.lat })}
              onDragEnd={(e) => setCreatePin({ lng: e.lngLat.lng, lat: e.lngLat.lat })}
            >
              <div className="map-marker-create">
                <svg width="36" height="44" viewBox="0 0 36 44" fill="none">
                  <circle cx="18" cy="18" r="16" fill="#0d0d0c" stroke="white" strokeWidth="2.5"/>
                  <line x1="18" y1="34" x2="18" y2="44" stroke="#0d0d0c" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="12" y1="18" x2="24" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="18" y1="12" x2="18" y2="24" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </Marker>
          )}
        </Map>

        {/* ── Mobile FAB buttons (icon only, floating over map) ── */}
        {!!userLocation && (
          <div className="map-fab-group">
            {/* Location arrow */}
            <button
              type="button"
              className="map-fab"
              onClick={handleResetToMyLocation}
              aria-label="My location"
            >
              {/* Diagonal arrow icon like Google Maps */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11"/>
              </svg>
            </button>

            {/* Nearby spots badge */}
            {nearbyPosts.length > 0 && (
              <button
                type="button"
                className="map-fab map-fab--badge"
                onClick={handleNearbyJump}
                aria-label={`${nearbyPosts.length} spots nearby`}
              >
                <span className="map-fab-count">{nearbyPosts.length}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </button>
            )}

            {/* Create pin toggle */}
            <button
              type="button"
              className={`map-fab${createPin ? " map-fab--active" : ""}`}
              onClick={handleToggleCreatePin}
              aria-label={createPin ? "Cancel pin" : "Create post here"}
            >
              {createPin ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              )}
            </button>

            {/* Marker style toggle */}
            <button
              type="button"
              className={`map-fab${markerStyle === "card" ? " map-fab--active" : ""}`}
              onClick={() => setMarkerStyle(markerStyle === "card" ? "pin" : "card")}
              aria-label={markerStyle === "card" ? "Switch to pins" : "Switch to cards"}
              title={markerStyle === "card" ? "Switch to pins" : "Switch to cards"}
            >
              {markerStyle === "card" ? (
                /* Card icon */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
              ) : (
                /* Pin icon */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                </svg>
              )}
            </button>

            {/* 3D Mode toggle */}
            <button
              type="button"
              className={`map-fab${is3DMode ? " map-fab--active" : ""}`}
              onClick={handleToggle3D}
              aria-label={is3DMode ? "Exit 3D mode" : "Enter 3D mode"}
              title={is3DMode ? "Exit 3D" : "3D View"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </button>
          </div>
        )}

        {/* Mini card */}
        {activePost && popupStep === "mini" && (
          <MiniCard post={activePost} onOpen={openFull} onClose={closePopup} userLocation={userLocation} />
        )}

        {/* Full card */}
        {activePost && popupStep === "full" && (
          <FullCard post={activePost} onClose={closePopup} onViewPost={handleViewPost} />
        )}

        {/* Create pin tooltip */}
        {createPin && showPinTooltip && (
          <CreatePinTooltip
            address={pinAddress}
            loading={pinAddrLoading}
            onConfirm={handleConfirmCreate}
            onCancel={() => { setCreatePin(null); setShowPinTooltip(false); }}
          />
        )}
      </div>
    </div>
  );
}