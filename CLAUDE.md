# Frontend Development Rules

This file defines behavioral rules for AI assistants working on this Vue 3 + TypeScript codebase. Follow these rules strictly.

---

## Intent

This is a jobs management application with multi-user editing, autosave, and optimistic concurrency control. All API contracts are defined in an OpenAPI schema. Type safety and data integrity are non-negotiable.

---

## Critical Rules

### Schema-Driven Development

1. **Backend schema is the source of truth** - All API types come from `schema.yml`
2. **Never manually type API responses** - Always infer: `type T = z.infer<typeof schemas.X>`
3. **Never use raw `fetch()` or `axios` calls** - Only use the generated `api` client from `@/api/client`
4. **If an endpoint doesn't exist in the schema** - Stop work and request backend implementation
5. **After backend updates schema** - Run `npm run update-schema && npm run gen:api`
6. **Never edit `/src/api/generated/api.ts`** - It's auto-generated
7. **Never work around backend issues** - Refuse to do anything until the backend is fixed.

### State Management

7. **Always use immutable updates** - `state.value = { ...state.value, [key]: newValue }`
8. **Never mutate objects directly** - Vue 3 reactivity won't detect it
9. **Stores manage state, services call APIs** - Keep separation clear
10. **Use `ref()` for state, `computed()` for getters** - Not reactive() in stores
11. **Store entities by ID in records** - `Record<string, Entity>` pattern
12. **Stores don't return promises** - They update state as side effects

### Type Safety

13. **Let TypeScript infer types** - Don't redundantly annotate
14. **Use `null` for nullable fields, not `undefined`** - Backend contract
15. **Validate with Zod schemas** - `schemas.X.parse(data)` before API calls
16. **Strict TypeScript mode is enforced** - No `any` types without justification

### Component Architecture

17. **Components use stores + composables** - Minimal direct API calls
18. **Never mutate props** - Always emit events
19. **Use `<script setup lang="ts">`** - Composition API only
20. **Import with `@/` alias** - Never relative paths (`../../`)

### Concurrency & Autosave

21. **ETag headers are managed automatically** - Don't manually handle them
22. **Handle 412/428 status codes gracefully** - Reload data + notify user
23. **Autosave uses debouncing (500ms)** - Don't bypass the autosave system
24. **Optimistic updates must have rollback** - If save fails, revert UI

---

## File Organization

### Where Things Go

```
/src/api/          - API client (generated + configuration)
/src/services/     - API calls + business logic
/src/stores/       - Pinia state management
/src/composables/  - Reusable reactive logic
/src/components/   - Vue components (domain-organized)
/src/views/        - Page-level route components
/src/types/        - TypeScript type definitions
/src/utils/        - Pure utility functions
```

### Component Organization

- **Domain-specific components** → `/components/{domain}/` (e.g., `/components/job/`)
- **Shared business components** → `/components/shared/`
- **Generic UI primitives** → `/components/ui/` (shadcn-vue style)
- **Page components** → `/views/` (lazy-loaded in routes)

---

## Development Workflow

### Adding a New Feature

1. **Check if backend endpoint exists** - Search in `/src/api/generated/api.ts`
2. **If missing** - Request backend implementation first
3. **After backend adds it** - Run `npm run update-schema && npm run gen:api`
4. **Implement using generated types** - Import from `@/api/client` and `@/api/generated/api`
5. **Follow existing patterns** - Check similar features in the codebase

### Making API Calls

```typescript
// ✅ Correct
import { api } from '@/api/client'
import { schemas } from '@/api/generated/api'

const response = await api.clients_list()

// ❌ Wrong - bypass
const response = await fetch('/clients/')
```

### State Updates

```typescript
// ✅ Correct - immutable
jobs.value = { ...jobs.value, [id]: updatedJob }

// ❌ Wrong - mutation
jobs.value[id] = updatedJob
```

### Error Handling

25. **Every `console.error` must either throw or toast** - Users must be notified of errors, not just developers. If you log an error with `console.error`, you must also either `throw` (so the caller handles it) or show a `toast.error()` to the user.

```typescript
// ✅ Correct - toast notifies user
} catch (error) {
  console.error('Failed to save:', error)
  toast.error('Failed to save changes')
}

// ✅ Correct - throw lets caller handle
} catch (error) {
  console.error('Failed to save:', error)
  throw error
}

// ❌ Wrong - silent failure, user sees nothing
} catch (error) {
  console.error('Failed to save:', error)
}
```

---

## When to Ask for Help

**Stop and ask the user when:**

1. **Backend endpoint is missing** - Don't work around with fetch()
2. **Schema conflicts with expected data** - Backend may need updating
3. **Breaking existing autosave behavior** - Concurrency is delicate
4. **Unclear which layer owns logic** - Service vs store vs composable
5. **Major architectural decision** - New state management pattern, etc.

**Don't ask about:**

- Standard patterns covered in this file
- TypeScript errors from incorrect types (fix them)
- Formatting/linting issues (auto-fixable)
- Adding new components following existing structure

---

## Code Quality Standards

### TypeScript

- Enable strict mode
- No `any` without explicit justification
- Infer types where possible, annotate function params
- Use Zod for runtime validation

### Vue

- Composition API (`<script setup>`) only
- Props + emits with TypeScript
- Computed for derived state
- Watch for side effects only

### Styling

- TailwindCSS utility classes
- Component variants via `class-variance-authority`
- shadcn-vue component library conventions

### Testing

- Type check: `npm run type-check`
- Lint: Auto-fixed by editor
- Test before committing

---

This is a **control file**, not documentation. Follow these rules. For "how it works" details, read the code.
