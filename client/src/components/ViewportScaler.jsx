import React, { useEffect, useMemo, useRef, useState } from "react";


export default function ViewportScaler({
  children,
  designWidth = 1024,
  designHeight = 680,
  minScale = 0.7,
  maxScale = 1,
  mobileOnly = true,
  className = "",
  style = {},
}) {
  const [scale, setScale] = useState(1);
  const frameRef = useRef(null);

  const isSmallScreen = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return w < 768 || h < 700;
  };

  const computeScale = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const k = Math.min(vw / designWidth, vh / designHeight);
    let s = Math.min(Math.max(k, minScale), maxScale);
    if (mobileOnly && !isSmallScreen()) s = 1;
    setScale(s);
  };

  useEffect(() => {
    computeScale();
    let tid;
    const onResize = () => {
      clearTimeout(tid);
      tid = setTimeout(computeScale, 100);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      clearTimeout(tid);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
    
  }, []);

  const frameStyle = useMemo(
    () => ({
      transform: `scale(${scale})`,
      transformOrigin: "top center",
      width: designWidth,
      minHeight: designHeight,
      marginInline: "auto",
    }),
    [scale, designWidth, designHeight]
  );

  return (
    <div
      className={`vs-root ${className}`}
      style={{
        display: "grid",
        placeItems: "start center",
        minHeight: "100svh",
        overflow: "hidden",
        padding: 12,
        ...style,
      }}
    >
      <div ref={frameRef} className="vs-frame" style={frameStyle}>
        {children}
      </div>
    </div>
  );
}
