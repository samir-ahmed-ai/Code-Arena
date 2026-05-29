"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamically load Excalidraw with no SSR for the free-form fallback whiteboard
const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false }
);

interface Problem {
  id: string;
}

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasProblems, setHasProblems] = useState(false);

  useEffect(() => {
    async function checkAndRedirect() {
      try {
        const res = await fetch("/api/problems");
        if (res.ok) {
          const problems: Problem[] = await res.json();
          if (Array.isArray(problems) && problems.length > 0) {
            setHasProblems(true);
            // Redirect to the first available problem in the library
            router.replace(`/problems/${problems[0].id}`);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to check problem library", err);
      } finally {
        setLoading(false);
      }
    }
    checkAndRedirect();
  }, [router]);

  if (loading) {
    return (
      <div 
        style={{ 
          height: "100vh", 
          width: "100vw", 
          background: "#090a0f", 
          display: "flex", 
          flexDirection: "column",
          alignItems: "center", 
          justifyContent: "center",
          gap: "1.5rem"
        }}
      >
        <div style={{ width: "40px", height: "40px", border: "3px solid transparent", borderTopColor: "var(--primary)", borderBottomColor: "var(--secondary)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontFamily: "var(--font-mono)" }}>Synchronizing sandbox cluster...</span>
        
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  // Fallback Free-form collaborative Excalidraw whiteboard
  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", background: "#090a0f" }}>
      
      {/* Excalidraw Main Canvas */}
      <div style={{ position: "absolute", width: "100%", height: "100%", left: 0, top: 0, zIndex: 1 }}>
        <Excalidraw 
          theme="dark"
        />
      </div>

      {/* Floating Info Banner */}
      <div 
        style={{ 
          position: "absolute", 
          top: "1rem", 
          left: "50%", 
          transform: "translateX(-50%)", 
          zIndex: 10,
          background: "rgba(19, 21, 32, 0.8)",
          backdropFilter: "blur(12px)",
          border: "1.5px solid rgba(255,255,255,0.06)",
          padding: "8px 16px",
          borderRadius: "9999px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
        }}
      >
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--success)" }}></span>
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#fff" }}>
          Free-form whiteboard sandbox. Click the "+" dock icon to deploy coding challenges!
        </span>
      </div>

    </div>
  );
}
