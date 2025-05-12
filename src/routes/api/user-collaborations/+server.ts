import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { client, clientCollaboration, collaboration as collaborationTable } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
    const session = await locals.getSession();

    if (!session?.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authId = session.user.id;

    try {
        // 1. Get the client_id from the auth_id
        const clientRecord = await db
            .select({ id: client.id })
            .from(client)
            .where(eq(client.authId, authId))
            .limit(1)
            .then(rows => rows[0]);

        if (!clientRecord) {
            console.warn(`No client record found for authId: ${authId}`);
            return json([]); // Return empty array if no client profile found
        }

        const clientId = clientRecord.id;

        // 2. Get collaboration_ids for this client
        const clientCollaborations = await db
            .select({ collaborationId: clientCollaboration.collaborationId })
            .from(clientCollaboration)
            .where(eq(clientCollaboration.clientId, clientId));

        if (clientCollaborations.length === 0) {
            return json([]); // No collaborations for this user
        }

        const collaborationIds = clientCollaborations.map(cc => cc.collaborationId);

        // 3. Get collaboration details for these IDs
        const collaborations = await db
            .select({
                id: collaborationTable.id,
                name: collaborationTable.name,
            })
            .from(collaborationTable)
            .where(inArray(collaborationTable.id, collaborationIds));

        // Format for the frontend (ensure id is a string for consistency with 'personal' space)
        const formattedCollaborations = collaborations.map(c => ({
            id: String(c.id), // Convert numeric ID to string
            name: c.name,
        }));

        return json(formattedCollaborations);

    } catch (error) {
        console.error('Error fetching user collaborations:', error);
        return json({ error: 'Failed to fetch collaborations' }, { status: 500 });
    }
};
