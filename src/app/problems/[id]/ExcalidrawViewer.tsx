"use client";

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import * as Y from 'yjs';
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => mod.Excalidraw),
  { ssr: false }
);

export default function ExcalidrawViewer({ data, ydoc, provider, children, theme = "dark" }: { data: string, ydoc?: Y.Doc, provider?: any, children?: React.ReactNode, theme?: "dark" | "light" }) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const isSyncing = useRef(false);

  let initialData = null;
  try {
    initialData = { elements: JSON.parse(data) };
  } catch(e) {
    console.error("Failed to parse Excalidraw data", e);
  }

  useEffect(() => {
    if (!ydoc || !excalidrawAPI) return;

    const yElements = ydoc.getMap('excalidraw-elements');

    // Pre-populate collaborative map if it's currently empty and database has initial drawing elements
    if (yElements.size === 0 && initialData?.elements) {
      ydoc.transact(() => {
        initialData.elements.forEach((el: any) => {
          if (!yElements.has(el.id)) {
            yElements.set(el.id, el);
          }
        });
      });
      // Update local view with the populated elements
      excalidrawAPI.updateScene({ elements: Array.from(yElements.values()) });
    } else if (yElements.size > 0) {
      // If we already have synced collaborative elements, apply them immediately
      excalidrawAPI.updateScene({ elements: Array.from(yElements.values()) });
    }

    // Observer: Remote changes -> Local Excalidraw
    const handleYjsUpdate = (event: Y.YMapEvent<any>, transaction: Y.Transaction) => {
      // Ignore our own changes
      if (transaction.local) return;
      
      const newElements = Array.from(yElements.values());
      if (newElements.length > 0) {
        isSyncing.current = true;
        excalidrawAPI.updateScene({ elements: newElements });
        
        // Small timeout to allow React/Excalidraw to process before unlocking
        setTimeout(() => { isSyncing.current = false; }, 50);
      }
    };

    yElements.observe(handleYjsUpdate);

    return () => {
      yElements.unobserve(handleYjsUpdate);
    };
  }, [ydoc, excalidrawAPI]);

  const handleExcalidrawChange = (elements: readonly any[]) => {
    if (!ydoc || isSyncing.current) return;

    const yElements = ydoc.getMap('excalidraw-elements');
    
    ydoc.transact(() => {
      elements.forEach(el => {
        const existing = yElements.get(el.id) as any;
        // Update Y.Map if the element is new or has a bumped version
        if (!existing || existing.version < el.version) {
          yElements.set(el.id, el);
        }
      });
    });
  };

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <Excalidraw 
        theme={theme}
        initialData={initialData || undefined}
        viewModeEnabled={false} // Make it editable for live collaboration!
        zenModeEnabled={false}
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        onChange={(elements) => handleExcalidrawChange(elements)}
      >
        {children}
      </Excalidraw>
    </div>
  );
}
