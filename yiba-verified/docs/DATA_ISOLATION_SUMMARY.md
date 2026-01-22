# 🚨 Data Isolation Issue - Summary & Root Cause

## Issue Confirmed

**Problem**: Student CV/Profile pages are showing **identical data for all users** due to hardcoded mock data.

**Root Cause**: `StudentProfileClient.tsx` uses static mock data instead of fetching user-specific data from the database.

---

## Root Cause Analysis

### The Problem

**File**: `src/components/student/StudentProfileClient.tsx`

The component contains hardcoded mock data that is **identical for every user**:

```typescript
// Lines 38-57: Same data for ALL users
const mockStudentEditable = {
  bio: "Experienced in project coordination...", // Everyone sees this
  skills: ["Project Management", ...], // Everyone sees this
  projects: [{ title: "Migration to cloud LMS", ... }], // Everyone sees this
};

// Lines 59-88: Same system data for ALL users
const mockStudentSystem = {
  header: {
    name: "Kagiso Botha", // ⚠️ HARDCODED - Same for everyone!
    verifiedBy: "Demo College", // Same for everyone
    institutions: [{ name: "Demo College", studentId: "STU-10482" }], // Same for everyone
  },
  qualifications: [
    { title: "Occupational Certificate: Project Management", ... }, // Same for everyone
  ],
  workplaceEvidence: {
    recent: [
      { workplace: "Tech Solutions Pty Ltd", ... }, // Same for everyone
    ],
  },
};
```

**Result**: Every student user sees:
- Name: "Kagiso Botha" (not their own name)
- Same qualifications
- Same workplace evidence
- Same bio, skills, and projects

### Why This Happened

The component was built with mock data for development/demo purposes, but **never replaced with real database queries** before production use.

---

## Correct Pattern (Already Used Elsewhere)

Other student pages correctly fetch user-specific data:

**Example**: `src/app/student/enrolments/page.tsx`

```typescript
// ✅ CORRECT: Get user from session
const session = await getServerSession(authOptions);
const userId = session.user.userId;

// ✅ CORRECT: Fetch learner using user_id
const learner = await prisma.learner.findFirst({
  where: { user_id: userId, deleted_at: null },
});

// ✅ CORRECT: Fetch data scoped to this learner
const enrolments = await prisma.enrolment.findMany({
  where: { learner_id: learner.learner_id, deleted_at: null },
});
```

**Same pattern used in**:
- ✅ `/student/enrolments` - Correct
- ✅ `/student/attendance` - Correct  
- ✅ `/student` (dashboard) - Correct
- ❌ `/student/profile` - **USES MOCK DATA**

---

## Data Model Relationships

```
User (user_id)
  └─> Learner (user_id) [one-to-one]
      ├─> Enrolment[] (learner_id)
      │   ├─> Qualification (qualification_id)
      │   └─> AttendanceRecord[] (enrolment_id)
      ├─> PastQualification[] (learner_id)
      └─> PriorLearning[] (learner_id)
```

**Critical Rule**: All queries MUST be scoped using:
1. `session.user.userId` → Get user
2. `prisma.learner.findFirst({ where: { user_id: userId } })` → Get learner
3. `learner.learner_id` → Scope all subsequent queries

---

## What Needs to Be Fixed

### Immediate Fix Required

1. **`src/components/student/StudentProfileClient.tsx`**
   - Remove all hardcoded mock data
   - Accept data as props from parent component

2. **`src/app/student/profile/page.tsx`**
   - Convert to server component
   - Fetch real data using session → user_id → learner pattern
   - Pass fetched data to `StudentProfileClient` as props

3. **Data to Fetch**:
   - Learner name (first_name, last_name)
   - Institution name (for "verified by")
   - Enrolments with qualifications
   - PastQualification records
   - PriorLearning records (for workplace evidence)
   - User-specific editable fields (bio, skills, projects) - may need new DB table

### Additional Considerations

- **Editable Fields**: Bio, skills, and projects are currently stored in component state (lost on refresh). Need to:
  - Create database schema for student profile editable fields, OR
  - Use existing `OnboardingProgress` table, OR
  - Create new `StudentProfile` table

- **CV Versions**: Currently mocked. Need to determine if CV versions should be stored in DB or generated on-the-fly.

---

## Validation After Fix

After implementing the fix, verify:

- [ ] New user created → sees empty/initial state (not another user's data)
- [ ] User A's profile shows User A's data only
- [ ] User B's profile shows User B's data only
- [ ] No hardcoded names, qualifications, or workplace evidence
- [ ] All queries use `user_id` or `learner_id` scoping
- [ ] Profile works for users with no learner record (shows appropriate empty state)
- [ ] Profile works for users with incomplete data

---

## Files Involved

### Primary Fix Targets
- `src/components/student/StudentProfileClient.tsx` - Remove mock data, accept props
- `src/app/student/profile/page.tsx` - Add data fetching

### Reference (Correct Implementation)
- `src/app/student/enrolments/page.tsx` - ✅ Use as pattern
- `src/app/student/attendance/page.tsx` - ✅ Use as pattern

### Documentation
- `docs/DATA_ISOLATION_INVESTIGATION.md` - Full investigation details
- `docs/DATA_ISOLATION_SUMMARY.md` - This file

---

## Next Steps

1. **Review** the full investigation document: `docs/DATA_ISOLATION_INVESTIGATION.md`
2. **Implement** the fix following the pattern from `enrolments/page.tsx`
3. **Test** with multiple users to verify data isolation
4. **Audit** other student-facing features for similar issues

---

## Severity

**HIGH** - This is a critical data privacy and integrity issue that:
- Violates user trust
- Breaches data privacy expectations
- Could have compliance implications
- Must be fixed immediately
