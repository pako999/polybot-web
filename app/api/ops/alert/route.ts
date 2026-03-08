import { NextRequest, NextResponse } from "next/server";
import { formatOpsTelegramMessage, sendTelegramMessage } from "@/lib/server/telegram";
import { safeEqualSecret } from "@/lib/server/security";
import { checkRateLimit } from "@/lib/server/rate-limit";

type OpsAlertPayload = {
  source?: unknown;
  level?: unknown;
  message?: unknown;
  details?: unknown;
};

const OPS_ALERT_TOKEN = process.env.OPS_ALERT_TOKEN;

function isValidLevel(level: unknown): level is "error" | "critical" {
  return level === "error" || level === "critical";
}

export async function POST(req: NextRequest) {
  if (!OPS_ALERT_TOKEN) {
    return NextResponse.json({ error: "Ops alerts are not configured." }, { status: 500 });
  }

  const providedToken = req.headers.get("x-ops-token");
  if (!providedToken || !safeEqualSecret(providedToken, OPS_ALERT_TOKEN)) {
    return NextResponse.json({ error: "Unauthorized alert token." }, { status: 401 });
  }

  const sourceIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const rate = await checkRateLimit(`ops_alert:${sourceIp}`, 30, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many alert requests." }, { status: 429 });
  }

  let payload: OpsAlertPayload;
  try {
    payload = (await req.json()) as OpsAlertPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof payload.source !== "string" || !payload.source.trim()) {
    return NextResponse.json({ error: "source is required." }, { status: 400 });
  }
  if (!isValidLevel(payload.level)) {
    return NextResponse.json({ error: "level must be 'error' or 'critical'." }, { status: 400 });
  }
  if (typeof payload.message !== "string" || !payload.message.trim()) {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  const alertMessage = formatOpsTelegramMessage({
    source: payload.source,
    level: payload.level,
    message: payload.message,
    details: typeof payload.details === "string" ? payload.details : undefined,
    timestampIso: new Date().toISOString(),
  });

  const result = await sendTelegramMessage(alertMessage);
  console.info("[security-audit] ops_alert_received", {
    source: payload.source,
    level: payload.level,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || "Unable to send Telegram alert." },
      { status: result.skipped ? 200 : 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
