import { writable } from 'svelte/store';

export interface BackendStatus {
	status: 'loading' | 'connected' | 'disconnected';
	responseTime?: number;
	error?: string;
	lastChecked?: Date;
}

function createBackendStatusStore() {
	const { subscribe, set, update } = writable<BackendStatus>({
		status: 'loading',
		lastChecked: undefined
	});

	let checkInterval: ReturnType<typeof setInterval> | null = null;

	async function checkStatus() {
		console.log('🔍 [BackendStatus] Checking backend status...');
		try {
			const response = await fetch('/api/backend-status');
			console.log('📡 [BackendStatus] Response status:', response.status);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			const data = await response.json();
			console.log('✅ [BackendStatus] Backend response:', data);

			update(state => ({
				...state,
				status: data.status === 'connected' ? 'connected' : 'disconnected',
				responseTime: data.response_time_ms,
				error: undefined,
				lastChecked: new Date()
			}));
		} catch (error) {
			console.error('❌ [BackendStatus] Status check failed:', error);
			update(state => ({
				...state,
				status: 'disconnected',
				error: error instanceof Error ? error.message : 'Connection failed',
				lastChecked: new Date()
			}));
		}
	}

	function startChecking(intervalMs: number = 30000) {
		// Check immediately
		checkStatus();

		// Then check periodically
		if (checkInterval) clearInterval(checkInterval);
		checkInterval = setInterval(checkStatus, intervalMs);
	}

	function stopChecking() {
		if (checkInterval) {
			clearInterval(checkInterval);
			checkInterval = null;
		}
	}

	return {
		subscribe,
		checkStatus,
		startChecking,
		stopChecking,
		set
	};
}

export const backendStatusStore = createBackendStatusStore();
