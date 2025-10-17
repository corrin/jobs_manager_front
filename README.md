# Jobs Manager Frontend

This repository contains the Vue 3 front‑end for the Jobs Manager application.
It communicates with the [Jobs Manager backend](https://github.com/corrin/jobs_manager).

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

The app expects the backend to run at `http://localhost:8000`.

### Running with Tunnels (Remote Access)

For remote access during development (ngrok):

```bash
ngrok http 5173 --domain=msm-workflow-front.ngrok-free.app
```

Monitor requests at: http://localhost:4040

**Backend tunnels**: See the [backend repository](https://github.com/corrin/jobs_manager) docs for backend tunnel setup

## Project Structure

Source files live in the `src/` directory:

- **assets/** – Tailwind CSS and static assets
- **components/** – Reusable Vue components
- **composables/** – Reusable logic (Composition API functions)
- **lib/** – Utility helpers
- **plugins/** – Plugins such as Axios configuration
- **router/** – Vue Router setup
- **schemas/** – Zod schemas for API responses
- **services/** – API service wrappers
- **stores/** – Pinia stores for state management
- **types/** – TypeScript interfaces
- **views/** – Page‑level Vue components

## Additional Documentation

See `docs/overview.md` for a newcomer‑oriented explanation of the codebase.
