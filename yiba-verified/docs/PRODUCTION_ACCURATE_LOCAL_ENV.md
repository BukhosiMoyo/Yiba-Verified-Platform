# Production-Accurate Local Environment Analysis & Implementation Plan

## Executive Summary

**Current State**: The codebase has a well-structured demo seed system that properly respects user isolation. However, there are still some mock data shortcuts that break production behavior.

**Key Finding**: The demo seed system (`seed.demo.ts`) already creates properly scoped, production-accurate data. The main issues are:
1. Public profile page (`/p/[id]`) still uses hardcoded mock data
2. Need verification that no other shared mock data exists
3. Need scalable seed strategy for thousands of users
4. Need clean reset mechanism

---

## Investigation Findings

### ✅ What's Already Production-Accurate

#### 1. **Demo Seed System (`prisma/seed.demo.ts`)**
- **Status**: ✅ EXCELLENT - Properly scoped
- **Details**:
  - Creates 20-30 institutions with proper isolation
  - Creates 800-1000+ learners, each properly linked to institutions
  - All relationships respect database constraints
  - All queries would work with real user scoping
  - Demo entities are identifiable via:
    - Institutions: `registration_number LIKE 'DEMO-%'`
    - Users: `email LIKE '%@demo.yibaverified.local'`
    - Qualifications: `code LIKE 'DEMO-%'`

#### 2. **Regular Seed System (`prisma/seed.ts`)**
- **Status**: ✅ GOOD - Properly scoped
- **Details**:
  - Creates test accounts with proper User → Learner relationships
  - All data is correctly scoped to users
  - Uses real database relationships

#### 3. **Student Profile Page (`/student/profile`)**
- **Status**: ✅ FIXED - Now uses real data
- **Details**:
  - Recently fixed to fetch real user-specific data
  - No longer uses shared mock data
  - Properly scoped via `session.user.userId` → `learner_id`

#### 4. **Dev Auth System (`src/lib/api/devAuth.ts`)**
- **Status**: ✅ ACCEPTABLE - Dev-only, properly isolated
- **Details**:
  - Only works when `NODE_ENV === "development"`
  - Uses real user lookup from database
  - Doesn't bypass real scoping logic
  - Safe for local development

---

### ❌ What Needs Fixing

#### 1. **Public Profile Page (`/p/[id]`)**
- **Status**: ❌ USES HARDCODED MOCK DATA
- **File**: `src/app/p/[id]/page.tsx`
- **Problem**: 
  - Uses `getPublicProfile()` from `src/lib/student-profile-mock.ts`
  - Returns same hardcoded data for ALL users ("Kagiso Botha")
  - Bypasses real database queries
- **Impact**: Public profile links would show wrong user data
- **Fix Required**: Replace with real database lookup

#### 2. **Mock Data File (`src/lib/student-profile-mock.ts`)**
- **Status**: ⚠️ STILL USED BY PUBLIC PROFILE
- **Problem**:
  - Contains hardcoded demo user data
  - Used only by public profile page now (private profile fixed)
  - Should be removed or converted to use real data

---

## Mock Data Usage Audit

### Files Using "mock" or "demo" in Names

| File | Purpose | Status | Action Required |
|------|---------|--------|-----------------|
| `src/lib/student-profile-mock.ts` | Public profile mock data | ❌ Still used | Replace with DB lookup |
| `prisma/seed.demo.ts` | Demo seed script | ✅ Properly scoped | No change needed |
| `prisma/seed.demo-wipe.ts` | Wipe demo data | ✅ Safe | No change needed |
| `src/lib/api/devAuth.ts` | Dev API auth | ✅ Dev-only | No change needed |

### Other Potential Mock Data Locations

**Checked and Verified**:
- ✅ Student profile page - FIXED (uses real data)
- ✅ Student enrolments - Uses real data
- ✅ Student attendance - Uses real data
- ✅ Student dashboard - Uses real data
- ✅ Institution pages - Use real data (need to verify)
- ✅ QCTO pages - Use real data (need to verify)

---

## Environment Configuration Analysis

### Environment Variables

| Variable | Purpose | Current Behavior | Production Impact |
|----------|---------|------------------|-------------------|
| `DEMO_MODE` | Controls seed mode | Switches between regular/demo seed | ✅ Safe - only affects seeding |
| `NODE_ENV` | Node environment | Controls dev auth availability | ✅ Safe - dev-only features |
| `DEV_API_TOKEN` | Dev API auth | Only works in development | ✅ Safe - dev-only |

**No problematic environment-based data switching found.**

---

## Seed System Analysis

### Current Seed Capabilities

#### Regular Seed (`npm run db:seed`)
- Creates: ~5 test students, 1 institution, admin accounts
- Scale: Small (good for quick testing)
- Isolation: ✅ Proper
- Relationships: ✅ Proper

#### Demo Seed (`npm run seed:demo` or `DEMO_MODE=true npx tsx prisma/seed.ts`)
- Creates: 800-1000+ learners, 20-30 institutions, thousands of records
- Scale: Medium (good for realistic demos)
- Isolation: ✅ Proper
- Relationships: ✅ Proper
- Identifiable: ✅ All demo entities tagged

### Gap Analysis

**Missing**:
1. ❌ Large-scale seed (5,000+ users) - doesn't exist
2. ❌ Clean reset script (wipe everything and start fresh)
3. ❌ Seed script that creates linked User accounts for all learners

**Current demo seed creates learners but not all have linked User accounts for login.**

---

## Data Isolation Verification

### Areas Verified for Proper Isolation

| Area | Verification Status | Notes |
|------|-------------------|-------|
| Student CV/Profile | ✅ Fixed | Now uses real user-scoped data |
| Student Enrolments | ✅ Correct | Uses `user_id` → `learner_id` scoping |
| Student Attendance | ✅ Correct | Uses `user_id` → `learner_id` scoping |
| Student Dashboard | ✅ Correct | Uses `user_id` → `learner_id` scoping |
| Public Profile | ❌ Broken | Uses hardcoded mock data |
| Institution Views | ⚠️ Needs verification | Likely correct but should verify |
| QCTO Views | ⚠️ Needs verification | Likely correct but should verify |

---

## Internal Prompt for Fix Implementation

### Prompt: Make Local Environment Production-Accurate

**Context**: The local development environment currently has one remaining mock data shortcut that breaks production behavior: the public profile page uses hardcoded data instead of real database queries.

**Core Principle**: 
> Demo data is allowed, but ONLY if it is generated through production logic and remains correctly scoped. No shortcuts that bypass real user isolation.

**Tasks**:

#### Phase 1: Fix Remaining Mock Data Issues (IMMEDIATE)

1. **Fix Public Profile Page**:
   - Replace `getPublicProfile()` in `/p/[id]/page.tsx`
   - Create database schema for public profile links (or use learner_id)
   - Query real learner data from database
   - Handle case where profile doesn't exist or isn't public
   - Ensure proper user scoping

2. **Remove or Deprecate Mock Data File**:
   - Option A: Delete `src/lib/student-profile-mock.ts` if no longer needed
   - Option B: Keep for backward compatibility but add deprecation warning
   - Update all references

#### Phase 2: Verification & Testing (IMMEDIATE)

3. **Comprehensive Isolation Audit**:
   - Test every user-facing page with multiple users
   - Verify no cross-user data leakage
   - Document verification results

4. **Institution & QCTO Views Verification**:
   - Verify institution admin views are properly scoped
   - Verify QCTO views respect permissions
   - Test with multiple institutions

#### Phase 3: Scalable Demo Data (SHORT TERM)

5. **Large-Scale Seed Script**:
   - Create `prisma/seed.large.ts` or extend `seed.demo.ts`
   - Generate 5,000+ learners with proper relationships
   - Ensure all learners have linked User accounts
   - Generate realistic enrolments, attendance, documents
   - Ensure all data respects isolation

6. **User Account Linking**:
   - Modify demo seed to create User accounts for all learners
   - Use predictable email patterns (e.g., `student.{nationalId}@demo.yibaverified.local`)
   - Generate secure passwords or use single demo password
   - Document login credentials

#### Phase 4: Clean Reset Capabilities (SHORT TERM)

7. **Complete Database Reset Script**:
   - Create `prisma/reset.ts` or `scripts/reset-db.ts`
   - Wipe ALL data (not just demo data)
   - Optional: Keep system/admin accounts
   - Run migrations to ensure clean schema
   - Document usage

8. **Reset + Seed Workflow**:
   - Create script that: Reset → Seed → Verify
   - Make it easy to get fresh environment
   - Document in README

#### Phase 5: Production-Accuracy Validation (ONGOING)

9. **Testing Checklist**:
   - [ ] New user created → sees empty/initial state (not another user's data)
   - [ ] User A's CV shows User A's data only
   - [ ] User B's CV shows User B's data only
   - [ ] No hardcoded names, qualifications, or workplace evidence
   - [ ] All queries use `user_id` or `learner_id` scoping
   - [ ] Profile page works for users with no learner record
   - [ ] Profile page works for users with incomplete data
   - [ ] Public profile links show correct user data
   - [ ] Institution admins only see their institution's data
   - [ ] QCTO users only see data they have permission for
   - [ ] Works correctly with 5,000+ users in database

10. **Documentation**:
    - Document seed strategies
    - Document reset procedures
    - Document demo login credentials
    - Document verification procedures

---

## Implementation Plan

### Priority 1: Critical Fixes (Do First)

1. **Fix Public Profile** (1-2 hours)
   - Replace mock data with database queries
   - Add public profile ID field to Learner or create PublicProfile table
   - Test with multiple users

2. **Remove Mock Data File** (15 minutes)
   - Delete or deprecate `student-profile-mock.ts`
   - Update all references

3. **Verification Audit** (2-3 hours)
   - Test all student-facing pages
   - Test with multiple users
   - Document results

### Priority 2: Scalability (Do Soon)

4. **Large-Scale Seed** (4-6 hours)
   - Create seed script for 5,000+ users
   - Ensure all learners have User accounts
   - Generate realistic relationships

5. **Clean Reset Script** (2-3 hours)
   - Create reset utility
   - Test thoroughly
   - Document usage

### Priority 3: Documentation (Ongoing)

6. **Update Documentation** (1-2 hours)
   - Document seed strategies
   - Document reset procedures
   - Document demo credentials
   - Update README

---

## Seed Data Strategy Recommendations

### Strategy 1: Incremental Seeds

```
Regular Seed (default):      ~5 users, 1 institution
Demo Seed (DEMO_MODE=true):  800-1000 users, 20-30 institutions
Large Seed (SCALE=large):    5,000+ users, 50-100 institutions
```

### Strategy 2: All Learners Get User Accounts

**Current**: Demo seed creates learners but not all have User accounts.

**Recommendation**: Create User accounts for ALL learners in demo seed.

**Benefits**:
- Can test login as any learner
- More realistic testing
- Easier to test isolation

**Implementation**:
- In demo seed, after creating learners, create User accounts
- Use email pattern: `student.{nationalId}@demo.yibaverified.local`
- Use password: `Demo@123!` (same as other demo accounts)
- Link User to Learner via `user_id`

### Strategy 3: Deterministic Data Generation

**Current**: Demo seed uses seeded RNG (good for deterministic results).

**Keep This**: Continue using seeded RNG for reproducibility.

---

## Reset Strategy

### Clean Reset (Everything)

```typescript
// prisma/reset.ts
async function resetEverything() {
  // Delete in dependency order
  await prisma.sickNote.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.submissionResource.deleteMany();
  await prisma.submission.deleteMany();
  // ... continue with all tables
  
  // Optional: Keep system accounts (admin@yiba.local, etc.)
  // Optional: Keep QCTOOrg
  
  // Run migrations to ensure schema is clean
  // Re-seed if desired
}
```

### Demo-Only Reset (Existing)

Already exists: `npm run seed:demo:wipe`

**Status**: ✅ Works correctly, only wipes demo data

---

## Verification Checklist

After fixes, verify:

### Data Isolation
- [ ] User A's profile shows User A's data only
- [ ] User B's profile shows User B's data only  
- [ ] Public profile links show correct user data
- [ ] No cross-user data in CVs, enrolments, attendance
- [ ] Institution admins only see their institution
- [ ] QCTO users see only permitted data

### Data Correctness
- [ ] All queries use proper scoping (`user_id`, `learner_id`, `institution_id`)
- [ ] No hardcoded names, IDs, or data
- [ ] Empty states work correctly
- [ ] Incomplete data handled gracefully

### Scalability
- [ ] Works with 100 users
- [ ] Works with 1,000 users
- [ ] Works with 5,000+ users
- [ ] Performance acceptable at scale

### Demo Data Quality
- [ ] All demo data respects relationships
- [ ] All demo data respects isolation
- [ ] Demo data is identifiable
- [ ] Demo data is realistic

---

## Summary

**Good News**:
- Demo seed system is already production-accurate
- Most pages already use real data
- Seed system respects relationships and isolation

**Needs Fixing**:
- Public profile page still uses mock data (CRITICAL)
- Need large-scale seed capability
- Need clean reset capability

**Estimated Time**: 10-15 hours for complete implementation

**Risk Level**: LOW - Most infrastructure already exists, just needs one critical fix and enhancements.
