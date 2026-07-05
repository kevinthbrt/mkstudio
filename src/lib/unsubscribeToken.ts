import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.INTERNAL_API_SECRET ?? "";

export function generateUnsubscribeToken(profileId: string): string {
  return createHmac("sha256", SECRET).update(profileId).digest("hex");
}

export function verifyUnsubscribeToken(profileId: string, token: string): boolean {
  const expected = generateUnsubscribeToken(profileId);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
