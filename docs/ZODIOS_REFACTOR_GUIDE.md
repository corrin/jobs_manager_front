## Overview
Manual migration from raw Axios + handwritten interfaces to Zodios API client
and centralised Zod schemas (generated and local).

## Step-by-Step
1. **Mapping** – build DEPRECATED_REPORT.md from every `@deprecated` tag.
2. **API Migration** – swap Axios/fetch calls for `api.<alias>()`.
3. **Schema Migration**  
   • Import generated schemas where available.  
   • Create local schemas in `src/api/local/schemas.ts` for uncov­ered cases.  
   • Replace interfaces with `z.infer<typeof XxxSchema>`.
4. **Lint** – run `npm run lint` until clean.
5. **Reporting** – tick finished items in DEPRECATED_REPORT.md.
6. **Pull Request** – commit: `refactor!: Zodios & Zod migration`, open PR.

## Checklist
- [ ] DEPRECATED_REPORT.md reviewed  
- [ ] API calls migrated  
- [ ] Interfaces replaced by generated schemas  
- [ ] Remaining interfaces converted to local schemas  
- [ ] Lint passes  
- [ ] Pull Request merged
