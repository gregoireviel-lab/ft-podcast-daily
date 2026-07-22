import { ImageResponse } from "next/og";

export const runtime = "edge";
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
          backgroundColor: "#0f0f11",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            backgroundColor: "#ffb27a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 36,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 5,
              alignItems: "center",
            }}
          >
            {[18, 28, 22, 32, 16].map((h, i) => (
              <div
                key={i}
                style={{
                  width: 7,
                  height: h,
                  borderRadius: 4,
                  backgroundColor: "#0f0f11",
                }}
              />
            ))}
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#f4f4f5",
            letterSpacing: "-1px",
            marginBottom: 16,
          }}
        >
          The Essential
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 26,
            color: "#71717a",
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
          }}
        >
          Your daily essential financial briefing
        </div>

        {/* Accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: "#ffb27a",
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
