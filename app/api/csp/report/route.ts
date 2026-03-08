import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/server/rate-limit";

type CspReportBody =
  | {
      "csp-report"?: Record<string, unknown>;
    }
  | Array<Record<string, unknown>>;

function sanitize(value: unknown, maxLen = 300) {
  if (typeof value !== "string") return "unknown";
  return value.slice(0, maxLen);
}

function extractReportDetails(parsed: CspReportBody) {
  if (Array.isArray(parsed) && parsed.length > 0) {
    const report = parsed[0];
    return {
      violatedDirective: sanitize(report?.["violated-directive"]),
      effectiveDirective: sanitize(report?.["effective-directive"]),
      blockedUri: sanitize(report?.["blocked-uri"]),
      documentUri: sanitize(report?.["document-uri"]),
      disposition: sanitize(report?.disposition),
    };
  }

  const report = (parsed as { "csp-report"?: Record<string, unknown> })["csp-report"];
  if (!report || typeof report !== "object") {
    return null;
  }

  return {
    violatedDirective: sanitize(report["violated-directive"]),
    effectiveDirective: sanitize(report["effective-directive"]),
    blockedUri: sanitize(report["blocked-uri"]),
    documentUri: sanitize(report["document-uri"]),
    disposition: sanitize(report.disposition),
  };
}

export async function POST(req: NextRequest) {
  const sourceIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const rate = await checkRateLimit(`csp_report:${sourceIp}`, 120, 60_000);
  if (!rate.allowed) {
    return new NextResponse(null, { status: 429 });
  }

  const bodyText = await req.text();
  if (!bodyText) {
    return new NextResponse(null, { status: 204 });
  }

  let parsed: CspReportBody;
  try {
    parsed = JSON.parse(bodyText) as CspReportBody;
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const report = extractReportDetails(parsed);
  if (report) {
    console.warn("[security-audit] csp_violation_report", {
      sourceIp,
      ...report,
    });
  }

  return new NextResponse(null, { status: 204 });
}
