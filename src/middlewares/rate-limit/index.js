'use strict';

const DEFAULT_WINDOW_MS = 60 * 1000;
const DEFAULT_MAX_REQUESTS = 120;

const defaultKeyGenerator = (ctx) => {
  const userId = ctx.state?.user?.id;
  if (userId) {
    return `user:${userId}`;
  }
  return `ip:${ctx.ip}`;
};

module.exports = (config = {}, { strapi } = {}) => {
  const windowMs = Number(config.windowMs || DEFAULT_WINDOW_MS);
  const max = Number(config.max || DEFAULT_MAX_REQUESTS);
  const keyGenerator = config.keyGenerator || defaultKeyGenerator;
  const whitelist = new Set(config.whitelist || []);

  const buckets = new Map();

  return async (ctx, next) => {
    if (!ctx.path.startsWith('/api/')) {
      return next();
    }

    const key = keyGenerator(ctx);
    if (!key || whitelist.has(key) || whitelist.has(ctx.ip)) {
      return next();
    }

    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || bucket.expiresAt <= now) {
      bucket = {
        count: 0,
        expiresAt: now + windowMs,
      };
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    const retryAfterSeconds = Math.max(0, Math.ceil((bucket.expiresAt - now) / 1000));

    ctx.set('X-RateLimit-Limit', String(max));
    ctx.set('X-RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
    ctx.set('X-RateLimit-Reset', String(Math.ceil(bucket.expiresAt / 1000)));

    if (bucket.count > max) {
      ctx.set('Retry-After', String(retryAfterSeconds));
      ctx.throw(429, 'Rate limit exceeded. Please try again later.');
    }

    await next();

    if (bucket.expiresAt <= Date.now()) {
      buckets.delete(key);
    }
  };
};
