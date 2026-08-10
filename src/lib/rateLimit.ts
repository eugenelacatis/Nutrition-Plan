interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()
const MAX_TRACKED_KEYS = 5000

/**
 * Minimal in-memory IP rate limiter. Resets on redeploy/cold start and
 * undercounts across concurrent serverless instances — an accepted tradeoff
 * for this app's scale on a route that triggers real Anthropic API spend
 * with no auth wall. This is now backed by the persistent TrialPlanPool
 * cache too, so even a bypassed limit can't cause unbounded spend — the
 * limiter's remaining job is just to stop one client hammering the route.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()

  // Opportunistically evict expired entries so a flood of distinct keys
  // (e.g. spoofed IPs) can't grow this map without bound.
  if (buckets.size > MAX_TRACKED_KEYS) {
    Array.from(buckets.entries()).forEach(([k, b]) => {
      if (now > b.resetAt) buckets.delete(k)
    })
    // Still over the cap after evicting expired entries — fail closed
    // rather than let the map grow forever.
    if (buckets.size > MAX_TRACKED_KEYS) {
      return false
    }
  }

  const bucket = buckets.get(key)

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (bucket.count >= limit) {
    return false
  }

  bucket.count += 1
  return true
}

/**
 * Vercel's platform-level infrastructure sets x-forwarded-for itself and
 * cannot be spoofed by the client (Vercel strips/overwrites any client-sent
 * value before it reaches the function) — safe to trust as-is when deployed
 * there. In a self-hosted setup behind a different/untrusted proxy, this
 * would need the proxy's actual trusted-header configuration instead.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || 'unknown'
}
