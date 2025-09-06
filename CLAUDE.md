# Jobs Manager Frontend - Claude Instructions

## 🚨 CRITICAL PROJECT RULES 🚨

### Schema Rule: Database Data Prohibition

**If data is stored in the database, you CANNOT model it in the frontend**

- Jobs, staff, purchase orders, timesheets → ❌ Use backend schemas only
- Pure UI dropdowns, tab names, filter forms → ✅ Create locally

**When uncertain:** Ask user: "Is this database data or UI constant?"

**Never:**

- Create local types for API data
- Comment out broken imports
- Use `// @ts-ignore` for missing schemas

### Backend Coordination Required

**You cannot read `/home/corrin/src/jobs_manager` - coordinate through user**

Must coordinate for:

- Business logic vs UI logic decisions
- API contract questions
- Schema generation requests

## Project Overview

Vue 3 + TypeScript frontend for Morris Sheet Metal job management system. Kanban job board, timesheet management, workflow tracking. Communicates with Django REST API backend.

**Backend location:** `/home/corrin/src/jobs_manager`
**Deployment:** Frontend and backend always deployed on same machine (Dev/UAT/Prod)

### Backend Architecture

- Django REST Framework with MariaDB
- UUID primary keys throughout
- Modern CostSet/CostLine architecture (NOT legacy JobPricing)
- SimpleHistory for audit trails
- drf_spectacular for OpenAPI schema generation

**Core Django Apps:**

- workflow - Base functionality, Xero integration, authentication
- job - Job lifecycle with modern costing (CostSet/CostLine)
- accounts - Staff management with custom user model
- client - Customer relationship management
- timesheet - Time tracking via CostLine architecture
- purchasing - Purchase orders with Xero integration
- accounting - Financial reporting and KPIs
- quoting - Quote generation and supplier pricing

## Tech Stack

**Core:** Vue 3 (Composition API), TypeScript, Vite, Pinia, Vue Router, Tailwind CSS v4, Axios
**Key Libraries:** AG Grid Community, Reka UI, VeeValidate + Zod, SortableJS, Vue Sonner, Lucide Vue

## Project Structure

```
src/
├── components/         # Reusable components (ui/, job/, timesheet/, kanban/)
├── composables/        # Composition API functions (20+ composables)
├── stores/            # Pinia state stores
├── services/          # API service layer
├── types/             # TypeScript definitions
├── views/             # Page-level components
├── router/            # Vue Router config
└── lib/               # Utilities
```

## Key Features

**Kanban Board (`KanbanView.vue`):**

- Drag-and-drop job management using SortableJS
- Advanced search and filtering
- Mobile-responsive column selector
- Staff assignment filters

**Timesheet Management:**

- Daily view (`DailyTimesheetView.vue`) - Overview of all staff
- Entry view (`TimesheetEntryView.vue`) - Individual timesheet entry with AG Grid
- Weekly view (`WeeklyTimesheetView.vue`) - Weekly summaries

**Job Management:**

- Job creation (`JobCreateView.vue`) - New job wizard
- Job details (`JobView.vue`) - Comprehensive job editing
- Quote import - Import jobs from external quote systems

## Authentication

- Uses httpOnly cookies for secure token storage
- Automatic token refresh via Axios interceptors
- Router guards protect authenticated routes
- Auth state managed in `stores/auth.ts`

## Environment Configuration

**Required:** `VITE_API_BASE_URL` - API endpoint
**Schema updates:** `npm run update-schema`

## Commands

```bash
npm run dev          # Development server on http://localhost:5173
npm run build        # Production build
npm run type-check   # TypeScript validation
npm run lint         # ESLint with auto-fix
npm run update-schema # Fetch latest API schemas from backend
```

## No Fallbacks Rule

Don't use fallbacks for our own API/config:

- ❌ `job.job_number || job.number`
- ✅ `job.job_number`
- ❌ `import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'`
- ✅ `import.meta.env.VITE_API_BASE_URL`
