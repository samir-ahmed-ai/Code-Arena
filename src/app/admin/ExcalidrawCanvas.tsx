"use client";

import dynamic from 'next/dynamic';
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => mod.Excalidraw),
  { ssr: false }
);

export default function ExcalidrawCanvas({ onChange }: { onChange: (data: string) => void }) {
  return (
    <div style={{ height: '600px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
      <Excalidraw 
        theme="dark"
        onChange={(elements) => {
          // Avoid saving empty states or triggering too often; stringify elements.
          onChange(JSON.stringify(elements));
        }}
      />
    </div>
  );
}
