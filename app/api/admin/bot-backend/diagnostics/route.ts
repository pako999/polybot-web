import { NextResponse } from "next/server";
import { requireAdminUserId } from "@/lib/server/admin";
import { getInternalBotStatus } from "@/lib/server/bot-backend";

export async function GET(req: Request) {
  const admin = await requireAdminUserId();
  if (!admin.userId) {
    return NextResponse.json({ error: admin.error, code: "ADMIN_REQUIRED" }, { status: admin.status });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || admin.userId;

  const probe = await getInternalBotStatus(userId);

  return NextResponse.json({
    userId,
    internalBaseUrlConfigured: Boolean(process.env.POLYBOT_INTERNAL_BASE_URL),
    internalApiTokenConfigured: Boolean(process.env.POLYBOT_INTERNAL_API_TOKEN),
    internalBaseUrlHost: process.env.POLYBOT_INTERNAL_BASE_URL || null,
    probeOk: probe.ok,
    probeError: probe.ok
      ? null
      : {
          code: probe.code,
          message: probe.message,
          upstreamStatus: probe.upstreamStatus ?? null,
        },
    probeStatus: probe.ok ? probe.data : null,
  });
}
