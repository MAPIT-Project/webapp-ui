import {
  pgTable,
  varchar,
  timestamp,
  boolean,
  integer,
  numeric,
  text,
  serial,
  uuid,
  decimal,
  date,
  pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const senderEnum = pgEnum('sender', ['ai', 'user', 'system']);
export const roleEnum = pgEnum('role', ['owner', 'admin', 'member']);

// Client table
export const client = pgTable('client', {
  id: serial('id').primaryKey(),
    // Add a auth_id column that links to Supabase auth.users.id
  authId: uuid('auth_id').unique().notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const clientRelations = relations(client, ({ many }) => ({
  conversations: many(conversation),
  collaborations: many(clientCollaboration),
}));

// Conversation table
export const conversation = pgTable('conversation', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => client.id).notNull(),
  topic: varchar('topic', { length: 255 }),
  name: varchar('name', { length: 255 }),
  collaborationId: integer('collaboration_id').references(() => collaboration.id),
  archived: boolean('archived').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const conversationRelations = relations(conversation, ({ one, many }) => ({
  user: one(client, {
    fields: [conversation.userId],
    references: [client.id],
  }),
  collaboration: one(collaboration, {
    fields: [conversation.collaborationId],
    references: [collaboration.id],
  }),
  messages: many(message),
}));

// Message table
export const message = pgTable('message', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').references(() => conversation.id).notNull(),
  text: text('text').notNull(),
  sender: varchar('sender', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const messageRelations = relations(message, ({ one }) => ({
  conversation: one(conversation, {
    fields: [message.conversationId],
    references: [conversation.id],
  }),
}));

// Collaboration table
export const collaboration = pgTable('collaboration', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const collaborationRelations = relations(collaboration, ({ many }) => ({
  clients: many(clientCollaboration),
  conversations: many(conversation),
}));

// ClientCollaboration (join table)
export const clientCollaboration = pgTable('client_collaboration', {
  id: serial('id').primaryKey(),
  collaborationId: integer('collaboration_id').references(() => collaboration.id).notNull(),
  clientId: integer('client_id').references(() => client.id).notNull(),
  role: roleEnum('role').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const clientCollaborationRelations = relations(clientCollaboration, ({ one }) => ({
  client: one(client, {
    fields: [clientCollaboration.clientId],
    references: [client.id],
  }),
  collaboration: one(collaboration, {
    fields: [clientCollaboration.collaborationId],
    references: [collaboration.id],
  }),
}));

// Organizations
export const organizations = pgTable('organizations', {
  projectID: integer('projectID').notNull(),
  projectAcronym: text('projectAcronym'),
  organisationID: text('organisationID').notNull().primaryKey(),
  vatNumber: text('vatNumber'),
  name: text('name'),
  shortName: text('shortName'),
  SME: boolean('SME'),
  activityType: text('activityType'),
  street: text('street'),
  postCode: text('postCode'),
  city: text('city'),
  country: text('country'),
  nutsCode: text('nutsCode'),
  geolocation: text('geolocation'),
  organizationURL: text('organizationURL'),
  contactForm: text('contactForm'),
  contentUpdateDate: timestamp('contentUpdateDate', { mode: 'string' }),
  rcn: integer('rcn'),
  order: integer('order'),
  role: text('role'),
  ecContribution: decimal('ecContribution'),
  netEcContribution: decimal('netEcContribution'),
  totalCost: decimal('totalCost'),
  endOfParticipation: boolean('endOfParticipation'),
  active: boolean('active'),
});

// Projects
export const projects = pgTable('projects', {
  id: integer('id').primaryKey(),
  acronym: text('acronym'),
  status: text('status'),
  title: text('title'),
  startDate: date('startDate'),
  endDate: date('endDate'),
  totalCost: decimal('totalCost'),
  ecMaxContribution: decimal('ecMaxContribution'),
  legalBasis: text('legalBasis'),
  topics: text('topics'),
  ecSignatureDate: date('ecSignatureDate'),
  frameworkProgramme: text('frameworkProgramme'),
  masterCall: text('masterCall'),
  subCall: text('subCall'),
  fundingScheme: text('fundingScheme'),
  nature: text('nature'),
  objective: text('objective'),
  contentUpdateDate: timestamp('contentUpdateDate', { mode: 'string' }),
  rcn: integer('rcn'),
  grantDoi: text('grantDoi'),
});
