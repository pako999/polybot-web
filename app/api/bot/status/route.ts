import { NextResponse } from "next/server";
import { requireAuthenticatedUserId } from "@/lib/server/account-state";
import { buildBotStatusResponse } from "@/lib/server/bot-status";

export async function GET() {
  const { userId, error } = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error, code: "AUTH_REQUIRED" }, { status: 401 });
  }

  return NextResponse.json(await buildBotStatusResponse(userId));
}
