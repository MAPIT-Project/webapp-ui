import type { InferSelectModel } from 'drizzle-orm';
import type { collaboration, clientCollaboration } from '$lib/server/db/schema';

export type Collaboration = InferSelectModel<typeof collaboration>;
export type ClientCollaboration = InferSelectModel<typeof clientCollaboration>;

export type Role = 'owner' | 'admin' | 'member';