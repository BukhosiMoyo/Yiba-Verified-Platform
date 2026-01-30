# Multi-Institution Data Model (Prompt 1)

This document describes the data model changes for **multi-institution support** and **unique identifiers** (Prompt 1).

## Approach: Option A (Multiple Institution Rows per Org)

We use **Option A**: each branch or location is a separate **Institution** row (different `institution_id`), linked to the same admin via **UserInstitution**. This reuses existing Institution fields (address, status, etc.) and avoids a separate Branch table.

- **Head office** and **branches** are each an `Institution` row.
- **branch_code** (optional) identifies the branch/location (e.g. `"HQ"`, `"CPT-01"`, `"DBN-02"`).
- **parent_institution_id** (optional) links a branch to its head office for hierarchy/grouping.

## Schema Changes

### 1. Institution

| New field | Type | Description |
|-----------|------|-------------|
| **branch_code** | `String?` | Short, globally unique code for the branch/location (e.g. HQ, CPT-01). Used for display and identification. Multiple NULLs allowed. |
| **parent_institution_id** | `String?` | Optional FK to head office when this row is a branch. Self-reference to `Institution.institution_id`. |

- **Uniqueness:** `branch_code` has a unique constraint. When provided, it must be unique across all institutions. When NULL, multiple institutions can have no branch code (e.g. single-location orgs).
- **Relations:** `parent` → head office, `branches` → child institutions; `userInstitutions` → UserInstitution join.

### 2. UserInstitution (new join table)

Many-to-many between User and Institution. One user can belong to multiple institutions (e.g. admin for head office + branches).

| Field | Type | Description |
|-------|------|-------------|
| **user_id** | `String` | FK to User. Part of composite PK. |
| **institution_id** | `String` | FK to Institution. Part of composite PK. |
| **role** | `UserInstitutionRole` | Role within this institution: `ADMIN` or `STAFF`. Default `ADMIN`. |
| **is_primary** | `Boolean` | Primary institution for this user (e.g. default context). Default `false`. |
| **created_at** | `DateTime` | When the link was created. |

- **Primary key:** `(user_id, institution_id)`.
- **UserInstitutionRole enum:** `ADMIN`, `STAFF`.

### 3. User.institution_id (kept for transition)

- **User.institution_id** is **kept** for backward compatibility. It acts as the “primary” institution during the transition period.
- Application code can resolve “current institution” from **UserInstitution** (where `is_primary = true`) or fall back to **User.institution_id** until all code uses UserInstitution.
- A later phase can deprecate **User.institution_id** and rely only on UserInstitution; until then, keep it in sync when the primary institution changes (e.g. in onboarding or context switcher).

## Migration and Backfill

- **Migration:** `20260128000000_add_multi_institution_user_institution_branch_code`
  - Creates enum **UserInstitutionRole**.
  - Adds **Institution.branch_code** and **Institution.parent_institution_id** (with unique/index and FK).
  - Creates **UserInstitution** table and FKs.
  - **Backfill:** Inserts one **UserInstitution** row per user that has `User.institution_id` set: `role = ADMIN`, `is_primary = true`. Uses `ON CONFLICT DO NOTHING` so the migration is safe to run after the table already exists (e.g. if backfill was run separately).

## Unique Identifiers

- **institution_id** (UUID): Primary key; use for APIs and foreign keys.
- **registration_number**: Required; identifies the legal entity (can be shared across branches).
- **branch_code** (optional): Human-readable, globally unique when set. Use for display (e.g. “Legal Name (REG123-HQ)”) and for identifying branches. When NULL, the institution is typically the only or main location for that registration number.

## Completion Criteria (Prompt 1)

- [x] UserInstitution model exists and is migrated.
- [x] Institution has **branch_code** (unique when set) and **parent_institution_id** (optional hierarchy).
- [x] Existing users with **User.institution_id** have a corresponding **UserInstitution** row (backfill in migration).
- [x] **User.institution_id** kept for transition; document sync strategy when primary changes (Prompt 4).
