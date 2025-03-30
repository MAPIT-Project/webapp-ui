import { pgTable, varchar, timestamp, boolean, integer, numeric, text, char, bigint, jsonb, primaryKey, serial, pgEnum, uuid, decimal, date } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Create the sender enum type
export const senderEnum = pgEnum('sender', ['ai', 'user', 'system']);

// Client table
export const client = pgTable('client', {
  id: serial('id').primaryKey(),
  // Add a auth_id column that links to Supabase auth.users.id
  authId: uuid('auth_id').unique().notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Conversation table
export const conversation = pgTable('conversation', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => client.id).notNull(),
  topic: varchar('topic', { length: 255 }),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Message table
export const message = pgTable('message', {
  id: serial('id').primaryKey(),
  conversationId: serial('conversation_id').references(() => conversation.id).notNull(),
  text: text('text').notNull(),
  sender: varchar('sender', { length: 50 }).notNull(), // Using varchar instead of enum as noted in diagram
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Define types based on the schema for TypeScript
export type Client = typeof client.$inferSelect;
export type NewClient = typeof client.$inferInsert;

export type Conversation = typeof conversation.$inferSelect;
export type NewConversation = typeof conversation.$inferInsert;

export type Message = typeof message.$inferSelect;
export type NewMessage = typeof message.$inferInsert;





// 

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

export const projects = pgTable('projects', {
  id: integer('id').primaryKey(), // numeric project ID
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