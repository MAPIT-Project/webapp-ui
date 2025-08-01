/**
 * Simple cache utility for API responses
 */

interface CacheOptions {
	ttl: number; // Time to live in milliseconds
}

interface CacheEntry<T> {
	value: T;
	expiresAt: number;
}

class Cache {
	private cache: Map<string, CacheEntry<any>> = new Map();
	private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default

	/**
	 * Set a value in the cache
	 */
	set<T>(key: string, value: T, options?: Partial<CacheOptions>): void {
		const ttl = options?.ttl || this.defaultTTL;
		const expiresAt = Date.now() + ttl;

		this.cache.set(key, { value, expiresAt });
	}

	/**
	 * Get a value from the cache
	 * @returns The cached value or undefined if not found or expired
	 */
	get<T>(key: string): T | undefined {
		const entry = this.cache.get(key);

		// If entry doesn't exist or is expired
		if (!entry || entry.expiresAt < Date.now()) {
			if (entry) this.delete(key); // Clean up expired entry
			return undefined;
		}

		return entry.value as T;
	}

	/**
	 * Check if a key exists in the cache and is not expired
	 */
	has(key: string): boolean {
		const entry = this.cache.get(key);
		const isValid = entry && entry.expiresAt >= Date.now();

		if (entry && !isValid) {
			this.delete(key); // Clean up expired entry
		}

		return !!isValid;
	}

	/**
	 * Delete a value from the cache
	 */
	delete(key: string): boolean {
		return this.cache.delete(key);
	}

	/**
	 * Clear all values from the cache
	 */
	clear(): void {
		this.cache.clear();
	}

	/**
	 * Get or set a value with a callback if it doesn't exist
	 * Useful for avoiding race conditions when multiple parts of the code
	 * might request the same data simultaneously
	 */
	async getOrSet<T>(
		key: string,
		callback: () => Promise<T>,
		options?: Partial<CacheOptions>
	): Promise<T> {
		// Check if value exists in cache
		const cached = this.get<T>(key);
		if (cached !== undefined) {
			return cached;
		}

		// If not in cache, call the callback to get the value
		const value = await callback();

		// Store in cache
		this.set(key, value, options);

		return value;
	}

	/**
	 * Remove all expired entries from the cache
	 */
	cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache.entries()) {
			if (entry.expiresAt < now) {
				this.cache.delete(key);
			}
		}
	}
}

// Create and export a singleton instance
export const apiCache = new Cache();
