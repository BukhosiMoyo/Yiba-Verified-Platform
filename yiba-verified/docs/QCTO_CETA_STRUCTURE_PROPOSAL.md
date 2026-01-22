# 🏛️ QCTO & CETA (SETA) Account Structure – Research & Proposal

## Document Status: **PROPOSAL FOR APPROVAL** ⚠️

**Do NOT implement until this proposal is approved.**

---

## Deliverable 1: Verified Real-World Summary

### What is QCTO?

The **Quality Council for Trades and Occupations (QCTO)** is a public entity established in 2010 under the Skills Development Act (Act 97 of 1998). It operates as a national body headquartered in Pretoria.

**Key Responsibilities:**
- Design, implementation, assessment, and certification of occupational qualifications under the Occupational Qualifications Sub-Framework (OQSF)
- Accreditation of Skills Development Providers (SDPs) and Assessment Centres
- Development and registration of occupational qualifications
- Oversight of External Integrated Summative Assessment (EISA)
- Certification of qualifications and trade certificates
- Quality assurance for occupational qualifications
- Research and knowledge development

**Structure:**
- **National entity** (head office in Pretoria)
- **No provincial offices** (conducts provincial workshops/capacity building, but centrally managed)
- Organized into directorates: Accreditations, Assessment, Certification, Qualifications Development, Quality Assurance, Corporate Services, etc.
- Council (governing body) with standing committees

### What are CETAs/SETAs?

**Sector Education and Training Authorities (SETAs)** are sector-specific bodies. There are **21 SETAs** in South Africa, each covering specific economic sectors (e.g., CETA for Construction, EWSETA for Energy & Water, etc.).

**Historical Context:**
- Previously, SETAs had independent authority to accredit providers and develop qualifications
- As of **30 June 2024**, SETAs **lost independent accreditation authority** for occupational qualifications
- All new occupational qualification accreditation is now handled by **QCTO only**

**Current SETA Roles (Post-June 2024):**
1. **Development Quality Partner (DQP)**: Develop occupational qualifications (in consultation with industry), submit to QCTO for registration
2. **Assessment Quality Partner (AQP)**: Manage External Integrated Summative Assessments (EISA), accredit assessment centres, develop assessment tools, recommend Assessment Centres to QCTO
3. **Quality Assurance Partner (QAP)**: Continue quality assurance for "legacy" qualifications (pre-June 2024) until 30 June 2027 (teach-out period)
4. **Funding & Sector Planning**: Manage levies, grants, Workplace Skills Plans (WSP), Annual Training Reports (ATR), stakeholder engagement

**Key Changes:**
- SETAs no longer issue new accreditations for occupational qualifications
- All SDPs must now be accredited by **QCTO directly**
- SETAs operate in **delegated roles** under QCTO oversight
- Legacy qualifications (pre-June 2024) remain valid until June 2027 with SETA oversight

### Provincial Context

**QCTO:**
- **National entity** - no provincial offices
- Staff may be assigned to provincial oversight/engagement, but organizationally national
- Conducts provincial workshops, but operations are centrally managed

**SETAs:**
- Typically **national** in scope, but may have:
  - Provincial/regional offices
  - Provincial coordinators or staff
  - Sector-specific provincial focus areas
- Provincial assignments depend on SETA structure (varies by SETA)

**Institutions:**
- Institutions have a physical address in a specific **province** (required field)
- Provincial context matters for:
  - QCTO oversight and engagement
  - SETA coordination (where applicable)
  - Regional accreditation reviews
  - Provincial reporting and compliance

---

## Deliverable 2: Proposed Platform Account Hierarchies (Options)

### Current State Analysis

**What exists now:**
- `QCTOOrg` model: Single entity with `id`, `name` (default "QCTO"), `members` (Users), `invites`
- `User` model: Has `qcto_id` field linking to `QCTOOrg`
- User roles: `QCTO_SUPER_ADMIN`, `QCTO_ADMIN`, `QCTO_USER`, `QCTO_REVIEWER`, `QCTO_AUDITOR`, `QCTO_VIEWER`
- No CETA/SETA model exists
- No provincial assignment for QCTO users
- Institutions have `province` field (required)

**Gaps identified:**
1. No model for SETAs/CETAs
2. No relationship between QCTO and SETAs
3. No SETA admin/staff roles
4. No provincial context for QCTO staff assignments
5. No distinction between QCTO central staff and SETA-delegated staff

---

### Option 1: Hierarchical Organization Model (Recommended)

**Structure:**
```
Platform Admin
└── QCTO (National Organization)
    ├── QCTO Central Staff
    │   ├── QCTO_SUPER_ADMIN
    │   ├── QCTO_ADMIN
    │   ├── QCTO_USER
    │   ├── QCTO_REVIEWER
    │   ├── QCTO_AUDITOR
    │   └── QCTO_VIEWER
    └── SETA/CETA Organizations (multiple)
        ├── SETA_SUPER_ADMIN (optional, for SETA management)
        ├── SETA_ADMIN
        ├── SETA_USER
        ├── SETA_REVIEWER
        └── SETA_AUDITOR
            └── [Provincial assignment where applicable]
```

**Key Features:**
- Single `QCTOOrg` entity (national)
- New `SETOrg` model for each SETA/CETA
- SETAs have `parent_org_id` → `QCTOOrg` (or `governing_body_type` enum)
- QCTO users: `qcto_id` → `QCTOOrg`, `province` optional/nullable
- SETA users: `seta_id` → `SETOrg`, `province` optional/nullable (set when provincial)
- Users belong to ONE organization (QCTO OR SETA, not both)
- Clear hierarchy: QCTO oversees SETAs

**Permissions:**
- QCTO users can access all institutions (subject to submission/request access rules)
- SETA users can access institutions they oversee (delegated by QCTO, sector-specific)
- QCTO_SUPER_ADMIN can manage SETA organizations
- Platform Admin manages everything

**Pros:**
- Clear organizational hierarchy
- Reflects real-world structure (QCTO → SETAs)
- Supports delegated roles
- Scalable for 21 SETAs
- Allows provincial assignment where needed

**Cons:**
- More complex model
- Requires new SETOrg model
- Need to migrate existing QCTO users

---

### Option 2: Unified Governing Body Model

**Structure:**
```
Platform Admin
└── Governing Bodies (unified)
    ├── QCTO (type: QCTO)
    │   ├── QCTO_SUPER_ADMIN
    │   ├── QCTO_ADMIN
    │   ├── QCTO_USER
    │   └── [all QCTO roles]
    └── SETA/CETA (type: SETA)
        ├── SETA_ADMIN
        ├── SETA_USER
        ├── SETA_REVIEWER
        └── [provincial assignment]
```

**Key Features:**
- Single `GoverningBody` model with `type` enum: `QCTO` | `SETA`
- `parent_body_id` nullable (SETA → QCTO)
- Users have `governing_body_id` and `governing_body_type`
- QCTO is one governing body, each SETA is another
- Simpler model, unified structure

**Pros:**
- Simpler schema (one model instead of two)
- Easier to query "all governing bodies"
- Flexible for future organization types

**Cons:**
- Less explicit hierarchy (relying on `parent_body_id`)
- May be less clear in code which type you're working with
- More generic, less domain-specific

---

### Option 3: Role-Based with Organization Tags (Simplest)

**Structure:**
```
Platform Admin
└── Organizations
    ├── QCTO (single entity)
    │   └── Users with QCTO_* roles
    └── SETAs (tags on users)
        └── Users with SETA_* roles + seta_organization_name
```

**Key Features:**
- Keep `QCTOOrg` as-is
- Add `seta_name` field to User (nullable string)
- New roles: `SETA_ADMIN`, `SETA_USER`, etc.
- No separate SETA model
- QCTO users: `qcto_id` set
- SETA users: `qcto_id` null, `seta_name` set

**Pros:**
- Minimal schema changes
- Quick to implement
- Simple to understand

**Cons:**
- No explicit SETA entity (can't track SETA metadata)
- Harder to manage SETA relationships
- Less structured for reporting
- Doesn't support SETA-to-institution relationships well

---

## Recommendation: **Option 1 (Hierarchical Organization Model)**

**Rationale:**
- Best reflects real-world structure (QCTO → SETAs)
- Supports delegated roles and provincial assignments
- Scalable and auditable
- Clear permission hierarchy
- Allows SETA-specific features (e.g., sector assignments, SETA-specific reports)

---

## Deliverable 3: Required Fields & Relationships

### Schema Changes for Option 1

#### New Model: `SETOrg`

```prisma
model SETOrg {
  id                String       @id @default(cuid())
  name              String       // e.g., "CETA", "EWSETA"
  acronym           String       @unique // e.g., "CETA", "EWSETA"
  description       String?      @db.Text
  sector            String?      // e.g., "Construction", "Energy & Water"
  qcto_id           String       // Parent QCTO organization
  province          String?      // Nullable - some SETAs are provincial, most are national
  contact_email     String?
  contact_phone     String?
  status            String       @default("ACTIVE") // ACTIVE, SUSPENDED
  created_at        DateTime     @default(now())
  updated_at        DateTime     @updatedAt
  
  qctoOrg           QCTOOrg      @relation(fields: [qcto_id], references: [id])
  members           User[]
  invites           SETAInvite[]
  
  @@index([qcto_id])
  @@index([acronym])
}
```

#### Updates to `QCTOOrg`

```prisma
model QCTOOrg {
  id         String       @id @default(cuid())
  name       String       @default("QCTO")
  created_at DateTime     @default(now())
  updated_at DateTime     @updatedAt // Add this
  
  members    User[]
  invites    QCTOInvite[]
  setas      SETOrg[]     // Add relation to SETAs
}
```

#### Updates to `User` Model

```prisma
model User {
  // ... existing fields ...
  
  qcto_id            String?      // Existing - keep for QCTO users
  seta_id            String?      // NEW - for SETA users
  default_province    String?      // NEW - required for QCTO roles (except QCTO_SUPER_ADMIN), shows employment location
  assigned_provinces String[]      @default([]) // NEW - array of provinces user can access (multiple provinces allowed)
  
  // ... existing relations ...
  
  qctoOrg            QCTOOrg?     @relation(fields: [qcto_id], references: [id])
  setaOrg            SETOrg?      @relation(fields: [seta_id], references: [id]) // NEW
  reviewAssignments  ReviewAssignment[] @relation("ReviewAssignments") // NEW - reviews assigned to this user
  reviewAssignmentsBy ReviewAssignment[] @relation("ReviewAssignmentsBy") // NEW - reviews assigned by this user
  
  // Validation: user can belong to QCTO OR SETA, not both
  // Enforce in application logic: if qcto_id set, seta_id must be null
  // Validation: default_province must be in assigned_provinces array
  // Validation: QCTO roles (except QCTO_SUPER_ADMIN) must have default_province
}
```

#### New User Roles

```prisma
enum UserRole {
  // ... existing roles ...
  
  SETA_ADMIN      // NEW - SETA administrator
  SETA_USER       // NEW - SETA staff/user
  SETA_REVIEWER   // NEW - SETA reviewer
  SETA_AUDITOR    // NEW - SETA auditor
  // Note: No SETA_SUPER_ADMIN (QCTO_SUPER_ADMIN manages SETAs)
}
```

#### New Model: `SETAInvite` (optional, for consistency)

```prisma
model SETAInvite {
  id                 String           @id @default(cuid())
  seta_id            String
  email              String
  full_name          String
  role               UserRole         // Must be SETA_* role
  token_hash         String           @unique
  status             QCTOInviteStatus @default(PENDING) // Reuse enum
  created_at         DateTime         @default(now())
  expires_at         DateTime
  accepted_at        DateTime?
  invited_by_user_id String
  
  setaOrg            SETOrg           @relation(fields: [seta_id], references: [id], onDelete: Cascade)
  invitedBy          User             @relation(fields: [invited_by_user_id], references: [user_id])
  
  @@index([seta_id])
  @@index([email])
}
```

#### Updates to `Institution` (optional - for SETA oversight)

```prisma
model Institution {
  // ... existing fields ...
  
  primary_seta_id    String?      // NEW - optional, if institution works primarily with a SETA
  
  // ... existing relations ...
  
  primarySETA        SETOrg?      @relation(fields: [primary_seta_id], references: [id]) // NEW
}
```

### Minimum Required Changes (MVP)

**Essential (Must Have):**
1. ✅ New `SETOrg` model with `qcto_id` relation
2. ✅ Add `seta_id` to `User` model
3. ✅ Add `province` to `User` model (optional)
4. ✅ New SETA roles: `SETA_ADMIN`, `SETA_USER`, `SETA_REVIEWER`, `SETA_AUDITOR`
5. ✅ Update `QCTOOrg` to include `setas` relation
6. ✅ Application logic: enforce `qcto_id` XOR `seta_id` (user belongs to one)

**Nice to Have (Can Add Later):**
- `SETAInvite` model (start with manual user creation)
- `primary_seta_id` on Institution (can be added in v2)
- SETA-specific metadata (sector, contact info) - can start minimal

#### New Model: `ReviewAssignment` (for fail-safe multiple reviewer assignments)

```prisma
model ReviewAssignment {
  id              String   @id @default(uuid())
  review_type     String   // "READINESS", "SUBMISSION", etc.
  review_id       String   // ID of the review (readiness_id, submission_id, etc.)
  assigned_to     String   // User ID of the reviewer
  assigned_by     String   // User ID who made the assignment (QCTO_ADMIN or PLATFORM_ADMIN)
  assigned_at     DateTime @default(now())
  status          String   @default("ASSIGNED") // ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
  completed_at    DateTime?
  notes           String?  @db.Text // Optional notes about the assignment
  
  reviewer        User     @relation("ReviewAssignments", fields: [assigned_to], references: [user_id])
  assigner        User     @relation("ReviewAssignmentsBy", fields: [assigned_by], references: [user_id])
  
  @@unique([review_type, review_id, assigned_to]) // One assignment per reviewer per review
  @@index([assigned_to])
  @@index([review_type, review_id])
  @@index([status])
}
```

### Data Validation Rules

1. **User Organization Assignment:**
   - User MUST have EITHER `qcto_id` OR `seta_id`, not both
   - Exception: Platform Admin users (both null)

2. **Role Validation:**
   - If `qcto_id` set → role must be `QCTO_*`
   - If `seta_id` set → role must be `SETA_*`
   - Platform Admin → `PLATFORM_ADMIN`, both org IDs null

3. **Province Assignment:**
   - **QCTO_SUPER_ADMIN**: `default_province` optional (can be null/national)
   - **QCTO_ADMIN, QCTO_USER, QCTO_REVIEWER, QCTO_AUDITOR, QCTO_VIEWER**: `default_province` REQUIRED
   - **All QCTO roles**: Can have multiple provinces in `assigned_provinces` array
   - **Default province**: Must be included in `assigned_provinces` array
   - **Province management**: Only QCTO_SUPER_ADMIN, QCTO_ADMIN, or PLATFORM_ADMIN can edit province assignments
   - SETA users: `default_province` optional (set if provincial staff)
   - Institution users: `province` derived from institution (no direct field)

4. **Review Assignment:**
   - Reviews can be assigned to multiple reviewers simultaneously (fail-safe)
   - Reviewers must have the review's province in their `assigned_provinces` array
   - QCTO_SUPER_ADMIN can be assigned to reviews from any province

---

## Deliverable 4: Impact & Migration Assessment

### What Stays the Same ✅

1. **Institutions**: No changes to Institution model (except optional `primary_seta_id`)
2. **Students**: No changes to Learner or Student user model
3. **Platform Admins**: No changes (still `role = PLATFORM_ADMIN`, no org assignment)
4. **Enrolments, Readiness, Submissions**: No schema changes
5. **Documents, Attendance, etc.**: No changes
6. **RBAC Logic**: Core permission checking logic remains (QCTO vs Institution vs Student)

### What Must Change ⚠️

1. **User Model:**
   - Add `seta_id` field (nullable)
   - Add `province` field (nullable)
   - Add `setaOrg` relation

2. **New Models:**
   - Create `SETOrg` model
   - Create initial SETA records (21 SETAs)

3. **QCTOOrg Model:**
   - Add `setas` relation
   - Add `updated_at` field

4. **User Roles:**
   - Add 4 new SETA roles

5. **Application Logic:**
   - Update user creation/validation (enforce QCTO XOR SETA)
   - Update RBAC checks to handle SETA users
   - Update invitation flows (QCTO vs SETA)
   - Update UI to show SETA organizations
   - Update API routes to handle SETA context

6. **Seed Data:**
   - Update seed scripts to create SETAs
   - Create SETA users for testing
   - Migrate existing QCTO users (verify `qcto_id` is set)

### Migration Strategy

**Phase 1: Schema Migration (Non-Breaking)**
1. Add `seta_id`, `province` to User (nullable, safe)
2. Create `SETOrg` model
3. Create `SETAInvite` model (if using)
4. Add relations (backwards compatible)
5. Run migration: `npx prisma migrate dev --name add_seta_structure`

**Phase 2: Data Migration**
1. Verify all existing QCTO users have `qcto_id` set (should already be true)
2. Create 21 SETA organization records (manual or seed script)
3. No user migration needed (existing users stay as-is)

**Phase 3: Application Updates**
1. Update user creation/validation logic
2. Update RBAC functions to recognize SETA roles
3. Update API routes to handle SETA context
4. Update UI for SETA management
5. Add SETA invitation flow (if using)

**Phase 4: Testing**
1. Test QCTO user flows (should work as before)
2. Test SETA user flows (new)
3. Test permission boundaries (QCTO vs SETA vs Institution)
4. Test provincial assignments

### Breaking Changes Assessment

**Low Risk:**
- Adding nullable fields (`seta_id`, `province`) is safe
- Existing QCTO users continue to work
- Existing permissions logic mostly unchanged

**Medium Risk:**
- RBAC updates need thorough testing
- API route updates may affect QCTO user flows
- UI changes for SETA management

**Mitigation:**
- Feature flags for SETA features (can disable if issues)
- Backwards compatibility: QCTO users work as before
- Phased rollout: enable SETA features after QCTO verified

### Test Data Strategy

**After Approval:**
1. **Delete existing test data** (production seed can be re-run)
2. **Create new seed script** that includes:
   - QCTO organization
   - 3-5 sample SETAs (CETA, EWSETA, etc.)
   - QCTO users (multiple roles)
   - SETA users (multiple roles, some with provinces)
   - Institutions (some linked to SETAs)
3. **Test all flows** with new structure

**Recommendation:**
- Wait for approval before deleting test data
- Create migration branch
- Test thoroughly before merging

---

## Provincial Assignment Requirements (CRITICAL)

### Key Requirements

1. **QCTO_SUPER_ADMIN**:
   - Can view, edit, and delete data from **ANY province** (no restrictions)
   - `default_province` is **optional** (can be null/national)
   - Dashboard/stats show **ALL provinces** (national view)

2. **All Other QCTO Roles** (QCTO_ADMIN, QCTO_USER, QCTO_REVIEWER, QCTO_AUDITOR, QCTO_VIEWER):
   - **`default_province` is REQUIRED** (shows where they're employed)
   - **Can have multiple provinces** in `assigned_provinces` array
   - All work, stats, and reviews filtered to assigned provinces
   - Dashboard/stats show only assigned provinces

3. **Review Assignment**:
   - Reviews can be assigned to **multiple reviewers simultaneously** (fail-safe feature)
   - Reviewers must have the review's province in their `assigned_provinces` array
   - QCTO_SUPER_ADMIN can be assigned to reviews from any province

4. **Province Assignment Management**:
   - **Who can edit**: QCTO_SUPER_ADMIN, QCTO_ADMIN, or PLATFORM_ADMIN
   - **When**: Based on work assignment requests
   - **What**: Can add/remove provinces from `assigned_provinces` array
   - **Default province**: Must always be included in `assigned_provinces` array

### Schema Fields Required

- `default_province` (String, nullable): Required for all QCTO roles except QCTO_SUPER_ADMIN
- `assigned_provinces` (String[], array): Array of provinces user can access (must include default_province)
- `ReviewAssignment` model: Tracks which reviewers are assigned to which reviews (multiple reviewers per review)

## Questions for Approval

1. **Which option do you prefer?** (Recommend Option 1)
2. **Should we implement `SETAInvite` now or later?**
3. **Should we add `primary_seta_id` to Institution now or in v2?**
4. **Which SETAs should we seed initially?** (All 21, or sample of 5-10?)
5. **Should SETA users have different permissions than QCTO users?** (e.g., SETA can only see institutions in their sector?)
6. **Review Assignment UI**: How should review assignments be managed? Separate page or inline in review details?

---

## Next Steps (After Approval)

Once approved, I will create:
1. **Migration files** for schema changes
2. **Updated seed script** with SETA data
3. **Implementation prompt** with detailed steps
4. **RBAC updates** for SETA roles
5. **API route updates** for SETA context
6. **UI updates** for SETA management

---

**Status**: ⏳ **Awaiting Approval**

**Created**: 2025
**Last Updated**: 2025
