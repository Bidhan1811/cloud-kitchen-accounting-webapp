"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1C1410",
          fontFamily: "system-ui, sans-serif",
          color: "#FFFBF4",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            maxWidth: "480px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(192,82,74,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              fontSize: "24px",
            }}
          >
            ⚠️
          </div>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 600,
              marginBottom: "0.75rem",
              color: "#FFFBF4",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "rgba(255,251,244,0.55)",
              marginBottom: "1.5rem",
              lineHeight: 1.6,
            }}
          >
            A critical error occurred. Please refresh the page or try again.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: "10px 24px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #C8973E 0%, #A07830 100%)",
              color: "#1C1410",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
