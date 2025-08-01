# Mapit AI Expert

A web application empowering domain experts with advanced AI-driven insights—bridging cutting-edge technology with deep subject expertise.

## Features

- Interactive mapping visualization using Deck.gl and Mapbox
- AI-powered data analysis for domain experts
- User authentication and authorization via Supabase
- Responsive UI built with SvelteKit and Tailwind CSS

## Development

Once you've cloned the project and installed dependencies with `npm install`, start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Database Management

This project uses Drizzle ORM for database operations:

```bash
# Push schema changes to the database
npm run db:push

# Generate migration files
npm run db:generate

# Run migrations
npm run db:migrate

# View and manage data in Drizzle Studio
npm run db:studio
```

## Building for Production

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

## Tech Stack

- SvelteKit
- TypeScript
- Tailwind CSS
- Supabase
- Deck.gl & Mapbox
- Drizzle ORM
