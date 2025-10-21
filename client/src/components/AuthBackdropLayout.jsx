import React from "react";
import "./auth-backdrop.css";

export default function AuthBackdropLayout({
  imageUrl,
  duration = 40,
  direction = "left",
  repeat = true,
  opacity = 0.18,
  blur = 0,
  overlay = true,
  className = "",
  children,
}) {
  const dirClass =
    direction === "right"
      ? "ab-move-x-rev"
      : direction === "up"
      ? "ab-move-y"
      : direction === "down"
      ? "ab-move-y-rev"
      : "ab-move-x";

  return (
    <div className="ab-root">
      <div
        className={`ab-bg ${dirClass}`}
        style={{
          backgroundImage: `url("${imageUrl}")`,
          backgroundRepeat: repeat ? "repeat" : "no-repeat",
          backgroundSize: repeat ? "480px auto" : "cover",
          opacity,
          filter: blur ? `blur(${blur}px)` : "none",
          "--ab-duration": `${duration}s`,
        }}
        aria-hidden
      />
      {overlay && <div className="ab-overlay" aria-hidden />}
      <div className={`ab-foreground ${className}`}>{children}</div>
    </div>
  );
}
