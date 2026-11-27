import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

export const SESSION_COOKIE = "admin_session";
export const SESSION_SECONDS = 12 * 60 * 60;

export function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("SESSION_SECRET must be at least 32 characters");
  return secret;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  // ":" not "$": .env files expand "$name" and would mangle the hash.
  return `scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = scryptSync(
    password,
    Buffer.from(salt, "base64url"),
    expected.length,
  );
  return timingSafeEqual(actual, expected);
}

export function sameText(a: string, b: string): boolean {
  const digest = (text: string) => createHash("sha256").update(text).digest();
  return timingSafeEqual(digest(a), digest(b));
}

const sign = (value: string, secret: string) =>
  createHmac("sha256", secret).update(value).digest("base64url");

export function createSession(secret: string, now = Date.now()): string {
  const expires = String(now + SESSION_SECONDS * 1000);
  return `${expires}.${sign(expires, secret)}`;
}

export function isValidSession(
  token: string | undefined,
  secret: string,
  now = Date.now(),
): boolean {
  const [expires, signature] = token?.split(".") ?? [];
  if (!expires || !signature) return false;
  const expected = Buffer.from(sign(expires, secret));
  const actual = Buffer.from(signature);
  return (
    actual.length === expected.length &&
    timingSafeEqual(actual, expected) &&
    Number(expires) > now
  );
}
