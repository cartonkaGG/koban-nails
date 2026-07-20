import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2e2a26",
          borderRadius: 8,
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "#fbf7f3",
            fontFamily: "Georgia, serif",
          }}
        >
          KN
        </span>
      </div>
    ),
    { ...size },
  );
}
