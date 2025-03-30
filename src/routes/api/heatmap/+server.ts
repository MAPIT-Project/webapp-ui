import { db } from '$lib/server/db';
import { organizations, projects } from '$lib/server/db/schema';
import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request }) => {
  try {
    // Step 1: Fetch all organizations and their related project ecMaxContribution
    const data = await db
    .select({
      organisationID: organizations.organisationID,
      name: organizations.name,
      geolocation: organizations.geolocation,
      projectID: organizations.projectID,
      ecMaxContribution: projects.ecMaxContribution,
    })
    .from(organizations)
    .leftJoin(projects, eq(organizations.projectID, projects.id));

  // Group by organisationID
  const grouped: Record<string, {
    organisationID: string,
    name: string,
    lat: number,
    lng: number,
    total: number
  }> = {};

  for (const row of data) {
    const id = row.organisationID;
    if (!row.geolocation || !row.ecMaxContribution) continue;

    const [lat, lng] = row.geolocation.split(',').map(Number);
    const contribution = Number(row.ecMaxContribution);

    if (!grouped[id]) {
      grouped[id] = {
        organisationID: id,
        name: row.name ?? 'Unknown',
        lat,
        lng,
        total: 0
      };
    }

    grouped[id].total += contribution;
  }

  const weightedPoints = Object.values(grouped).map((entry) => ({
    organisationID: entry.organisationID,
    name: entry.name,
    location: { lat: entry.lat, lng: entry.lng },
    weight: entry.total
  }));

  return json(weightedPoints);
    
  } catch (error) {
    console.error('Error in heatmap endpoint:', error);
    return json({ 
      error: 'An error occurred while generating heatmap data', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
};