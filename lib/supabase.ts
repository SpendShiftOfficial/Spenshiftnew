import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL) {
  throw new Error("Missing SUPABASE_URL");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

// Preview builds must never connect to the real customer database.
// This strict guard applies to Phase 1 previews even if Vercel's environment
// variable scoping is accidentally changed later.
if (process.env.VERCEL_ENV === "preview" &&
    process.env.SUPABASE_URL !== "https://pcjgzbaigtsnevhcjqyd.supabase.co") {
  throw new Error("Preview database isolation is not configured.");
}

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);
