import { NextResponse } from "next/server";
import { requireAuthenticatedUserId } from "@/lib/server/account-state";
import { runEventScan } from "@/lib/server/event-detection";

export const maxDuration = 60;

export async function POST() {
  const { userId, error } = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI event detection is not configured. Set ANTHROPIC_API_KEY." },
      { status: 503 }
    );
  }

  try {
    const result = await runEventScan();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Event scan failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
