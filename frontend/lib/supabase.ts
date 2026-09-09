import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isConfigured =
  supabaseUrl &&
  supabaseUrl !== "https://your-project.supabase.co" &&
  supabaseAnonKey &&
  supabaseAnonKey !== "your-anon-key";

if (!isConfigured) {
  console.warn(
    "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
  );
}

// createBrowserClient from @supabase/ssr stores session in cookies so the
// middleware (which reads cookies server-side) can see the session immediately
// after sign-in and allow access to protected routes like /dashboard.
export const supabase = isConfigured
  ? createBrowserClient(supabaseUrl!, supabaseAnonKey!)
  : null;
