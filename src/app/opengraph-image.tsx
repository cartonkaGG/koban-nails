import { ImageResponse } from "next/og";

export const alt = "Koban Nails — онлайн-курси манікюру";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
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
          background: "linear-gradient(135deg, #fbf7f3 0%, #f3eae2 55%, #ede2d9 100%)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -60,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "rgba(231, 160, 170, 0.22)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "rgba(201, 127, 114, 0.14)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <span
              style={{
                fontSize: 96,
                fontWeight: 600,
                letterSpacing: "0.22em",
                color: "#2e2a26",
                fontFamily: "Georgia, serif",
              }}
            >
              KOBAN
            </span>
            <span
              style={{
                fontSize: 28,
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

          <p
            style={{
              margin: 0,
              fontSize: 30,
              color: "#4a433d",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 500,
            }}
          >
            Онлайн-курси манікюру та педикюру
          </p>
        </div>
      </div>
    ),
    { ...size },
  );
}
