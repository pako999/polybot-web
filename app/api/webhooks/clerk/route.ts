import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { formatSignupTelegramMessage, sendTelegramMessage } from "@/lib/server/telegram";

type ClerkEmailAddress = {
  email_address?: string;
};

type ClerkWebhookData = {
  id?: string;
  created_at?: number;
  email_addresses?: ClerkEmailAddress[];
};

export async function POST(req: NextRequest) {
  let evt: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    evt = await verifyWebhook(req);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  if (evt.type !== "user.created") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const data = evt.data as ClerkWebhookData;
  const primaryEmail = data.email_addresses?.[0]?.email_address || "unknown";
  const createdAtIso = data.created_at
    ? new Date(data.created_at).toISOString()
    : new Date().toISOString();

  const message = formatSignupTelegramMessage({
    email: primaryEmail,
    clerkUserId: data.id || "unknown",
    createdAtIso,
  });

  const result = await sendTelegramMessage(message);
  console.info("[security-audit] clerk_user_created_webhook", {
    clerkUserId: data.id || "unknown",
    telegramSent: result.ok,
  });

  if (!result.ok && !result.skipped) {
    return NextResponse.json({ error: result.error || "Telegram send failed." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, telegram: result.ok ? "sent" : "skipped" });
}
