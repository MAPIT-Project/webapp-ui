import type { InferSelectModel } from 'drizzle-orm';
import type {
	collaboration,
	clientCollaboration,
	conversation,
	message,
	client
} from '$lib/server/db/schema';

export type Client = InferSelectModel<typeof client>;
export type Collaboration = InferSelectModel<typeof collaboration>;
export type ClientCollaboration = InferSelectModel<typeof clientCollaboration>;
export type Conversation = InferSelectModel<typeof conversation>;
export type Message = InferSelectModel<typeof message>;

export type Role = 'owner' | 'admin' | 'member';

// Extended collaboration type for UI components
export interface CollaborationWithDetails extends Collaboration {
	collaboratorsCount?: number;
	client_collaboration?: Array<{ role: Role }>;
}

// Extended message type for collaboration chats with user info
export interface MessageWithUser extends Message {
	user?: {
		id: number;
		firstName: string;
		lastName: string;
		email: string;
	};
}

// Extended message interface for messages with additional API response fields
export interface MessageWithSuggestions extends Message {
	follow_up_suggestions?: string[];
	context_used?: boolean;
	resolved_question?: string;
	projects_discussed?: any[];
}
