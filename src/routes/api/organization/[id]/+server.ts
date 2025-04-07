import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { organizations, projects } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const orgId = params.id;
    
    if (!orgId) {
      return json({ error: 'Organization ID is required' }, { status: 400 });
    }
    
    // Fetch organization details
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.organisationID, orgId)
    });
    
    if (!org) {
      return json({ error: 'Organization not found' }, { status: 404 });
    }
    
    // Get all projects this organization is involved in
    const projectResults = await db
      .select({
        projectID: organizations.projectID,
        id: projects.id,
        acronym: projects.acronym,
        title: projects.title,
        objective: projects.objective,
        status: projects.status,
        startDate: projects.startDate,
        endDate: projects.endDate,
        totalCost: projects.totalCost,
        ecMaxContribution: projects.ecMaxContribution,
        frameworkProgramme: projects.frameworkProgramme,
        fundingScheme: projects.fundingScheme,
        ecContribution: organizations.ecContribution,
        netEcContribution: organizations.netEcContribution
      })
      .from(organizations)
      .innerJoin(projects, eq(organizations.projectID, projects.id))
      .where(eq(organizations.organisationID, orgId));
    
    // Transform project results - calculate this organization's contribution to each project
    const projectsWithContribution = projectResults.map(result => ({
      id: result.id,
      projectID: result.projectID,
      acronym: result.acronym,
      title: result.title,
      objective: result.objective,
      status: result.status,
      startDate: result.startDate ? new Date(result.startDate).toLocaleDateString() : null,
      endDate: result.endDate ? new Date(result.endDate).toLocaleDateString() : null,
      totalCost: result.totalCost,
      ecMaxContribution: result.ecMaxContribution,
      frameworkProgramme: result.frameworkProgramme,
      fundingScheme: result.fundingScheme,
      // Organization's contribution for this specific project
      contribution: result.ecContribution
    }));
    
    return json({
      organization: org,
      projects: projectsWithContribution
    });
    
  } catch (error) {
    console.error('Error fetching organization details:', error);
    return json(
      { error: 'Failed to fetch organization details' }, 
      { status: 500 }
    );
  }
};
