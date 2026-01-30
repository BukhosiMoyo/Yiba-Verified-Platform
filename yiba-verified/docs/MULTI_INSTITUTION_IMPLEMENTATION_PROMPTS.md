# Multi-Institution & Institution Admin Onboarding — Implementation Prompts

This document contains **four prompts** to implement:

1. **Institution admins invited without an institution** — They don’t belong to an institution at signup; they add institution(s) during onboarding.
2. **Multiple institutions per admin** — Support institutions with branches and multiple locations (one admin can manage many institutions).
3. **Unique identifiers** — Each institution (and branch) has a stable, human-readable identifier for easy identification.
4. **Onboarding flow** — Institution admin onboarding lets them add one or more institutions (details + optional branch codes).

**Apply the prompts in order.** Each prompt is self-contained but builds on the previous one. Read the “Current state” and “Completion criteria” for each before coding.

---

## Current State (Before Implementation)

- **User** has a single optional `institution_id` (one institution per user).
- **Invite** has optional `institution_id`. When PLATFORM_ADMIN invites INSTITUTION_ADMIN/INSTITUTION_STAFF/STUDENT, the API **requires** `institution_id`.
- **Accept invite** sets `user.institution_id = invite.institution_id`; if invite has no institution, user would have `institution_id: null` but the invite API currently doesn’t allow that for institution roles.
- **Institution admin onboarding** is a single step: acknowledge responsibilities and complete; it does **not** create or link any institution.
- **Institution** has `institution_id` (UUID), `registration_number`, and other fields; no separate “branch code” or human-readable unique code.

---

# PROMPT 1 — Data Model: Multi-Institution & Unique Identifiers

## Objective

- Support **one user (institution admin) linked to multiple institutions** (e.g. head office + branches).
- Give each institution (and optionally each branch) a **unique, human-readable identifier** (in addition to UUID and registration number) so they are easy to identify in the UI and in exports.

## Requirements

1. **User–Institution relationship**
   - Replace the current “user has one institution” (`User.institution_id`) with a **many-to-many** relationship:
     - New join table: e.g. `UserInstitution` with `user_id`, `institution_id`, `role` (e.g. ADMIN, STAFF), `is_primary` (boolean), `created_at`.
   - Keep **backward compatibility** during migration: existing users have a single `institution_id`; after migration, ensure every user who had `institution_id` has exactly one row in the join table with `is_primary: true` (and optionally `role: ADMIN` for admins).

2. **Institution unique identifier**
   - Add to **Institution**:
     - `branch_code` (optional): short, unique per institution (e.g. "HQ", "CPT-01", "DBN-02"). Used for branches under the same legal entity.
     - Ensure **uniqueness**: either `(registration_number, branch_code)` unique (with branch_code nullable) or a single `unique_code` that combines org + branch for display (e.g. "REG123-HQ").
   - Keep `institution_id` (UUID) as primary key; keep `registration_number` as required. The new field(s) are for **identification and display**, not replacement of UUID.

3. **Branches vs separate institutions**
   - Decide and document:
     - **Option A:** Each branch is a separate **Institution** row (different `institution_id`), linked to the same admin via UserInstitution; use `branch_code` (and optionally a `parent_institution_id` if you want a hierarchy).
     - **Option B:** One Institution row per legal entity, with a separate **Branch** table (branch_id, institution_id, branch_code, address, etc.) and UserInstitution links users to Institution (and optionally to Branch).
   - **Recommendation:** Option A (multiple Institution rows per org) is simpler and reuses existing Institution fields (address, status, etc.); use `branch_code` and optionally `parent_institution_id` for “head office” grouping.

## Tasks

1. Design and add the **UserInstitution** model (and, if needed, **Branch** or **parent_institution_id** on Institution).
2. Add **Institution.branch_code** (optional, unique per registration_number or globally) and any **parent_institution_id** if using hierarchy.
3. Create a **migration** that:
   - Creates UserInstitution and new Institution columns.
   - Backfills UserInstitution from existing `User.institution_id` (one row per user with `is_primary: true`).
4. Plan **deprecation** of `User.institution_id`: either remove it in a later migration after all code uses UserInstitution, or keep it as a cached “primary” institution and keep it in sync with UserInstitution for a transition period.
5. Document the chosen approach (Option A vs B, uniqueness rules for branch_code) in this file or in `docs/MULTI_INSTITUTION_DATA_MODEL.md`.

## Completion Criteria

- [ ] UserInstitution (and any Branch/parent_institution_id) exists and is migrated.
- [ ] Institution has a unique-identifier strategy (branch_code and/or unique_code) and uniqueness is enforced in DB.
- [ ] Existing users with `institution_id` have corresponding UserInstitution row(s); no data loss.
- [ ] Documentation updated.

---

# PROMPT 2 — Invite & Accept: Allow Institution Admin Without Institution

## Objective

- When **PLATFORM_ADMIN** (or future invite creator) invites an **INSTITUTION_ADMIN**, allow the invite to be created **without** an institution (`institution_id` null).
- On **accept**, create the user with **no institution** linked yet (`institution_id` null and no UserInstitution rows); they will add institution(s) during onboarding.

## Requirements

1. **Invite API** (`POST /api/invites`)
   - For role **INSTITUTION_ADMIN** only: allow `institution_id` to be **omitted or null**.
   - For INSTITUTION_STAFF and STUDENT: keep current behaviour (institution required when invited by PLATFORM_ADMIN; when invited by INSTITUTION_ADMIN, use creator’s institution).
   - Validation: if `role === "INSTITUTION_ADMIN"`, do **not** require `institution_id`. If `role` is INSTITUTION_STAFF or STUDENT, require either `institution_id` (from body) or creator’s institution (for INSTITUTION_ADMIN creator).

2. **Bulk invite API** (`POST /api/invites/bulk`)
   - Same rule: for each invite with role INSTITUTION_ADMIN, `institution_id` is optional; for INSTITUTION_STAFF/STUDENT, institution must be resolvable (body or creator).

3. **Accept invite** (`POST /api/invites/accept` or equivalent)
   - When `invite.institution_id` is null and role is INSTITUTION_ADMIN: create user with `institution_id: null` and **no** UserInstitution rows (or, if User.institution_id is removed, simply create user without institution links).
   - Do not require institution on accept for INSTITUTION_ADMIN when invite has no institution.
   - Ensure onboarding is required for this user (they already get `onboarding_completed: false`).

## Tasks

1. In **invites route** (single and bulk): relax validation so INSTITUTION_ADMIN can have `institution_id` null.
2. In **accept route**: when `invite.institution_id == null` and role is INSTITUTION_ADMIN, create user without institution; do not fail or default to a random institution.
3. Add a short comment in code: “Institution admin may add institution(s) during onboarding.”
4. (Optional) In invite UI (platform-admin): when role is INSTITUTION_ADMIN, make institution dropdown/field optional and show helper text: “Institution can be left blank; admin will add institution(s) during onboarding.”

## Completion Criteria

- [ ] PLATFORM_ADMIN can create an invite for INSTITUTION_ADMIN with no institution.
- [ ] Accepting that invite creates a user with no institution linked; user can log in and is redirected to institution onboarding.
- [ ] INSTITUTION_STAFF and STUDENT invites still require an institution (unchanged).
- [ ] No regression for existing invite/accept flows that include institution_id.

---

# PROMPT 3 — Institution Admin Onboarding: Add Institution(s)

## Objective

- **Institution admin onboarding** must allow the admin to **add one or more institutions** (name, registration number, address, province, contact, and optional branch code).
- Each institution gets a **unique identifier** (branch_code or equivalent) so they are easy to identify.
- On completion, create Institution record(s) and link the user via UserInstitution (and set primary if single, or first added = primary).
- If the user already has an institution (e.g. invited with institution_id), skip “add institution” step or show existing and allow adding more.

## Requirements

1. **Onboarding steps**
   - Step 1 (or 0): **Add institutions** — form to add at least one institution:
     - Legal name, trading name (optional), institution type, registration number, physical/postal address, province, contact person/email/phone, optional **branch code** (unique per institution or per registration_number).
     - “Add another institution/branch” to add more (e.g. same legal entity different branch, or different institutions).
     - Validation: at least one institution; registration_number required; branch_code unique where applicable; province from allowed list.
   - Step 2: **Acknowledge responsibilities** (current content of InstitutionAdminOnboardingWizard).
   - Step 3: **Complete** — POST to complete onboarding: create Institution(s), create UserInstitution row(s), set onboarding_completed true, then redirect to institution dashboard.

2. **API for onboarding**
   - **POST /api/institution/onboarding/complete** (or equivalent):
     - Body: `{ institutions: [{ legal_name, trading_name?, institution_type, registration_number, branch_code?, physical_address, postal_address?, province, contact_person_name?, contact_email?, contact_number? }, ...], acknowledged: true }`.
     - Create Institution record(s) (status DRAFT or as per product rule).
     - Create UserInstitution row(s) for current user; first institution = primary (`is_primary: true`).
     - Set user.onboarding_completed = true (and optionally update session).
     - Return success and list of created institution IDs/codes.
   - If user already has institutions (e.g. invited with institution_id), either:
     - Allow completing with no new institutions (just acknowledge), or
     - Allow adding more institutions in the same payload; link existing + new.

3. **Unique identifiers**
   - When creating Institution, set `branch_code` if provided; enforce uniqueness (e.g. unique on (registration_number, branch_code) or global unique on branch_code).
   - Display in UI: e.g. “Legal Name (REG123-HQ)” or “Legal Name — Branch HQ” so users can easily tell branches apart.

4. **UI**
   - Multi-step wizard: Add institution(s) → Acknowledge → Complete.
   - “Add another institution” adds another form block; list of institutions with option to remove before submit.
   - Clear labels for branch code (e.g. “Branch or location code (e.g. HQ, CPT-01)”).
   - Client-side validation before calling complete API; server-side validation in API.

## Tasks

1. Extend **InstitutionAdminOnboardingWizard** (or replace) with multi-step flow: add institutions → acknowledge → complete.
2. Implement **institution form** (one or more): legal name, registration number, address, province, contact, optional branch_code; “Add another” and remove.
3. Implement **POST /api/institution/onboarding/complete** (or adjust existing) to accept `institutions` array, create Institution(s), create UserInstitution(s), set onboarding_completed.
4. Enforce **branch_code** uniqueness in API (and in DB if not already).
5. If user already has institutions (e.g. from invite), either prefill or skip “add institution” step and only show acknowledge + complete.
6. After completion, redirect to institution dashboard; ensure layout and dashboard load using new UserInstitution (or primary institution).

## Completion Criteria

- [ ] Institution admin without an institution can complete onboarding by adding at least one institution (with required fields and optional branch code).
- [ ] Institution admin can add multiple institutions in one onboarding flow.
- [ ] Each institution has a unique identifier (branch_code or equivalent) and is displayed clearly in UI.
- [ ] API creates Institution(s) and UserInstitution(s) correctly; user can access institution area after onboarding.
- [ ] Existing institution admins (invited with institution) still complete onboarding without being forced to re-add their institution (skip or prefill).

---

# PROMPT 4 — Application Logic: Multi-Institution Scoping & Context

## Objective

- **All institution-scoped data** (readiness, learners, enrolments, staff, documents, etc.) must respect **multiple institutions** when the user has more than one (via UserInstitution).
- Provide a way for the user to **switch context** (current institution) when they have multiple, and persist that choice (e.g. cookie or session).
- Ensure **backward compatibility**: users with only one institution (or only `institution_id` during transition) behave as today.

## Requirements

1. **Resolving “current institution”**
   - If using **UserInstitution** only: “current institution” = one of the user’s institutions, chosen by:
     - Stored preference (e.g. cookie `current_institution_id` or session), or
     - Primary institution (`is_primary: true`), or
     - First by created_at.
   - If **User.institution_id** is still present during transition: treat it as “primary” and keep it in sync with UserInstitution.primary when there is a single institution.

2. **Data access**
   - All queries that currently filter by `user.institution_id` (or `ctx.institutionId`) must be updated to:
     - Either filter by “user’s current institution” (single ID from context), or
     - Or filter by “any of user’s institutions” (e.g. `where: { institution_id: { in: userInstitutionIds } }`) depending on the feature (e.g. dashboard may show all; readiness list may be per current institution).
   - Document which pages use “current institution” vs “all my institutions”.

3. **Context switcher**
   - In institution layout (e.g. sidebar or header): if the user has more than one institution, show a **dropdown or selector** to switch “current institution.” On change, update cookie/session and optionally revalidate or redirect so subsequent data reflects the new context.
   - Show current institution name (and branch code if present) in the selector.

4. **APIs**
   - All institution-scoped API routes that use `ctx.institutionId` must:
     - Resolve “current institution” from UserInstitution + cookie/session when user has multiple;
     - Or accept an optional `institution_id` query/body for context and validate that it belongs to the user’s institutions.
   - Ensure platform-admin and QCTO flows that reference “the institution” still work (e.g. by institution_id in URL or body).

5. **Migration and backward compatibility**
   - Users with only one institution (or only `User.institution_id`): after migration they have one UserInstitution row; “current institution” is that one; no UI change needed.
   - No duplicate data; no broken links to readiness/learners/documents after migration.

## Tasks

1. Introduce **current institution resolution** (helper or middleware): from session + UserInstitution (+ cookie), return current institution ID and list of all institution IDs for the user.
2. Update **institution layout** to pass current institution (and list) to children; add **context switcher** when user has multiple institutions.
3. Update **all institution-scoped API routes** to use “current institution” or “institution IDs for user” instead of only `ctx.institutionId` (or keep ctx.institutionId in sync with current institution from UserInstitution).
4. Update **institution pages** (dashboard, readiness, learners, staff, documents, etc.) to use current-institution context; ensure lists and creates are scoped correctly.
5. Add **tests or manual checklist** for: single-institution user, multi-institution user, context switch, and platform-admin viewing an institution.
6. Document in `docs/MULTI_INSTITUTION_APPLICATION_LOGIC.md` (or in this file): how current institution is resolved, where context switcher lives, and which queries use current vs all institutions.

## Completion Criteria

- [ ] Users with multiple institutions see a context switcher and can switch; current institution is persisted and used for scoped data.
- [ ] All institution-scoped APIs and pages work for both single- and multi-institution users.
- [ ] No regression for single-institution users (including those still on User.institution_id during transition).
- [ ] Documentation of resolution and scoping rules is in place.

---

# Summary Checklist

- [ ] **Prompt 1:** Data model has UserInstitution, Institution unique identifiers (e.g. branch_code), migration and backfill done.
- [ ] **Prompt 2:** Invite and accept allow INSTITUTION_ADMIN without institution; onboarding is required for them.
- [ ] **Prompt 3:** Institution admin onboarding lets them add one or more institutions with unique identifiers; API creates Institution(s) and UserInstitution(s).
- [ ] **Prompt 4:** App uses “current institution” and “all my institutions”; context switcher for multi-institution; all scoped logic updated and documented.

Use these prompts in sequence; validate each step (data, invite/accept, onboarding, app logic) before moving to the next.
