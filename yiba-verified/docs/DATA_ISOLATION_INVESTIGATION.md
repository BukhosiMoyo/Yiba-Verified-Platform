# 🔍 Data Isolation Investigation & Fix Plan

## Executive Summary

**Critical Issue**: Student CV/Profile pages are displaying **hardcoded mock data** that is identical for ALL users, causing cross-user data leakage. This is a **data integrity and privacy violation**.

**Root Cause**: `StudentProfileClient.tsx` uses static mock data instead of fetching user-specific data from the database.

**Severity**: HIGH - Affects user trust, data privacy, and platform credibility.

---

## Investigation Findings

### 1. Problem Identification

#### Affected Components
- `/src/components/student/StudentProfileClient.tsx` - Main profile component
- `/src/app/student/profile/page.tsx` - Profile page route
- `/src/lib/student-profile-mock.ts` - Mock data source

#### Evidence of Data Leakage

**File**: `src/components/student/StudentProfileClient.tsx`

```typescript
// Lines 38-94: Hardcoded mock data used for ALL users
const mockStudentEditable: MockStudentEditable = {
  photoUrl: null,
  bio: "Experienced in project coordination...", // Same for everyone
  skills: ["Project Management", ...], // Same for everyone
  projects: [{ id: "p1", title: "Migration to cloud LMS", ... }], // Same for everyone
};

const mockStudentSystem: MockStudentSystem = {
  header: {
    name: "Kagiso Botha", // HARDCODED NAME - Same for all users!
    verifiedBy: "Demo College", // Same for all users
    institutions: [{ name: "Demo College", studentId: "STU-10482" }], // Same for all users
  },
  qualifications: [
    { title: "Occupational Certificate: Project Management", ... }, // Same for all users
  ],
  workplaceEvidence: {
    total: 12, // Same for all users
    recent: [
      { workplace: "Tech Solutions Pty Ltd", ... }, // Same for all users
    ],
  },
};

const mockCVs: CVVersionRow[] = [
  { id: "1", name: "Primary CV", ... }, // Same for all users
];
```

**Result**: Every student sees:
- Name: "Kagiso Botha"
- Same qualifications
- Same workplace evidence
- Same bio, skills, and projects

### 2. Correct Pattern (Reference Implementation)

**File**: `src/app/student/enrolments/page.tsx` (Lines 15-60)

```typescript
export default async function StudentEnrolmentsPage() {
  const session = await getServerSession(authOptions);
  const userId = session.user.userId;

  // ✅ CORRECT: Fetch learner using user_id from session
  const learner = await prisma.learner.findFirst({
    where: { user_id: userId, deleted_at: null },
    select: { learner_id: true },
  });

  // ✅ CORRECT: Fetch enrolments using learner_id
  const enrolments = await prisma.enrolment.findMany({
    where: { learner_id: learner.learner_id, deleted_at: null },
    // ... proper scoping
  });
}
```

**File**: `src/app/student/attendance/page.tsx` (Lines 15-58)

```typescript
// ✅ CORRECT: Same pattern - session → user_id → learner → related data
const learner = await prisma.learner.findFirst({
  where: { user_id: userId, deleted_at: null },
});
```

### 3. Data Model Relationships

From `prisma/schema.prisma`:

```
User (user_id)
  └─> Learner (user_id) [one-to-one, optional]
      ├─> Enrolment[] (learner_id)
      │   ├─> Qualification (qualification_id)
      │   ├─> AttendanceRecord[] (enrolment_id)
      │   └─> Institution (institution_id)
      ├─> PastQualification[] (learner_id)
      ├─> PriorLearning[] (learner_id)
      └─> Document[] (learner_id)
```

**Key Relationships**:
- `User.user_id` → `Learner.user_id` (unique, optional)
- `Learner.learner_id` → `Enrolment.learner_id`
- `Learner.learner_id` → `PastQualification.learner_id`
- `Learner.learner_id` → `PriorLearning.learner_id`

### 4. Data Scoping Requirements

All user-specific data MUST be scoped using:

1. **Session-based**: `session.user.userId` (from NextAuth)
2. **User → Learner**: `prisma.learner.findFirst({ where: { user_id: session.user.userId } })`
3. **Learner-scoped queries**: All subsequent queries MUST use `learner.learner_id`

**Critical Rule**: NEVER query without user/learner scoping. NEVER use hardcoded IDs or mock data for user-specific content.

---

## Internal Prompt for Fix

### Prompt: Fix Student Profile Data Isolation

**Context**: The student profile/CV page (`/student/profile`) is displaying hardcoded mock data that is identical for all users. This violates data isolation and privacy requirements.

**Task**: Replace all mock data in `StudentProfileClient.tsx` with real database queries that are properly scoped to the authenticated user.

**Requirements**:

1. **Convert to Server Component Pattern**:
   - Move data fetching to `src/app/student/profile/page.tsx` (server component)
   - Pass fetched data as props to `StudentProfileClient` (client component)
   - Follow the pattern used in `enrolments/page.tsx` and `attendance/page.tsx`

2. **Data Fetching Requirements**:
   - Get session using `getServerSession(authOptions)`
   - Get `user_id` from `session.user.userId`
   - Fetch `Learner` record: `prisma.learner.findFirst({ where: { user_id: userId } })`
   - If no learner exists, show appropriate empty state (not mock data)

3. **Required Data to Fetch**:

   **From Learner**:
   - `first_name`, `last_name` (for header name)
   - `national_id` (for student ID)
   - `institution_id` (to fetch institution name)

   **From Institution**:
   - `trading_name` or `legal_name` (for verified by)

   **From Enrolments**:
   - All enrolments for this learner
   - Qualification details (title, NQF level, status)
   - Institution details

   **From PastQualification**:
   - All past qualifications for this learner
   - Document links if available

   **From PriorLearning**:
   - All prior learning records for this learner
   - Convert to workplace evidence format

   **From User** (for editable fields - may need new table):
   - Bio, skills, projects (currently mocked)
   - Photo URL
   - CV versions/target roles

4. **Data Transformation**:
   - Map database records to the `MockStudentSystem` and `MockStudentEditable` types
   - Ensure all data is properly typed
   - Handle null/empty states gracefully

5. **CV Versions**:
   - Currently mocked as `mockCVs` array
   - Need to determine: Should CV versions be stored in DB? Or generated on-the-fly?
   - For now: Create a default CV version from learner data

6. **Editable Fields** (Bio, Skills, Projects):
   - Currently stored in component state (lost on refresh)
   - Need to create database schema or API to persist:
     - Student profile editable fields (bio, skills, projects)
     - CV versions with target roles
   - **OR** use existing `OnboardingProgress` if appropriate
   - **OR** create new `StudentProfile` table

7. **Validation**:
   - Verify that each user sees ONLY their own data
   - Test with multiple users to confirm isolation
   - Verify that new users see empty/initial state (not another user's data)

8. **Error Handling**:
   - Handle case where learner doesn't exist
   - Handle case where user has no enrolments
   - Handle case where data is incomplete

---

## Areas Requiring Data Isolation Audit

### ✅ Already Correct (Properly Scoped)
- `/student/enrolments` - Uses `user_id` → `learner_id` scoping
- `/student/attendance` - Uses `user_id` → `learner_id` scoping
- `/student/page` (dashboard) - Uses `user_id` → `learner_id` scoping

### ❌ Requires Fix
- `/student/profile` - **USES MOCK DATA** - No user scoping
- `/student/certificates` - **NEEDS AUDIT** - Verify user scoping

### 🔍 Needs Investigation
- CV PDF generation - Verify it uses user-specific data
- Public profile (`/p/[id]`) - Currently uses mock, but may be intentional for demo
- Any API routes that return student data without proper scoping

---

## Fix Implementation Plan

### Phase 1: Immediate Fix (Data Fetching)
1. ✅ Convert `StudentProfileClient` to accept props instead of using mock data
2. ✅ Update `student/profile/page.tsx` to fetch real data
3. ✅ Map database records to component props
4. ✅ Handle empty states properly

### Phase 2: Data Persistence (Editable Fields)
1. ⚠️ Design schema for student profile editable fields:
   - Option A: Add to `User` table (simple fields like bio)
   - Option B: Create `StudentProfile` table (more flexible)
   - Option C: Use JSON in `OnboardingProgress` (quick but less structured)
2. ⚠️ Create API routes for saving editable fields
3. ⚠️ Update component to persist changes

### Phase 3: CV Versions
1. ⚠️ Design schema for CV versions (if needed)
2. ⚠️ Implement CV version management
3. ⚠️ Update PDF generation to use real data

### Phase 4: Validation & Testing
1. ⚠️ Create test users with different data
2. ⚠️ Verify each user sees only their data
3. ⚠️ Test edge cases (no learner, no enrolments, etc.)
4. ⚠️ Audit all student-facing pages for proper scoping

---

## Validation Checklist

After fixes are applied, verify:

- [ ] New user created → sees empty/initial state (not another user's data)
- [ ] User A's CV shows User A's data only
- [ ] User B's CV shows User B's data only
- [ ] No hardcoded names, qualifications, or workplace evidence
- [ ] All queries use `user_id` or `learner_id` scoping
- [ ] No shared defaults or templates being reused
- [ ] Profile page works for users with no learner record
- [ ] Profile page works for users with incomplete data
- [ ] Editable fields (bio, skills, projects) are user-specific
- [ ] CV versions are user-specific

---

## Related Files to Review

### Core Files
- `src/components/student/StudentProfileClient.tsx` - **PRIMARY FIX TARGET**
- `src/app/student/profile/page.tsx` - **NEEDS DATA FETCHING**
- `src/lib/student-profile-mock.ts` - **REPLACE WITH REAL DATA**

### Reference Files (Correct Implementation)
- `src/app/student/enrolments/page.tsx` - ✅ Correct pattern
- `src/app/student/attendance/page.tsx` - ✅ Correct pattern
- `src/app/student/page.tsx` - ✅ Correct pattern

### Schema Files
- `prisma/schema.prisma` - Review relationships
- May need migration for student profile editable fields

### API Routes (May Need Creation)
- `/api/student/profile` - GET/PATCH for profile data
- `/api/student/cv-versions` - CRUD for CV versions

---

## Notes

- The mock data was likely intentional for development/demo purposes
- However, it should have been replaced before production use
- The pattern for correct data fetching already exists in other student pages
- This fix should be straightforward but requires careful attention to data scoping

---

## Next Steps

1. **Immediate**: Fix `StudentProfileClient` to use real data (Phase 1)
2. **Short-term**: Implement data persistence for editable fields (Phase 2)
3. **Medium-term**: Complete CV versions feature (Phase 3)
4. **Ongoing**: Audit all student-facing features for proper data isolation
