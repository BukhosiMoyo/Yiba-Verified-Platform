# 🚀 Implementation Plan - Provincial Assignments & View As User

## Overview

This document outlines the step-by-step implementation plan for:
1. Provincial assignment features
2. View As User feature (for all admins)
3. Onboarding flows for all user types
4. Platform Admin statistics enhancements

---

## Phase 1: Schema Updates ⚙️

### Step 1.1: Update User Model
- [ ] Add `default_province` field (String, nullable)
- [ ] Add `assigned_provinces` field (String[], array, default [])
- [ ] Add validation: default_province must be in assigned_provinces array
- [ ] Add validation: QCTO roles (except QCTO_SUPER_ADMIN) must have default_province

### Step 1.2: Create ReviewAssignment Model
- [ ] Create model with fields:
  - `review_type` (String) - "READINESS", "SUBMISSION", etc.
  - `review_id` (String) - ID of the review
  - `assigned_to` (String) - User ID of reviewer
  - `assigned_by` (String) - User ID who made assignment
  - `status` (String) - ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
  - `assigned_at`, `completed_at`, `notes`
- [ ] Add relations to User model
- [ ] Add unique constraint: [review_type, review_id, assigned_to]

### Step 1.3: Update QCTOOrg Model
- [ ] Add `updated_at` field (DateTime, @updatedAt)

### Step 1.4: Create Migration
- [ ] Run `npx prisma migrate dev --name add_provincial_assignments`
- [ ] Review migration SQL
- [ ] Test migration on development database
- [ ] Update Prisma client

### Step 1.5: Update Seed Scripts
- [ ] Update production seed to include provincial assignments
- [ ] Add default_province for all QCTO users (except QCTO_SUPER_ADMIN)
- [ ] Add assigned_provinces arrays
- [ ] Test seed script

**Git**: Commit after Step 1.4 (migration) and Step 1.5 (seed updates)

---

## Phase 2: Provincial Assignment Logic 🗺️

### Step 2.1: Validation Logic
- [ ] Create validation function: `validateProvinceAssignment(user, role)`
- [ ] Enforce: QCTO roles (except QCTO_SUPER_ADMIN) must have default_province
- [ ] Enforce: default_province must be in assigned_provinces array
- [ ] Add validation to user creation/update endpoints

### Step 2.2: Province Assignment Management API
- [ ] Create endpoint: `POST /api/platform-admin/users/[userId]/provinces`
- [ ] Create endpoint: `POST /api/qcto/team/[userId]/provinces`
- [ ] Add permission checks: Only QCTO_SUPER_ADMIN, QCTO_ADMIN, or PLATFORM_ADMIN
- [ ] Add audit logging for province assignment changes
- [ ] Test API endpoints

### Step 2.3: Update RBAC Filtering
- [ ] Update `canReadForQCTO` to check assigned_provinces array
- [ ] Update QCTO data access to filter by province
- [ ] Update institution filtering to check province matching
- [ ] Test province filtering logic

### Step 2.4: Update QCTO Dashboards
- [ ] Filter submissions by assigned_provinces
- [ ] Filter institutions by assigned_provinces
- [ ] Filter readiness records by assigned_provinces
- [ ] Filter stats by assigned_provinces (except QCTO_SUPER_ADMIN - shows all)
- [ ] Test dashboard filtering

### Step 2.5: Review Assignment Logic
- [ ] Update review assignment to check province matching
- [ ] Allow multiple reviewers per review (fail-safe)
- [ ] Create ReviewAssignment records when assigning reviews
- [ ] Test review assignment with multiple reviewers

**Git**: Commit after each step (2.1, 2.2, 2.3, 2.4, 2.5)

---

## Phase 3: View As User Feature 👁️

### Step 3.1: PLATFORM_ADMIN - User Selection
- [ ] Add "View Dashboard" button in `/platform-admin/users` page
- [ ] Create user selection UI component
- [ ] Add route parameter handling for viewAsUserId
- [ ] Test user selection

### Step 3.2: PLATFORM_ADMIN - API Context
- [ ] Create API endpoint: `GET /api/platform-admin/view-as/[userId]`
- [ ] Return user context (role, institution_id, qcto_id, provinces)
- [ ] Add permission check: Only PLATFORM_ADMIN
- [ ] Add audit log entry for View As User action
- [ ] Test API endpoint

### Step 3.3: PLATFORM_ADMIN - Student Dashboard View
- [ ] Create route: `/platform-admin/view-as/[userId]` with student dashboard
- [ ] Render Student dashboard component with selected user's context
- [ ] Show student's enrolments, attendance, certificates
- [ ] Add "Exit View As" button
- [ ] Test with real student user
- [ ] Verify data scoping (only their own data)

### Step 3.4: PLATFORM_ADMIN - Institution Dashboard View
- [ ] Render Institution dashboard with selected institution admin's context
- [ ] Show institution's stats, learners, submissions
- [ ] Allow navigation to institution pages
- [ ] Test with real institution admin
- [ ] Verify data scoping (only their institution's data)

### Step 3.5: PLATFORM_ADMIN - QCTO Dashboard View
- [ ] Render QCTO dashboard with selected QCTO user's context
- [ ] Apply province filtering based on user's assigned_provinces
- [ ] Show QCTO stats, submissions, reviews
- [ ] Test with real QCTO user (QCTO_USER, QCTO_ADMIN, etc.)
- [ ] Verify province filtering works correctly

### Step 3.6: PLATFORM_ADMIN - Exit View As
- [ ] Add "Exit View As" button/banner
- [ ] Clear viewAsUserId from context
- [ ] Return to Platform Admin dashboard
- [ ] Test exit functionality

### Step 3.7: QCTO_SUPER_ADMIN - View As User
- [ ] Add "View Dashboard" button in `/qcto/team` page
- [ ] Filter to show only QCTO users (QCTO_ADMIN, QCTO_USER, etc.)
- [ ] Create API endpoint: `GET /api/qcto/team/[userId]/view-as`
- [ ] Render QCTO dashboard with selected user's context
- [ ] Test with real QCTO user
- [ ] Verify can only view QCTO users, not Institution/Student

### Step 3.8: QCTO_ADMIN - View As User
- [ ] Add "View Dashboard" button in `/qcto/team` page
- [ ] Filter to show only QCTO users within their scope (provinces)
- [ ] Create API endpoint with province scope check
- [ ] Render QCTO dashboard with selected user's context
- [ ] Test with real QCTO user in their province
- [ ] Verify cannot view users outside their scope

### Step 3.9: INSTITUTION_ADMIN - View As User (Staff)
- [ ] Add "View Dashboard" button in `/institution/staff` page
- [ ] Filter to show only INSTITUTION_STAFF in their institution
- [ ] Create API endpoint: `GET /api/institution/staff/[userId]/view-as`
- [ ] Render Institution dashboard with selected staff's context
- [ ] Test with real institution staff user
- [ ] Verify can only view staff in their institution

### Step 3.10: INSTITUTION_ADMIN - View As User (Students)
- [ ] Add "View Dashboard" button in `/institution/learners` page
- [ ] Filter to show only STUDENTS in their institution
- [ ] Create API endpoint: `GET /api/institution/learners/[learnerId]/view-as`
- [ ] Render Student dashboard with selected student's context
- [ ] Test with real student in their institution
- [ ] Verify can only view students in their institution

### Step 3.11: Audit Logging
- [ ] Add audit log entry for all View As User actions
- [ ] Log: who viewed, which user, when, from which page
- [ ] Add audit log viewing in Platform Admin audit logs
- [ ] Test audit logging

**Git**: Commit after each step (3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11)

---

## Phase 4: Onboarding Flows 🎓

### Step 4.1: Review Existing Student Onboarding
- [ ] Review current student onboarding flow
- [ ] Verify all new fields are included (disability_status, next_of_kin, etc.)
- [ ] Test existing onboarding
- [ ] Fix any missing fields

### Step 4.2: INSTITUTION_ADMIN Onboarding
- [ ] Create onboarding flow component
- [ ] Steps:
  1. Welcome & role explanation
  2. Institution profile setup (if new institution)
  3. Institution details verification
  4. Staff invitation setup
  5. Learner management introduction
  6. Submission process overview
  7. Completion
- [ ] Add onboarding progress tracking
- [ ] Test onboarding flow

### Step 4.3: INSTITUTION_STAFF Onboarding
- [ ] Create onboarding flow component
- [ ] Steps:
  1. Welcome & role explanation
  2. Profile completion
  3. Institution overview
  4. Role-specific training (based on assignments)
  5. Feature walkthrough
  6. Completion
- [ ] Add onboarding progress tracking
- [ ] Test onboarding flow

### Step 4.4: QCTO_SUPER_ADMIN Onboarding
- [ ] Create onboarding flow component
- [ ] Steps:
  1. Welcome & QCTO role explanation
  2. QCTO organization setup
  3. Team management introduction
  4. Province assignment (optional - can be national)
  5. Review process overview
  6. Completion
- [ ] Add onboarding progress tracking
- [ ] Test onboarding flow

### Step 4.5: QCTO_ADMIN Onboarding
- [ ] Create onboarding flow component
- [ ] Steps:
  1. Welcome & role explanation
  2. Profile completion
  3. **Province assignment** (required - default province + multiple provinces)
  4. Team management introduction
  5. Review assignment process
  6. Province filtering explanation
  7. Completion
- [ ] Add onboarding progress tracking
- [ ] Test onboarding flow

### Step 4.6: QCTO_USER Onboarding
- [ ] Create onboarding flow component
- [ ] Steps:
  1. Welcome & role explanation
  2. Profile completion
  3. **Province assignment** (required - default province)
  4. Submission/request-based access explanation
  5. Review process training
  6. Completion
- [ ] Add onboarding progress tracking
- [ ] Test onboarding flow

### Step 4.7: QCTO_REVIEWER Onboarding
- [ ] Create onboarding flow component
- [ ] Steps:
  1. Welcome & role explanation
  2. Profile completion
  3. **Province assignment** (required)
  4. Review assignment process (multiple reviewers)
  5. Review workflow training
  6. Completion
- [ ] Add onboarding progress tracking
- [ ] Test onboarding flow

### Step 4.8: QCTO_AUDITOR Onboarding
- [ ] Create onboarding flow component
- [ ] Steps:
  1. Welcome & role explanation
  2. Profile completion
  3. **Province assignment** (required)
  4. Audit log access explanation
  5. Reporting features
  6. Completion
- [ ] Add onboarding progress tracking
- [ ] Test onboarding flow

### Step 4.9: QCTO_VIEWER Onboarding
- [ ] Create onboarding flow component
- [ ] Steps:
  1. Welcome & role explanation
  2. Profile completion
  3. **Province assignment** (required)
  4. Read-only access explanation
  5. Dashboard navigation
  6. Completion
- [ ] Add onboarding progress tracking
- [ ] Test onboarding flow

**Git**: Commit after each onboarding flow is completed (4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9)

---

## Phase 5: Platform Admin Statistics 📊

### Step 5.1: Enhanced Dashboard Stats
- [ ] Add comprehensive statistics to Platform Admin dashboard
- [ ] Add provincial breakdowns
- [ ] Add time-based analytics
- [ ] Add growth trends
- [ ] Test dashboard performance

### Step 5.2: Provincial Statistics
- [ ] Add statistics by province
- [ ] Institutions by province
- [ ] Learners by province
- [ ] Submissions by province
- [ ] QCTO reviews by province
- [ ] Test provincial statistics

### Step 5.3: System Health Metrics
- [ ] Add database status monitoring
- [ ] Add error tracking
- [ ] Add performance metrics
- [ ] Add uptime tracking
- [ ] Test system health display

**Git**: Commit after each step (5.1, 5.2, 5.3)

---

## Phase 6: Testing & Quality Assurance ✅

### Step 6.1: View As User Testing
- [ ] Test PLATFORM_ADMIN viewing as Student
- [ ] Test PLATFORM_ADMIN viewing as Institution Admin
- [ ] Test PLATFORM_ADMIN viewing as QCTO User
- [ ] Test QCTO_SUPER_ADMIN viewing as QCTO User
- [ ] Test QCTO_ADMIN viewing as QCTO User (within scope)
- [ ] Test INSTITUTION_ADMIN viewing as Staff
- [ ] Test INSTITUTION_ADMIN viewing as Student
- [ ] Verify permission boundaries (cannot view users outside scope)

### Step 6.2: Provincial Filtering Testing
- [ ] Test QCTO_USER with single province
- [ ] Test QCTO_ADMIN with multiple provinces
- [ ] Test QCTO_SUPER_ADMIN with no province (national)
- [ ] Test province filtering on dashboards
- [ ] Test province filtering on submissions
- [ ] Test province filtering on reviews

### Step 6.3: Onboarding Testing
- [ ] Test all onboarding flows
- [ ] Verify province assignment in onboarding
- [ ] Verify all required fields are captured
- [ ] Test onboarding completion tracking
- [ ] Test onboarding resumption (if user leaves mid-flow)

### Step 6.4: Review Assignment Testing
- [ ] Test assigning multiple reviewers to one review
- [ ] Test province matching for review assignment
- [ ] Test review assignment API
- [ ] Test review assignment UI

### Step 6.5: Integration Testing
- [ ] Test full user journey (invite → onboard → use platform)
- [ ] Test View As User with real users
- [ ] Test provincial assignment management
- [ ] Test audit logging

**Git**: Commit test results and fixes

---

## Phase 7: Git Workflow 📝

### Branch Strategy
- [ ] Create feature branch: `feature/provincial-assignments-view-as-user`
- [ ] Create sub-branches for major features:
  - `feature/provincial-assignments`
  - `feature/view-as-user-platform-admin`
  - `feature/view-as-user-qcto`
  - `feature/view-as-user-institution`
  - `feature/onboarding-flows`

### Commit Strategy
- [ ] Commit after each completed step
- [ ] Use descriptive commit messages:
  - `feat: add provincial assignment fields to User model`
  - `feat: implement View As User for PLATFORM_ADMIN - Student view`
  - `feat: add QCTO_ADMIN onboarding flow`
- [ ] Keep commits atomic (one feature per commit)

### Pull Request Strategy
- [ ] Create PR after Phase 1 (Schema Updates)
- [ ] Create PR after Phase 2 (Provincial Assignment Logic)
- [ ] Create PR after Phase 3 (View As User - each admin type separately)
- [ ] Create PR after Phase 4 (Onboarding Flows)
- [ ] Create PR after Phase 5 (Platform Admin Stats)
- [ ] Final PR for Phase 6 (Testing & QA)

---

## Notes & Future Enhancements 📌

### Government Employment Identifiers
- ⏸️ **Deferred**: Add government employment identifier fields
- Can be added later when requirements are clear
- May include: employee_id, department, position, etc.

### Additional Features (Future)
- [ ] View As User with Actions (perform actions on behalf of users)
- [ ] Session replay for debugging
- [ ] Comparison view (compare two users' dashboards)
- [ ] Custom dashboard builder for Platform Admin
- [ ] Real-time monitoring dashboard

---

## Success Criteria ✅

- [ ] All QCTO roles (except QCTO_SUPER_ADMIN) have required province assignments
- [ ] Provincial filtering works correctly for all QCTO roles
- [ ] View As User works for all admin types (PLATFORM_ADMIN, QCTO_SUPER_ADMIN, QCTO_ADMIN, INSTITUTION_ADMIN)
- [ ] All user types have complete onboarding flows
- [ ] Platform Admin has comprehensive statistics
- [ ] All features are tested and working
- [ ] All code is committed to git with descriptive messages
- [ ] Documentation is updated

---

**Status**: 🚀 **Ready for Implementation**

**Start Date**: TBD
**Estimated Completion**: TBD
