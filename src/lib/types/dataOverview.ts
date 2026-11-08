export type InventoryDocument = {
	id: string;
	title: string;
	programme: string;
	type: string;
	year: string | null;
	version: string | null;
	status: string;
	chunks: number;
	source_url: string | null;
	source_status: string;
	source_warning: string | null;
	updated_at: string | null;
	stores: string[];
};

export type DataOverview = {
	checked_at: string;
	status: 'available' | 'partial' | 'unavailable';
	database: {
		status: string;
		message?: string;
		projects?: {
			count: number;
			organisations: number;
			participations: number;
			embedded: number;
			coverage: {
				import_date: string | null;
				latest_record_source_update: string | null;
				snapshot_verified_at?: string;
				warning: string;
				retained_projects_outside_export?: number;
			};
		};
		documents?: {
			records: number;
			searchable: number;
			pending: number;
			archived: number;
			chunks: number;
			embedded_chunks: number;
			note: string;
			programmes: {
				id: string;
				name: string;
				records: number;
				searchable: number;
				pending: number;
				archived: number;
			}[];
			documents: InventoryDocument[];
		};
		calls?: {
			count: number;
			programmes: { programme: string; records: number }[];
			health: { stale?: boolean; status?: string; last_successful_sync?: string };
		};
	};
	graph: {
		status: string;
		message?: string;
		nodes?: number;
		connections?: number;
		relationships?: { type: string; count: number }[];
		labels?: { label: string; count: number }[];
		note?: string;
	};
};
