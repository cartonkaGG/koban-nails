import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          background: "linear-gradient(145deg, #fbf7f3 0%, #f3eae2 100%)",
          borderRadius: 36,
        }}
      >
        <span
          style={{
            fontSize: 52,
            fontWeight: 600,
            letterSpacing: "0.18em",
            color: "#2e2a26",
            fontFamily: "Georgia, serif",
            lineHeight: 1,
          }}
        >
          KOBAN
        </span>
        <span
          style={{
            marginTop: 8,
            fontSize: 16,
            fontWeight: 500,
            letterSpacing: "0.35em",
            color: "#c97f72",
            textTransform: "uppercase",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          nails
        </span>
      </div>
    ),
    { ...size },
  );
}
