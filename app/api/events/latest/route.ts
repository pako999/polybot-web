import { NextResponse } from "next/server";
import { requireAuthenticatedUserId } from "@/lib/server/account-state";
import { getLatestSignals } from "@/lib/server/event-detection";

export async function GET() {
  const { userId, error } = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { signals, lastScanAt } = getLatestSignals();
  return NextResponse.json({ signals, lastScanAt });
}
