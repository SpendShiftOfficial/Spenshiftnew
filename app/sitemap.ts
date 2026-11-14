import type { MetadataRoute } from "next";

const origin = "https://www.spendshift.com.au";

// Use a date only when the page content has been meaningfully updated.
// Do not fabricate a fresh lastmod for legal pages on each build.
const entries: Array<{ path: string; lastModified?: string }> = [
  { path: "/", lastModified: "2026-11-14" },
  { path: "/how-it-works", lastModified: "2026-11-14" },
  { path: "/why-spendshift", lastModified: "2026-11-14" },
  { path: "/pricing", lastModified: "2026-11-14" },
  { path: "/whats-included", lastModified: "2026-11-14" },
  { path: "/services", lastModified: "2026-11-14" },
  { path: "/save-money-australia", lastModified: "2026-11-14" },
  { path: "/reduce-electricity-bill-australia", lastModified: "2026-11-14" },
  { path: "/cancel-unused-subscriptions-australia", lastModified: "2026-11-14" },
  { path: "/financial-information-ai-disclaimer" },
  { path: "/privacy-policy" },
  { path: "/terms-and-conditions" },
  { path: "/cookies" },
  { path: "/refund-policy" },
];

// Private /audit, /results, /personalise and report routes are deliberately excluded.
export default function sitemap(): MetadataRoute.Sitemap {
  return entries.map(({ path, lastModified }) => ({
    url: origin + path,
    ...(lastModified ? { lastModified } : {}),
  }));
}
