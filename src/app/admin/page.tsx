"use client";

import { useState } from "react";
import ExcalidrawCanvas from "./ExcalidrawCanvas";
import { Save, ChevronRight, Sliders, Play, Settings, Sparkles, BookOpen, Layers, Terminal } from "lucide-react";

export default function AdminDashboard() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [testCases, setTestCases] = useState([{ input: "", expectedOutput: "" }]);
  const [explanationText, setExplanationText] = useState("");
  const [graphDataJson, setGraphDataJson] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please enter a problem title.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          difficulty,
          testCases,
          explanationText,
          graphDataJson
        })
      });
      if (res.ok) {
        alert("Problem created successfully!");
        setTitle("");
        setDescription("");
        setExplanationText("");
        setTestCases([{ input: "", expectedOutput: "" }]);
      } else {
        alert("Error saving problem.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    }
    setLoading(false);
  };

  return (
    <div className="flex-col h-screen" style={{ overflow: "hidden" }}>
      
      {/* Top Header matching GraphiQL breadcrumbs */}
      <div className="top-header">
        <div className="top-header-title">
          <span className="text-muted">Playground</span>
          <span className="text-dark">/</span>
          <span style={{ fontWeight: 600 }}>Creator Studio</span>
          <ChevronRight size={14} className="text-muted" style={{ margin: "0 4px" }} />
          <input 
            className="input-glass" 
            style={{ width: "220px", padding: "4px 8px", fontSize: "0.85rem", background: "rgba(0,0,0,0.2)", borderRadius: "4px" }} 
            placeholder="Untitled Problem Title" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
          />
          <select 
            className="input-glass" 
            value={difficulty} 
            onChange={e => setDifficulty(e.target.value)} 
            style={{ background: "#1a1d29", padding: "4px 8px", fontSize: "0.85rem", width: "auto", marginLeft: "10px", borderRadius: "4px" }}
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleSave} className="btn-primary" disabled={loading} style={{ padding: "6px 14px", fontSize: "0.8rem", borderRadius: "6px" }}>
            {loading ? "Saving..." : <><Save size={14} /> Save Problem</>}
          </button>
        </div>
      </div>

      {/* Main Split Area */}
      <div className="flex w-full h-full" style={{ flex: 1, overflow: "hidden" }}>
        
        {/* Left/Center Column: Prompt editors & Canvas */}
        <div className="flex-col" style={{ flex: 2, padding: "1.5rem 2rem", overflowY: "auto", borderRight: "1px solid var(--border-glass)" }}>
          
          {/* Section banner */}
          <div className="flex items-center gap-2" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--secondary)", marginBottom: "1rem", fontFamily: "var(--font-mono)" }}>
            <Sparkles size={14} />
            <span>PROMPT TEMPLATES</span>
          </div>

          {/* Problem description box (styled as User Prompt in Screen 1) */}
          <div className="flex-col gap-2" style={{ marginBottom: "1.5rem" }}>
            <div className="flex justify-between items-center" style={{ fontSize: "0.8rem", color: "var(--text-dark)", fontFamily: "var(--font-mono)" }}>
              <span>Problem Description (User Prompt Template)</span>
              <span>markdown supported</span>
            </div>
            <textarea 
              className="input-glass" 
              placeholder="Describe the problem, input patterns, constraints, and algorithmic assumptions..." 
              rows={5} 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", background: "rgba(0,0,0,0.2)" }} 
            />
          </div>
          
          {/* Audio script box (styled as System Prompt in Screen 1) */}
          <div className="flex-col gap-2" style={{ marginBottom: "2rem" }}>
            <div className="flex justify-between items-center" style={{ fontSize: "0.8rem", color: "var(--text-dark)", fontFamily: "var(--font-mono)" }}>
              <span>Audio Explanation Script (System Context)</span>
              <span>text-to-speech engine ready</span>
            </div>
            <textarea 
              className="input-glass" 
              placeholder="Enter a step-by-step narrative script reviewing the time and space complexity. This will speak as users view your canvas." 
              rows={3} 
              value={explanationText} 
              onChange={e => setExplanationText(e.target.value)} 
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", background: "rgba(0,0,0,0.2)" }} 
            />
          </div>

          {/* Excalidraw Widescreen Whiteboard Drawing */}
          <div className="flex-col gap-2" style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "1.5rem" }}>
            <div className="flex items-center gap-2" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--secondary)", marginBottom: "0.5rem", fontFamily: "var(--font-mono)" }}>
              <Layers size={14} />
              <span>EXCALIDRAW VISUAL LOGIC BOARD</span>
            </div>
            <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>
              Sketch the flowchart, visual array indices, pointer movements, or stack items. Collaborators will sync with these coordinates.
            </p>
            <ExcalidrawCanvas onChange={setGraphDataJson} />
          </div>

          {/* Padding bottom */}
          <div style={{ height: "4rem" }}></div>
        </div>

        {/* Right Sidebar Column: Test Cases / Variables */}
        <div className="flex-col" style={{ flex: 1, padding: "1.5rem 2rem", background: "#11131c", overflowY: "auto" }}>
          
          {/* Right sidebar title */}
          <div className="flex items-center gap-2" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--primary)", marginBottom: "0.5rem", fontFamily: "var(--font-mono)" }}>
            <Terminal size={14} />
            <span>TEST CASE VARIABLES</span>
          </div>
          
          <p className="text-muted" style={{ marginBottom: "1.5rem", fontSize: "0.85rem" }}>
            Define custom sets of inputs and expected outputs to compile within Monaco execution.
          </p>

          <div className="flex-col gap-4">
            {testCases.map((tc, idx) => (
              <div key={idx} className="glass-card flex-col gap-3" style={{ padding: "1.25rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
                <div className="flex justify-between items-center" style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-dark)", fontWeight: 600 }}>
                  <span>CASE SET {idx + 1}</span>
                  {testCases.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => {
                        const newTc = [...testCases];
                        newTc.splice(idx, 1);
                        setTestCases(newTc);
                      }} 
                      style={{ border: "none", background: "transparent", color: "var(--error)", cursor: "pointer", fontSize: "0.75rem" }}
                    >
                      Delete
                    </button>
                  )}
                </div>
                
                <div className="flex-col gap-1">
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dark)", fontFamily: "var(--font-mono)" }}>input parameters</span>
                  <input 
                    className="input-glass" 
                    style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", background: "rgba(0,0,0,0.3)" }} 
                    placeholder='e.g. {"nums": [2, 7], "target": 9}' 
                    value={tc.input} 
                    onChange={e => {
                      const newTc = [...testCases];
                      newTc[idx].input = e.target.value;
                      setTestCases(newTc);
                    }} 
                  />
                </div>
                
                <div className="flex-col gap-1">
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dark)", fontFamily: "var(--font-mono)" }}>expected output</span>
                  <input 
                    className="input-glass" 
                    style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", background: "rgba(0,0,0,0.3)" }} 
                    placeholder='e.g. [0, 1]' 
                    value={tc.expectedOutput} 
                    onChange={e => {
                      const newTc = [...testCases];
                      newTc[idx].expectedOutput = e.target.value;
                      setTestCases(newTc);
                    }} 
                  />
                </div>
              </div>
            ))}
            
            <button 
              type="button" 
              className="btn-outline" 
              onClick={() => setTestCases([...testCases, { input: "", expectedOutput: "" }])} 
              style={{ marginTop: "0.5rem", width: "100%", justifyContent: "center" }}
            >
              + Add Variable Set
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
