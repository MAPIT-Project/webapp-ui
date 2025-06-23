import type { InferSelectModel } from 'drizzle-orm';
import type { collaboration, clientCollaboration, conversation, message } from '$lib/server/db/schema';

export type Collaboration = InferSelectModel<typeof collaboration>;
export type ClientCollaboration = InferSelectModel<typeof clientCollaboration>;
export type Conversation = InferSelectModel<typeof conversation>;
export type Message = InferSelectModel<typeof message>;

export type Role = 'owner' | 'admin' | 'member';