import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/server/rate-limit";

type CspReportBody =
  | {
      "csp-report"?: Record<string, unknown>;
    }
  | Array<Record<string, unknown>>;

function getStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string") return v.slice(0, 300);
  }
  return "unknown";
}

function extractFromReport(report: Record<string, unknown>) {
  return {
    violatedDirective: getStr(report, "violated-directive", "violatedDirective", "effectiveDirective"),
    effectiveDirective: getStr(report, "effective-directive", "effectiveDirective"),
    blockedUri: getStr(report, "blocked-uri", "blockedUri", "blockedURL"),
    documentUri: getStr(report, "document-uri", "documentUri", "documentURL"),
    disposition: getStr(report, "disposition"),
  };
}

function extractReportDetails(parsed: CspReportBody): Record<string, string> | null {
  // Report-To format: { type: "csp-violation", body: {...} } or array of such
  if (Array.isArray(parsed) && parsed.length > 0) {
    const first = parsed[0] as Record<string, unknown>;
    const body = first?.body && typeof first.body === "object" ? (first.body as Record<string, unknown>) : first;
    if (body) return extractFromReport(body);
  }

  const obj = parsed as Record<string, unknown>;
  if (obj?.body && typeof obj.body === "object") {
    return extractFromReport(obj.body as Record<string, unknown>);
  }

  // Legacy report-uri format: { "csp-report": {...} }
  const cspReport = obj["csp-report"];
  if (cspReport && typeof cspReport === "object") {
    return extractFromReport(cspReport as Record<string, unknown>);
  }

  return null;
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
    const allUnknown =
      report.violatedDirective === "unknown" &&
      report.effectiveDirective === "unknown" &&
      report.blockedUri === "unknown" &&
      report.documentUri === "unknown";
    const meta: Record<string, unknown> = { sourceIp, ...report };
    if (allUnknown && parsed && typeof parsed === "object") {
      const body = (parsed as { body?: unknown }).body ?? parsed;
      meta.receivedKeys = Array.isArray(body) ? "array" : Object.keys(body as object);
    }
    console.warn("[security-audit] csp_violation_report", meta);
  }

  return new NextResponse(null, { status: 204 });
}
