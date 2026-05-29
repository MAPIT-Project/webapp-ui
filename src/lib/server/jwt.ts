/**
 * JWT generation for backend authentication.
 *
 * This module creates JWT tokens compatible with the MAP-IT backend auth system.
 */

import { env } from '$env/dynamic/private';
import { SignJWT } from 'jose';

// Get JWT secret from environment
const JWT_SECRET = new TextEncoder().encode(
  env.JWT_SECRET_KEY || 'fallback-secret-change-in-production'
);

/**
 * Create a JWT access token for backend authentication.
 *
 * Compatible with the MAP-IT backend's AuthService.create_access_token()
 *
 * @param userId - User ID (default: "proxy")
 * @param email - User email (optional)
 * @param roles - User roles (default: ["researcher"])
 * @param organizationId - Organization ID (optional)
 * @param tier - Subscription tier (default: "free")
 * @returns JWT access token
 */
export async function createBackendAccessToken(options: {
  userId?: string;
  email?: string;
  roles?: string[];
  organizationId?: string | null;
  tier?: string;
}): Promise<string> {
  const {
    userId = 'proxy',
    email = null,
    roles = ['researcher'],
    organizationId = null,
    tier = 'free'
  } = options;

  // Create JWT with required payload structure
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (24 * 60 * 60); // 24 hours

  const token = await new SignJWT({
    sub: userId,
    email: email,
    roles: roles,
    org_id: organizationId,
    tier: tier,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Create a simple access token for the proxy user.
 * This is used when calling the backend API.
 */
export async function createProxyToken(): Promise<string> {
  return createBackendAccessToken({
    userId: 'webapp-proxy',
    email: 'proxy@mapit.work',
    roles: ['api_user'],
    tier: 'basic',
  });
}
