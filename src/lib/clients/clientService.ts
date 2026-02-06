import type { Client } from '$lib/server/db/schema';

/**
 * Get the client data for the currently authenticated user
 */
export async function getCurrentClient() {
	try {
		const response = await fetch('/api/client', {
			method: 'GET'
		});

		const result = await response.json();

		if (!response.ok) {
			console.error('Error fetching current client:', result.error);
			return null;
		}

		return result.client as Client | null;
	} catch (error) {
		console.error('Error in getCurrentClient:', error);
		return null;
	}
}

/**
 * Create a new client record for the authenticated user
 */
export async function createClient(name: string) {
	// This function is deprecated in favor of ensureClientExists
	return await ensureClientExists(name);
}

/**
 * Create a new client record with specific userId (used during registration)
 * Note: This is now handled by the registration API endpoint
 */
export async function createClientWithUserId(
	userId: string,
	email: string,
	firstName: string,
	lastName: string
) {
	console.log('createClientWithUserId is now handled by registration API');
	return null;
}

/**
 * Check if client exists for the authenticated user, if not create one
 */
export async function ensureClientExists(firstName?: string, lastName?: string) {
	console.log('[CLIENT SERVICE] ensureClientExists called with:', firstName, lastName);
	try {
		console.log('[CLIENT SERVICE] POSTing to /api/client...');
		const response = await fetch('/api/client', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				firstName,
				lastName
			})
		});

		console.log('[CLIENT SERVICE] /api/client response status:', response.status);
		const result = await response.json();

		if (!response.ok) {
			console.error('[CLIENT SERVICE] Error ensuring client exists:', result.error);
			return null;
		}

		console.log('[CLIENT SERVICE] Client ensured:', result.client?.id);
		return result.client as Client;
	} catch (error) {
		console.error('[CLIENT SERVICE] Error in ensureClientExists:', error);
		return null;
	}
}

/**
 * Retry client lookup after a conflict error
 * Note: This is now handled server-side
 */
async function retryClientLookupAfterConflict(
	userId: string,
	userEmail: string,
	firstName?: string,
	lastName?: string
) {
	console.log('retryClientLookupAfterConflict is now handled server-side');
	return null;
}

/**
 * Get client details by auth ID
 */
export async function getClientByAuthId(authId: string) {
	// This is primarily for server-side use
	return await getCurrentClient();
}
