"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, ArrowRight, ShieldCheck, User } from "lucide-react";

const AVATAR_PRESETS = [
  { id: "purple", color: "linear-gradient(135deg, #8b5cf6, #ec4899)", label: "Laser Purple" },
  { id: "emerald", color: "linear-gradient(135deg, #10b981, #3b82f6)", label: "Emerald Glow" },
  { id: "amber", color: "linear-gradient(135deg, #fbbf24, #f43f5e)", label: "Solar Amber" },
  { id: "blue", color: "linear-gradient(135deg, #06b6d4, #8b5cf6)", label: "Cyan Surge" },
];

export default function ClientAuthWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [error, setError] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if session already exists
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("codegraph_username");
      if (storedUser) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter a username or nickname.");
      return;
    }
    if (username.length > 20) {
      setError("Username must be 20 characters or less.");
      return;
    }

    setIsAnimating(true);
    setTimeout(() => {
      localStorage.setItem("codegraph_username", username.trim());
      localStorage.setItem("codegraph_avatar_color", selectedAvatar.color);
      localStorage.setItem("codegraph_avatar_name", selectedAvatar.id);
      setIsAuthenticated(true);
      setIsAnimating(false);
    }, 800); // Elegant micro-delay for login animation experience
  };

  // Prevent flash before checking auth state
  if (isAuthenticated === null) {
    return (
      <div 
        style={{ 
          height: "100vh", 
          width: "100vw", 
          background: "#090a0f", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center" 
        }}
      >
        <div className="login-glow" style={{ width: "80px", height: "80px", border: "3px solid transparent", borderTopColor: "var(--primary)", borderBottomColor: "var(--secondary)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="login-screen-bg">
      {/* Animated glowing backgrounds */}
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-header-group">
            <div className="login-logo-orb">
              <svg
                viewBox="0 0 24 24"
                width="32"
                height="32"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h2 className="login-title">
              Code<span className="text-gradient">Graph</span>
            </h2>
            <p className="login-subtitle">
              Interactive coding playgrounds, algorithms, and real-time drawings.
            </p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            {error && (
              <div className="login-error-toast">
                <span>{error}</span>
              </div>
            )}

            <div className="login-input-group">
              <label className="login-label">CHOOSE YOUR NICKNAME</label>
              <div className="login-input-wrapper">
                <User size={16} className="login-input-icon" />
                <input
                  type="text"
                  placeholder="e.g. CodeMaster, DevSam"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  className="login-input"
                  required
                />
              </div>
            </div>

            <div className="login-input-group">
              <label className="login-label">SELECT SYSTEM AVATAR</label>
              <div className="avatar-selection-grid">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedAvatar(preset)}
                    className={`avatar-preset-btn ${selectedAvatar.id === preset.id ? "active" : ""}`}
                    title={preset.label}
                  >
                    <div 
                      className="avatar-preset-color" 
                      style={{ background: preset.color }}
                    >
                      {selectedAvatar.id === preset.id && <ShieldCheck size={16} style={{ color: "#fff" }} />}
                    </div>
                    <span className="avatar-preset-label">{preset.label.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="submit" 
              className={`login-submit-btn ${isAnimating ? "loading" : ""}`}
              disabled={isAnimating}
            >
              {isAnimating ? (
                <>Configuring Sandbox Environment...</>
              ) : (
                <>
                  Enter Collaborative Whiteboard <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <div className="flex items-center gap-1.5 justify-center text-muted" style={{ fontSize: "0.75rem" }}>
              <Sparkles size={12} style={{ color: "var(--accent)" }} />
              <span>WebRTC & Yjs session automatically synchronizes client states.</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Inline styles for login structure which will also be backed by globals.css */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.7; }
        }
        .login-screen-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: #06070a;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          overflow: hidden;
          font-family: var(--font-sans);
        }
        .bg-glow {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          filter: blur(150px);
          opacity: 0.12;
          z-index: 1;
          animation: pulse 8s ease-in-out infinite;
        }
        .bg-glow-1 {
          background: var(--primary);
          top: -100px;
          left: -100px;
        }
        .bg-glow-2 {
          background: var(--secondary);
          bottom: -100px;
          right: -100px;
          animation-delay: 4s;
        }
        .login-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          padding: 1.5rem;
        }
        .login-card {
          background: rgba(19, 21, 32, 0.45);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 2.5rem 2rem;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), 
                      inset 0 1px 0 rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .login-header-group {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }
        .login-logo-orb {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(236, 72, 153, 0.15));
          border: 1.5px solid rgba(99, 102, 241, 0.45);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.5rem;
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
        }
        .login-title {
          font-size: 2rem;
          font-weight: 800;
          margin: 0;
          letter-spacing: -0.03em;
        }
        .login-subtitle {
          color: #94a3b8;
          font-size: 0.88rem;
          line-height: 1.5;
          margin: 0;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .login-error-toast {
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.25);
          color: #fda4af;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.8rem;
          text-align: center;
        }
        .login-input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .login-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.08em;
        }
        .login-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .login-input-icon {
          position: absolute;
          left: 14px;
          color: #64748b;
        }
        .login-input {
          width: 100%;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          color: #fff;
          padding: 12px 14px 12px 40px;
          font-size: 0.95rem;
          transition: all 0.25s ease;
        }
        .login-input:focus {
          outline: none;
          border-color: var(--primary);
          background: rgba(0, 0, 0, 0.6);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }
        .avatar-selection-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
        }
        .avatar-preset-btn {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 8px 4px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          transition: all 0.2s;
        }
        .avatar-preset-btn:hover {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.15);
        }
        .avatar-preset-btn.active {
          border-color: var(--primary);
          background: rgba(99, 102, 241, 0.08);
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.1);
        }
        .avatar-preset-color {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        .avatar-preset-label {
          color: #94a3b8;
          font-size: 0.65rem;
          font-weight: 500;
        }
        .avatar-preset-btn.active .avatar-preset-label {
          color: #fff;
          font-weight: 600;
        }
        .login-submit-btn {
          margin-top: 0.5rem;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: #fff;
          border: none;
          padding: 14px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
        }
        .login-submit-btn:hover {
          opacity: 0.95;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
        }
        .login-submit-btn:active {
          transform: translateY(0);
        }
        .login-submit-btn.loading {
          background: #1e1b4b;
          color: #6366f1;
          cursor: not-allowed;
          box-shadow: none;
        }
        .login-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 1rem;
          text-align: center;
        }
      `}} />
    </div>
  );
}
