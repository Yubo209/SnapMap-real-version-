import React from "react";
import { useNavigate } from "react-router-dom";
import AuthBackdropLayout from "../components/AuthBackdropLayout";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <AuthBackdropLayout
      imageUrl="/spotmap-logo.svg"
      duration={36}
      direction="left"
      repeat={true}
      opacity={0.12}
      blur={0}
      overlay={false}
    >
      <div className="home-card">
        <h1 className="home-title">Welcome to SnapMap</h1>
        <p className="home-subtitle">Log in to unlock a new world! Browse global attractions and photography spots.</p>

        <div className="home-actions">
          <button className="btn btn-primary" onClick={() => navigate("/login")}>Login</button>
          <button className="btn btn-ghost" onClick={() => navigate("/register")}>Register</button>
        </div>

        <div className="home-tip">
          <div className="tip-title">Demo Account</div>
          <div className="tip-row"><span>Email:</span><code>user@spotmail.com</code></div>
          <div className="tip-row"><span>Password:</span><code>User12345678</code></div>
          <div className="tip-note">The first login may take up to 30 seconds due to free server cold start. If it times out, please try again.</div>
        </div>
      </div>
    </AuthBackdropLayout>
  );
}
