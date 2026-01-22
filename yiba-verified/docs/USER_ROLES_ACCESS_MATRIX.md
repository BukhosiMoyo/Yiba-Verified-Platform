# 👥 User Roles & Access Matrix

**Status**: 📋 **FOR REVIEW & CORRECTION**

This document maps what each user role can see and access in the platform. Please review and correct any inaccuracies.

---

## User Roles Overview

The platform has **10 user roles**:

1. **PLATFORM_ADMIN** - Platform owners/operators
2. **QCTO_SUPER_ADMIN** - QCTO organization super administrator
3. **QCTO_ADMIN** - QCTO organization administrator
4. **QCTO_USER** - QCTO staff member (standard)
5. **QCTO_REVIEWER** - QCTO reviewer (review-focused)
6. **QCTO_AUDITOR** - QCTO auditor (audit-focused)
7. **QCTO_VIEWER** - QCTO viewer (read-only)
8. **INSTITUTION_ADMIN** - Institution administrator
9. **INSTITUTION_STAFF** - Institution staff member
10. **STUDENT** - Student/learner

---

## 1. PLATFORM_ADMIN 👑

### Route Access
- ✅ `/platform-admin/*` (full access)
- ✅ `/account/*` (account management)
- ✅ `/announcements` (view announcements)
- ✅ `/qcto/*` (can view QCTO area - for viewing QCTO dashboards)
- ✅ `/institution/*` (can view institution area - for viewing institution dashboards)
- ✅ `/student/*` (can view student area - for viewing student dashboards)
- ✅ **View As User**: Can view any user's dashboard by selecting them from Users page

### Navigation Menu
- Dashboard (Platform Admin Dashboard - aggregated stats)
- Institutions (all institutions)
- Learners (all learners across all institutions)
- Qualifications (manage qualifications)
- Users (all users in platform - **with "View Dashboard" feature**)
- Invites (all invites across platform)
- Announcements
- Audit Logs
- Reports
- System Health
- **View As User** (dropdown or user selector to view other user dashboards)
- Account (Profile, Security, Logs, Notifications, Admin Preferences)

### Data Access
- ✅ **All Institutions**: Can view, edit, manage all institutions
- ✅ **All Learners**: Can view all learners across all institutions
- ✅ **All Users**: Can view, edit, deactivate all users
- ✅ **All Qualifications**: Can create, edit, manage qualifications
- ✅ **All Invites**: Can view all invites, create invites for any role
- ✅ **All Submissions**: Can view all institution submissions
- ✅ **All QCTO Requests**: Can view all QCTO requests
- ✅ **All Readiness Records**: Can view all Form 5 readiness records
- ✅ **All Documents**: Can view all documents
- ✅ **All Audit Logs**: Can view and export all audit logs
- ✅ **All Reports**: Can view and export all reports
- ✅ **System Health**: Can view system health metrics
- ✅ **Announcements**: Can create platform-wide or institution-specific announcements
- ✅ **View As User**: Can view any user's dashboard (Student, Institution, QCTO) by selecting them

### Additional Stats & Metrics (Platform Admin Dashboard)
- ✅ **Platform-wide Statistics**:
  - Total institutions (by status: APPROVED, DRAFT, SUSPENDED)
  - Total learners (by institution, by province)
  - Total enrolments (by status: ACTIVE, COMPLETED, TRANSFERRED, ARCHIVED)
  - Total users (by role, by status)
  - Total submissions (by status, by institution, by province)
  - Total QCTO requests (by status, by institution)
  - Total readiness records (by status, by institution)
  - Total documents (by type, by institution)
  - Total invites (by status, by role)
  - Daily/weekly active users
  - Daily/weekly active institutions
  - Average review time (submissions, readiness)
  - Overdue submissions/reviews
  - System health metrics (database status, recent errors)
  - Recent activity feed (from audit logs)

- ✅ **QCTO Statistics** (aggregated):
  - QCTO team size (by role)
  - QCTO reviews completed (by province, by reviewer)
  - QCTO requests created/approved/rejected
  - QCTO evidence flags (active, resolved)
  - QCTO audit logs

- ✅ **Institution Statistics** (aggregated across all institutions):
  - Institution submissions (by status)
  - Institution readiness records (by status)
  - Institution learners (by enrolment status)
  - Institution attendance rates
  - Institution document uploads

- ✅ **Student Statistics** (aggregated):
  - Total students (by institution, by province)
  - Student enrolments (by status)
  - Student attendance rates
  - Student completion rates

- ✅ **Provincial Statistics**:
  - Institutions by province
  - Learners by province
  - Submissions by province
  - QCTO reviews by province
  - Activity by province

- ✅ **Time-based Analytics**:
  - Growth trends (institutions, learners, users)
  - Activity trends (submissions, reviews, logins)
  - Performance metrics (review times, approval rates)
  - Engagement metrics (daily/weekly active users)

### View As User Feature
- ✅ **User Selection**: In "All Users" page, can select any user
- ✅ **Dashboard View**: Automatically shows the appropriate dashboard based on selected user's role:
  - **STUDENT** → Student Dashboard (shows their enrolments, attendance, certificates)
  - **INSTITUTION_ADMIN** → Institution Dashboard (shows their institution's stats)
  - **INSTITUTION_STAFF** → Institution Dashboard (shows their institution's stats)
  - **QCTO_SUPER_ADMIN** → QCTO Dashboard (shows QCTO stats)
  - **QCTO_ADMIN** → QCTO Dashboard (shows QCTO stats filtered to their provinces)
  - **QCTO_USER** → QCTO Dashboard (shows QCTO stats filtered to their provinces + submissions)
  - **QCTO_REVIEWER** → QCTO Dashboard (shows assigned reviews)
  - **QCTO_AUDITOR** → QCTO Dashboard (shows audit-focused stats)
  - **QCTO_VIEWER** → QCTO Dashboard (read-only view)
- ✅ **Context**: Dashboard shows data as if logged in as that user (with their permissions/filters)
- ✅ **Navigation**: Can navigate within that user's area (e.g., if viewing Institution Admin, can see their institution pages)
- ✅ **Exit**: Can exit "view as" mode to return to Platform Admin view

### Capabilities
- INSTITUTION_PROFILE_EDIT
- STAFF_INVITE
- STAFF_ASSIGN_ROLES
- STAFF_DEACTIVATE
- FORM5_VIEW, FORM5_EDIT, FORM5_SUBMIT
- EVIDENCE_VIEW, EVIDENCE_UPLOAD, EVIDENCE_REPLACE
- LEARNER_VIEW, LEARNER_CREATE, LEARNER_EDIT, LEARNER_ARCHIVE
- ENROLMENT_CREATE, ENROLMENT_EDIT_STATUS
- ATTENDANCE_CAPTURE, ATTENDANCE_VIEW
- AUDIT_VIEW, AUDIT_EXPORT
- REPORTS_VIEW, REPORTS_EXPORT
- FEATURE_APPROVE, FEATURE_ALERTS

### Special Notes
- Platform admins have **unrestricted access** to all data
- Can manage all users, institutions, and system settings
- Can view QCTO data without submission/request restrictions (unlike QCTO_USER)
- **View As User**: Can view any user's dashboard to assist with issues, debugging, or training
- **Multiple Dashboards**: Has access to all dashboard types (Platform Admin, QCTO, Institution, Student)
- **Comprehensive Stats**: Has access to aggregated statistics across all entities, provinces, and time periods
- **Support Role**: Primary role is to assist users and maintain platform health

---

## 2. QCTO_SUPER_ADMIN 🏛️

### Route Access
- ✅ `/qcto/*` (full QCTO area access)
- ✅ `/account/*` (account management)
- ✅ `/announcements` (view announcements)
- ❌ `/platform-admin/*` (cannot access)
- ❌ `/institution/*` (cannot access)
- ❌ `/student/*` (cannot access)

### Navigation Menu
- Dashboard
- QCTO Team (manage QCTO users and invites)
- Submissions (filtered by province assignment, if assigned)
- Requests (filtered by province assignment, if assigned)
- Institutions (filtered by province assignment, if assigned)
- Readiness Reviews (Form 5 reviews - filtered by province assignment, if assigned)
- Evidence Flags
- Audit Logs
- Reports
- Announcements
- Account (Profile, Security, Logs, Notifications, Scope/Assignments)

### Data Access
- ✅ **QCTO Team Management**: Can invite, manage, deactivate QCTO users
- ✅ **All Institutions**: Can view, edit, and delete institutions from **ANY province** (no restrictions)
- ✅ **All Submissions**: Can view, edit, and delete submissions from **ANY province** (no restrictions)
- ✅ **All QCTO Requests**: Can create, view, edit, and delete requests from **ANY province** (no restrictions)
- ✅ **All Readiness Records**: Can view, edit, and delete readiness records from **ANY province** (no restrictions)
- ✅ **All Reviews**: Can be assigned to review work from **ANY province** (no restrictions)
- ✅ **Dashboard/Stats**: Can see stats from **ALL provinces** (national view)
- ✅ **All Documents**: Can view, edit, and delete documents from **ANY province** (no restrictions)
- ✅ **Evidence Flags**: Can view and manage evidence flags from **ANY province** (no restrictions)
- ✅ **Audit Logs**: Can view and export audit logs from **ANY province** (no restrictions)
- ✅ **Reports**: Can view and export reports from **ALL provinces** (no restrictions)
- ✅ **QCTO Settings**: Can manage QCTO organization settings
- ✅ **Province Assignments**: Can edit province assignments for QCTO users (based on work assignment requests)

### Capabilities
- QCTO_TEAM_MANAGE (can manage QCTO team)
- QCTO_REVIEW, QCTO_ASSIGN
- QCTO_AUDIT_READ, QCTO_EXPORT
- QCTO_SETTINGS
- FORM5_VIEW
- EVIDENCE_VIEW
- QCTO_REVIEW_FLAG, QCTO_RECORD_RECOMMENDATION
- LEARNER_VIEW
- ATTENDANCE_VIEW
- AUDIT_VIEW, AUDIT_EXPORT
- REPORTS_VIEW, REPORTS_EXPORT

### Special Notes
- **No Province Required**: Can be national (no province assignment)
- **Full Access**: Can view, edit, and delete data from ANY province (no restrictions)
- **National Stats View**: Can see dashboard/stats from ALL provinces
- **Review Assignment**: Can be assigned to reviews from any province
- **Province Management**: Can edit province assignments for QCTO users (based on work assignment requests)
- **View As User**: Can view as any QCTO user they manage (QCTO_ADMIN, QCTO_USER, QCTO_REVIEWER, QCTO_AUDITOR, QCTO_VIEWER)
- Can manage QCTO team members
- Has full QCTO data access (not restricted by submissions/requests like QCTO_USER)

---

## 3. QCTO_ADMIN 🏛️

### Route Access
- ✅ `/qcto/*` (full QCTO area access)
- ✅ `/account/*` (account management)
- ✅ `/announcements` (view announcements)
- ❌ `/platform-admin/*` (cannot access)
- ❌ `/institution/*` (cannot access)
- ❌ `/student/*` (cannot access)

### Navigation Menu
- Dashboard
- QCTO Team (manage QCTO users and invites)
- Submissions (filtered by province assignment)
- Requests (filtered by province assignment)
- Institutions (filtered by province assignment)
- Readiness Reviews (filtered by province assignment)
- Evidence Flags
- Audit Logs
- Reports
- Announcements
- Account

### Data Access
- ✅ **QCTO Team Management**: Can invite, manage QCTO users
- ⚠️ **Institutions**: Only see institutions from their assigned provinces (can have multiple provinces)
- ⚠️ **Submissions**: Only see submissions from their assigned provinces (can have multiple provinces)
- ⚠️ **QCTO Requests**: Only see requests from their assigned provinces (can have multiple provinces)
- ⚠️ **Readiness Records**: Only see readiness records from their assigned provinces (can have multiple provinces)
- ⚠️ **Reviews**: Can be assigned to review work from their assigned provinces (can have multiple provinces)
- ⚠️ **Dashboard/Stats**: Only see stats from their assigned provinces (can have multiple provinces)
- ⚠️ **Documents**: Only see documents from their assigned provinces (can have multiple provinces)
- ⚠️ **Evidence Flags**: Only see evidence flags from their assigned provinces (can have multiple provinces)
- ⚠️ **Audit Logs**: Only see audit logs from their assigned provinces (can have multiple provinces)
- ⚠️ **Reports**: Only see reports from their assigned provinces (can have multiple provinces)
- ✅ **Province Management**: Can edit province assignments for QCTO users (based on work assignment requests)

### Capabilities
- QCTO_TEAM_MANAGE
- QCTO_REVIEW, QCTO_ASSIGN
- QCTO_AUDIT_READ, QCTO_EXPORT
- FORM5_VIEW
- EVIDENCE_VIEW
- QCTO_REVIEW_FLAG, QCTO_RECORD_RECOMMENDATION
- LEARNER_VIEW
- ATTENDANCE_VIEW
- AUDIT_VIEW, AUDIT_EXPORT
- REPORTS_VIEW, REPORTS_EXPORT

### Special Notes
- **Default Province Required**: Must have a default province (shows where they're employed)
- **Multiple Provinces**: Can have multiple provinces assigned (editable by QCTO_ADMIN or PLATFORM_ADMIN)
- **Province-Filtered**: All work, stats, and reviews are filtered to assigned provinces
- **Review Assignment**: Can be assigned to review work from any of their assigned provinces
- **Province Management**: Can edit province assignments for QCTO users (based on work assignment requests)
- **View As User**: Can view as QCTO users they manage (within their provinces or organization)
- Has full QCTO data access within their assigned provinces (not submission-based)

---

## 4. QCTO_USER 👤

### Route Access
- ✅ `/qcto/*` (QCTO area access)
- ✅ `/account/*` (account management)
- ✅ `/announcements` (view announcements)
- ❌ `/platform-admin/*` (cannot access)
- ❌ `/institution/*` (cannot access)
- ❌ `/student/*` (cannot access)

### Navigation Menu
- Dashboard
- Submissions (filtered by province + submission/request access)
- Requests (filtered by province + submission/request access)
- Institutions (filtered by province + submission/request access)
- Readiness Reviews (filtered by province + submission/request access)
- Evidence Flags
- Audit Logs
- Reports
- Announcements
- Account

### Data Access (Province + Submission/Request-Based)
- ⚠️ **Provincial Assignment**: Must be assigned to a province
- ⚠️ **Institutions**: Can ONLY view institutions that:
  - Are from one of their assigned provinces, AND
  - Have APPROVED submissions, OR
  - Have APPROVED QCTO requests, OR
  - Have SUBMITTED/UNDER_REVIEW submissions (for review)
- ⚠️ **Submissions**: Can ONLY view submissions that:
  - Are from one of their assigned provinces, AND
  - Are SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, RETURNED_FOR_CORRECTION
  - Cannot view DRAFT submissions
- ⚠️ **QCTO Requests**: Can create requests, view requests from their assigned provinces that they created or have access to
- ⚠️ **Readiness Records**: Can ONLY view readiness records that:
  - Are from one of their assigned provinces, AND
  - Are linked to accessible submissions/requests
- ⚠️ **Reviews**: Can be assigned to review work from any of their assigned provinces (multiple reviewers can be assigned simultaneously - fail-safe feature)
- ⚠️ **Learners**: Can ONLY view learners from their assigned provinces linked to accessible submissions/requests
- ⚠️ **Enrolments**: Can ONLY view enrolments from their assigned provinces linked to accessible submissions/requests
- ⚠️ **Documents**: Can ONLY view documents from their assigned provinces linked to accessible submissions/requests
- ⚠️ **Dashboard/Stats**: Only see stats from their assigned provinces
- ✅ **Evidence Flags**: Can view and flag evidence (from their assigned provinces)
- ✅ **Audit Logs**: Can view audit logs (filtered to assigned provinces + accessible data)
- ✅ **Reports**: Can view and export reports (filtered to assigned provinces + accessible data)

### Capabilities
- FORM5_VIEW
- EVIDENCE_VIEW
- QCTO_REVIEW_FLAG, QCTO_RECORD_RECOMMENDATION
- QCTO_REVIEW
- QCTO_AUDIT_READ, QCTO_EXPORT
- LEARNER_VIEW (limited to assigned provinces + accessible learners)
- ATTENDANCE_VIEW (limited to assigned provinces + accessible enrolments)
- AUDIT_VIEW, AUDIT_EXPORT
- REPORTS_VIEW, REPORTS_EXPORT

### Special Notes
- **Default Province Required**: Must have a default province
- **Multiple Provinces**: Can have multiple provinces assigned (editable by QCTO_ADMIN or PLATFORM_ADMIN)
- **Dual Filtering**: Access is filtered by BOTH assigned provinces AND submission/request access
- **Review Assignment**: Can be assigned to review work from any of their assigned provinces (multiple reviewers can be assigned simultaneously - fail-safe feature)
- Cannot access QCTO Team management
- Cannot access QCTO Settings
- Cannot edit province assignments (only QCTO_ADMIN or PLATFORM_ADMIN can)
- Cannot edit province assignments (only QCTO_ADMIN or PLATFORM_ADMIN can)
- Deny-by-default: if institution hasn't shared data OR is from different province, QCTO_USER cannot see it

---

## 5. QCTO_REVIEWER 👁️

### Route Access
- ✅ `/qcto/*` (QCTO area access)
- ✅ `/account/*` (account management)
- ✅ `/announcements` (view announcements)
- ❌ `/platform-admin/*` (cannot access)
- ❌ `/institution/*` (cannot access)
- ❌ `/student/*` (cannot access)

### Navigation Menu
- Dashboard
- Submissions (filtered by province assignment)
- Requests (filtered by province assignment)
- Institutions (filtered by province assignment)
- Readiness Reviews (filtered by province assignment)
- Evidence Flags
- Audit Logs
- Reports
- Announcements
- Account

### Data Access
- ⚠️ **Default Province Required**: Must have a default province
- ⚠️ **Multiple Provinces**: Can have multiple provinces assigned (editable by QCTO_ADMIN or PLATFORM_ADMIN)
- ⚠️ **Review Assignment**: Can be assigned to review work from any of their assigned provinces (multiple reviewers can be assigned simultaneously - fail-safe feature)
- ✅ **Submissions**: Can review submissions from their assigned provinces (if assigned to review)
- ✅ **Readiness Records**: Can review and recommend readiness records from their assigned provinces (if assigned to review)
- ✅ **Evidence Flags**: Can flag evidence from their assigned provinces
- ✅ **Documents**: Can view documents for review from their assigned provinces
- ⚠️ **Dashboard/Stats**: Only see stats from their assigned provinces
- ❌ **Cannot manage QCTO team**
- ❌ **Cannot export data** (no QCTO_EXPORT capability)
- ❌ **Limited audit access** (read-only, province-filtered)
- ❌ **Cannot edit province assignments** (only QCTO_ADMIN or PLATFORM_ADMIN can)

### Capabilities
- QCTO_REVIEW
- FORM5_VIEW
- EVIDENCE_VIEW
- QCTO_REVIEW_FLAG, QCTO_RECORD_RECOMMENDATION
- LEARNER_VIEW
- ATTENDANCE_VIEW
- AUDIT_VIEW (read-only)
- REPORTS_VIEW (read-only)

### Special Notes
- **Default Province Required**: Must have a default province
- **Multiple Provinces**: Can have multiple provinces assigned (editable by QCTO_ADMIN or PLATFORM_ADMIN)
- **Review Assignment**: Can be assigned to review work from any of their assigned provinces (multiple reviewers can be assigned simultaneously - fail-safe feature)
- Focused on review tasks (submissions, readiness, evidence)
- Cannot export or manage team
- Cannot edit province assignments (only QCTO_ADMIN or PLATFORM_ADMIN can)
- All access is filtered to assigned provinces

---

## 6. QCTO_AUDITOR 🔍

### Route Access
- ✅ `/qcto/*` (QCTO area access)
- ✅ `/account/*` (account management)
- ✅ `/announcements` (view announcements)
- ❌ `/platform-admin/*` (cannot access)
- ❌ `/institution/*` (cannot access)
- ❌ `/student/*` (cannot access)

### Navigation Menu
- Dashboard
- Audit Logs (primary focus - filtered by province)
- Reports (filtered by province)
- Announcements
- Account

### Data Access
- ⚠️ **Default Province Required**: Must have a default province
- ⚠️ **Multiple Provinces**: Can have multiple provinces assigned (editable by QCTO_ADMIN or PLATFORM_ADMIN)
- ✅ **Audit Logs**: Can view and export audit logs from their assigned provinces
- ✅ **Reports**: Can view and export reports from their assigned provinces
- ⚠️ **Dashboard/Stats**: Only see stats from their assigned provinces
- ❌ **Cannot review submissions** (no QCTO_REVIEW)
- ❌ **Cannot flag evidence** (no QCTO_REVIEW_FLAG)
- ❌ **Cannot manage QCTO team**
- ❌ **Cannot edit province assignments** (only QCTO_ADMIN or PLATFORM_ADMIN can)
- ❌ **Limited to audit and reporting functions**

### Capabilities
- QCTO_AUDIT_READ, QCTO_EXPORT
- AUDIT_VIEW, AUDIT_EXPORT
- REPORTS_VIEW, REPORTS_EXPORT

### Special Notes
- **Default Province Required**: Must have a default province
- **Multiple Provinces**: Can have multiple provinces assigned (editable by QCTO_ADMIN or PLATFORM_ADMIN)
- **Audit-focused role**: Primarily for viewing audit logs and generating reports
- Cannot perform review actions
- Cannot edit province assignments (only QCTO_ADMIN or PLATFORM_ADMIN can)
- All access is filtered to assigned provinces

---

## 7. QCTO_VIEWER 👀

### Route Access
- ✅ `/qcto/*` (QCTO area access - read-only)
- ✅ `/account/*` (account management)
- ✅ `/announcements` (view announcements)
- ❌ `/platform-admin/*` (cannot access)
- ❌ `/institution/*` (cannot access)
- ❌ `/student/*` (cannot access)

### Navigation Menu
- Dashboard
- Submissions (view-only, filtered by province)
- Requests (view-only, filtered by province)
- Institutions (view-only, filtered by province)
- Readiness Reviews (view-only, filtered by province)
- Evidence Flags (view-only, filtered by province)
- Audit Logs (view-only, filtered by province)
- Reports (view-only, filtered by province)
- Announcements
- Account

### Data Access
- ⚠️ **Default Province Required**: Must have a default province
- ⚠️ **Multiple Provinces**: Can have multiple provinces assigned (editable by QCTO_ADMIN or PLATFORM_ADMIN)
- ✅ **Read-only access**: Can view but cannot edit/approve/reject
- ✅ **Submissions**: Can view from their assigned provinces (read-only)
- ✅ **Readiness Records**: Can view from their assigned provinces (read-only)
- ✅ **Documents**: Can view from their assigned provinces (read-only)
- ✅ **Evidence Flags**: Can view from their assigned provinces (read-only)
- ✅ **Audit Logs**: Can view from their assigned provinces (read-only)
- ✅ **Reports**: Can view from their assigned provinces (read-only)
- ⚠️ **Dashboard/Stats**: Only see stats from their assigned provinces
- ❌ **Cannot review, approve, reject, or flag**
- ❌ **Cannot export data**
- ❌ **Cannot manage QCTO team**
- ❌ **Cannot edit province assignments** (only QCTO_ADMIN or PLATFORM_ADMIN can)

### Capabilities
- FORM5_VIEW (read-only)
- EVIDENCE_VIEW (read-only)
- LEARNER_VIEW (read-only)
- ATTENDANCE_VIEW (read-only)
- AUDIT_VIEW (read-only)
- REPORTS_VIEW (read-only)

### Special Notes
- **Default Province Required**: Must have a default province
- **Multiple Provinces**: Can have multiple provinces assigned (editable by QCTO_ADMIN or PLATFORM_ADMIN)
- **Pure read-only role**: No write/action capabilities
- Cannot edit province assignments (only QCTO_ADMIN or PLATFORM_ADMIN can)
- All access is filtered to assigned provinces

---

## 8. INSTITUTION_ADMIN 🏢

### Route Access
- ✅ `/institution/*` (full institution area access)
- ✅ `/account/*` (account management)
- ✅ `/announcements` (view announcements)
- ❌ `/platform-admin/*` (cannot access)
- ❌ `/qcto/*` (cannot access)
- ❌ `/student/*` (cannot access)

### Navigation Menu
- Dashboard
- Institution Profile (edit institution details)
- Staff (manage institution staff)
- Invites (manage institution invites)
- Announcements (institution announcements)
- Learners (all learners in their institution)
- Enrolments (all enrolments in their institution)
- Attendance Register (capture and view attendance)
- Submissions (create and manage submissions to QCTO)
- QCTO Requests (view and approve/reject QCTO requests)
- Readiness (Form 5 - create, edit, submit)
- Evidence Vault (upload and manage documents)
- Reports
- Announcements (platform announcements)
- Account

### Data Access
- ✅ **Own Institution**: Full access to their institution's data
- ✅ **Institution Profile**: Can edit institution details
- ✅ **Staff Management**: Can invite, assign roles, deactivate staff
- ✅ **All Learners**: Can view, create, edit, archive all learners in their institution
- ✅ **All Enrolments**: Can create, edit, manage all enrolments in their institution
- ✅ **Attendance**: Can capture and view attendance for all enrolments
- ✅ **Submissions**: Can create, edit, submit submissions to QCTO
- ✅ **QCTO Requests**: Can view and approve/reject QCTO requests for their institution
- ✅ **Readiness Records**: Can create, edit, submit Form 5 readiness records
- ✅ **Documents**: Can upload, view, replace documents
- ✅ **Audit Logs**: Can view audit logs for their institution
- ✅ **Reports**: Can view and export reports for their institution
- ✅ **Announcements**: Can create institution-specific announcements
- ❌ **Cannot see other institutions' data**
- ❌ **Cannot see QCTO data** (except through submissions/requests)

### Capabilities
- INSTITUTION_PROFILE_EDIT
- STAFF_INVITE, STAFF_ASSIGN_ROLES, STAFF_DEACTIVATE
- FORM5_VIEW, FORM5_EDIT, FORM5_SUBMIT
- EVIDENCE_VIEW, EVIDENCE_UPLOAD, EVIDENCE_REPLACE
- LEARNER_VIEW, LEARNER_CREATE, LEARNER_EDIT, LEARNER_ARCHIVE
- ENROLMENT_CREATE, ENROLMENT_EDIT_STATUS
- ATTENDANCE_CAPTURE, ATTENDANCE_VIEW
- AUDIT_VIEW
- REPORTS_VIEW, REPORTS_EXPORT

### Special Notes
- **Full control** over their institution's data
- Can manage staff and invites
- Can submit data to QCTO via submissions
- Can approve/reject QCTO requests for their institution
- **View As User**: Can view as users in their institution (INSTITUTION_STAFF, STUDENTS in their institution)

---

## 9. INSTITUTION_STAFF 👨‍💼

### Route Access
- ✅ `/institution/*` (institution area access - limited)
- ✅ `/account/*` (account management)
- ✅ `/announcements` (view announcements)
- ❌ `/platform-admin/*` (cannot access)
- ❌ `/qcto/*` (cannot access)
- ❌ `/student/*` (cannot access)

### Navigation Menu
- Dashboard
- Learners (view learners - may be assignment-based)
- Enrolments (view enrolments - may be assignment-based)
- Attendance Register (capture attendance)
- Submissions (view submissions - may be assignment-based)
- QCTO Requests (view requests)
- Readiness (view Form 5 - may be assignment-based)
- Evidence Vault (view and upload documents - may be assignment-based)
- Reports (view reports)
- Announcements
- Account

### Data Access
- ⚠️ **Assignment-based access**: Many capabilities are "assigned-only" (enforced in backend)
- ✅ **Own Institution**: Access to their institution's data (may be filtered by assignments)
- ✅ **Learners**: Can view learners (create/edit if assigned)
- ✅ **Enrolments**: Can view enrolments (create if assigned)
- ✅ **Attendance**: Can capture attendance for assigned enrolments
- ✅ **Submissions**: Can view submissions (may be assignment-based)
- ✅ **Readiness Records**: Can view Form 5 (edit if assigned)
- ✅ **Documents**: Can view documents (upload/replace if assigned)
- ✅ **Audit Logs**: Can view own actions only
- ✅ **Reports**: Can view reports
- ❌ **Cannot edit institution profile**
- ❌ **Cannot manage staff**
- ❌ **Cannot create invites**
- ❌ **Cannot submit readiness records** (no FORM5_SUBMIT)

### Capabilities
- FORM5_VIEW, FORM5_EDIT (assigned-only)
- EVIDENCE_VIEW, EVIDENCE_UPLOAD, EVIDENCE_REPLACE (assigned-only)
- LEARNER_VIEW, LEARNER_CREATE, LEARNER_EDIT (assigned-only)
- ENROLMENT_CREATE (assigned-only)
- ATTENDANCE_CAPTURE, ATTENDANCE_VIEW
- AUDIT_VIEW (own actions only)
- REPORTS_VIEW

### Special Notes
- **Limited permissions**: Many actions require explicit assignment
- Cannot manage institution settings or staff
- Cannot submit readiness records (only admins can submit)
- Access may be filtered by assignments (needs confirmation)

---

## 10. STUDENT 🎓

### Route Access
- ✅ `/student/*` (student area access)
- ✅ `/account/*` (account management)
- ✅ `/announcements` (view announcements)
- ❌ `/platform-admin/*` (cannot access)
- ❌ `/qcto/*` (cannot access)
- ❌ `/institution/*` (cannot access)

### Navigation Menu
- Dashboard
- My Profile & CV (own profile)
- My Enrolments (own enrolments)
- Attendance (own attendance records)
- Certificates (own certificates)
- Announcements
- Account (Profile, Security, Logs, Notifications, Academic Profile)

### Data Access
- ✅ **Own Profile**: Can view and edit own learner profile
- ✅ **Own Enrolments**: Can view own enrolments only
- ✅ **Own Attendance**: Can view own attendance records
- ✅ **Own Certificates**: Can view own certificates
- ✅ **Public Profile**: Can manage public profile settings
- ❌ **Cannot see other learners' data**
- ❌ **Cannot see institution data** (except own)
- ❌ **Cannot see QCTO data**
- ❌ **Cannot see submissions or readiness records**

### Capabilities
- LEARNER_VIEW (own data only)
- ATTENDANCE_VIEW (own data only)

### Special Notes
- **Self-only access**: Can only see and manage their own data
- All access is scoped to their own learner record
- Cannot see institution-level data or other learners

---

## View As User Feature Summary

### Who Can View As User

1. **PLATFORM_ADMIN**:
   - ✅ Can view as **ANY user** in the platform
   - ✅ Can view Student, Institution, QCTO dashboards
   - ✅ Full access to all user types

2. **QCTO_SUPER_ADMIN**:
   - ✅ Can view as **QCTO users they manage** (QCTO_ADMIN, QCTO_USER, QCTO_REVIEWER, QCTO_AUDITOR, QCTO_VIEWER)
   - ✅ Can view QCTO dashboards for managed users
   - ❌ Cannot view as Institution or Student users

3. **QCTO_ADMIN**:
   - ✅ Can view as **QCTO users they manage** (within their provinces or organization)
   - ✅ Can view QCTO dashboards for managed users
   - ❌ Cannot view as Institution or Student users

4. **INSTITUTION_ADMIN**:
   - ✅ Can view as **users in their institution** (INSTITUTION_STAFF, STUDENTS)
   - ✅ Can view Institution and Student dashboards for their users
   - ❌ Cannot view as QCTO users or users from other institutions

5. **Other Roles**:
   - ❌ Cannot view as other users (no "View As User" feature)

### View As User Rules

- **Scope**: Admins can only view as users they manage/have access to
- **Dashboard**: Automatically shows appropriate dashboard based on selected user's role
- **Context**: Shows data scoped to that user (their institution, their provinces, etc.)
- **Read-Only**: Viewing as another user is read-only (cannot perform actions on their behalf)
- **Audit**: All "View As User" actions are logged in audit logs

## Access Patterns Summary

### Full Access Roles
- **PLATFORM_ADMIN**: Unrestricted access to everything + View As Any User
- **QCTO_SUPER_ADMIN**: Full QCTO data access (not submission-based) + View As QCTO Users
- **QCTO_ADMIN**: Full QCTO data access (not submission-based) + View As QCTO Users (within scope)

### Restricted Access Roles
- **QCTO_USER**: Submission/request-based access only
- **QCTO_REVIEWER**: Review-focused, province-based
- **QCTO_AUDITOR**: Audit-focused, province-based
- **QCTO_VIEWER**: Read-only, province-based

### Institution-Scoped Roles
- **INSTITUTION_ADMIN**: Full access to own institution + View As Institution Users
- **INSTITUTION_STAFF**: Limited access, assignment-based

### Self-Scoped Role
- **STUDENT**: Own data only

---

## Provincial Assignment Summary

### Provincial Assignment Rules

1. **QCTO_SUPER_ADMIN**:
   - **No province required** (can be national)
   - Can view, edit, and delete data from **ANY province** (no restrictions)
   - Dashboard/stats show **ALL provinces** (national view)
   - Can be assigned to reviews from any province

2. **QCTO_ADMIN**:
   - **Default province required** (shows where they're employed)
   - **Can have multiple provinces assigned** (editable by QCTO_ADMIN or PLATFORM_ADMIN based on work assignment requests)
   - All work, stats, and reviews filtered to assigned provinces
   - Dashboard/stats show only assigned provinces
   - Can edit province assignments for QCTO users

3. **QCTO_USER**:
   - **Default province required**
   - **Can have multiple provinces assigned** (editable by QCTO_ADMIN or PLATFORM_ADMIN)
   - Access filtered by BOTH assigned provinces AND submission/request access
   - Can be assigned to reviews from any of their assigned provinces
   - Dashboard/stats show only assigned provinces
   - Cannot edit own province assignments

4. **QCTO_REVIEWER**:
   - **Default province required**
   - **Can have multiple provinces assigned** (editable by QCTO_ADMIN or PLATFORM_ADMIN)
   - Reviews can be assigned from any of their assigned provinces
   - All access filtered to assigned provinces
   - Dashboard/stats show only assigned provinces
   - Cannot edit own province assignments

5. **QCTO_AUDITOR**:
   - **Default province required**
   - **Can have multiple provinces assigned** (editable by QCTO_ADMIN or PLATFORM_ADMIN)
   - Audit logs and reports filtered to assigned provinces
   - Dashboard/stats show only assigned provinces
   - Cannot edit own province assignments

6. **QCTO_VIEWER**:
   - **Default province required**
   - **Can have multiple provinces assigned** (editable by QCTO_ADMIN or PLATFORM_ADMIN)
   - All read-only access filtered to assigned provinces
   - Dashboard/stats show only assigned provinces
   - Cannot edit own province assignments

### Review Assignment Logic

- Reviews are **assigned** to QCTO users based on:
  1. **Province matching**: Institution's province must match one of reviewer's assigned provinces
  2. **Role capability**: User must have QCTO_REVIEW capability
  3. **Multiple reviewers**: A review can be assigned to **multiple reviewers simultaneously** (fail-safe feature)
  4. **Default province**: Each reviewer has a default province (shows where they're employed)

- **QCTO_SUPER_ADMIN** can be assigned to reviews from any province (no restriction)

### Province Assignment Management

- **Who can edit province assignments:**
  - **QCTO_SUPER_ADMIN**: Can edit any QCTO user's province assignments
  - **QCTO_ADMIN**: Can edit QCTO user's province assignments (based on work assignment requests)
  - **PLATFORM_ADMIN**: Can edit any QCTO user's province assignments (based on work assignment requests)
  - **Other QCTO roles**: Cannot edit province assignments (read-only)

- **Province assignment features:**
  - **Default province**: Required for all QCTO roles except QCTO_SUPER_ADMIN (shows employment location)
  - **Multiple provinces**: QCTO_ADMIN and other QCTO roles can have multiple provinces assigned
  - **Editable**: Province assignments can be updated based on work assignment requests

## Schema Requirements (Based on Provincial Assignment Rules)

### Required Fields for User Model

1. **`default_province`** (String, nullable):
   - Required for: QCTO_ADMIN, QCTO_USER, QCTO_REVIEWER, QCTO_AUDITOR, QCTO_VIEWER
   - Optional for: QCTO_SUPER_ADMIN (can be null/national)
   - Shows where the user is employed

2. **`assigned_provinces`** (String[], array):
   - Array of province names the user can access
   - Can have multiple provinces
   - Editable by QCTO_ADMIN or PLATFORM_ADMIN
   - Must include `default_province` in the array

3. **Review Assignment Model** (new):
   - Links reviews to multiple reviewers (fail-safe)
   - Tracks which reviewers are assigned to which reviews
   - Based on province matching

### Questions for Review

1. **INSTITUTION_STAFF**: How do "assignments" work? Are there explicit assignment records, or is it based on other criteria?
2. **Review Assignment Model**: Should we create a separate `ReviewAssignment` model to track which reviewers are assigned to which reviews?
3. **Province Assignment UI**: How should province assignments be managed? Separate admin page or inline editing?

---

**Please review and correct any inaccuracies!** ✅
