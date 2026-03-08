import { timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";

export function isCrossSiteRequest(req: NextRequest): boolean {
  const secFetchSite = req.headers.get("sec-fetch-site");
  if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "same-site") {
    return true;
  }

  const origin = req.headers.get("origin");
  if (!origin) return false;

  const requestOrigin = req.nextUrl.origin;
  return origin !== requestOrigin;
}

export function safeEqualSecret(input: string, expected: string): boolean {
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);
  if (inputBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return timingSafeEqual(inputBuffer, expectedBuffer);
}
