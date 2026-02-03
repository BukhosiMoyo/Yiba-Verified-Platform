// Next.js middleware
// Handles RBAC route protection, security headers, CORS, and other cross-cutting concerns
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { canAccessArea, type Role, type RouteArea } from "@/lib/rbac";

const AREA_PREFIXES: Array<{ prefix: string; area: RouteArea }> = [
  { prefix: "/platform-admin", area: "platform-admin" },
  { prefix: "/advisor", area: "advisor" },
  { prefix: "/qcto", area: "qcto" },
  { prefix: "/institution", area: "institution" },
  { prefix: "/student", area: "student" },
  { prefix: "/account", area: "account" },
  { prefix: "/announcements", area: "announcements" },
];

function getAreaFromPath(pathname: string): RouteArea | null {
  for (const item of AREA_PREFIXES) {
    if (pathname === item.prefix || pathname.startsWith(item.prefix + "/")) return item.area;
  }
  return null;
}

/**
 * Apply security headers to a response
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content Security Policy (Google Maps / Places Autocomplete: allow script + connect)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com",
    "script-src-elem 'self' 'unsafe-inline' https://maps.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://maps.googleapis.com https://*.googleapis.com https://*.gstatic.com",
    "frame-src 'self' https://maps.googleapis.com https://*.googleapis.com",
    "frame-ancestors 'none'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  // Strict Transport Security (HSTS) - only in production with HTTPS
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  // Permissions Policy (formerly Feature Policy)
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
  );

  return response;
}

/**
 * Apply CORS headers for API routes
 */
function applyCORSHeaders(response: NextResponse, request: NextRequest): NextResponse {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["https://yibaverified.co.za"];

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-DEV-TOKEN");
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set("Access-Control-Max-Age", "86400");
    }
  }

  return response;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Paths that should have NOINDEX headers (app routes)
  // Marketing routes (/, /features, /how-it-works, /security, /pricing, /contact) are NOT in this list
  const noindexPaths = [
    "/platform-admin",
    "/advisor",
    "/qcto",
    "/institution",
    "/student",
    "/api",
  ];

  // Check if path should have NOINDEX header
  const shouldNoIndex = noindexPaths.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // Handle auth routes separately - login is public and should NOT have noindex
  const authRoutes = ["/login", "/signup", "/invite"];
  if (authRoutes.includes(pathname)) {
    let response = NextResponse.next();
    response = applySecurityHeaders(response);
    return response;
  }

  // Other auth routes (logout, unauthorized, check-email, etc.) get noindex
  const otherAuthRoutes = [
    "/logout",
    "/unauthorized",
    "/check-email",
    "/reset-success",
    "/account-deactivated",
    "/forgot-password",
    "/reset-password",
  ];
  if (otherAuthRoutes.includes(pathname)) {
    let response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response = applySecurityHeaders(response);
    return response;
  }

  // Handle /api/auth routes - these are NextAuth API routes, no RBAC needed but should have noindex
  if (pathname.startsWith("/api/auth")) {
    let response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response = applySecurityHeaders(response);
    return response;
  }

  // Handle CORS preflight for API routes
  if (pathname.startsWith("/api/") && req.method === "OPTIONS") {
    let response = new NextResponse(null, { status: 200 });
    response = applyCORSHeaders(response, req);
    response = applySecurityHeaders(response);
    return response;
  }

  // Public routes (marketing pages) - no noindex needed
  if (pathname === "/" || pathname.startsWith("/public")) {
    let response = NextResponse.next();
    response = applySecurityHeaders(response);
    return response;
  }

  const area = getAreaFromPath(pathname);

  // If it's not a protected area route, but still needs noindex (like /api routes)
  if (!area) {
    if (shouldNoIndex) {
      let response = NextResponse.next();
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      response = applySecurityHeaders(response);
      response = applyCORSHeaders(response, req);
      return response;
    }
    // Marketing routes and other public routes - no noindex
    let response = NextResponse.next();
    response = applySecurityHeaders(response);
    return response;
  }

  // Protected area routes - apply RBAC, then add noindex header
  // Cache token lookup per request using a simple in-memory cache (per request only)
  // Note: getToken already has internal caching, but we can optimize further
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    // Only set "next" parameter if it's a safe internal path (prevents open redirects)
    // Allow only paths that start with / and don't contain protocol separators
    if (pathname && pathname.startsWith("/") && !pathname.includes("://") && !pathname.includes("//")) {
      url.searchParams.set("next", pathname);
    }
    let response = NextResponse.redirect(url);
    response = applySecurityHeaders(response);
    return response;
  }

  const role = (token.role as Role | undefined) ?? null;
  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/unauthorized";
    let response = NextResponse.redirect(url);
    response = applySecurityHeaders(response);
    return response;
  }

  // Check for impersonation session expiration (if this is an impersonation session)
  const impersonationSessionId = (token as any).impersonationSessionId;
  if (impersonationSessionId && pathname !== "/view-as" && !pathname.startsWith("/view-as/")) {
    // Check session expiration in the background (don't block request)
    // The API routes will handle expiration checks
    // For now, we just allow the request through
  }

  // Onboarding: redirect to onboarding page before layout runs so we never flash the dashboard
  const onboardingCompleted = (token as any).onboarding_completed === true;

  // PLATFORM_ADMIN: do not redirect to onboarding in middleware. Layout uses DB (with cache
  // revalidation on complete) so dashboard opens right after onboarding without relying on JWT update timing.
  if (role === "PLATFORM_ADMIN") {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", pathname);
    let response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response = applySecurityHeaders(response);
    response = applyCORSHeaders(response, req);
    return response;
  }

  // Check for View As User state in cookies (deprecated - old system)
  const viewingAsRole = req.cookies.get("viewing_as_role")?.value as Role | undefined;

  // Allow access if either the original role OR the viewing-as role can access the area
  const originalCanAccess = canAccessArea(role, area);
  const viewingAsCanAccess = viewingAsRole ? canAccessArea(viewingAsRole, area) : false;

  if (!originalCanAccess && !viewingAsCanAccess) {
    const url = req.nextUrl.clone();
    url.pathname = "/unauthorized";
    let response = NextResponse.redirect(url);
    response = applySecurityHeaders(response);
    return response;
  }

  // Redirect to role-specific onboarding when not completed (avoids dashboard flash)
  if (!onboardingCompleted && area) {
    if (area === "student" && pathname === "/student" && role === "STUDENT") {
      const url = req.nextUrl.clone();
      url.pathname = "/student/onboarding";
      let response = NextResponse.redirect(url);
      response = applySecurityHeaders(response);
      return response;
    }
    if (
      area === "institution" &&
      (pathname === "/institution" || pathname.startsWith("/institution/")) &&
      !pathname.startsWith("/institution/onboarding") &&
      role === "INSTITUTION_ADMIN"
    ) {
      const url = req.nextUrl.clone();
      url.pathname = "/institution/onboarding";
      let response = NextResponse.redirect(url);
      response = applySecurityHeaders(response);
      return response;
    }
    if (
      area === "qcto" &&
      (pathname === "/qcto" || pathname.startsWith("/qcto/")) &&
      !pathname.startsWith("/qcto/onboarding") &&
      (role as string) !== "QCTO_SUPER_ADMIN" &&
      (role as string) !== "PLATFORM_ADMIN"
    ) {
      const url = req.nextUrl.clone();
      url.pathname = "/qcto/onboarding";
      let response = NextResponse.redirect(url);
      response = applySecurityHeaders(response);
      return response;
    }
  }

  // All protected area routes: forward pathname on request so layouts can avoid redirect loops
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response = applySecurityHeaders(response);
  response = applyCORSHeaders(response, req);
  return response;
}

export const config = {
  matcher: [
    "/platform-admin/:path*",
    "/qcto/:path*",
    "/institution/:path*",
    "/student/:path*",
    "/account",
    "/account/:path*",
    "/announcements",
    "/announcements/:path*",
    "/api/:path*",
    "/login",
    "/logout",
    "/signup",
    "/invite",
    "/unauthorized",
    "/check-email",
    "/reset-success",
    "/account-deactivated",
    "/forgot-password",
    "/reset-password",
  ],
};
