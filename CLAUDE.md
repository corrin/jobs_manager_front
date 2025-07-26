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

## Project Overview

This is a Vue 3 + TypeScript frontend for a job management system built for Morris Sheet Metal. It provides a Kanban-style job board, timesheet management, and comprehensive job workflow tracking. The application communicates with a Django REST API backend.

## Backend

The backend is in /home/corrin/src/jobs_manager
It's a standard Django app.

**IMPORTANT: This Claude instance is NOT permitted to read or modify the backend directory or source code.** If you need information about the backend API, models, or validation logic, you must ask the user to coordinate with the Claude instance managing the backend code.

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

#### CRITICAL: No Schema Workarounds

**NEVER create local schema overrides to work around incorrect auto-generated API schemas.** This completely violates the single source of truth principle.

**Schema Workarounds (STRICTLY PROHIBITED):**
❌ Creating `/api/local/schemas.ts` to override generated schemas
❌ Manual validation like `CostSetSchema.parse(response)` to "fix" API responses  
❌ Dual-schema patterns where generated and local schemas coexist
❌ Type overrides like `import { type CostSet } from '@/api/local/schemas'`

**Correct Approach:**
✅ Fix the backend OpenAPI schema generation at the source
✅ Use only the auto-generated API client and schemas
✅ Coordinate with backend developers to add proper `@extend_schema_field` annotations
✅ Regenerate frontend API when backend schema is corrected

**Why schema workarounds are forbidden:**

- **Breaks contract**: Auto-generated APIs are meant to be the single source of truth
- **Dual maintenance**: Now you maintain both generated AND local schemas
- **Drift risk**: Local schemas can become stale and incorrect
- **Masks real issues**: Backend schema problems should be fixed, not worked around
- **Technical debt**: Creates permanent workarounds that become hard to remove

**If the generated schema is wrong:**

1. **Stop immediately** - Do not create local schema overrides
2. **Identify root cause** - Usually missing OpenAPI annotations in backend
3. **Coordinate with backend** - Get proper `@extend_schema_field` annotations added
4. **Regenerate schema** - Use `npm run update-schema` after backend fix
5. **Verify fix** - Ensure generated types match actual API responses

**Schema integrity is non-negotiable.** Local schema workarounds are a serious architectural violation.

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
