"use client";

import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import ExcalidrawViewer from './ExcalidrawViewer';
import { 
  Play, 
  Check, 
  X, 
  Volume2, 
  XCircle, 
  Maximize2, 
  Users, 
  Folder, 
  BookOpen, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  Info,
  Sliders,
  Code2,
  List,
  Sparkles,
  Share2,
  Copy,
  Layout,
  Minimize2,
  PlayCircle
} from 'lucide-react';

import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { MonacoBinding } from 'y-monaco';
import dynamic from 'next/dynamic';

const Sidebar = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => mod.Sidebar),
  { ssr: false }
) as any;

// Global session registry to avoid duplicated provider registrations under React StrictMode double rendering
const globalCollaborationCache: Record<string, { doc: Y.Doc; provider: any; count: number }> = {};

const getCollaborationSession = (roomId: string) => {
  if (typeof window === "undefined") return { doc: null, provider: null };
  
  if (globalCollaborationCache[roomId]) {
    globalCollaborationCache[roomId].count++;
    return globalCollaborationCache[roomId];
  }
  
  const doc = new Y.Doc();
  const provider = new WebrtcProvider(roomId, doc);
  
  const nickname = localStorage.getItem("codegraph_username") || "User";
  const avatarColor = localStorage.getItem("codegraph_avatar_color") || "#6366f1";
  
  provider.awareness.setLocalStateField('user', {
    name: nickname,
    color: avatarColor
  });

  globalCollaborationCache[roomId] = { doc, provider, count: 1 };
  return globalCollaborationCache[roomId];
};

const releaseCollaborationSession = (roomId: string) => {
  if (globalCollaborationCache[roomId]) {
    globalCollaborationCache[roomId].count--;
    if (globalCollaborationCache[roomId].count <= 0) {
      globalCollaborationCache[roomId].provider.destroy();
      globalCollaborationCache[roomId].doc.destroy();
      delete globalCollaborationCache[roomId];
    }
  }
};

export default function ProblemWorkspace({ problem }: { problem: any }) {
  const [code, setCode] = useState(`function solve(input) {\n  // Your code here\n  return input;\n}`);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [collaborators, setCollaborators] = useState(1);
  const [lastExecutionState, setLastExecutionState] = useState<"idle" | "success" | "error">("idle");
  
  const [activeTheme, setActiveTheme] = useState("cyberpunk");

  // MutationObserver to listen for document.body data-theme changes and reactively sync Monaco & Excalidraw
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Initial sync
    const initialTheme = document.body.getAttribute("data-theme") || localStorage.getItem("codegraph_theme") || "cyberpunk";
    setActiveTheme(initialTheme);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-theme") {
          const newTheme = document.body.getAttribute("data-theme") || "cyberpunk";
          setActiveTheme(newTheme);
        }
      });
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      observer.disconnect();
    };
  }, []);
  
  // Custom drag and layout states for floating editor
  const [editorState, setEditorState] = useState<"docked" | "maximized" | "floating" | "minimized">("docked");
  const [editorPos, setEditorPos] = useState({ x: 80, y: 70 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Active Monaco Tab (Code or Description)
  const [activeEditorTab, setActiveEditorTab] = useState<"code" | "instructions">("code");
  
  // Interactive Drawer states inside floating panel
  const [activeTestCaseIdx, setActiveTestCaseIdx] = useState(0);
  const [activeResultTab, setActiveResultTab] = useState<"interactive" | "results" | "parameters">("interactive");
  
  // Share Overlay States
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  // History tracking
  const [runHistory, setRunHistory] = useState<any[]>([
    {
      timestamp: new Date(Date.now() - 300000).toLocaleTimeString(),
      status: "Accepted",
      passedCount: 3,
      totalCount: 3
    }
  ]);

  const editorRef = useRef<any>(null);
  
  // Initialize Yjs and WebRTC provider synchronously ONCE during first render via global registry cache
  const roomId = typeof window !== "undefined" ? (() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room");
    return `codegraph-problem-${problem.id}${roomParam ? `-${roomParam}` : ""}`;
  })() : `codegraph-problem-${problem.id}`;

  const [collaboration] = useState(() => {
    return getCollaborationSession(roomId);
  });

  const bindingRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setInviteLink(window.location.href);
      const params = new URLSearchParams(window.location.search);
      setRoomCode(params.get("room") || "Default");
    }
  }, []);

  // WebRTC provider & Yjs document cleanup on unmount using releaseCollaborationSession
  useEffect(() => {
    const { provider } = collaboration;
    if (!provider) return;

    const handleAwarenessChange = () => {
      setCollaborators(provider.awareness.getStates().size);
    };

    provider.awareness.on('change', handleAwarenessChange);
    setCollaborators(provider.awareness.getStates().size);

    return () => {
      provider.awareness.off('change', handleAwarenessChange);
      releaseCollaborationSession(roomId);
    };
  }, [collaboration, roomId]);

  // Clean up MonacoBinding when switching tabs or when the editor component unmounts
  useEffect(() => {
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [activeEditorTab]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    const { doc, provider } = collaboration;
    if (!doc || !provider) return;

    if (bindingRef.current) {
      bindingRef.current.destroy();
    }

    const ytext = doc.getText('monaco');
    bindingRef.current = new MonacoBinding(
      ytext,
      editor.getModel(),
      new Set([editor]),
      provider.awareness
    );

    const initializeTemplate = () => {
      if (ytext.toString().trim() === '') {
        const savedDraft = localStorage.getItem(`codegraph_solution_${problem.id}`);
        if (savedDraft) {
          ytext.insert(0, savedDraft);
        } else {
          ytext.insert(0, `// Solve the problem: ${problem.title}\n// Collaborative workspace active.\n\nfunction solve(input) {\n  // Write your code here\n  \n}`);
        }
      }
    };
    
    if ((provider as any).synced) {
      initializeTemplate();
    } else {
      (provider as any).once('synced', initializeTemplate);
    }
  };

  // Draggable component implementation
  const handleMouseDown = (e: React.MouseEvent) => {
    if (editorState !== "floating") return;
    
    // Disable drag if clicking input, buttons, or Monaco editor
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("select") || target.closest(".monaco-editor")) {
      return;
    }
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - editorPos.x,
      y: e.clientY - editorPos.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setEditorPos({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // Safe Web Worker evaluation utility (prevents infinite loop thread lockouts)
  const evaluateTestCase = (codeToRun: string, tc: any): Promise<any> => {
    return new Promise((resolve) => {
      const workerCode = `
        self.onmessage = function(e) {
          const { code, input } = e.data;
          const logs = [];
          
          // Intercept console.log
          const originalLog = console.log;
          console.log = function(...args) {
            logs.push(args.map(arg => {
              if (typeof arg === 'object') {
                try {
                  return JSON.stringify(arg);
                } catch (err) {
                  return String(arg);
                }
              }
              return String(arg);
            }).join(' '));
            originalLog.apply(console, args);
          };

          try {
            // Helpers to parse function parameters
            const STRIP_COMMENTS = /(\\/\\/.*$)|(\\/\\*[\\s\\S]*?\\*\\/)|(\\s*=[^,)]*(?=(?:[^{}]*\\{[^{}]*\\})*[^{}]*(?:,|\\))))/mg;
            const ARGUMENT_NAMES = /([^\\s,]+)/g;
            function getParamNames(fn) {
              const fnStr = fn.toString().replace(STRIP_COMMENTS, '');
              let result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
              if (result === null) {
                const firstArrow = fnStr.indexOf('=>');
                if (firstArrow !== -1) {
                  const beforeArrow = fnStr.slice(0, firstArrow).trim();
                  if (beforeArrow && !beforeArrow.includes('(')) {
                    return [beforeArrow];
                  }
                }
                return [];
              }
              return result.map(p => p.trim());
            }

            const fn = new Function('input', code + "\\nreturn solve;");
            const solveFn = fn();
            if (typeof solveFn !== 'function') {
              throw new Error("Could not find 'solve' function. Make sure 'function solve(input)' is declared.");
            }
            
            const parsedInput = JSON.parse(input);
            let args = [parsedInput];
            if (typeof parsedInput === 'object' && parsedInput !== null && !Array.isArray(parsedInput)) {
              const params = getParamNames(solveFn);
              const allParamsAreKeys = params.length > 0 && params.every(p => p in parsedInput);
              if (allParamsAreKeys) {
                args = params.map(p => parsedInput[p]);
              }
            }

            const result = solveFn.apply(null, args);
            self.postMessage({ success: true, result: result, logs: logs });
          } catch (err) {
            self.postMessage({ success: false, error: err.message, logs: logs });
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));

      // Limit execution to 1.5 seconds maximum to catch infinite loops
      const timeoutId = setTimeout(() => {
        worker.terminate();
        resolve({
          passed: false,
          input: tc.input,
          expected: tc.expectedOutput,
          actual: "Timeout Error: Infinite loop or heavy computation detected! Execution halted safely.",
          logs: ["SYSTEM WARNING: Halted worker due to 1.5 second execution timeout limit."]
        });
      }, 1500);

      worker.onmessage = (e) => {
        clearTimeout(timeoutId);
        worker.terminate();
        const { success, result, error, logs } = e.data;

        if (!success) {
          resolve({
            passed: false,
            input: tc.input,
            expected: tc.expectedOutput,
            actual: error,
            logs: logs || []
          });
          return;
        }

        let expectedParsed = tc.expectedOutput;
        try {
          expectedParsed = JSON.parse(tc.expectedOutput);
        } catch {}

        let passed = false;
        if (typeof result === 'object' && result !== null) {
          passed = JSON.stringify(result) === JSON.stringify(expectedParsed);
        } else {
          passed = String(result) === String(expectedParsed);
        }

        const actualStr = typeof result === 'object' && result !== null ? JSON.stringify(result) : String(result);

        resolve({
          passed,
          input: tc.input,
          expected: tc.expectedOutput,
          actual: actualStr,
          logs: logs || []
        });
      };

      worker.postMessage({ code: codeToRun, input: tc.input });
    });
  };

  // Run test cases inside safe sandboxed Web Workers asynchronously
  const runTests = async () => {
    const currentCode = editorRef.current ? editorRef.current.getValue() : code;
    
    // Auto-save progress to local storage during runtime as well
    localStorage.setItem(`codegraph_solution_${problem.id}`, currentCode);

    const results = await Promise.all(
      problem.testCases.map((tc: any) => evaluateTestCase(currentCode, tc))
    );

    const hasFailure = results.some(r => !r.passed);

    setTestResults(results);
    setLastExecutionState(hasFailure ? "error" : "success");
    setActiveResultTab("interactive");

    const passedCount = results.filter((r: any) => r.passed).length;
    setRunHistory(prev => [
      {
        timestamp: new Date().toLocaleTimeString(),
        status: hasFailure ? "Failed" : "Accepted",
        passedCount,
        totalCount: results.length
      },
      ...prev
    ]);
  };


  // Narration Explanation Speech synthesis
  const playAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
        return;
      }
      const text = problem.solutions?.[0]?.explanationText || "No explanation provided for this problem.";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsPlayingAudio(false);
      setIsPlayingAudio(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Copy share invitation link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Join a custom room
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    setIsShareOpen(false);
    window.location.search = `?room=${roomCode.trim()}`;
  };

  // Generate Invite URL with random code
  const handleGenerateRoom = () => {
    const code = Math.random().toString(36).substring(2, 8);
    setRoomCode(code);
    const newUrl = `${window.location.origin}${window.location.pathname}?room=${code}`;
    setInviteLink(newUrl);
    window.history.pushState({}, '', newUrl);
    routerRefresh();
  };

  const routerRefresh = () => {
    // Quick refresh provider connection
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  // Render JSON viewer
  const renderJSONHighlight = (obj: any) => {
    const jsonStr = JSON.stringify(obj, null, 2);
    const lines = jsonStr.split('\n');
    return (
      <div style={{ whiteSpace: "pre", fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "#cbd5e1" }}>
        {lines.map((line, idx) => {
          const keyMatch = line.match(/^(\s*)"([^"]+)":/);
          if (keyMatch) {
            const indent = keyMatch[1];
            const key = keyMatch[2];
            const rest = line.substring(keyMatch[0].length);
            return (
              <div key={idx} style={{ lineHeight: 1.5 }}>
                {indent}
                <span className="json-key" style={{ color: "#a5b4fc", fontWeight: 500 }}>"{key}"</span>:
                {highlightValue(rest)}
              </div>
            );
          }
          return (
            <div key={idx} style={{ lineHeight: 1.5 }}>
              {line}
            </div>
          );
        })}
      </div>
    );
  };

  const highlightValue = (valStr: string) => {
    const trimmed = valStr.trim();
    if (trimmed.startsWith('"')) {
      return <span className="json-string" style={{ color: "#34d399" }}> {trimmed}</span>;
    }
    if (trimmed === 'true' || trimmed === 'false') {
      return <span className="json-boolean" style={{ color: "#f472b6", fontWeight: 600 }}> {trimmed}</span>;
    }
    if (trimmed === 'null') {
      return <span className="json-null" style={{ color: "#64748b", fontStyle: "italic" }}> {trimmed}</span>;
    }
    const numOnly = trimmed.replace(/,$/, '');
    if (!isNaN(Number(numOnly)) && numOnly !== '') {
      return <span className="json-number" style={{ color: "#fbbf24" }}> {trimmed}</span>;
    }
    return <span> {valStr}</span>;
  };

  const getGraphiQLResponse = () => {
    if (lastExecutionState === "idle") {
      return {
        info: "CodeGraph Dynamic Workspace Sync active.",
        status: "IDLE",
        variables: "Use the floating execution panels to execute test cases."
      };
    }

    if (lastExecutionState === "error") {
      const failedCase = testResults.find(r => !r.passed) || testResults[0];
      return {
        data: null,
        errors: [
          {
            message: `Assertion failed: expected output does not match sandbox evaluation`,
            path: ["solve"],
            testCase: {
              input: failedCase.input,
              expected: failedCase.expected,
              evaluatedActual: failedCase.actual
            }
          }
        ]
      };
    }

    return {
      data: {
        problem: {
          id: problem.id,
          title: problem.title,
          status: "ACCEPTED",
          runTimeMs: Math.floor(Math.random() * 8) + 2,
          casesPassed: testResults.length,
          totalCases: testResults.length,
          evaluationOutputs: testResults.map((r, i) => ({
            caseNum: i + 1,
            passed: true,
            evaluatedOutput: r.actual
          }))
        }
      }
    };
  };

  // Draggable window dimensions depending on editor state
  const getPanelStyles = (): React.CSSProperties => {
    if (editorState === "docked") {
      return {
        position: "fixed",
        top: 0,
        right: 0,
        width: "45vw",
        height: "100vh",
        borderRadius: 0,
        borderLeft: "1px solid var(--border-glass)",
        borderTop: "none",
        borderBottom: "none",
        borderRight: "none",
        zIndex: 100,
        boxShadow: "-10px 0 40px rgba(0,0,0,0.5)"
      };
    }
    if (editorState === "maximized") {
      return {
        position: "fixed",
        top: "5vh",
        left: "5vw",
        width: "90vw",
        height: "85vh",
        zIndex: 100,
        boxShadow: "0 20px 60px rgba(0,0,0,0.7)"
      };
    }
    if (editorState === "minimized") {
      return {
        display: "none" // Managed by floating bubble instead
      };
    }
    // Floating
    return {
      position: "absolute",
      left: `${editorPos.x}px`,
      top: `${editorPos.y}px`,
      width: "660px",
      height: "560px",
      zIndex: 100,
      cursor: isDragging ? "move" : "default"
    };
  };

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", background: "var(--bg-dark)" }}>
      
      {/* 1. Full-Bleed Excalidraw Whiteboard Background rendering native Sidebar children */}
      <div style={{ position: "absolute", width: "100%", height: "100%", left: 0, top: 0, zIndex: 1 }}>
        <ExcalidrawViewer 
          data={problem.solutions?.[0]?.graphDataJson || "[]"} 
          ydoc={collaboration.doc || undefined} 
          provider={collaboration.provider || undefined} 
          theme={activeTheme === "light" ? "light" : "dark"}
        >
          {editorState !== "minimized" && (
            <Sidebar 
              name="code-console" 
              docked={editorState === "docked"}
              onDock={(docked: boolean) => setEditorState(docked ? "docked" : "floating")}
              className="excalidraw-sidebar-overrides"
            >
              <Sidebar.Header style={{ padding: "10px 16px", background: "rgba(0,0,0,0.25)", borderBottom: "1px solid var(--border-glass)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div className="flex items-center gap-2">
                  <Sparkles size={14} style={{ color: "var(--secondary)" }} />
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.02em", color: "var(--text-main)" }}>
                    CODE CONSOLE: {problem.title}
                  </span>
                </div>

                <div className="flex items-center gap-2" style={{ marginLeft: "auto", marginRight: "1rem" }}>
                  <button 
                    onClick={() => setEditorState(editorState === "docked" ? "floating" : "docked")}
                    className="btn-outline" 
                    style={{ padding: "4px 8px", fontSize: "0.68rem", background: "none", border: "none", color: "var(--text-dark)", cursor: "pointer" }}
                    title={editorState === "docked" ? "Float panel" : "Dock split-screen"}
                  >
                    <Layout size={14} />
                  </button>

                  <button 
                    onClick={() => setEditorState(editorState === "maximized" ? "floating" : "maximized")}
                    className="btn-outline" 
                    style={{ padding: "4px 8px", fontSize: "0.68rem", background: "none", border: "none", color: "var(--text-dark)", cursor: "pointer" }}
                    title={editorState === "maximized" ? "Restore to Float" : "Maximize view"}
                  >
                    <Maximize2 size={14} />
                  </button>

                  <button 
                    onClick={() => setEditorState("minimized")}
                    className="btn-outline" 
                    style={{ padding: "4px 8px", fontSize: "0.68rem", background: "none", border: "none", color: "var(--text-dark)", cursor: "pointer" }}
                    title="Collapse editor"
                  >
                    <Minimize2 size={14} />
                  </button>
                </div>
              </Sidebar.Header>

              {/* Sidebar Console Content Container */}
              <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%", overflow: "hidden", background: "var(--bg-editor)" }}>
                {/* Monaco Tabs Bar */}
                <div className="editor-tabs" style={{ background: "rgba(0,0,0,0.25)", flexShrink: 0, paddingRight: "1rem" }}>
                  <div className="flex h-full">
                    <button 
                      onClick={() => setActiveEditorTab("code")}
                      className={`editor-tab-item ${activeEditorTab === "code" ? "active" : ""}`}
                      style={{ background: "none", border: "none" }}
                    >
                      <Code2 size={13} style={{ color: "var(--secondary)" }} />
                      <span>solution.js</span>
                    </button>

                    <button 
                      onClick={() => setActiveEditorTab("instructions")}
                      className={`editor-tab-item ${activeEditorTab === "instructions" ? "active" : ""}`}
                      style={{ background: "none", border: "none" }}
                    >
                      <BookOpen size={13} style={{ color: "var(--primary)" }} />
                      <span>instructions.md</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-muted" style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)", opacity: 0.8 }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--success)" }}></span>
                    Active Collaboration
                  </div>
                </div>

                {/* Tab Contents */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, position: "relative" }}>
                  
                  {/* Tab A: Collaborative Editor */}
                  {activeEditorTab === "code" && (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                      {/* Floating execution play button */}
                      <button 
                        onClick={runTests} 
                        className="floating-play-btn" 
                        title="Run tests and execute solution in sandbox"
                        style={{ top: "14px", right: "20px" }}
                      >
                        <Play size={18} fill="#fff" style={{ marginLeft: "1.5px" }} />
                      </button>

                      <div style={{ flex: 1, minHeight: 0 }}>
                        <Editor
                          height="100%"
                          defaultLanguage="javascript"
                          theme={activeTheme === "light" ? "vs" : "vs-dark"}
                          onMount={handleEditorDidMount}
                          onChange={(val) => {
                            if (val) {
                              localStorage.setItem(`codegraph_solution_${problem.id}`, val);
                            }
                          }}
                          options={{ 
                            minimap: { enabled: false }, 
                            fontSize: 14, 
                            fontFamily: 'var(--font-mono)', 
                            padding: { top: 12 } 
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Tab B: Markdown Instructions */}
                  {activeEditorTab === "instructions" && (
                    <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", background: "var(--bg-editor)", color: "var(--text-main)" }}>
                      <h3 style={{ fontSize: "1.2rem", fontWeight: 700, borderBottom: "1px solid var(--border-glass)", paddingBottom: "6px", color: "var(--text-main)" }}>
                        {problem.title}
                      </h3>
                      
                      <div style={{ fontSize: "0.75rem", display: "inline-flex", gap: "6px", background: "rgba(99,102,241,0.06)", padding: "3px 8px", borderRadius: "4px", margin: "10px 0", border: "1px solid rgba(99,102,241,0.15)", color: "var(--primary)", fontWeight: 600 }}>
                        Difficulty: {problem.difficulty}
                      </div>

                      <div style={{ fontSize: "0.88rem", whiteSpace: "pre-wrap", lineHeight: 1.6, marginTop: "10px", fontFamily: "var(--font-sans)" }} className="markdown-body">
                        {problem.description}
                      </div>
                    </div>
                  )}

                  {/* Collapsible bottom drawer for Sandbox Results & Parameters */}
                  <div className="variables-drawer" style={{ flexShrink: 0 }}>
                    <div className="variables-header" style={{ height: "34px" }}>
                      <div className="flex h-full items-center">
                        <button 
                          onClick={() => setActiveResultTab("interactive")}
                          className={`variables-header-tab ${activeResultTab === 'interactive' ? 'active' : ''}`}
                          style={{ background: "none", border: "none", cursor: "pointer" }}
                        >
                          Interactive Runner
                        </button>

                        <button 
                          onClick={() => setActiveResultTab("results")}
                          className={`variables-header-tab ${activeResultTab === 'results' ? 'active' : ''}`}
                          style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "1rem" }}
                        >
                          Sandbox Response JSON
                        </button>
                        
                        <button 
                          onClick={() => setActiveResultTab("parameters")}
                          className={`variables-header-tab ${activeResultTab === 'parameters' ? 'active' : ''}`}
                          style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "1rem" }}
                        >
                          Query Parameters
                        </button>
                      </div>
                    </div>

                    <div className="variables-content" style={{ maxHeight: "250px", overflowY: "auto", background: "rgba(0,0,0,0.45)", padding: "12px" }}>
                      {activeResultTab === "interactive" && (
                        <div className="flex-col gap-2 w-full" style={{ padding: "2px" }}>
                          {/* Case Switcher */}
                          <div className="flex justify-between items-center" style={{ marginBottom: "8px" }}>
                            <span style={{ fontSize: "0.72rem", color: "var(--text-dark)", fontWeight: 700 }}>SELECT TEST CASE</span>
                            {testResults.length > 0 && (
                              <span style={{ 
                                fontSize: "0.72rem", 
                                fontWeight: 700, 
                                color: testResults.every(r => r.passed) ? "var(--success)" : "var(--error)"
                              }}>
                                {testResults.every(r => r.passed) ? "ALL PASSED" : "SOME FAILED"}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex gap-2 items-center" style={{ marginBottom: "10px", flexWrap: "wrap" }}>
                            {problem.testCases.map((_: any, idx: number) => {
                              const hasResult = testResults.length > idx;
                              const passed = hasResult && testResults[idx]?.passed;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => setActiveTestCaseIdx(idx)}
                                  className="flex items-center gap-1.5"
                                  style={{
                                    padding: "4px 10px",
                                    fontSize: "0.72rem",
                                    borderRadius: "6px",
                                    border: "1.5px solid",
                                    borderColor: activeTestCaseIdx === idx 
                                      ? 'var(--primary)' 
                                      : (activeTheme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'),
                                    background: activeTestCaseIdx === idx 
                                      ? 'rgba(99, 102, 241, 0.12)' 
                                      : (activeTheme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.2)'),
                                    color: activeTheme === 'light' 
                                      ? (activeTestCaseIdx === idx ? 'var(--primary)' : 'var(--text-main)') 
                                      : '#fff',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    transition: 'all 0.15s'
                                  }}
                                >
                                  <span>Case {idx + 1}</span>
                                  {hasResult && (
                                    <span style={{ display: 'flex', alignItems: 'center' }}>
                                      {passed ? (
                                        <Check size={11} strokeWidth={3} style={{ color: 'var(--success)' }} />
                                      ) : (
                                        <X size={11} strokeWidth={3} style={{ color: 'var(--error)' }} />
                                      )}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Grid Input/Expected/Actual */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            <div className="flex-col gap-1">
                              <span style={{ fontSize: "0.68rem", color: "var(--text-dark)", fontWeight: 700, letterSpacing: "0.02em" }}>INPUT</span>
                              <div style={{ 
                                fontFamily: "var(--font-mono)", 
                                fontSize: "0.76rem", 
                                background: activeTheme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.35)', 
                                padding: "6px 10px", 
                                borderRadius: "6px", 
                                border: `1px solid ${activeTheme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.03)'}`, 
                                color: activeTheme === 'light' ? '#2563eb' : '#93c5fd',
                                overflowX: "auto",
                                whiteSpace: "nowrap"
                              }} title={problem.testCases[activeTestCaseIdx]?.input}>
                                {problem.testCases[activeTestCaseIdx]?.input}
                              </div>
                            </div>
                            <div className="flex-col gap-1">
                              <span style={{ fontSize: "0.68rem", color: "var(--text-dark)", fontWeight: 700, letterSpacing: "0.02em" }}>EXPECTED</span>
                              <div style={{ 
                                fontFamily: "var(--font-mono)", 
                                fontSize: "0.76rem", 
                                background: activeTheme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.35)', 
                                padding: "6px 10px", 
                                borderRadius: "6px", 
                                border: `1px solid ${activeTheme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.03)'}`, 
                                color: activeTheme === 'light' ? '#16a34a' : '#34d399',
                                overflowX: "auto",
                                whiteSpace: "nowrap"
                              }} title={problem.testCases[activeTestCaseIdx]?.expectedOutput}>
                                {problem.testCases[activeTestCaseIdx]?.expectedOutput}
                              </div>
                            </div>
                          </div>

                          {/* Actual output */}
                          <div className="flex-col gap-1" style={{ marginTop: "8px" }}>
                            <span style={{ fontSize: "0.68rem", color: "var(--text-dark)", fontWeight: 700, letterSpacing: "0.02em" }}>ACTUAL RUNTIME OUTPUT</span>
                            <div style={{ 
                              fontFamily: "var(--font-mono)", 
                              fontSize: "0.76rem", 
                              background: activeTheme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.5)', 
                              padding: "8px 12px", 
                              borderRadius: "6px", 
                              border: testResults.length > 0 
                                ? (testResults[activeTestCaseIdx]?.passed ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(244,63,94,0.2)") 
                                : `1px solid ${activeTheme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.03)'}`, 
                              color: testResults.length > 0 ? (testResults[activeTestCaseIdx]?.passed ? "var(--success)" : "var(--error)") : "var(--text-dark)",
                              wordBreak: "break-all",
                              boxShadow: testResults.length > 0 ? (testResults[activeTestCaseIdx]?.passed ? "inset 0 0 10px rgba(16,185,129,0.05)" : "inset 0 0 10px rgba(244,63,94,0.05)") : "none"
                            }}>
                              {testResults.length > 0 ? testResults[activeTestCaseIdx]?.actual : "No execution results. Run solution to evaluate."}
                            </div>
                          </div>

                          {/* Captured Console Logs */}
                          {testResults.length > 0 && testResults[activeTestCaseIdx]?.logs && testResults[activeTestCaseIdx]?.logs.length > 0 && (
                            <div className="flex-col gap-1" style={{ marginTop: "10px" }}>
                              <span style={{ fontSize: "0.68rem", color: "var(--text-dark)", fontWeight: 700, letterSpacing: "0.02em" }}>CONSOLE LOGS</span>
                              <div style={{ 
                                border: `1px solid ${activeTheme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)'}`, 
                                borderRadius: "6px", 
                                background: activeTheme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.6)', 
                                padding: "8px 12px", 
                                maxHeight: "80px", 
                                overflowY: "auto",
                                boxShadow: activeTheme === 'light' ? '0 2px 6px rgba(0,0,0,0.05)' : '0 4px 10px rgba(0,0,0,0.5)'
                              }}>
                                {testResults[activeTestCaseIdx].logs.map((log: string, lIdx: number) => (
                                  <div key={lIdx} style={{ fontFamily: "var(--font-mono)", fontSize: "0.76rem", color: activeTheme === 'light' ? 'var(--warning)' : '#fbbf24', borderLeft: "2.5px solid var(--accent)", paddingLeft: "8px", marginBottom: "3px", wordBreak: "break-all" }}>
                                    {log}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {activeResultTab === "results" && (
                        <div className="json-viewer" style={{ padding: "4px 8px", background: "none" }}>
                          {renderJSONHighlight(getGraphiQLResponse())}
                        </div>
                      )}

                      {activeResultTab === "parameters" && (
                        <div className="flex-col gap-3">
                          <div className="flex justify-between items-center" style={{ fontSize: "0.72rem", color: "var(--text-dark)" }}>
                            <span>Active Parameters (Test Case {activeTestCaseIdx + 1})</span>
                            <div className="flex gap-2">
                              {problem.testCases.map((_: any, idx: number) => (
                                <button
                                  key={idx}
                                  onClick={() => setActiveTestCaseIdx(idx)}
                                  style={{
                                    padding: "2px 6px",
                                    fontSize: "0.68rem",
                                    borderRadius: "4px",
                                    border: "none",
                                    background: activeTestCaseIdx === idx ? "var(--secondary)" : "rgba(255,255,255,0.06)",
                                    color: "#fff",
                                    cursor: "pointer"
                                  }}
                                >
                                  Case {idx + 1}
                                </button>
                              ))}
                            </div>
                          </div>
                          <textarea 
                            className="input-glass"
                            style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", background: activeTheme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.5)' }}
                            rows={2}
                            value={problem.testCases[activeTestCaseIdx]?.input || ""}
                            readOnly
                          />
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </Sidebar>
          )}
        </ExcalidrawViewer>
      </div>

      {/* 2. Top-Right floating presence indicator & narration panel */}
      <div style={{ position: "absolute", top: "4.5rem", right: "1rem", zIndex: 10, display: "flex", gap: "10px", alignItems: "center" }}>
        
        {/* Narrate Concept */}
        <button 
          onClick={playAudio} 
          className="btn-primary" 
          style={{ 
            padding: "8px 14px", 
            borderRadius: "9999px", 
            fontSize: "0.8rem", 
            background: isPlayingAudio ? "var(--accent)" : "linear-gradient(135deg, var(--primary), var(--accent))",
            boxShadow: "0 4px 15px rgba(99,102,241,0.2)"
          }}
        >
          <Volume2 size={15} />
          {isPlayingAudio ? "Stop Narrator" : "Narrate Concept"}
        </button>

        {/* Share Board invite system */}
        <button 
          onClick={() => setIsShareOpen(true)} 
          className="btn-outline" 
          style={{ 
            padding: "8px 14px", 
            borderRadius: "9999px", 
            fontSize: "0.8rem", 
            background: "rgba(19, 21, 32, 0.75)",
            backdropFilter: "blur(8px)",
            border: "1.5px solid rgba(255,255,255,0.06)",
            color: "var(--text-main)"
          }}
        >
          <Share2 size={14} />
          Share Session
        </button>

        {/* WebRTC Collaborators Count */}
        <div 
          className="flex items-center gap-1.5" 
          style={{ 
            background: "rgba(16, 185, 129, 0.15)", 
            color: "var(--success)", 
            padding: "8px 14px", 
            borderRadius: "9999px", 
            fontSize: "0.8rem", 
            fontWeight: 600,
            border: "1px solid rgba(16, 185, 129, 0.25)"
          }}
          title="Active Webrtc room peers"
        >
          <Users size={14} />
          <span>{collaborators} Online</span>
        </div>
      </div>

      {/* 3. Floating Minimized Bubble Overlay */}
      {editorState === "minimized" && (
        <button 
          onClick={() => setEditorState("docked")}
          className="floating-play-btn" 
          style={{ 
            position: "absolute", 
            top: "8.5rem", 
            right: "1rem", 
            width: "52px", 
            height: "52px", 
            borderRadius: "50%",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, var(--secondary), var(--accent))",
            boxShadow: "0 0 20px rgba(236, 72, 153, 0.5)",
            animation: "pulseBadge 2s infinite"
          }}
          title="Restore Code Console"
        >
          <Code2 size={24} style={{ color: "#fff" }} />
        </button>
      )}

      {/* 4. Sleek Invite / Collaboration Share Modal */}
      {isShareOpen && (
        <div className="full-viewport-overlay" style={{ zIndex: 2000 }}>
          <div className="overlay-modal-card" style={{ maxWidth: "480px" }}>
            <div className="drawer-header">
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }} className="text-gradient">Share Drawing Session</h3>
              <button 
                onClick={() => setIsShareOpen(false)}
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-glass)", color: "var(--text-main)", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <X size={14} style={{ margin: "auto" }} />
              </button>
            </div>

            <div style={{ padding: "1.5rem" }} className="flex-col gap-4">
              <div className="flex-col gap-2">
                <label className="login-label">INVITATION URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={inviteLink} 
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
                <span style={{ fontSize: "0.7rem", color: "var(--text-dark)" }}>Anyone with this URL can join and edit your whiteboard and code in real-time.</span>
              </div>

              <div style={{ borderTop: "1px dashed rgba(255,255,255,0.05)", paddingTop: "1.25rem", marginTop: "0.5rem" }}>
                <form onSubmit={handleJoinRoom} className="flex-col gap-2">
                  <label className="login-label">CONNECT TO SPECIFIC ROOM</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter custom room code..." 
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value)}
                      className="overlay-input"
                      style={{ flex: 1, fontSize: "0.8rem" }}
                      required
                    />
                    <button 
                      type="submit" 
                      className="btn-outline" 
                      style={{ padding: "10px 16px", borderRadius: "8px", background: "rgba(99,102,241,0.06)", border: "1.5px solid rgba(99,102,241,0.3)" }}
                    >
                      Connect
                    </button>
                  </div>
                </form>
              </div>

              <div className="flex justify-between items-center" style={{ borderTop: "1px dashed rgba(255,255,255,0.05)", paddingTop: "1.25rem", marginTop: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-dark)" }}>Current active room: {roomCode}</span>
                <button 
                  onClick={handleGenerateRoom} 
                  style={{ background: "none", border: "none", color: "var(--secondary)", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}
                >
                  Generate New Room Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
