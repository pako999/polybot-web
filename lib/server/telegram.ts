const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

type TelegramSendResult = {
  ok: boolean;
  skipped?: boolean;
  error?: string;
};

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isTelegramConfigured() {
  return Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_ADMIN_CHAT_ID);
}

export async function sendTelegramMessage(message: string): Promise<TelegramSendResult> {
  if (!isTelegramConfigured()) {
    return { ok: false, skipped: true, error: "Telegram env vars are not configured." };
  }

  const endpoint = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_ADMIN_CHAT_ID,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { description?: string };
      return {
        ok: false,
        error: payload.description || `Telegram API returned ${response.status}.`,
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Telegram request failed.",
    };
  }
}

export function formatSignupTelegramMessage(input: {
  email: string;
  clerkUserId: string;
  createdAtIso: string;
}) {
  return [
    "🎉 <b>New user signup</b>",
    `• User ID: <code>${escapeHtml(input.clerkUserId)}</code>`,
    `• Email: <code>${escapeHtml(input.email)}</code>`,
    `• Created: <code>${escapeHtml(input.createdAtIso)}</code>`,
  ].join("\n");
}

export function formatOpsTelegramMessage(input: {
  source: string;
  level: "error" | "critical";
  message: string;
  details?: string;
  timestampIso: string;
}) {
  return [
    input.level === "critical" ? "🚨 <b>Server critical alert</b>" : "⚠️ <b>Server error alert</b>",
    `• Source: <code>${escapeHtml(input.source)}</code>`,
    `• Time: <code>${escapeHtml(input.timestampIso)}</code>`,
    `• Message: ${escapeHtml(input.message)}`,
    input.details ? `• Details: <code>${escapeHtml(input.details)}</code>` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
