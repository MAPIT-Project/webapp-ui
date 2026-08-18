> Documentation status: archived draft | Owner: MAP-IT frontend team | Scope: superseded architecture stub | Last verified: 18-08-2026 for archival classification

Note:  
_This document contains information about the full stack UI application for the MAPIT AI Domain Expert Tool. This is currently a work in progress, so the documentation here will be a bit messy to begin with and gradually turn into an important document._

## Tech Stack

**Frontend**

- Svelte 5 (SvelteKit)
- Typescript
- Tailwind CSS

**Backend**

- Node JS
- SvelteKit
- Drizzle ORM

**Database**

- Supabase (PostgreSQL)

## General Info

**Schema**  
 All tables are created with _created_at_ and _updated_at_ columns. These columns contain a timestamp in the UTC timezone.
