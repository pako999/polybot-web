import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/account(.*)",
  "/markets(.*)",
  "/strategies(.*)",
  "/risk(.*)",
]);

function buildCsp() {
  const customCsp = process.env.SECURITY_CSP;
  if (customCsp && customCsp.trim()) {
    return customCsp.trim();
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com data:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.com",
    "connect-src 'self' https://clerk.com https://*.clerk.com",
    "frame-src https://clerk.com https://*.clerk.com",
    "form-action 'self' https://clerk.com https://*.clerk.com",
    "upgrade-insecure-requests",
  ].join("; ");
}

function hasReportingDirective(csp: string) {
  const lower = csp.toLowerCase();
  return lower.includes("report-uri ") || lower.includes("report-to ");
}

function withCspReporting(csp: string, reportPath: string) {
  if (hasReportingDirective(csp)) {
    return csp;
  }
  return `${csp}; report-uri ${reportPath}; report-to csp-endpoint`;
}

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  if (req.nextUrl.protocol === "https:") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  const cspBase = buildCsp();
  const reportPath = process.env.SECURITY_CSP_REPORT_ENDPOINT || "/api/csp/report";
  const csp = withCspReporting(cspBase, reportPath);
  const reportOnly = process.env.SECURITY_CSP_REPORT_ONLY === "true";
  if (reportOnly) {
    response.headers.set("Content-Security-Policy-Report-Only", csp);
  } else {
    response.headers.set("Content-Security-Policy", csp);
  }

  response.headers.set(
    "Report-To",
    JSON.stringify({
      group: "csp-endpoint",
      max_age: 10886400,
      endpoints: [{ url: new URL(reportPath, req.nextUrl.origin).toString() }],
      include_subdomains: false,
    })
  );

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
