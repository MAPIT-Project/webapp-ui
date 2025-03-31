import { db } from '$lib/server/db';
import { organizations, projects } from '$lib/server/db/schema';
import { json } from '@sveltejs/kit';
import { eq, and, isNotNull } from 'drizzle-orm';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request, url }) => {
  try {
    // Extract viewport parameters
    const north = parseFloat(url.searchParams.get('north') || '90');
    const south = parseFloat(url.searchParams.get('south') || '-90');
    const east = parseFloat(url.searchParams.get('east') || '180');
    const west = parseFloat(url.searchParams.get('west') || '-180');
    const zoom = parseFloat(url.searchParams.get('zoom') || '0');
    
    // Set point limit based on zoom level
    let pointLimit = 100; // Default for low zoom levels
    if (zoom >= 10) {
      pointLimit = 1000; // Higher density for high zoom levels
    } else if (zoom >= 6) {
      pointLimit = 500;  // Medium density for medium zoom levels
    } else if (zoom >= 4) {
      pointLimit = 250;  // Lower density for lower zoom levels
    }
    
    // Step 1: Fetch all organizations (without filtering by geolocation in the query)
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

    // Group by organisationID and filter by viewport bounds
    const grouped: Record<string, {
      organisationID: string,
      name: string,
      lat: number,
      lng: number,
      total: number
    }> = {};

    for (const row of data) {
      if (!row.geolocation || !row.ecMaxContribution) continue;
      
      const [lat, lng] = row.geolocation.split(',').map(Number);
      
      // Skip if out of viewport bounds
      if (lat > north || lat < south || lng > east || lng < west) continue;
      
      const id = row.organisationID;
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

    // Convert to array and sort by contribution amount (descending)
    const weightedPoints = Object.values(grouped)
      .map((entry) => ({
        organisationID: entry.organisationID,
        name: entry.name,
        location: { lat: entry.lat, lng: entry.lng },
        weight: entry.total
      }))
      .sort((a, b) => b.weight - a.weight);

    // Return only the top N points based on the zoom level limit
    const finalResults = weightedPoints.slice(0, pointLimit);

    return json(finalResults);
  } catch (error) {
    console.error('Error in heatmap endpoint:', error);
    return json({ 
      error: 'An error occurred while generating heatmap data', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
};