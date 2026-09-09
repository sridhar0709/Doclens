import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/documents",
  "/chat",
  "/notifications",
  "/settings",
  "/profile",
];

const authRoutes = ["/login", "/register"];

const protectedSet = new Set(protectedRoutes);
const authSet = new Set(authRoutes);

const BLOCKED_USER_AGENTS = [
  "curl/",
  "python-requests",
  "masscan",
  "nikto",
  "sqlmap",
  "postmanruntime",
  "zgrab",
  "nmap",
];

function isProtected(pathname: string): boolean {
  if (protectedSet.has(pathname)) return true;
  for (const route of protectedSet) {
    if (pathname.startsWith(route + "/")) return true;
  }
  return false;
}

function isAuthRoute(pathname: string): boolean {
  if (authSet.has(pathname)) return true;
  for (const route of authSet) {
    if (pathname.startsWith(route + "/")) return true;
  }
  return false;
}

export async function middleware(request: NextRequest) {
  // ── Edge Shield: Block automated attack scanners and oversized requests ──
  const userAgent = (request.headers.get("user-agent") || "").toLowerCase();
  if (BLOCKED_USER_AGENTS.some((bot) => userAgent.includes(bot))) {
    return new NextResponse(
      JSON.stringify({ error: "Access Denied: Automated scraping or vulnerability scanning is strictly prohibited." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
  if (contentLength > 10 * 1024 * 1024) {
    return new NextResponse(
      JSON.stringify({ error: "Payload Too Large: Request body exceeds maximum edge limit." }),
      { status: 413, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  const { pathname, search } = request.nextUrl;
  const isProtectedRoute = isProtected(pathname);
  const authRouteCheck = isAuthRoute(pathname);

  if (!isProtectedRoute && !authRouteCheck) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedRoute && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("redirect", `${pathname}${search}`);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    redirectResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    redirectResponse.headers.set("Pragma", "no-cache");
    return redirectResponse;
  }

  if (authRouteCheck && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    const redirectResponse = NextResponse.redirect(redirectUrl);
    redirectResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    redirectResponse.headers.set("Pragma", "no-cache");
    return redirectResponse;
  }

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (isProtectedRoute) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    response.headers.set("Pragma", "no-cache");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
