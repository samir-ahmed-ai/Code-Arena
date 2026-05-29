"use client";

import React, { useState } from "react";
import ProblemCard from "@/components/ProblemCard";
import { Search, Filter, Sparkles, Plus, Copy, X } from "lucide-react";
import Link from "next/link";

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  createdAt: string;
}

export default function ProblemsDashboard({ initialProblems }: { initialProblems: Problem[] }) {
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<"All" | "Easy" | "Medium" | "Hard">("All");
  
  // Share popup state
  const [shareId, setShareId] = useState("");
  const [shareTitle, setShareTitle] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  const filteredProblems = initialProblems.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          p.description.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = difficultyFilter === "All" || p.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  const handleOpenShare = (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    setShareId(id);
    setShareTitle(title);
    setCopySuccess(false);
  };

  const getShareUrl = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/problems/${shareId}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="flex-col h-full" style={{ minHeight: "100vh", background: "var(--bg-dark)", paddingBottom: "5rem" }}>
      {/* Top Header */}
      <div className="top-header">
        <div className="top-header-title">
          <span className="text-muted">CodeGraph</span>
          <span className="text-dark">/</span>
          <span style={{ fontWeight: 600 }}>Problems Library</span>
        </div>
      </div>

      <div className="container flex-col gap-6" style={{ paddingTop: "2rem", maxWidth: "1000px" }}>
        
        {/* Glowing Banner */}
        <div 
          className="glass-card flex items-center justify-between" 
          style={{ 
            padding: "1.25rem", 
            borderLeft: "4px solid var(--primary)", 
            background: "rgba(99, 102, 241, 0.03)",
            borderRadius: "12px",
            borderTop: "1px solid var(--border-glass)",
            borderRight: "1px solid var(--border-glass)",
            borderBottom: "1px solid var(--border-glass)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
          }}
        >
          <div className="flex items-center gap-3">
            <Sparkles size={20} className="text-primary" style={{ color: "var(--primary)", animation: "pulseBadge 2s infinite" }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-main)" }}>Algorithm Playground</div>
              <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                Select a problem to launch our custom collaborative Monaco editor with real-time Excalidraw explanation canvas.
              </div>
            </div>
          </div>
          <div className="text-muted" style={{ fontSize: "0.8rem", fontFamily: "var(--font-mono)", background: "rgba(0,0,0,0.2)", padding: "4px 8px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.03)" }}>
            {filteredProblems.length} / {initialProblems.length} Loaded
          </div>
        </div>

        {/* Filter and Search Bar Pane */}
        <div 
          className="flex justify-between items-center" 
          style={{ 
            background: "var(--bg-panel)", 
            border: "1px solid var(--border-glass)", 
            borderRadius: "10px", 
            padding: "10px 16px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
          }}
        >
          <div className="flex items-center gap-2" style={{ flex: 1, maxWidth: "320px", position: "relative" }}>
            <Search size={16} className="text-dark" style={{ position: "absolute", left: "12px", color: "var(--text-dark)" }} />
            <input 
              type="text" 
              className="input-glass" 
              placeholder="Search datasets / problems..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "8px 12px 8px 36px", fontSize: "0.85rem", borderRadius: "8px" }}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Custom Difficulty Filters */}
            <div className="flex" style={{ background: "rgba(0,0,0,0.3)", padding: "2px", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
              {(["All", "Easy", "Medium", "Hard"] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficultyFilter(diff)}
                  style={{
                    padding: "4px 12px",
                    fontSize: "0.78rem",
                    borderRadius: "6px",
                    border: "none",
                    background: difficultyFilter === diff ? "var(--active-filter-bg)" : "transparent",
                    color: difficultyFilter === diff ? "var(--active-filter-color)" : "var(--text-dark)",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "all 0.15s"
                  }}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Problem Card Grid */}
        {filteredProblems.length === 0 ? (
          <div 
            className="glass-panel flex-col items-center justify-center gap-4" 
            style={{ 
              padding: "5rem 2rem", 
              textAlign: "center", 
              border: "1px dashed var(--border-glass)", 
              borderRadius: "12px",
              background: "rgba(19, 21, 32, 0.2)" 
            }}
          >
            <Sparkles size={40} className="text-muted" style={{ opacity: 0.3 }} />
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--text-main)" }}>No Problems Found</h3>
              <p className="text-muted" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                No challenges fit your search or difficulty selections. Expand filters or create a new one!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 w-full" style={{ marginTop: "1rem" }}>
            {filteredProblems.map((p) => (
              <ProblemCard 
                key={p.id} 
                problem={p} 
                onClickShare={handleOpenShare}
              />
            ))}
          </div>
        )}

      </div>

      {/* Share Modal Dialog */}
      {shareId && (
        <div className="full-viewport-overlay" style={{ zIndex: 2000 }}>
          <div className="overlay-modal-card" style={{ maxWidth: "460px" }}>
            <div className="drawer-header">
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }} className="text-gradient">Invite to Problem Board</h3>
                <span className="text-muted" style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)" }}>{shareTitle}</span>
              </div>
              <button 
                onClick={() => setShareId("")}
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-glass)", color: "var(--text-main)", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <X size={14} style={{ margin: "auto" }} />
              </button>
            </div>

            <div style={{ padding: "1.5rem" }} className="flex-col gap-4">
              <div className="flex-col gap-2">
                <label className="login-label">BOARD SYNC URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={getShareUrl()} 
                    className="overlay-input" 
                    style={{ flex: 1, fontSize: "0.8rem" }} 
                    readOnly 
                  />
                  <button 
                    onClick={handleCopyLink} 
                    className="btn-primary" 
                    style={{ padding: "10px 14px", borderRadius: "8px" }}
                  >
                    {copySuccess ? "Copied!" : <Copy size={16} />}
                  </button>
                </div>
                <span style={{ fontSize: "0.7rem", color: "var(--text-dark)" }}>
                  Share this sandbox link to open a dynamic WebRTC collaborative whiteboard sync room.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
