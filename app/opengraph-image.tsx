import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt =
  "SpendShift official logo — find where you could save with a free two-minute savings audit";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  // Use the exact same official logo as the site's header, not a drawn approximation.
  const logo = await readFile(join(process.cwd(), "public", "logo.png"), "base64");
  const logoSrc = `data:image/png;base64,${logo}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#F7FAF8",
        color: "#072C3F",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: 11,
          background: "#13B94F",
          display: "flex",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 735,
          boxSizing: "border-box",
          height: "100%",
          padding: "52px 0 50px 68px",
        }}
      >
        <img
          src={logoSrc}
          alt="SpendShift"
          width={337}
          height={96}
          style={{ objectFit: "contain" }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              background: "#DFF5E7",
              borderRadius: 50,
              padding: "11px 20px",
              color: "#14763A",
              letterSpacing: 1.1,
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            FREE 2-MINUTE SAVINGS AUDIT
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 78,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: -3.6,
              color: "#062B40",
            }}
          >
            <span>Find where</span>
            <span>you could save.</span>
          </div>
          <div style={{ display: "flex", fontSize: 25, color: "#4D6570", lineHeight: 1.25 }}>
            Eight quick questions about your everyday spending
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, color: "#345B5E", fontSize: 19, fontWeight: 700 }}>
          <span>NO BANK LOGIN</span>
          <span style={{ color: "#1DAF4C" }}>•</span>
          <span>FREE RESULTS</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          margin: "41px 36px 37px 20px",
          width: 409,
          boxSizing: "border-box",
          padding: "34px 30px 31px",
          background: "#073C31",
          borderRadius: 30,
          overflow: "hidden",
          color: "#FFFFFF",
        }}
      >
        <div style={{ display: "flex", fontWeight: 700, letterSpacing: 1.8, fontSize: 18, color: "#A9E8BB" }}>
          CHECK YOUR EVERYDAY SPENDING
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 17 }}>
          <div style={{ display: "flex", fontSize: 137, fontWeight: 800, lineHeight: 1, letterSpacing: -5, color: "#71E98E" }}>
            8
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 29, fontWeight: 750, lineHeight: 1.12 }}>
            <span>QUICK</span>
            <span>QUESTIONS</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {["Bills & utilities", "Subscriptions", "Everyday spending"].map((area) => (
            <div
              key={area}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "#195447",
                borderRadius: 13,
                padding: "13px 15px",
                fontSize: 20,
                color: "#F0FFF5",
              }}
            >
              <div style={{ display: "flex", background: "#79E996", height: 10, width: 10, borderRadius: 10 }} />
              <span>{area}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            background: "#70E58E",
            color: "#06382A",
            padding: "17px 20px",
            borderRadius: 15,
            fontWeight: 850,
            fontSize: 24,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>START YOUR FREE AUDIT</span>
          <span>→</span>
        </div>
      </div>
    </div>,
    { ...size }
  );
}
