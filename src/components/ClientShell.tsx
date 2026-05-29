"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ClientAuthWrapper from "./ClientAuthWrapper";
import { 
  BookOpen, 
  PlusCircle, 
  LogOut, 
  Sparkles, 
  X, 
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Palette,
  Check
} from "lucide-react";

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  createdAt: string;
}

const PREMIUM_THEMES = [
  {
    id: "cyberpunk",
    name: "Neon Night",
    subtitle: "Cyberpunk violet & pink neon",
    colors: ["#6366f1", "#ec4899", "#8b5cf6"],
    bg: "#090a0f"
  },
  {
    id: "matrix",
    name: "Emerald Matrix",
    subtitle: "Digital code hacker green",
    colors: ["#10b981", "#34d399", "#047857"],
    bg: "#020804"
  },
  {
    id: "solar",
    name: "Solar Gold",
    subtitle: "Warm amber gold & charcoal",
    colors: ["#fbbf24", "#f97316", "#ea580c"],
    bg: "#0d0c0a"
  },
  {
    id: "slate",
    name: "Minimalist Slate",
    subtitle: "Muted corporate slate blue",
    colors: ["#3b82f6", "#6366f1", "#0284c7"],
    bg: "#0f172a"
  },
  {
    id: "light",
    name: "Soft Light Mode",
    subtitle: "Clean bright slate layout",
    colors: ["#4f46e5", "#db2777", "#7c3aed"],
    bg: "#f8fafc"
  }
];

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // State for slide-out unified panel drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"library" | "creator" | "themes">("library");
  
  // Theme state
  const [activeTheme, setActiveTheme] = useState("cyberpunk");
  
  // Library data
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loadingProblems, setLoadingProblems] = useState(false);
  
  // Creator form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [explanation, setExplanation] = useState("");
  const [testCases, setTestCases] = useState([
    { input: '{"nums": [2,7,11,15], "target": 9}', expectedOutput: "[0,1]" }
  ]);
  const [creatorMsg, setCreatorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // User profile state
  const [username, setUsername] = useState("");
  const [avatarColor, setAvatarColor] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUsername(localStorage.getItem("codegraph_username") || "User");
      setAvatarColor(
        localStorage.getItem("codegraph_avatar_color") || "linear-gradient(135deg, #8b5cf6, #ec4899)"
      );
      
      const storedTheme = localStorage.getItem("codegraph_theme") || "cyberpunk";
      setActiveTheme(storedTheme);
      document.body.setAttribute("data-theme", storedTheme);
    }
  }, []);

  // Fetch problems when drawer opens to library
  useEffect(() => {
    if (isDrawerOpen && drawerTab === "library") {
      fetchProblems();
    }
  }, [isDrawerOpen, drawerTab]);

  const fetchProblems = async () => {
    setLoadingProblems(true);
    try {
      const res = await fetch("/api/problems");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProblems(data);
      }
    } catch (e) {
      console.error("Failed to load problems", e);
    } finally {
      setLoadingProblems(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.refresh();
    window.location.href = "/";
  };

  const handleSelectTheme = (themeName: string) => {
    setActiveTheme(themeName);
    document.body.setAttribute("data-theme", themeName);
    localStorage.setItem("codegraph_theme", themeName);
  };

  const handleToggleTab = (tab: "library" | "creator" | "themes") => {
    if (isDrawerOpen && drawerTab === tab) {
      setIsDrawerOpen(false);
    } else {
      setDrawerTab(tab);
      setIsDrawerOpen(true);
    }
  };

  const handleCreateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setCreatorMsg("Title and Description are required!");
      return;
    }

    setIsSubmitting(true);
    setCreatorMsg("");

    try {
      const res = await fetch("/api/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          difficulty,
          explanationText: explanation || `Solution for ${title}`,
          graphDataJson: "[]",
          testCases: testCases.map(tc => ({
            input: tc.input.trim(),
            expectedOutput: tc.expectedOutput.trim()
          }))
        })
      });

      if (res.ok) {
        const newProb = await res.json();
        setCreatorMsg(`Problem "${newProb.title}" created successfully!`);
        setTitle("");
        setDescription("");
        setExplanation("");
        setTestCases([{ input: "", expectedOutput: "" }]);
        
        // Refresh library list
        fetchProblems();
        
        // Dynamic wait to close Creator modal and redirect
        setTimeout(() => {
          setIsDrawerOpen(false);
          setCreatorMsg("");
          router.push(`/problems/${newProb.id}`);
        }, 1500);
      } else {
        setCreatorMsg("Error: Failed to save problem to database.");
      }
    } catch (err) {
      setCreatorMsg("Error: Connection failure.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTestCase = () => {
    setTestCases([...testCases, { input: "", expectedOutput: "" }]);
  };

  const removeTestCase = (idx: number) => {
    setTestCases(testCases.filter((_, i) => i !== idx));
  };

  return (
    <ClientAuthWrapper>
      <div className="client-shell-wrapper" style={{ position: "relative", width: "100%", height: "100%" }}>
        
        {/* Render Page Contents */}
        <div className="shell-content" style={{ width: "100%", height: "100%" }}>
          {children}
        </div>

        {/* Floating Navigation Dock */}
        <nav className="floating-navigation-dock">
          {/* Logo Orb */}
          <Link href="/" className="floating-dock-item active" title="Active Playboard" style={{ background: avatarColor, color: "#fff", border: "1.5px solid rgba(255,255,255,0.2)" }}>
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </Link>

          <div className="floating-dock-divider"></div>

          {/* Library Drawer Trigger */}
          <button 
            onClick={() => handleToggleTab("library")} 
            className={`floating-dock-item ${isDrawerOpen && drawerTab === "library" ? "active" : ""}`}
            title="Problem Library"
            style={{ border: "none", background: "none" }}
          >
            <BookOpen size={20} />
          </button>

          {/* In-app problem creator trigger */}
          <button 
            onClick={() => handleToggleTab("creator")} 
            className={`floating-dock-item ${isDrawerOpen && drawerTab === "creator" ? "active" : ""}`}
            title="Create Custom Problem"
            style={{ border: "none", background: "none" }}
          >
            <PlusCircle size={20} />
          </button>

          {/* Aesthetic Themes Trigger */}
          <button 
            onClick={() => handleToggleTab("themes")} 
            className={`floating-dock-item ${isDrawerOpen && drawerTab === "themes" ? "active" : ""}`}
            title="Aesthetic Workspace Themes"
            style={{ border: "none", background: "none" }}
          >
            <Palette size={20} />
          </button>

          <div className="floating-dock-divider"></div>

          {/* Profile Badge & Settings Info */}
          <div className="flex items-center gap-2" style={{ paddingRight: "6px" }}>
            <div 
              style={{ 
                width: "28px", 
                height: "28px", 
                borderRadius: "50%", 
                background: avatarColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.7rem",
                fontWeight: 600,
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.25)"
              }}
              title={`Logged in as ${username}`}
            >
              {username.substring(0, 2).toUpperCase()}
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-main)", fontWeight: 500, marginRight: "4px" }} className="text-muted">
              {username}
            </span>

            {/* Logout button */}
            <button 
              onClick={handleLogout} 
              className="floating-dock-item" 
              title="Logout session"
              style={{ width: "28px", height: "28px", border: "none", background: "none", color: "var(--error)", opacity: 0.8 }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </nav>

        {/* Retractable Unified Left Control Panel Sidebar Drawer */}
        <div className={`whiteboard-drawer ${isDrawerOpen ? "open" : ""}`}>
          <div className="drawer-header">
            <div>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }} className="text-gradient">
                {drawerTab === "library" ? "CodeGraph Library" : drawerTab === "creator" ? "Architect Panel" : "Aesthetic Customizer"}
              </h3>
              <div className="text-muted" style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                {drawerTab === "library" ? "Select a sandbox dataset" : drawerTab === "creator" ? "Create custom algorithm playground" : "Switch premium color templates"}
              </div>
            </div>
            <button 
              onClick={() => setIsDrawerOpen(false)}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-glass)", color: "var(--text-main)", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <X size={16} style={{ margin: "auto" }} />
            </button>
          </div>

          <div className="drawer-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            
            {/* TAB 1: Library Problems Grid List */}
            {drawerTab === "library" && (
              <>
                {loadingProblems ? (
                  <div className="flex-col items-center justify-center h-full gap-2 text-muted" style={{ paddingTop: "4rem" }}>
                    <div style={{ width: "24px", height: "24px", border: "2px solid transparent", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }}></div>
                    <span style={{ fontSize: "0.85rem" }}>Loading datasets...</span>
                  </div>
                ) : problems.length === 0 ? (
                  <div className="text-muted" style={{ textAlign: "center", paddingTop: "4rem", fontSize: "0.9rem" }}>
                    No database entries found. Use the "+" Creator tool in the dock to add your first algorithm problem!
                  </div>
                ) : (
                  <div className="flex-col gap-3">
                    {problems.map((p) => {
                      const isActive = pathname === `/problems/${p.id}`;
                      return (
                        <div 
                          key={p.id}
                          onClick={() => {
                            setIsDrawerOpen(false);
                            router.push(`/problems/${p.id}`);
                          }}
                          style={{
                            padding: "1rem",
                            background: isActive ? "rgba(99, 102, 241, 0.08)" : "rgba(255, 255, 255, 0.02)",
                            border: isActive ? "1.5px solid rgba(99, 102, 241, 0.4)" : "1px solid var(--border-glass)",
                            borderRadius: "10px",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          className="hover-card"
                        >
                          <div className="flex justify-between items-start" style={{ marginBottom: "6px" }}>
                            <h4 style={{ margin: 0, fontSize: "0.95rem", color: isActive ? "var(--primary)" : "var(--text-main)", fontWeight: 600 }}>{p.title}</h4>
                            <span style={{ 
                              fontSize: "0.7rem", 
                              padding: "2px 6px", 
                              borderRadius: "4px",
                              fontWeight: 600,
                              color: p.difficulty === 'Easy' ? 'var(--success)' : p.difficulty === 'Medium' ? 'var(--warning)' : 'var(--error)',
                              background: p.difficulty === 'Easy' ? 'rgba(16, 185, 129, 0.08)' : p.difficulty === 'Medium' ? 'rgba(251, 191, 36, 0.08)' : 'rgba(244, 63, 94, 0.08)'
                            }}>
                              {p.difficulty}
                            </span>
                          </div>
                          <p className="text-muted" style={{ fontSize: "0.8rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.4 }}>
                            {p.description.replace(/[#*`]/g, "")}
                          </p>
                          <div className="flex justify-between items-center" style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed var(--border-glass)" }}>
                            <span style={{ fontSize: "0.7rem", color: "var(--text-dark)" }}>Active Room: WebRTC P2P</span>
                            <span className="flex items-center gap-1" style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 500 }}>
                              Open board <ChevronRight size={12} />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* TAB 2: Dynamic Problem Creator Form */}
            {drawerTab === "creator" && (
              <form onSubmit={handleCreateProblem} className="flex-col gap-4" style={{ paddingBottom: "3rem" }}>
                {creatorMsg && (
                  <div className="floating-alert-badge glow-btn-success" style={{ background: creatorMsg.includes("Error") ? "rgba(244,63,94,0.1)" : "rgba(16,185,129,0.1)", color: creatorMsg.includes("Error") ? "var(--error)" : "var(--success)", border: creatorMsg.includes("Error") ? "1px solid rgba(244,63,94,0.25)" : "1px solid rgba(16,185,129,0.25)" }}>
                    <ShieldCheck size={14} />
                    <span>{creatorMsg}</span>
                  </div>
                )}

                <div className="login-input-group">
                  <label className="login-label">PROBLEM TITLE</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="e.g. Merge Sorted Array" 
                    className="overlay-input"
                    required
                  />
                </div>

                <div className="login-input-group">
                  <label className="login-label">DIFFICULTY</label>
                  <select 
                    value={difficulty} 
                    onChange={(e) => setDifficulty(e.target.value)} 
                    className="overlay-input"
                    style={{ cursor: "pointer" }}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div className="login-input-group">
                  <label className="login-label">DESCRIPTION (MARKDOWN SUPPORT)</label>
                  <textarea 
                    rows={4}
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Define problem statement, inputs, outputs, and constraints..." 
                    className="overlay-input"
                    style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", resize: "none" }}
                    required
                  />
                </div>

                <div className="login-input-group">
                  <label className="login-label">EXPLANATION SPEECH TEXT</label>
                  <textarea 
                    rows={3}
                    value={explanation} 
                    onChange={(e) => setExplanation(e.target.value)} 
                    placeholder="Provide deep breakdown for narrator..." 
                    className="overlay-input"
                    style={{ fontSize: "0.85rem", resize: "none" }}
                  />
                </div>

                {/* Sandbox Test Cases */}
                <div className="login-input-group">
                  <div className="flex justify-between items-center" style={{ marginBottom: "6px" }}>
                    <label className="login-label">SANDBOX TEST CASES</label>
                    <button 
                      type="button" 
                      onClick={addTestCase} 
                      className="btn-outline" 
                      style={{ padding: "2px 8px", fontSize: "0.7rem", borderRadius: "4px" }}
                    >
                      + Add Case
                    </button>
                  </div>
                  
                  <div className="flex-col gap-3">
                    {testCases.map((tc, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          padding: "10px", 
                          background: "rgba(0,0,0,0.2)", 
                          borderRadius: "8px", 
                          border: "1px solid var(--border-glass)" 
                        }}
                        className="flex-col gap-2"
                      >
                        <div className="flex justify-between items-center">
                          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--secondary)" }}>CASE #{idx + 1}</span>
                          {testCases.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => removeTestCase(idx)} 
                              style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer", fontSize: "0.7rem" }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input 
                          type="text" 
                          value={tc.input} 
                          onChange={(e) => {
                            const newCases = [...testCases];
                            newCases[idx].input = e.target.value;
                            setTestCases(newCases);
                          }} 
                          placeholder='Input JSON (e.g. {"nums": [1,2], "val": 3})' 
                          className="overlay-input"
                          style={{ fontSize: "0.75rem", padding: "6px 10px" }}
                          required
                        />
                        <input 
                          type="text" 
                          value={tc.expectedOutput} 
                          onChange={(e) => {
                            const newCases = [...testCases];
                            newCases[idx].expectedOutput = e.target.value;
                            setTestCases(newCases);
                          }} 
                          placeholder="Expected Output JSON or String" 
                          className="overlay-input"
                          style={{ fontSize: "0.75rem", padding: "6px 10px" }}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{ flex: 1, padding: "10px", borderRadius: "8px" }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Deploying..." : "Create Playground"}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsDrawerOpen(false)} 
                    className="btn-outline" 
                    style={{ padding: "10px 18px", borderRadius: "8px" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: Visual Theme Customizer Card Selectors */}
            {drawerTab === "themes" && (
              <div className="flex-col gap-4 w-full" style={{ paddingBottom: "2rem" }}>
                {PREMIUM_THEMES.map((theme) => {
                  const isActive = activeTheme === theme.id;
                  const isThemeLight = theme.id === "light";
                  return (
                    <div
                      key={theme.id}
                      onClick={() => handleSelectTheme(theme.id)}
                      style={{
                        padding: "1.25rem",
                        background: theme.bg,
                        borderRadius: "14px",
                        border: "2px solid",
                        borderColor: isActive 
                          ? theme.colors[0] 
                          : (isThemeLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.05)"),
                        cursor: "pointer",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: isActive 
                          ? `0 0 20px rgba(${isThemeLight ? '79,70,229' : '99,102,241'}, 0.15)` 
                          : "0 4px 15px rgba(0,0,0,0.3)"
                      }}
                      className="hover-card"
                    >
                      <div className="flex justify-between items-center" style={{ marginBottom: "8px" }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: "1rem", color: isThemeLight ? "#0f172a" : "#fff", fontWeight: 700 }}>{theme.name}</h4>
                          <span style={{ fontSize: "0.75rem", color: isThemeLight ? "rgba(15,23,42,0.6)" : "rgba(255,255,255,0.4)", display: "block", marginTop: "2px" }}>{theme.subtitle}</span>
                        </div>
                        {isActive && (
                          <div style={{ background: theme.colors[0], color: "#fff", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center" style={{ marginTop: "1rem", paddingTop: "8px", borderTop: `1px dashed ${isThemeLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)'}` }}>
                        <div className="flex gap-1.5">
                          {theme.colors.map((c, i) => (
                            <span key={i} style={{ background: c, width: "12px", height: "12px", borderRadius: "50%", display: "inline-block", boxShadow: "0 2px 4px rgba(0,0,0,0.4)" }}></span>
                          ))}
                        </div>
                        <span style={{ fontSize: "0.7rem", color: isThemeLight ? "rgba(15,23,42,0.4)" : "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Select Palette</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>

      </div>
      
      {/* Dynamic styles to allow hover effects inside ClientShell */}
      <style dangerouslySetInnerHTML={{ __html: `
        .hover-card:hover {
          background: rgba(255, 255, 255, 0.04) !important;
          border-color: rgba(99, 102, 241, 0.25) !important;
        }
      `}} />
    </ClientAuthWrapper>
  );
}
