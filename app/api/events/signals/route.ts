import { NextResponse } from "next/server";
import { requireAuthenticatedUserId } from "@/lib/server/account-state";
import { getSignalsByUrgency, type EventSignal } from "@/lib/server/event-detection";

type UrgencyLevel = "low" | "medium" | "high" | "critical";
const VALID_URGENCY: UrgencyLevel[] = ["low", "medium", "high", "critical"];

export async function GET(request: Request) {
  const { userId, error } = await requireAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const minUrgency = searchParams.get("min_urgency") as UrgencyLevel | null;

  let signals: EventSignal[];
  if (minUrgency && VALID_URGENCY.includes(minUrgency)) {
    signals = getSignalsByUrgency(minUrgency);
  } else {
    signals = getSignalsByUrgency("low");
  }

  return NextResponse.json({ signals, count: signals.length });
}
