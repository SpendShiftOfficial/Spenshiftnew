import { ImageResponse } from "next/og";

export const alt = "SpendShift — See where you could spend less with a free savings check";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "65px 80px", background: "#082d1b", color: "#ffffff", fontFamily: "sans-serif", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
        <div style={{ display: "flex", background: "#55c75a", width: 32, height: 32, borderRadius: 12 }} />
        <div style={{ display: "flex", fontWeight: 800, fontSize: 34, letterSpacing: -1 }}>SpendShift</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", color: "#b1e7b9", fontSize: 23, fontWeight: 700, letterSpacing: 2 }}>FREE SAVINGS CHECK</div>
        <div style={{ display: "flex", fontSize: 82, fontWeight: 800, lineHeight: 1.07, letterSpacing: -3, maxWidth: 950 }}>See where you could spend less.</div>
        <div style={{ display: "flex", fontSize: 29, color: "#d9ede0", maxWidth: 950 }}>8 free questions. Clear next steps. No bank login.</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 21, color: "#cfe7d2" }}>
        <span>Made for Australians</span>
        <span>Optional personal plan · A$29 once</span>
      </div>
    </div>,
    { ...size }
  );
}
