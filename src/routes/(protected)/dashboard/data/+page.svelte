<script lang="ts">
	import Icon from '$lib/components/generic/icon.svelte';
	import type { DataOverview } from '$lib/types/dataOverview';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let overview = $state<DataOverview | null>(data.overview);
	let error = $state<string | null>(data.error);
	let refreshing = $state(false);
	let query = $state('');
	let programme = $state('all');
	let documentState = $state('current');
	let pageNumber = $state(1);
	const pageSize = 15;
	$effect(() => {
		overview = data.overview;
		error = data.error;
	});

	const number = (value: number | undefined) =>
		value == null ? '—' : new Intl.NumberFormat('en-GB').format(value);
	const date = (value: string | null | undefined) =>
		value
			? new Intl.DateTimeFormat('en-GB', {
					day: 'numeric',
					month: 'short',
					year: 'numeric',
					timeZone: 'UTC'
				}).format(new Date(value))
			: 'Not recorded';
	const time = (value: string | undefined) =>
		value
			? new Intl.DateTimeFormat('en-GB', {
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
					timeZone: 'UTC'
				}).format(new Date(value)) + ' UTC'
			: 'Not checked';
	const graphNames: Record<string, string> = {
		PARTICIPATES_IN: 'Project participation',
		PARTNERS_WITH: 'Shared-project collaborations',
		LOCATED_IN: 'Country links',
		IS_TYPE: 'Organisation types',
		FUNDED_UNDER: 'Funding topics',
		TARGETS: 'Clusters & programmes'
	};
	const graphColours = ['#60a5fa', '#2dd4bf', '#a78bfa', '#fbbf24', '#fb923c', '#f472b6'];
	let projects = $derived(overview?.database.projects);
	let library = $derived(overview?.database.documents);
	let graph = $derived(overview?.graph);
	let calls = $derived(overview?.database.calls);
	let programmes = $derived(library?.programmes ?? []);
	let filtered = $derived(
		(library?.documents ?? []).filter((doc) => {
			const text = `${doc.title} ${doc.type} ${doc.year ?? ''} ${doc.version ?? ''}`.toLowerCase();
			const stateMatches =
				documentState === 'all' ||
				(documentState === 'current' ? doc.status !== 'archived' : doc.status === documentState);
			return (
				(programme === 'all' || doc.programme === programme) &&
				stateMatches &&
				text.includes(query.toLowerCase().trim())
			);
		})
	);
	let pages = $derived(Math.max(1, Math.ceil(filtered.length / pageSize)));
	let visible = $derived(filtered.slice((pageNumber - 1) * pageSize, pageNumber * pageSize));
	$effect(() => {
		query;
		programme;
		documentState;
		pageNumber = 1;
	});
	const programmeName = (id: string) => programmes.find((p) => p.id === id)?.name ?? id;

	async function refresh() {
		if (refreshing) return;
		refreshing = true;
		error = null;
		try {
			const response = await fetch('/api/data-overview?refresh=1');
			if (!response.ok) throw new Error('Unavailable');
			overview = await response.json();
		} catch {
			error = overview
				? 'Refresh failed. The last checked figures are still shown below.'
				: 'The data overview could not be loaded. Please try again.';
		} finally {
			refreshing = false;
		}
	}
</script>

<svelte:head
	><title>Data & sources · MAPIT</title><meta
		name="description"
		content="Explore MAPIT’s indexed projects, graph connections, funding calls and source documents."
	/></svelte:head
>

<div class="data-page min-h-screen text-slate-200">
	<div class="mx-auto max-w-[1500px] px-5 py-8 sm:px-9 lg:py-11">
		<header class="mb-8 flex flex-wrap items-start justify-between gap-5">
			<div>
				<div
					class="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300"
				>
					<Icon name="storage" iconClass="h-4 w-4" /> KNOWLEDGE EXPLORER
				</div>
				<h1 class="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Data & sources</h1>
				<p class="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
					Explore the projects, connections and documents behind MAPIT. Figures are read directly
					from our local data sources.
				</p>
			</div>
			<div class="flex items-center gap-4 pt-2">
				<div class="text-right">
					<div class="flex items-center justify-end gap-2 text-xs text-slate-300">
						<span
							class="h-1.5 w-1.5 rounded-full {overview?.status === 'available'
								? 'bg-emerald-400'
								: 'bg-amber-400'}"
						></span>{overview?.status === 'available' ? 'Sources connected' : 'Source status'}
					</div>
					<p class="mt-1 text-xs text-slate-500">Checked {time(overview?.checked_at)}</p>
				</div>
				<button
					type="button"
					onclick={refresh}
					disabled={refreshing}
					class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
					><span class:spin={refreshing}><Icon name="refresh" iconClass="h-4 w-4" /></span
					>{refreshing ? 'Refreshing…' : 'Refresh'}</button
				>
			</div>
		</header>

		{#if error}<div
				role="alert"
				class="mb-5 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200"
			>
				{error}
			</div>{/if}
		{#if overview && overview.status !== 'available'}<div
				role="status"
				class="mb-5 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200"
			>
				Some sources could not be checked. Unavailable figures are shown as a dash, not zero.
				Refresh to try again.
			</div>{/if}

		<section
			aria-label="Data totals"
			class="mb-7 grid grid-cols-1 gap-3 min-[500px]:grid-cols-2 xl:grid-cols-5"
		>
			{#each [{ label: 'CORDIS projects', value: projects?.count, icon: 'science', detail: 'Horizon Europe snapshot' }, { label: 'Organisations', value: projects?.organisations, icon: 'domain', detail: 'Distinct organisations in project data' }, { label: 'Graph connections', value: graph?.connections, icon: 'hub', detail: `${number(graph?.nodes)} nodes in the graph` }, { label: 'Searchable documents', value: library?.searchable, icon: 'library_books', detail: 'Active records with indexed text' }, { label: 'Funding calls', value: calls?.count, icon: 'flag', detail: 'All indexed call statuses' }] as stat}
				<div class="stat-card rounded-2xl border border-white/[0.08] p-5">
					<div class="mb-5 flex items-center justify-between gap-2">
						<span class="text-xs font-medium text-slate-400">{stat.label}</span><Icon
							name={stat.icon}
							iconClass="h-4 w-4 text-blue-300/80"
						/>
					</div>
					<div class="text-3xl font-semibold tabular-nums tracking-tight text-white">
						{number(stat.value)}
					</div>
					<p class="mt-2 text-[11px] leading-5 text-slate-500">{stat.detail}</p>
				</div>
			{/each}
		</section>

		<div class="mb-7 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
			<section
				class="panel rounded-2xl border border-white/[0.08] p-6"
				aria-labelledby="graph-heading"
			>
				<div class="mb-5 flex items-start justify-between gap-4">
					<div>
						<h2 id="graph-heading" class="font-semibold text-white">Inside the knowledge graph</h2>
						<p class="mt-1 text-xs text-slate-500">
							How projects, organisations and research topics connect.
						</p>
					</div>
					<span class="rounded-lg bg-blue-400/10 px-2.5 py-1 text-xs text-blue-300"
						>{number(graph?.connections)} links</span
					>
				</div>
				{#if graph?.status === 'available'}
					<div
						class="mb-6 flex h-3 overflow-hidden rounded-full bg-white/5"
						aria-label="Relationship composition"
					>
						{#each graph.relationships ?? [] as relationship, i}<div
								style:width={`${graph.connections ? (relationship.count / graph.connections) * 100 : 0}%`}
								style:background={graphColours[i % graphColours.length]}
								title={`${graphNames[relationship.type] ?? relationship.type}: ${number(relationship.count)}`}
							></div>{/each}
					</div>
					<div class="grid gap-x-6 gap-y-3 sm:grid-cols-2">
						{#each graph.relationships ?? [] as relationship, i}<div
								class="flex items-center justify-between gap-3 text-xs"
							>
								<span class="flex items-center gap-2 text-slate-400"
									><span
										class="h-2 w-2 shrink-0 rounded-full"
										style:background={graphColours[i % graphColours.length]}
									></span>{graphNames[relationship.type] ?? relationship.type}</span
								><span class="font-medium tabular-nums text-slate-200"
									>{number(relationship.count)}</span
								>
							</div>{/each}
					</div>
					<p class="mt-5 border-t border-white/5 pt-4 text-[11px] leading-5 text-slate-500">
						Connections are stored graph relationships, including derived collaboration links and
						retained reference entities. Multiple participation roles can share one
						organisation–project link.
					</p>
				{:else}<p class="py-8 text-sm text-slate-400">
						The graph is currently unavailable. Database figures and documents remain available when
						connected.
					</p>{/if}
			</section>

			<section
				class="panel rounded-2xl border border-white/[0.08] p-6"
				aria-labelledby="freshness-heading"
			>
				<h2 id="freshness-heading" class="mb-5 font-semibold text-white">
					Where the data comes from
				</h2>
				<div class="space-y-4">
					<div class="flex items-start gap-3">
						<div class="rounded-lg bg-teal-400/10 p-2 text-teal-300">
							<Icon name="dataset" iconClass="h-4 w-4" />
						</div>
						<div class="flex-1">
							<div class="flex flex-wrap justify-between gap-2 text-xs">
								<span class="font-medium text-slate-200">CORDIS · project & partner data</span><span
									class="text-teal-300">{projects ? 'Local snapshot' : 'Unavailable'}</span
								>
							</div>
							<p class="mt-1.5 text-xs leading-5 text-slate-500">
								Imported {date(projects?.coverage.import_date)} · latest source update {date(
									projects?.coverage.latest_record_source_update
								)}
							</p>
							<p class="text-[11px] text-slate-500">
								{number(projects?.participations)} organisation participation records
							</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<div class="rounded-lg bg-blue-400/10 p-2 text-blue-300">
							<Icon name="travel_explore" iconClass="h-4 w-4" />
						</div>
						<div class="flex-1">
							<div class="flex flex-wrap justify-between gap-2 text-xs">
								<span class="font-medium text-slate-200">EU Funding & Tenders Portal</span><span
									class={calls?.health.status === 'healthy' ? 'text-teal-300' : 'text-amber-300'}
									>{calls?.health.status === 'healthy'
										? 'Catalogue current'
										: 'Freshness not confirmed'}</span
								>
							</div>
							<p class="mt-1.5 text-xs leading-5 text-slate-500">
								Last successful sync {date(calls?.health.last_successful_sync)} · calls refresh separately
								from projects
							</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<div class="rounded-lg bg-violet-400/10 p-2 text-violet-300">
							<Icon name="verified" iconClass="h-4 w-4" />
						</div>
						<div class="flex-1">
							<div class="flex flex-wrap justify-between gap-2 text-xs">
								<span class="font-medium text-slate-200">Official documents & guidance</span><span
									class="text-amber-300">{number(library?.pending)} pending reviews</span
								>
							</div>
							<p class="mt-1.5 text-xs leading-5 text-slate-500">
								{number(library?.chunks)} general-library text fragments · editions and source status
								shown below
							</p>
						</div>
					</div>
				</div>
				<p class="mt-5 border-t border-white/5 pt-4 text-[11px] leading-5 text-slate-500">
					These figures describe MAPIT’s local index. They do not establish exhaustive EU coverage
					or guarantee that every source is the latest applicable edition.
				</p>
			</section>
		</div>

		<section
			class="panel overflow-hidden rounded-2xl border border-white/[0.08]"
			aria-labelledby="documents-heading"
		>
			<div class="border-b border-white/[0.06] p-6">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h2 id="documents-heading" class="text-lg font-semibold text-white">
							Document library
						</h2>
						<p class="mt-1 text-xs text-slate-500">
							Reference searches use publications with verified origins. Archived and pending records remain visible for review.
						</p>
					</div>
					<div class="flex gap-3 text-xs text-slate-400">
						<span>{number(library?.records)} stored records</span><span class="text-slate-600"
							>/</span
						><span>{number(library?.archived)} archived</span>
					</div>
				</div>
				<div class="mt-5 flex flex-wrap gap-2" aria-label="Filter by programme">
					<button
						type="button"
						aria-pressed={programme === 'all'}
						onclick={() => (programme = 'all')}
						class="filter-chip {programme === 'all' ? 'selected' : ''}"
						>All programmes <span>{number(library?.searchable)}</span></button
					>
					{#each programmes.filter((p) => p.records > 0) as group}<button
							type="button"
							aria-pressed={programme === group.id}
							onclick={() => (programme = group.id)}
							class="filter-chip {programme === group.id ? 'selected' : ''}"
							>{group.name} <span>{number(group.searchable)}</span></button
						>{/each}
				</div>
				<div class="mt-5 flex flex-wrap gap-3">
					<label class="relative min-w-[200px] flex-1"
						><span class="sr-only">Search documents</span><span
							class="pointer-events-none absolute left-3.5 top-3 text-slate-500"
							><Icon name="search" iconClass="h-4 w-4" /></span
						><input
							bind:value={query}
							placeholder="Search by name, year or edition…"
							class="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-400/50 focus:outline-none"
						/></label
					>
					<label
						><span class="sr-only">Document status</span><select
							bind:value={documentState}
							class="rounded-xl border border-white/10 bg-[#1e1e1e] px-4 py-2.5 text-sm text-slate-300 focus:border-blue-400/50 focus:outline-none"
							><option value="current">Current & pending</option><option value="active"
								>Active records</option
							><option value="pending_review">Pending review</option><option value="archived"
								>Archived & quarantined</option
							><option value="all">All records</option></select
						></label
					>
				</div>
			</div>
			{#if library}
				<div class="overflow-x-auto">
					<table class="w-full text-left text-xs">
						<thead class="bg-black/15 text-[10px] uppercase tracking-wider text-slate-500"
							><tr
								><th class="px-6 py-3 font-medium">Document / programme</th><th
									class="px-4 py-3 font-medium">Edition</th
								><th class="px-4 py-3 font-medium">Source & index</th><th
									class="px-6 py-3 text-right font-medium">Source</th
								></tr
							></thead
						><tbody class="divide-y divide-white/5">
							{#each visible as doc, i (`${doc.id}-${i}`)}<tr
									class="transition hover:bg-white/[0.025]"
									><td class="max-w-[500px] px-6 py-4"
										><div class="mb-1.5 font-medium leading-5 text-slate-200">{doc.title}</div>
										<div class="flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-slate-500">
											<span>{programmeName(doc.programme)}</span><span>·</span><span
												class="capitalize">{doc.type.replaceAll('_', ' ')}</span
											>
										</div></td
									><td class="max-w-[230px] px-4 py-4 align-top"
										><div class="leading-5 text-slate-300">
											{doc.version || 'Version not recorded'}
										</div>
										<div class="mt-1 text-[10px] text-slate-500">
											{doc.year || 'Year not recorded'}
										</div></td
									><td class="px-4 py-4 align-top"
										><span
											class="inline-block rounded-md px-2 py-1 text-[10px] {doc.status ===
											'pending_review'
												? 'bg-amber-400/10 text-amber-300'
												: doc.status === 'archived'
													? 'bg-white/5 text-slate-500'
													: doc.source_status.startsWith('verified')
														? 'bg-teal-400/10 text-teal-300'
														: 'bg-white/5 text-slate-400'}"
											>{doc.status === 'pending_review'
												? 'Pending review'
												: doc.status === 'archived'
													? 'Archived'
													: doc.source_status.startsWith('verified')
														? 'Source verified'
														: 'Source unverified'}</span
										>
										<p class="mt-2 text-[10px] text-slate-500">
											{number(doc.chunks)} indexed fragments
										</p>
										{#if doc.source_warning}<details
												class="mt-2 max-w-[260px] text-[10px] text-amber-200/70"
											>
												<summary class="cursor-pointer">Source note</summary>
												<p class="mt-1 leading-5">{doc.source_warning}</p>
											</details>{/if}</td
									><td class="px-6 py-4 text-right align-top"
										>{#if doc.source_url}<a
												href={doc.source_url}
												target="_blank"
												rel="noopener noreferrer"
												aria-label={`Open official source for ${doc.title}`}
												class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/10 px-2.5 py-2 text-[11px] text-blue-300 transition hover:bg-blue-400/10"
												>Official source <Icon name="open_in_new" iconClass="h-3 w-3" /></a
											>{:else}<span class="text-[10px] text-slate-600">No source link</span
											>{/if}</td
									></tr
								>
							{:else}<tr
									><td colspan="4" class="px-6 py-14 text-center text-sm text-slate-500"
										>No document records match these filters.</td
									></tr
								>{/each}
						</tbody>
					</table>
				</div>
				<div
					class="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 px-6 py-4 text-xs text-slate-500"
				>
					<span
						>{number(filtered.length)} matching records · programme badges show searchable records</span
					>
					<div class="flex items-center gap-3">
						<button
							type="button"
							aria-label="Previous document page"
							disabled={pageNumber <= 1}
							onclick={() => pageNumber--}
							class="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/5 disabled:opacity-25"
							><Icon name="chevron_left" iconClass="h-4 w-4" /></button
						><span class="tabular-nums">{pageNumber} / {pages}</span><button
							type="button"
							aria-label="Next document page"
							disabled={pageNumber >= pages}
							onclick={() => pageNumber++}
							class="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/5 disabled:opacity-25"
							><Icon name="chevron_right" iconClass="h-4 w-4" /></button
						>
					</div>
				</div>
			{:else}<p class="p-10 text-center text-sm text-slate-500">
					Document inventory is unavailable. Refresh to check again.
				</p>{/if}
			<p class="border-t border-white/5 px-6 py-4 text-[10px] leading-5 text-slate-500">
				{library?.note ??
					'Document records and source versions will appear when the library is available.'}
			</p>
		</section>
		<footer
			class="mt-5 flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-600"
		>
			<span>MAPIT · source transparency</span><span
				>Checked {date(overview?.checked_at)} at {time(overview?.checked_at)} · figures are not live
				EU-wide totals</span
			>
		</footer>
	</div>
</div>

<style>
	.data-page {
		background: linear-gradient(to bottom, #1a1a1a, #141414);
	}
	.stat-card {
		background: #1e1e1e;
	}
	.panel {
		background: #1e1e1e;
	}
	.filter-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		border: 1px solid #ffffff10;
		border-radius: 0.6rem;
		padding: 0.5rem 0.7rem;
		font-size: 0.65rem;
		color: #94a3b8;
		transition:
			background 0.15s,
			border-color 0.15s;
	}
	.filter-chip:hover {
		background: #ffffff08;
		color: #e2e8f0;
	}
	.filter-chip.selected {
		border-color: #60a5fa55;
		background: #60a5fa14;
		color: #bfdbfe;
	}
	.filter-chip span {
		font-variant-numeric: tabular-nums;
		color: #64748b;
	}
	.filter-chip.selected span {
		color: #93c5fd;
	}
	.spin {
		animation: rotation 1s linear infinite;
	}
	@keyframes rotation {
		to {
			transform: rotate(360deg);
		}
	}
</style>
