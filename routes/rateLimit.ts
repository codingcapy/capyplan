import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

type RateLimitBucket = {
  count: number;
  windowStart: number;
};

const buckets = new Map<string, RateLimitBucket>();

function getClientIp(c: Context) {
  const forwardedFor = c.req.header("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = c.req.header("x-real-ip");
  if (realIp) return realIp;
  const connectingIp = c.req.header("cf-connecting-ip");
  if (connectingIp) return connectingIp;
  return "unknown";
}

export function enforceRateLimit(
  c: Context,
  routeKey: string,
  limit: number,
  windowMs: number,
) {
  const now = Date.now();
  const ip = getClientIp(c);
  const bucketKey = `${routeKey}:${ip}`;
  const existing = buckets.get(bucketKey);

  if (!existing || now - existing.windowStart >= windowMs) {
    buckets.set(bucketKey, { count: 1, windowStart: now });
    return;
  }

  if (existing.count >= limit) {
    throw new HTTPException(429, {
      message: "Too many requests. Please try again later.",
    });
  }

  existing.count += 1;

  // Best-effort cleanup to prevent unbounded map growth.
  if (buckets.size > 10_000) {
    for (const [key, bucket] of buckets) {
      if (now - bucket.windowStart >= windowMs) {
        buckets.delete(key);
      }
    }
  }
}
