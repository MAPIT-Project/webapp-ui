import type { PageServerLoad } from './$types';
import type { DataOverview } from '$lib/types/dataOverview';

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });
	try {
		const response = await fetch('/api/data-overview');
		if (!response.ok) throw new Error('Unavailable');
		return { overview: (await response.json()) as DataOverview, error: null };
	} catch {
		return {
			overview: null,
			error: 'The data overview could not be loaded. Try refreshing in a moment.'
		};
	}
};
