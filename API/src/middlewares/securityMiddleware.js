/**
 * Small hardening helpers without extra dependencies.
 */

/** Adds the most useful security headers to every response. */
function securityHeaders(req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
}

/**
 * In-memory limiter: at most `max` requests per `windowMs` from one IP.
 * Good enough against password guessing on a single server.
 * @param {{windowMs: number, max: number}} options
 */
function rateLimit({ windowMs, max }) {
    const hits = new Map();

    setInterval(() => {
        const now = Date.now();
        hits.forEach((entry, key) => { if (entry.resetAt <= now) hits.delete(key); });
    }, windowMs).unref();

    return (req, res, next) => {
        const now = Date.now();
        const entry = hits.get(req.ip);

        if (!entry || entry.resetAt <= now) {
            hits.set(req.ip, { count: 1, resetAt: now + windowMs });
            return next();
        }

        entry.count += 1;
        if (entry.count > max) {
            res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
            return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
        }
        return next();
    };
}

module.exports = { securityHeaders, rateLimit };
