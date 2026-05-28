# Mapit AI Expert

A web application empowering domain experts with advanced AI-driven insights—bridging cutting-edge technology with deep subject expertise.

> [!WARNING]
> **Project Disclaimer & Review Notice:**
> - **Horizon Europe Focus**: The backend and frontend are primarily designed and optimized for **Horizon Europe**. Support for other programmes (Erasmus+, Creative Europe, EU4Health, Digital Europe, and LIFE) is integrated but not as thoroughly tested or mature.
> - **AI-Assisted Single-Dev Build**: This system was built by a **single developer** leveraging AI extensively to execute the work of a full engineering team.
> - **Manual Review Required**: Due to the speed and scale of development, the code contains unreviewed blocks, potentially redundant code, or security gaps. **Please ensure a thorough code review and security audit is completed before making this project public or deploying to production.**

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

---

## ❤️ Credits & Support
Developed and maintained by **Anmar Ram** ([anmar.noah@gmail.com](mailto:anmar.noah@gmail.com)) for the MAP-IT platform.

