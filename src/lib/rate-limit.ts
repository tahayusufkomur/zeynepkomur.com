const requests = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(ip: string, limit = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = requests.get(ip);

  if (!entry || now > entry.resetAt) {
    requests.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

const globalForRateLimit = globalThis as unknown as { _rateLimitCleanup?: NodeJS.Timeout };
if (!globalForRateLimit._rateLimitCleanup) {
  globalForRateLimit._rateLimitCleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of requests.entries()) {
      if (now > value.resetAt) requests.delete(key);
    }
  }, 5 * 60 * 1000);
}
