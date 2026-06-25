import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Bela & Belo — Barba, Cabelo e Unha · Cabo Verde";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #1a1410 0%, #2e2318 60%, #1a1410 100%)",
          fontFamily: "serif",
        }}
      >
        {/* Top accent line */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "#b8860b", display: "flex" }} />

        {/* Scissors icon */}
        <div style={{ fontSize: 64, marginBottom: 24, display: "flex" }}>✂</div>

        {/* Brand name */}
        <div
          style={{
            fontSize: 88,
            fontWeight: 800,
            color: "#f5ede0",
            letterSpacing: "-2px",
            lineHeight: 1,
            display: "flex",
          }}
        >
          Bela &amp; Belo
        </div>

        {/* Divider */}
        <div
          style={{
            width: 80,
            height: 2,
            background: "#b8860b",
            margin: "24px 0",
            display: "flex",
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "#c8a878",
            letterSpacing: "3px",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          Barba · Cabelo · Unha
        </div>

        {/* Sub-tagline */}
        <div
          style={{
            fontSize: 20,
            color: "#7a6a56",
            marginTop: 16,
            display: "flex",
          }}
        >
          Cabo Verde
        </div>

        {/* Bottom domain */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 18,
            color: "#4a3f30",
            display: "flex",
          }}
        >
          belabelo.cv
        </div>

        {/* Bottom accent line */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "#b8860b", display: "flex" }} />
      </div>
    ),
    { ...size }
  );
}
