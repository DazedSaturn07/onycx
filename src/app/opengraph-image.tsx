import { ImageResponse } from "next/og";

export const alt = "Prashant Yadav — Data Analyst & Creative Developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{
        display: "flex",
        width: "100%",
        height: "100%",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "62px 72px",
        background: "radial-gradient(ellipse at 78% 20%, #27231d 0%, #101010 38%, #050505 80%)",
        color: "#f4f2ed",
        fontFamily: "Arial, sans-serif",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#b6a177", fontSize: 20, letterSpacing: 4, textTransform: "uppercase" }}>
          <span style={{ width: 10, height: 10, borderRadius: 20, background: "#d6b47b" }} />
          Portfolio · India
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 86, fontWeight: 700, letterSpacing: -7, lineHeight: 1 }}>Prashant Yadav</div>
          <div style={{ color: "#aaa9a4", fontSize: 28, letterSpacing: 1 }}>Data Analyst · Creative Developer</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #42413f", paddingTop: 22, color: "#979590", fontSize: 18, letterSpacing: 2 }}>
          <span>DATA / SYSTEMS / EXPERIENCES</span>
          <span>onycx.dev</span>
        </div>
      </div>
    ),
    size,
  );
}
