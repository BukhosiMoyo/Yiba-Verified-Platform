# Multi-Institution & Institution Admin Onboarding — Master Prompt

Use this as the **single entry point** when implementing multi-institution and institution-admin onboarding. Follow the linked document and apply the four prompts in order.

## Goal

1. **Institution admins invited without an institution** — They don’t belong to an institution at signup; they add institution(s) during onboarding.
2. **Multiple institutions per admin** — One admin can manage multiple institutions (e.g. branches, multiple locations).
3. **Unique identifiers** — Each institution (and branch) has a stable, human-readable identifier (e.g. branch code) for easy identification.
4. **Onboarding** — Institution admin onboarding lets them add one or more institutions (details + optional branch codes) before completing.

## What to Do

1. **Read** `docs/MULTI_INSTITUTION_IMPLEMENTATION_PROMPTS.md` in full.
2. **Apply in order:**
   - **Prompt 1:** Data model (UserInstitution, Institution unique identifiers, migration).
   - **Prompt 2:** Invite & accept (allow INSTITUTION_ADMIN without institution).
   - **Prompt 3:** Institution admin onboarding (add institution(s) during onboarding, API to create Institution(s) and UserInstitution(s)).
   - **Prompt 4:** Application logic (current institution, context switcher, scoping).
3. **Validate** after each prompt using the “Completion criteria” in that section.
4. **Document** any product or schema decisions (e.g. Option A vs B for branches) in `docs/MULTI_INSTITUTION_DATA_MODEL.md` or in the main prompts doc.

## Key Files to Touch

- **Schema:** `prisma/schema.prisma` (UserInstitution, Institution.branch_code, etc.)
- **Invite:** `src/app/api/invites/route.ts`, `src/app/api/invites/bulk/route.ts`, `src/app/api/invites/accept/route.ts`
- **Onboarding:** `src/components/institution/onboarding/InstitutionAdminOnboardingWizard.tsx`, `src/app/api/institution/onboarding/complete/route.ts`
- **Context:** `src/lib/api/context.ts` (or equivalent) for `institutionId` / current institution
- **Layout:** `src/app/institution/layout.tsx` (current institution, context switcher)
- **Scoped APIs/pages:** All institution-scoped routes and pages that filter by institution_id

## Best Practices

- **Backward compatibility:** Keep existing users with a single institution working; migrate via UserInstitution backfill.
- **Unique identifiers:** Enforce uniqueness for branch_code (or equivalent) in DB and API.
- **Validation:** Validate at least one institution on onboarding complete; require registration_number and allowed province.
- **Security:** Always resolve “current institution” and “user’s institutions” from the database (UserInstitution); never trust client-only context without server validation.

Start with **Prompt 1** in `MULTI_INSTITUTION_IMPLEMENTATION_PROMPTS.md` and proceed in order.
