import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';

export const GET: RequestHandler = async ({ params, cookies }) => {
	try {
		const orgId = params.id;

		if (!orgId) {
			return json({ error: 'Organization ID is required' }, { status: 400 });
		}

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

		// Verify authentication
		const { data: authData } = await supabase.auth.getSession();
		if (!authData.session?.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Fetch organization details
		const { data: org, error: orgError } = await supabase
			.from('organizations')
			.select('*')
			.eq('organisationID', orgId)
			.single();

		if (orgError || !org) {
			return json({ error: 'Organization not found' }, { status: 404 });
		}

		// Get all projects this organization is involved in
		const { data: projectResults, error: projectError } = await supabase
			.from('organizations')
			.select(
				`
        projectID,
        ecContribution,
        netEcContribution,
        projects!inner (
          id,
          acronym,
          title,
          objective,
          status,
          startDate,
          endDate,
          totalCost,
          ecMaxContribution,
          frameworkProgramme,
          fundingScheme
        )
      `
			)
			.eq('organisationID', orgId);

		if (projectError) {
			console.error('Error fetching projects:', projectError);
			return json({ error: 'Failed to fetch organization projects' }, { status: 500 });
		}

		// Transform project results
		const projectsWithContribution = (projectResults || []).map((result) => ({
			id: result.projects.id,
			projectID: result.projectID,
			acronym: result.projects.acronym,
			title: result.projects.title,
			objective: result.projects.objective,
			status: result.projects.status,
			startDate: result.projects.startDate
				? new Date(result.projects.startDate).toLocaleDateString()
				: null,
			endDate: result.projects.endDate
				? new Date(result.projects.endDate).toLocaleDateString()
				: null,
			totalCost: result.projects.totalCost,
			ecMaxContribution: result.projects.ecMaxContribution,
			frameworkProgramme: result.projects.frameworkProgramme,
			fundingScheme: result.projects.fundingScheme,
			contribution: result.ecContribution
		}));

		return json({
			organization: org,
			projects: projectsWithContribution
		});
	} catch (error) {
		console.error('Error fetching organization details:', error);
		return json({ error: 'Failed to fetch organization details' }, { status: 500 });
	}
};
