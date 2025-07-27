# Jobs Manager Frontend - Claude Development Guide

## 🚨 CRITICAL ARCHITECTURAL RULES 🚨

### MAINTAIN ABSOLUTELY STRICT SEPARATION OF CONCERNS BETWEEN FRONTEND AND BACKEND

**NEVER PUT FRONTEND LOGIC IN THE BACKEND. NEVER PUT BACKEND LOGIC IN THE FRONTEND.**

**Frontend responsibilities ONLY:**

- User interface and presentation logic
- User interactions and form handling
- Client-side validation for UX (never security)
- Routing and navigation
- **STATIC CONSTANTS AND CONFIGURATION**
- Display formatting and styling

**NEVER request backend schemas for:**

- ❌ Static dropdown choices (status values, categories, etc.)
- ❌ UI constants that never change
- ❌ Configuration data that should be hardcoded in frontend
- ❌ Enums or choice fields that are purely presentational
- ❌ Display labels, tooltips, or UI text

**Rule**: If it's a constant that never changes and has no business logic, it belongs in YOUR codebase as a TypeScript constant. DO NOT request it from the backend.

### SCHEMA IMPORT RULES

🚨 **ABSOLUTELY NO LOCAL SCHEMAS FOR API DATA** 🚨
**NEVER create local TypeScript interfaces, types, or schemas that duplicate API functionality**
**ALL API-related types MUST come from the auto-generated API schemas only**

🚨 **ULTIMATE RULE: DATABASE DATA PROHIBITION** 🚨
**If this data is stored in the database, it is prohibited to model it in the frontend**

This is the absolute, foolproof test for determining if a type should be created locally:

- **Database data** (jobs, staff, purchase orders, deliveries, timesheets, etc.) → ❌ PROHIBITED
- **Form data for database entities** (contact forms, job forms, staff forms, etc.) → ❌ PROHIBITED
- **API request/response types** (create requests, update requests, API responses) → ❌ PROHIBITED
- **Pure UI structures ONLY** (dropdown options, tab names, filter structures, search forms) → ✅ ALLOWED

**CLARIFICATION: Form data for database entities is DATABASE DATA**

If a form creates, updates, or represents data that will be stored in the database, it is DATABASE DATA and must use backend schemas. The only frontend forms allowed are pure UI constructs like search filters or display preferences that are never persisted.

🚨 **WHEN UNCERTAIN - DO NOT TOUCH THE CODE** 🚨
\*\*If there is ANY ambiguity about whether a type represents database data, DO NOT WRITE ANY CODE. DO NOT EDIT ANYTHING. STOP AND LEARN. NEVER ATTEMPT TO FIND A WAY AROUND THIS RESTRICTION.

**NEVER modify code based on uncertainty - leave imports broken and document as Category C**

When uncertain about a type, ask: "Is this data stored in the database?" If yes, it belongs in Category C (missing backend schema).

**PROHIBITED actions when uncertain:**

- ❌ Creating frontend types "just in case"
- ❌ Making assumptions about what data represents
- ❌ Using words like "likely", "probably", "seems like"
- ❌ Modifying working code based on guesswork

**CORRECT approach when uncertain:**

- ✅ LEAVE THE CODE UNTOUCHED
- ✅ Document as Category C (missing backend schema)
- ✅ Only fix types when 100% certain they are pure UI constructs

🚨 **NEVER COMMENT OUT OR DISABLE BROKEN IMPORTS** 🚨
**DO NOT create temporary workarounds, placeholder types, or disable imports to "unblock" builds**
**If an import is broken due to missing backend schemas, LEAVE IT BROKEN and document the requirement**
**The build SHOULD fail until proper schemas exist - this maintains architectural integrity**

**PROHIBITED actions when imports are broken:**

- ❌ Commenting out imports
- ❌ Creating placeholder `any` types
- ❌ Creating temporary type definitions
- ❌ Using `// @ts-ignore` or similar suppressions
- ❌ "Unblocking" builds with workarounds

**CORRECT approach:**

- ✅ Document missing schema requirement for backend team
- ✅ Leave import broken to maintain pressure for proper fix
- ✅ Focus on files that can be legitimately fixed

**If generated schema is wrong:** Coordinate with backend to add proper `@extend_schema_field` annotations, then regenerate with `npm run update-schema`

## Project Overview

This is a Vue 3 + TypeScript frontend for a job management system built for Morris Sheet Metal. It provides a Kanban-style job board, timesheet management, and comprehensive job workflow tracking. The application communicates with a Django REST API backend.

## Backend Coordination

The backend is in /home/corrin/src/jobs_manager

### Backend Architecture (Provided by Backend Claude)

**System Architecture:**

- Django REST Framework with MySQL-compatible MariaDB
- UUID primary keys throughout for security
- Modern CostSet/CostLine architecture (NOT legacy JobPricing models)
- SimpleHistory for audit trails on critical models
- drf_spectacular for OpenAPI schema generation
- Defensive programming philosophy - fail early, no fallbacks, mandatory error persistence

**Core Django Apps:**

- workflow - Base functionality, Xero integration, authentication
- job - Job lifecycle with modern costing (CostSet/CostLine)
- accounts - Staff management with custom user model
- client - Customer relationship management
- timesheet - Time tracking via CostLine architecture
- purchasing - Purchase orders with Xero integration
- accounting - Financial reporting and KPIs
- quoting - Quote generation and supplier pricing

### Mandatory Coordination Rules

**🚨 This Claude instance is NOT permitted to read or modify the backend directory or source code.**

**ALWAYS coordinate with the backend Claude through the user for:**

**Data Ownership Questions:**

- "Is this database data or UI constant?"
- "Does this data come from the database or is it a UI constant?"
- "Should job status choices come from backend API?" (Answer: No - static constants)
- "Does user profile data need backend serializer?" (Answer: Yes - dynamic data)

**API Contract Questions:**

- "What fields does the [specific] API actually return?"
- "Does [ModelName] have a '[field]' field?"
- "What's the actual API response structure for this endpoint?"

**Business Logic Questions:**

- "Is this business logic (backend) or presentation logic (frontend)?"
- "Should frontend calculate [specific calculation]?"
- "Are there business rules I need to know about this data?"

**Schema Generation Issues:**

- "Frontend needs schema for [specific type] - should this exist?"
- "Does the backend already have a serializer for this data?"

### Coordination Process

**Frontend Claude Workflow:**

1. **Before assuming data source:** Ask "Is this database data or UI constant?"
2. **Before creating types:** Ask "Does backend already serialize this?"
3. **Before implementing logic:** Ask "Is this business logic or presentation logic?"
4. **When schemas missing:** Provide specific use case, not generic type requests

**Emergency Prevention - MUST coordinate before:**

- Creating any schema/type that might represent backend data
- Implementing calculations that might be business logic
- Making assumptions about API response structures
- Hardcoding values that might be dynamic in backend

### Data Architecture Decision Examples

**Frontend Claude Should Coordinate:**

```typescript
// ❓ COORDINATE - Dynamic data from models?
interface UserProfile {
  wage_rate?: number // Changes based on staff record
  permissions: string[] // Role-based, stored in database
}

// ❓ COORDINATE - Calculated business data?
interface JobSummary {
  profitMargin: number // Business calculation
  totalCost: number // Aggregated from CostLines
}
```

**Frontend Claude Should Handle Locally:**

```typescript
// ✅ UI CONSTANTS - Frontend owns these
const JOB_STATUS_CHOICES = [{ key: 'draft', label: 'Draft' }]

// ✅ PRESENTATION LOGIC - Frontend owns these
interface TableColumn {
  field: string
  header: string
  sortable: boolean
}
```

**The backend Claude has complete context about database models, API design, and data architecture that the frontend Claude lacks.**

## Deployment Architecture

**Frontend and backend are always deployed on the same machine** in all environments (Dev, UAT, Prod). This means:

- The Django backend is usually available at `http://localhost:8000` during builds
- Fresh OpenAPI schemas are fetched directly from the backend during build/dev processes
- **Graceful fallback**: If backend is unavailable, build continues with existing `schema.yml`
- No network dependencies or external service calls required
- True single source of truth: frontend uses the latest backend schema when available

## Tech Stack & Architecture

### Core Technologies

- **Vue 3** with Composition API and `<script setup>`
- **TypeScript** for type safety
- **Vite** as build tool and dev server
- **Pinia** for state management
- **Vue Router** with authentication guards
- **Tailwind CSS v4** with custom theme
- **Axios** for HTTP requests with interceptors

### Key Libraries

- **AG Grid Community** - Data grids for timesheets
- **Reka UI** - Headless component library (shadcn/vue style)
- **VeeValidate + Zod** - Form validation
- **SortableJS** - Drag and drop functionality
- **Vue Sonner** - Toast notifications
- **Lucide Vue** - Icon library

## Project Structure

```
src/
├── components/          # Reusable Vue components
│   ├── ui/             # Base UI components (Button, Dialog, etc.)
│   ├── job/            # Job-specific components
│   ├── timesheet/      # Timesheet-related components
│   └── kanban/         # Kanban board components
├── composables/        # Composition API functions (20+ composables)
├── stores/             # Pinia state stores
├── services/           # API service layer
├── types/              # TypeScript type definitions
├── schemas/            # Zod validation schemas
├── views/              # Page-level components
├── router/             # Vue Router configuration
├── plugins/            # Third-party library configurations
├── lib/                # Utility functions
└── assets/             # CSS and static assets
```

## Key Patterns & Conventions

### Authentication

- Uses **httpOnly cookies** for secure token storage
- Automatic token refresh via Axios interceptors
- Router guards protect authenticated routes
- Auth state managed in `stores/auth.ts`

### API Integration

- Centralized service layer in `services/` directory
- Axios configured with base URL and CSRF handling
- Typed responses using TypeScript interfaces
- Error handling with automatic logout on 401

#### No Fallbacks in Our Own Code

**Do not use fallback patterns when accessing our own API, component data, or environment variables.** Use the correct field names and values directly.

**API/Component Data:**
❌ `job.job_number || job.number || job.jobNumber`
✅ `job.job_number`

**Environment Variables:**
❌ `import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'`
✅ `import.meta.env.VITE_API_BASE_URL`

**Configuration Values:**
❌ `config.retryAttempts || 3`
✅ `config.retryAttempts`

### Component Architecture

- **Composition API** with `<script setup>` syntax
- **Composables** for shared logic (use\* pattern)
- **Props/Emits** with TypeScript interfaces
- **UI components** follow shadcn/vue patterns

### State Management

- **Pinia stores** for global state
- **Reactive refs** for component-local state
- **Computed properties** for derived state
- **Actions** for async operations

## Development Guidelines

### File Organization

- Group related components by feature (job/, timesheet/, etc.)
- Use descriptive, PascalCase names for components
- Keep composables focused and reusable
- Separate types from implementation files

### TypeScript Usage

- Always type component props and emits
- Use interfaces for complex objects
- Leverage type inference where possible
- Validate API responses with Zod schemas

### Component Patterns

```vue
<template>
  <!-- Template with proper accessibility -->
</template>

<script setup lang="ts">
// Imports
import { ref, computed, onMounted } from 'vue'
import type { ComponentProps } from '@/types'

// Props & Emits
interface Props {
  // Define props with types
}
const props = defineProps<Props>()

// Composables
const { data, loading, error } = useApi()

// Local state
const localState = ref('')

// Computed
const computedValue = computed(() => {
  // Derived state
})

// Lifecycle
onMounted(() => {
  // Initialization
})
</script>
```

### API Service Pattern

```typescript
export class SomeService {
  private static instance: SomeService

  static getInstance(): SomeService {
    if (!this.instance) {
      this.instance = new SomeService()
    }
    return this.instance
  }

  async fetchData(): Promise<ApiResponse<DataType>> {
    const response = await api.get<DataType>('/endpoint')
    return response.data
  }
}
```

## Key Features & Components

### Kanban Board (`KanbanView.vue`)

- Drag-and-drop job management using SortableJS
- Advanced search and filtering
- Mobile-responsive column selector
- Staff assignment filters

### Timesheet Management

- **Daily view** (`DailyTimesheetView.vue`) - Overview of all staff
- **Entry view** (`TimesheetEntryView.vue`) - Individual timesheet entry with AG Grid
- **Weekly view** (`WeeklyTimesheetView.vue`) - Weekly summaries

### Job Management

- **Job creation** (`JobCreateView.vue`) - New job wizard
- **Job details** (`JobView.vue`) - Comprehensive job editing
- **Quote import** - Import jobs from external quote systems

## Environment Configuration

### Development Setup

```bash
npm install
npm run dev  # Starts dev server on http://localhost:5173
```

### Environment Variables

- `VITE_API_BASE_URL` - API endpoint (defaults to http://localhost:8000)

### Build Commands

- `npm run build` - Production build
- `npm run type-check` - TypeScript validation
- `npm run lint` - ESLint with auto-fix
- `npm run format` - Prettier formatting

## Important Implementation Details

### Authentication Flow

1. User logs in via `/login` route
2. Backend sets httpOnly cookies
3. Axios automatically includes cookies in requests
4. Router guards check auth state before navigation
5. 401 responses trigger automatic logout

### Drag & Drop Implementation

- Uses SortableJS with Vue 3 integration
- Composables handle drag state and API updates
- Mobile-specific movement buttons for touch devices

### Grid Configuration

- AG Grid with custom theme matching app design
- Column types for currency, dates, hours formatting
- Editable cells with validation

### Form Validation

- VeeValidate for form handling
- Zod schemas for runtime validation
- Custom validation composables

## Common Tasks

### Adding New Components

1. Create component in appropriate `components/` subdirectory
2. Export from component's index.ts if applicable
3. Add TypeScript interfaces for props/emits
4. Follow established naming conventions

### Creating New API Endpoints

1. Add service method in appropriate service class
2. Define TypeScript types for request/response
3. Add Zod schema for validation if needed
4. Update composables to use new service method

### Adding New Routes

1. Define route in `router/index.ts`
2. Set appropriate meta properties (auth, title)
3. Create corresponding view component
4. Update navigation if needed

## Testing & Quality

### Code Quality Tools

- **ESLint** - Linting with Vue/TypeScript rules
- **Prettier** - Code formatting
- **TypeScript** - Type checking
- **Vue DevTools** - Development debugging

### Browser Support

- Modern browsers with ES2020+ support
- Mobile-responsive design
- Progressive enhancement patterns

## Troubleshooting

### Common Issues

- **CORS errors**: Check API base URL configuration
- **Auth redirects**: Verify cookie settings and domain
- **Build failures**: Run type-check to identify TypeScript errors
- **Style issues**: Check Tailwind class conflicts

### Debug Tools

- Vue DevTools extension
- Browser network tab for API calls
- Console logs in development mode
- TypeScript compiler errors

## Additional Resources

- Main documentation: `docs/overview.md`
- Backend repository: https://github.com/corrin/jobs_manager
- Component library: Based on shadcn/vue patterns
- UI components: Custom implementation in `components/ui/`
