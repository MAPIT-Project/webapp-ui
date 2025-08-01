# CRUSH Agent Configuration

## Build Commands

- Dev server: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`

## Lint/Format Commands

- Check types: `npm run check`
- Watch types: `npm run check:watch`
- Format code: `npm run format`
- Lint code: `npm run lint`

## Test Commands

- Run tests: `npm run test` (check package.json for exact command)
- Run single test file: `npm run test -- <file-pattern>`

## Database Commands

- Push schema: `npm run db:push`
- Generate migrations: `npm run db:generate`
- Run migrations: `npm run db:migrate`
- Open DB studio: `npm run db:studio`

## Code Style Guidelines

- Use TypeScript with strict typing
- Follow Svelte 5+ conventions
- Use Tailwind CSS for styling
- Component naming: PascalCase with .svelte extension
- Import organization: External libs → Internal libs → Components
- Error handling: Use errorHandling.ts utilities
- Async operations: Always handle errors appropriately
- State management: Use Svelte stores for global state

## Naming Conventions

- Variables/Functions: camelCase
- Components: PascalCase
- Constants: UPPER_SNAKE_CASE
- Files: kebab-case (except components)

## Formatting

- Prettier with Svelte plugin
- Tailwind classes sorted with plugin
- Line width: 100 characters
- Indentation: 2 spaces

## Git Ignore

- Add `.crush` directory to `.gitignore`
