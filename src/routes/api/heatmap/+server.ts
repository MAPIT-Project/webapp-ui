import { db } from '$lib/server/db';
import { organizations, projects } from '$lib/server/db/schema';
import { json } from '@sveltejs/kit';
import { eq, and, ilike, or, inArray, count } from 'drizzle-orm';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request, url }) => {
	try {
		// Extract viewport parameters
		const north = parseFloat(url.searchParams.get('north') || '90');
		const south = parseFloat(url.searchParams.get('south') || '-90');
		const east = parseFloat(url.searchParams.get('east') || '180');
		const west = parseFloat(url.searchParams.get('west') || '-180');
		const zoom = parseFloat(url.searchParams.get('zoom') || '0');

		// Extract search keyword if present
		const searchKeyword = url.searchParams.get('search')?.trim();

		// Extract heatmap specific flag
		const heatmapOnly = url.searchParams.get('heatmapOnly') === 'true';

		// Set point limit based on zoom level and request type
		let pointLimit = 100; // Default for low zoom levels

		if (heatmapOnly) {
			// Use a much higher limit for heatmap-only requests
			pointLimit = 10000; // Allow up to 10,000 points for accurate heatmaps
		} else {
			// Regular limits for requests that include marker data
			if (zoom >= 10) {
				pointLimit = 1000;
			} else if (zoom >= 6) {
				pointLimit = 500;
			} else if (zoom >= 4) {
				pointLimit = 250;
			}

			// If we have a search keyword, increase the limit to ensure results are visible
			if (searchKeyword) {
				pointLimit = Math.max(pointLimit, 1000);
			}
		}

		// If search keyword is provided, first find matching projects
		let matchingProjectIds: number[] = [];
		let totalMatchCount = 0;

		if (searchKeyword) {
			const searchPattern = `%${searchKeyword}%`;

			// Find all projects that match the search keyword in title or objective
			const matchingProjects = await db
				.select({ id: projects.id })
				.from(projects)
				.where(or(ilike(projects.title, searchPattern), ilike(projects.objective, searchPattern)));

			matchingProjectIds = matchingProjects.map((p) => p.id);

			// If no projects match, return empty result early
			if (matchingProjectIds.length === 0) {
				return json({ results: [], totalCount: 0 });
			}

			// Get the total count of matching organizations for accurate reporting
			const countResult = await db
				.select({ value: count() })
				.from(organizations)
				.where(inArray(organizations.projectID, matchingProjectIds));

			totalMatchCount = countResult[0]?.value || 0;
		}

		// Prepare the query to fetch organizations
		let query = db
			.select({
				organisationID: organizations.organisationID,
				name: organizations.name,
				geolocation: organizations.geolocation,
				projectID: organizations.projectID,
				ecMaxContribution: projects.ecMaxContribution,
				projectTitle: projects.title,
				projectObjective: projects.objective
			})
			.from(organizations)
			.leftJoin(projects, eq(organizations.projectID, projects.id));

		// Apply project ID filter if we're searching
		if (searchKeyword && matchingProjectIds.length > 0) {
			query = query.where(inArray(organizations.projectID, matchingProjectIds));
		}

		const data = await query;

		// Group by organisationID and filter by viewport bounds
		const grouped: Record<
			string,
			{
				organisationID: string;
				name: string;
				lat: number;
				lng: number;
				total: number;
				isSearchMatch: boolean;
				matchingProjects: Array<{
					projectID: number;
					title: string;
					contribution: number;
					objective: string;
				}>;
			}
		> = {};

		for (const row of data) {
			if (!row.geolocation || !row.ecMaxContribution) continue;

			const [lat, lng] = row.geolocation.split(',').map(Number);

			// Skip if out of viewport bounds (unless it's a search match)
			if (!searchKeyword && (lat > north || lat < south || lng > east || lng < west)) continue;

			const id = row.organisationID;
			const contribution = Number(row.ecMaxContribution);
			const isSearchMatch = searchKeyword ? true : false; // All results are matches if searching

			if (!grouped[id]) {
				grouped[id] = {
					organisationID: id,
					name: row.name ?? 'Unknown',
					lat,
					lng,
					total: 0,
					isSearchMatch,
					matchingProjects: []
				};
			}

			// Add contribution to the organization's total
			grouped[id].total += contribution;

			// Add project info to the list of matching projects
			// (we only add this for search results to save memory)
			if (isSearchMatch && row.projectID && row.projectTitle) {
				grouped[id].matchingProjects.push({
					projectID: row.projectID,
					title: row.projectTitle,
					contribution: contribution,
					objective: row.projectObjective || 'No objective provided'
				});
			}
		}

		// Convert to array and sort, prioritizing search matches and then by contribution
		const weightedPoints = Object.values(grouped)
			.map((entry) => ({
				organisationID: entry.organisationID,
				name: entry.name,
				location: { lat: entry.lat, lng: entry.lng },
				weight: entry.total,
				isSearchMatch: entry.isSearchMatch,
				matchingProjects: entry.matchingProjects
			}))
			.sort((a, b) => {
				// First sort by search matches
				if (a.isSearchMatch && !b.isSearchMatch) return -1;
				if (!a.isSearchMatch && b.isSearchMatch) return 1;
				// Then sort by weight
				return b.weight - a.weight;
			});

		// Return both the limited results and total count
		const finalResults = weightedPoints.slice(0, pointLimit);

		return json({
			results: finalResults,
			totalCount: searchKeyword ? totalMatchCount : finalResults.length
		});
	} catch (error) {
		console.error('Error in heatmap endpoint:', error);
		return json(
			{
				error: 'An error occurred while generating heatmap data',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
