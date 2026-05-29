import type { Metadata } from "next";
import "./globals.css";
import ClientShell from "@/components/ClientShell";

export const metadata: Metadata = {
  title: "CodeGraph | Visualize Your Solutions",
  description: "Practice coding problems with interactive step-by-step Excalidraw diagrams and audio explanations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClientShell>
          <div className="app-layout" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <main style={{ flex: 1, display: "flex", flexDirection: "column", width: "100vw", height: "100vh", overflow: "hidden" }}>
              {children}
            </main>
          </div>
        </ClientShell>
      </body>
    </html>
  );
}


