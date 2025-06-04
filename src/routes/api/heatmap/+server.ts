import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';

export const GET: RequestHandler = async ({ request, url, cookies }) => {
  try {
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
    
    // Build the query with search filters
    let organizationsQuery = supabase
      .from('organizations')
      .select(`
        organisationID,
        name,
        geolocation,
        projectID,
        projects!inner (
          id,
          title,
          objective,
          ecMaxContribution
        )
      `);

    // If search keyword is provided, filter projects
    if (searchKeyword) {
      organizationsQuery = organizationsQuery.or(
        `projects.title.ilike.%${searchKeyword}%,projects.objective.ilike.%${searchKeyword}%`,
        { foreignTable: 'projects' }
      );
    }

    const { data, error } = await organizationsQuery;

    if (error) {
      console.error('Error fetching organizations:', error);
      return json({ error: 'Failed to fetch organization data' }, { status: 500 });
    }

    // Group by organisationID and filter by viewport bounds
    const grouped: Record<string, {
      organisationID: string,
      name: string,
      lat: number,
      lng: number,
      total: number,
      isSearchMatch: boolean,
      matchingProjects: Array<{
        projectID: number,
        title: string,
        contribution: number,
        objective: string
      }>
    }> = {};

    for (const row of data || []) {
      if (!row.geolocation || !row.projects?.ecMaxContribution) continue;
      
      const [lat, lng] = row.geolocation.split(',').map(Number);
      
      // Skip if out of viewport bounds (unless it's a search match)
      if (!searchKeyword && (lat > north || lat < south || lng > east || lng < west)) continue;
      
      const id = row.organisationID;
      const contribution = Number(row.projects.ecMaxContribution);
      const isSearchMatch = searchKeyword ? true : false;
      
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
      if (isSearchMatch && row.projectID && row.projects?.title) {
        grouped[id].matchingProjects.push({
          projectID: row.projectID,
          title: row.projects.title,
          contribution: contribution,
          objective: row.projects.objective || 'No objective provided'
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
      totalCount: searchKeyword ? (data?.length || 0) : finalResults.length 
    });
  } catch (error) {
    console.error('Error in heatmap endpoint:', error);
    return json({ 
      error: 'An error occurred while generating heatmap data', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
};