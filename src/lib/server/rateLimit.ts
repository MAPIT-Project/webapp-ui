import { dev } from '$app/environment';

type RateLimitOptions = {
    windowMs: number;
    max: number;
};

type RateLimitStore = {
    [key: string]: {
        count: number;
        resetTime: number;
    };
};

export function createRateLimiter(options: RateLimitOptions) {
    const store: RateLimitStore = {};

    return {
        async check(ip: string) {
            const now = Date.now();
            const windowStart = now - options.windowMs;

            // Clean old entries
            if (!dev) {
                Object.keys(store).forEach(key => {
                    if (store[key].resetTime < windowStart) {
                        delete store[key];
                    }
                });
            }

            // Check/Create rate limit entry
            if (!store[ip]) {
                store[ip] = {
                    count: 1,
                    resetTime: now + options.windowMs
                };
                return true;
            }

            // Reset if window expired
            if (store[ip].resetTime < now) {
                store[ip] = {
                    count: 1,
                    resetTime: now + options.windowMs
                };
                return true;
            }

            // Increment and check
            store[ip].count++;
            if (store[ip].count > options.max) {
                throw new Error('Rate limit exceeded');
            }

            return true;
        }
    };
}