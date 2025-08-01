// Environment configuration management
// For accessing environment variables in a type-safe way

interface EnvConfig {
	// App settings
	PUBLIC_APP_NAME: string;
	PUBLIC_APP_URL: string;

	// Environment indicator
	PUBLIC_APP_ENV: 'development' | 'testing' | 'production';

	// API URLs and keys
	PUBLIC_SUPABASE_URL: string;
	PUBLIC_SUPABASE_ANON_KEY: string;

	// Feature flags
	PUBLIC_ENABLE_DEBUG_TOOLS: boolean;
	PUBLIC_ENABLE_ANALYTICS: boolean;

	// Optional settings with defaults
	PUBLIC_API_TIMEOUT_MS: number;
	PUBLIC_MAX_UPLOAD_SIZE_MB: number;
}

// Get environment variables with type safety and fallbacks
function getEnv<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
	const value = import.meta.env[key];

	// Handle boolean values
	if (
		typeof value === 'string' &&
		(value.toLowerCase() === 'true' || value.toLowerCase() === 'false')
	) {
		return (value.toLowerCase() === 'true') as any;
	}

	// Handle numeric values
	if (
		(typeof value === 'string' && !isNaN(Number(value)) && key.toString().includes('_MS')) ||
		key.toString().includes('_SIZE_')
	) {
		return Number(value) as any;
	}

	return value as EnvConfig[K];
}

// Environment configuration with fallbacks
export const env: EnvConfig = {
	// App settings
	PUBLIC_APP_NAME: getEnv('PUBLIC_APP_NAME') || 'Mapit AI Expert',
	PUBLIC_APP_URL: getEnv('PUBLIC_APP_URL') || 'http://localhost:5173',

	// Environment indicator
	PUBLIC_APP_ENV: (getEnv('PUBLIC_APP_ENV') as EnvConfig['PUBLIC_APP_ENV']) || 'development',

	// API URLs and keys
	PUBLIC_SUPABASE_URL: getEnv('PUBLIC_SUPABASE_URL') || '',
	PUBLIC_SUPABASE_ANON_KEY: getEnv('PUBLIC_SUPABASE_ANON_KEY') || '',

	// Feature flags
	PUBLIC_ENABLE_DEBUG_TOOLS:
		getEnv('PUBLIC_ENABLE_DEBUG_TOOLS') ?? getEnv('PUBLIC_APP_ENV') !== 'production',
	PUBLIC_ENABLE_ANALYTICS:
		getEnv('PUBLIC_ENABLE_ANALYTICS') ?? getEnv('PUBLIC_APP_ENV') === 'production',

	// Optional settings with defaults
	PUBLIC_API_TIMEOUT_MS: getEnv('PUBLIC_API_TIMEOUT_MS') || 30000,
	PUBLIC_MAX_UPLOAD_SIZE_MB: getEnv('PUBLIC_MAX_UPLOAD_SIZE_MB') || 10
};

// Helper function to check if we're in development mode
export function isDevelopment(): boolean {
	return env.PUBLIC_APP_ENV === 'development';
}

// Helper function to check if we're in production mode
export function isProduction(): boolean {
	return env.PUBLIC_APP_ENV === 'production';
}

// Helper function to check if we're in testing mode
export function isTesting(): boolean {
	return env.PUBLIC_APP_ENV === 'testing';
}

// Helper function to check if debug tools are enabled
export function isDebugEnabled(): boolean {
	return env.PUBLIC_ENABLE_DEBUG_TOOLS;
}
