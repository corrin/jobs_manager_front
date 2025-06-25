# ADMIN_IMPLEMENTATION_PLAN.md

## Implementation Plan: Modern Admin Features (Vue.js + Django)

### General Coding Guidelines

- **Single Responsibility Principle (SRP):** Each function/class/component should have a single, clear responsibility.
- **Early Return & Guard Clauses:** Use guard clauses to avoid deep nesting and improve readability.
- **Switch-Case Usage:** Use switch-case (or Python match-case) for discrete value/type-based control flow.
- **Service Layer (Backend):** All business logic must be in service layers. Views only orchestrate and delegate.
- **Componentization (Frontend):** Vue components should be small and cohesive. Shared logic goes to composables or store.
- **Zod for Validation (Frontend):** Use Zod for runtime validation and type inference of all external data.
- **Centralize Flow Decisions:** Centralize business rules and avoid duplication.
- **General Best Practices:** Use descriptive names, follow PEP8/ESLint, avoid long functions, prefer async/await, and always log or handle exceptions.

---

## 1. Staff Admin (CRUD)

### Backend

1. **Create RESTful Endpoints for Staff**
   - List, retrieve, create, update, delete staff.
   - Expose all fields shown in Django admin (`apps/accounts/admin.py`).
   - Restrict access to users with `is_superuser`.

2. **Serializers**
   - Implement serializers for all staff fields, including working hours, wage rate, permissions, etc.
   - Ensure validation matches model constraints.

3. **Permissions**
   - Use Django permissions to restrict endpoints to `is_superuser`.

### Frontend

1. **Admin Panel UI**
   - Create a modern, responsive admin panel for staff management.
   - Use shadcn-vue and Tailwind 4 for styling.
   - Implement tabbed/lateral panel navigation (like Django admin, but improved).
   - All fields must be viewable and editable.
   - Support image upload for `icon`.

2. **CRUD Operations**
   - List staff with search/filter.
   - Create/edit staff with full form (grouped in tabs/sections).
   - Delete staff with confirmation.

3. **Validation**
   - Use Zod schemas for all forms, inferring types for TypeScript.

4. **Permission Control**
   - Only show admin UI if user is `is_superuser`.

---

## 2. Company Defaults Admin (CRUD)

### Backend

1. **Create RESTful Endpoints for CompanyDefaults**
   - List, retrieve, create, update, delete company defaults.
   - Expose all fields from Django admin (`apps/workflow/admin.py`), including AIProvider inlines.
   - Restrict access to `is_superuser`.

2. **Serializers**
   - Implement serializers for all fields, including nested AIProvider.
   - Enforce model validation.

3. **Permissions**
   - Restrict endpoints to `is_superuser`.

### Frontend

1. **Admin Panel UI**
   - Modern, sectioned form for all company defaults fields.
   - Inline editing for AIProviders (add/remove/edit).
   - Use shadcn-vue and Tailwind 4.

2. **Validation**
   - Use Zod schemas for all forms, matching backend validation.

3. **Permission Control**
   - Only show admin UI if user is `is_superuser`.

---

## 3. Archive Complete Jobs

### Backend

- **Already implemented.** Use endpoints from `archive_completed_jobs_view.py` and `job_service.py`.

### Frontend

1. **Archive Jobs UI**
   - List all completed and paid jobs (paginated).
   - Allow multi-select and bulk archive.
   - Show success/error feedback.
   - Use shadcn-vue and Tailwind 4.

2. **Permission Control**
   - Only show admin UI if user is `is_superuser`.

---

## 4. Permission Control (Global)

- On login, fetch user info and check `is_superuser`.
- Hide all admin features/routes/components for non-superusers.
- Backend endpoints must always check for `is_superuser` (never trust only the frontend).

---

## 5. General Steps

1. Implement/extend backend endpoints and serializers as needed.
2. Create Zod schemas for all admin forms.
3. Build Vue components and views for each admin feature.
4. Integrate permission checks in both backend and frontend.
5. Test flows as a superuser and as a regular user.

---

**Note:**  
Month-end processing is explicitly excluded from this plan.

---

This plan should be placed in the root of your project as `ADMIN_IMPLEMENTATION_PLAN.md`.
