import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const privateHeaders = [
      { key: "Cache-Control", value: "private, no-store, max-age=0" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
    ];
    return [
      { source: "/report/:path*", headers: privateHeaders },
      { source: "/success", headers: privateHeaders },
      { source: "/personalise", headers: privateHeaders },
    ];
  },
};

export default nextConfig;
