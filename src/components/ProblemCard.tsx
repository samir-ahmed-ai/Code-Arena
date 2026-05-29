"use client";

import React from "react";
import Link from "next/link";
import { Cpu, Users, ChevronRight, Share2, Sparkles, BookOpen } from "lucide-react";

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  createdAt: string;
}

interface ProblemCardProps {
  problem: Problem;
  onClickShare?: (e: React.MouseEvent, id: string, title: string) => void;
}

export default function ProblemCard({ problem, onClickShare }: ProblemCardProps) {
  const getDifficultyColor = () => {
    switch (problem.difficulty) {
      case "Easy":
        return "var(--success)";
      case "Medium":
        return "var(--warning)";
      case "Hard":
        return "var(--error)";
      default:
        return "var(--primary)";
    }
  };

  const getDifficultyBg = () => {
    switch (problem.difficulty) {
      case "Easy":
        return "rgba(16, 185, 129, 0.06)";
      case "Medium":
        return "rgba(251, 191, 36, 0.06)";
      case "Hard":
        return "rgba(244, 63, 94, 0.06)";
      default:
        return "rgba(99, 102, 241, 0.06)";
    }
  };

  const formattedDate = new Date(problem.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div 
      className="glass-card flex-col"
      style={{
        padding: "1.5rem",
        borderTop: `4px solid ${getDifficultyColor()}`,
        background: "var(--bg-panel)",
        backdropFilter: "blur(12px)",
        borderRadius: "14px",
        borderLeft: "1px solid var(--border-glass)",
        borderRight: "1px solid var(--border-glass)",
        borderBottom: "1px solid var(--border-glass)",
        position: "relative",
        height: "240px",
        justifyContent: "space-between",
        transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)"
      }}
    >
      {/* Top Section */}
      <div className="flex-col gap-2">
        <div className="flex justify-between items-start">
          <span 
            style={{ 
              fontSize: "0.72rem", 
              padding: "3px 8px", 
              borderRadius: "6px",
              fontWeight: 700,
              color: getDifficultyColor(),
              background: getDifficultyBg(),
              border: `1px solid var(--border-glass)`
            }}
          >
            {problem.difficulty}
          </span>
          
          <div className="flex items-center gap-1.5" style={{ color: "var(--success)", fontSize: "0.75rem", background: "rgba(74, 222, 128, 0.05)", padding: "3px 8px", borderRadius: "6px" }}>
            <Users size={12} />
            <span style={{ fontWeight: 600 }}>WebRTC Active</span>
          </div>
        </div>

        <Link href={`/problems/${problem.id}`} className="flex items-center gap-2" style={{ marginTop: "0.5rem" }}>
          <div style={{ padding: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "var(--primary)" }}>
            <Cpu size={16} />
          </div>
          <h3 
            style={{ 
              margin: 0, 
              fontSize: "1.1rem", 
              fontWeight: 700, 
              color: "var(--text-main)",
              letterSpacing: "-0.01em"
            }} 
            className="hover-card-title"
          >
            {problem.title}
          </h3>
        </Link>

        <p 
          className="text-muted" 
          style={{ 
            fontSize: "0.82rem", 
            margin: "0.5rem 0 0 0", 
            lineHeight: 1.5,
            overflow: "hidden", 
            textOverflow: "ellipsis", 
            display: "-webkit-box", 
            WebkitLineClamp: 3, 
            WebkitBoxOrient: "vertical" 
          }}
        >
          {problem.description.replace(/[#*`]/g, "")}
        </p>
      </div>

      {/* Bottom Section */}
      <div 
        className="flex justify-between items-center" 
        style={{ 
          borderTop: "1px solid var(--border-glass)", 
          paddingTop: "1rem", 
          marginTop: "1rem" 
        }}
      >
        <span style={{ fontSize: "0.72rem", color: "var(--text-dark)", fontFamily: "var(--font-mono)" }}>
          {formattedDate}
        </span>

        <div className="flex items-center gap-2">
          {onClickShare && (
            <button 
              onClick={(e) => onClickShare(e, problem.id, problem.title)}
              className="btn-outline" 
              style={{ padding: "6px 10px", borderRadius: "8px", fontSize: "0.75rem" }}
              title="Copy session link"
            >
              <Share2 size={13} />
            </button>
          )}

          <Link 
            href={`/problems/${problem.id}`}
            className="btn-primary hover-glow-btn"
            style={{ 
              padding: "6px 14px", 
              borderRadius: "8px", 
              fontSize: "0.75rem",
              fontWeight: 600,
              boxShadow: "none"
            }}
          >
            Launch Board <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .hover-card-title:hover {
          color: var(--primary) !important;
          text-decoration: underline;
        }
      `}} />
    </div>
  );
}
