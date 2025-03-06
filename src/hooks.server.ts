import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { createRateLimiter } from '$lib/server/rateLimit';

// Create rate limiter instance
const limiter = createRateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 300 // 300 requests per 10 minutes
});

// Valid route prefixes
const VALID_ROUTES = [
    '/api',
    '/login',
    '/dashboard',
    '/maskd',
    '/static',
    '/favicon.png'
];

// Add a set to store banned IPs
const bannedIPs = new Set<string>();

// Helper function to get client IP
const getClientIP = (event: any): string => {
    const forwarded = event.request.headers.get('x-forwarded-for');
    if (forwarded) {
        const ip = forwarded.split(/, /)[0];
        return ip;
    }
    return event.request.headers.get('host') || 'unknown';
};

// Rate limiting middleware
const handleRateLimit: Handle = async ({ event, resolve }) => {
    const path = event.url.pathname;

    const ip = getClientIP(event);

    try {
        await limiter.check(ip);
    } catch {
        return new Response('Too Many Requests', { status: 429 });
    }

    return await resolve(event);
};

// Route filtering middleware
const handleRouteFilter: Handle = async ({ event, resolve }) => {
    const path = event.url.pathname;
    const ip = event.getClientAddress();
    event.locals.ip = ip;
    // if (bannedIPs.has(ip)) {
    //     console.log('already banned');
    //     return new Response('Forbidden', { status: 403 });
    // }
    // // If IP is already banned, return forbidden response immediately
    // if (bannedIPs.has(ip)) {
    //     return new Response('Forbidden', { status: 403 });
    // }

    // Check if path starts with any valid route
    // const isValidRoute = VALID_ROUTES.some(route => path.startsWith(route));

    // if (!isValidRoute && path !== '/') {
    //     console.log(`Blocked request to ${path} from ${ip}`);
        
    //     // Ban the IP
    //     bannedIPs.add(ip);

    //     // Send Discord webhook notification
    //     const webhookUrl = 'https://discord.com/api/webhooks/1306676145856446547/TygPyzh6t5rdhBxAJxLqBhltDG3Hez-1T2EzoAWHeeNTF3KR7eiS0LKcpcxHwYMYwfiR';
    //     const headers = Object.fromEntries(event.request.headers);
    //     await fetch(webhookUrl, {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({
    //             content: `🚫 IP Address Banned: ${ip}\nPath: ${path}\nHeaders: ${JSON.stringify(headers, null, 2)}`
    //         })
    //     });

    //     return new Response('Forbidden', { status: 403 });
    // }

    return await resolve(event);
};

// Export combined middleware
export const handle = sequence(handleRateLimit, handleRouteFilter);