// Rate Limiting für API-Schutz
// Optional: Verhindert Missbrauch und hohe Kosten

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Konfiguration
const RATE_LIMIT = {
  MAX_REQUESTS: 120, // Max 120 Requests (2 per second avg)
  WINDOW_MS: 60 * 1000, // pro Minute
};

export function checkRateLimit(
  identifier: string,
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  // Cleanup alte Einträge
  if (entry && now > entry.resetTime) {
    rateLimitMap.delete(identifier);
  }

  const current = rateLimitMap.get(identifier);

  if (!current) {
    // Erste Anfrage
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT.WINDOW_MS,
    });
    return { allowed: true, remaining: RATE_LIMIT.MAX_REQUESTS - 1 };
  }

  if (current.count >= RATE_LIMIT.MAX_REQUESTS) {
    // Limit erreicht
    return { allowed: false, remaining: 0 };
  }

  // Inkrement
  current.count++;
  return { allowed: true, remaining: RATE_LIMIT.MAX_REQUESTS - current.count };
}
