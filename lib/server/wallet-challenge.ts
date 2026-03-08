const MESSAGE_PREFIX = "Connect to PolyBot: ";
const MESSAGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function buildChallengeMessage(): string {
  const nonce = `${Date.now()}:${crypto.randomUUID()}`;
  return `${MESSAGE_PREFIX}${nonce}`;
}

export function isValidChallengeMessage(msg: string): boolean {
  if (!msg.startsWith(MESSAGE_PREFIX)) return false;
  const rest = msg.slice(MESSAGE_PREFIX.length);
  const [ts] = rest.split(":");
  const t = parseInt(ts, 10);
  if (Number.isNaN(t)) return false;
  return Date.now() - t < MESSAGE_TTL_MS;
}
