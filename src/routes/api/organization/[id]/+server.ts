import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';

export const GET: RequestHandler = async ({ params, cookies }) => {
	try {
		const orgId = params.id;

		// Set up Supabase client
		const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
			cookies: {
				get: (key: string) => cookies.get(key),
				set: (key: string, value: string, options: any) => {
					cookies.set(key, value, { ...options, path: '/' });
				},
				remove: (key: string, options: any) => {
					cookies.delete(key, { ...options, path: '/' });
				}
			}
		});

		// Note: Foreign key constraint addition skipped for now

		if (!orgId) {
			return json({ error: 'Organization ID is required' }, { status: 400 });
		}


		// Fetch organization details - get the first record as base info
		const { data: orgRecords, error: orgError } = await supabase
			.from('organizations')
			.select('*')
			.eq('organisationID', orgId)
			.limit(1);

		if (orgError || !orgRecords || orgRecords.length === 0) {
			console.error('Organization query error:', orgError);
			return json({ error: 'Organization not found', details: orgError?.message }, { status: 404 });
		}

		const org = orgRecords[0];

		// Get project IDs for this organization
		const { data: projectIds, error: idsError } = await supabase
			.from('organizations')
			.select('projectID, ecContribution, netEcContribution')
			.eq('organisationID', orgId);

		if (idsError) {
			console.error('Error fetching project IDs:', idsError);
			// Return organization without projects if project query fails
			return json({
				organization: org,
				projects: []
			});
		}

		const uniqueProjectIds = [...new Set(projectIds.map(record => record.projectID))];

		// Fetch project details
		const { data: projectDetails, error: detailsError } = await supabase
			.from('projects')
			.select('id, acronym, title, objective, status, startDate, endDate, totalCost, ecMaxContribution, frameworkProgramme, fundingScheme')
			.in('id', uniqueProjectIds);

		if (detailsError) {
			console.error('Error fetching project details:', detailsError);
			// Return organization without projects if project query fails
			return json({
				organization: org,
				projects: []
			});
		}

		// Transform project results
		const projects = (projectDetails || []).map((project) => {
			const orgRecord = projectIds.find(record => record.projectID === project.id);
			return {
				id: project.id,
				projectID: project.id,
				acronym: project.acronym,
				title: project.title,
				objective: project.objective,
				status: project.status,
				startDate: project.startDate || null,
				endDate: project.endDate || null,
				totalCost: project.totalCost,
				ecMaxContribution: project.ecMaxContribution,
				frameworkProgramme: project.frameworkProgramme,
				fundingScheme: project.fundingScheme,
				contribution: orgRecord ? orgRecord.ecContribution : 0
			};
		});

		return json({
			organization: org,
			projects: projects
		});
	} catch (error) {
		console.error('Error fetching organization details:', error);
		return json({ error: 'Failed to fetch organization details' }, { status: 500 });
	}
};
