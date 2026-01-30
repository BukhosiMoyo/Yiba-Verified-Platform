# Multi-Institution — Quick Reference (Copy-Paste Prompts)

Short, self-contained prompts you can copy-paste for an AI or developer. Each references the full doc.

---

## Prompt A — Data Model (use first)

```
We need to support multiple institutions per institution admin (branches, multiple locations) and unique identifiers per institution.

1. Add a many-to-many relationship between User and Institution (e.g. UserInstitution: user_id, institution_id, is_primary, role).
2. Add to Institution: branch_code (optional, unique per registration_number or globally) for easy identification.
3. Migrate: backfill UserInstitution from existing User.institution_id (one row per user, is_primary true).
4. Plan deprecation of User.institution_id or keep it in sync with primary for transition.

Follow the data model and migration steps in docs/MULTI_INSTITUTION_IMPLEMENTATION_PROMPTS.md — PROMPT 1. Ensure uniqueness for branch_code and document Option A (multiple Institution rows per org) vs Option B (Branch table).
```

---

## Prompt B — Invite & Accept (use second)

```
Institution admins should be allowed to sign up without belonging to an institution; they will add institution(s) during onboarding.

1. In POST /api/invites and bulk: allow institution_id to be null/omitted when role is INSTITUTION_ADMIN.
2. In accept-invite: when invite.institution_id is null and role is INSTITUTION_ADMIN, create user with no institution linked (institution_id null and no UserInstitution rows).
3. Do not require institution for INSTITUTION_ADMIN invites; keep requirement for INSTITUTION_STAFF and STUDENT.

Follow docs/MULTI_INSTITUTION_IMPLEMENTATION_PROMPTS.md — PROMPT 2.
```

---

## Prompt C — Institution Admin Onboarding (use third)

```
Institution admin onboarding must let them add one or more institutions (with unique identifiers) before completing.

1. Multi-step onboarding: (1) Add institutions — form with legal name, registration number, address, province, contact, optional branch_code; "Add another institution/branch"; (2) Acknowledge responsibilities; (3) Complete.
2. API: POST /api/institution/onboarding/complete accepts institutions[] array; creates Institution(s) and UserInstitution(s), sets onboarding_completed.
3. Enforce branch_code uniqueness; display institutions with branch code in UI (e.g. "Legal Name (REG123-HQ)").
4. If user already has an institution (invited with one), skip add step or prefill; still allow adding more.

Follow docs/MULTI_INSTITUTION_IMPLEMENTATION_PROMPTS.md — PROMPT 3.
```

---

## Prompt D — Application Logic & Context (use fourth)

```
All institution-scoped data must respect multiple institutions and a "current institution" context.

1. Resolve "current institution" from UserInstitution + cookie/session (or primary).
2. Add context switcher in institution layout when user has multiple institutions.
3. Update all institution-scoped APIs and pages to use current institution (or "all my institutions" where appropriate).
4. Keep backward compatibility for single-institution users.

Follow docs/MULTI_INSTITUTION_IMPLEMENTATION_PROMPTS.md — PROMPT 4.
```

---

## Single combined prompt (high level)

```
Implement multi-institution support and institution-admin onboarding as follows:

1. Data: UserInstitution many-to-many; Institution.branch_code (unique); migrate from User.institution_id.
2. Invite: Allow INSTITUTION_ADMIN invite without institution_id; accept creates user with no institution.
3. Onboarding: Institution admin onboarding adds one or more institutions (with branch codes), then acknowledge and complete; API creates Institution(s) and UserInstitution(s).
4. App: Resolve "current institution" from UserInstitution + session; add context switcher; scope all institution data to current or all user institutions.

Apply in order. Full details, tasks, and completion criteria: docs/MULTI_INSTITUTION_IMPLEMENTATION_PROMPTS.md. Entry point: docs/MULTI_INSTITUTION_MASTER_PROMPT.md.
```

Use **Prompt A → B → C → D** in sequence, or the combined prompt for a high-level pass, then drill into each section in the main doc.
