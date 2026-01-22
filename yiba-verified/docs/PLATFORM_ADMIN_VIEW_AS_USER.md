# 👑 View As User Feature (For All Admins)

## Overview

Admins who manage users need the ability to view their users' dashboards to assist them, debug issues, and understand user experience. This document describes the **"View As User"** feature available to Platform Admin, QCTO Admins, and Institution Admins.

---

## View As User Feature

### Purpose
Allow admins to view their managed users' dashboards and experience the platform from their perspective.

### Who Can Use This Feature

1. **PLATFORM_ADMIN**: Can view as **ANY user** in the platform
2. **QCTO_SUPER_ADMIN**: Can view as **QCTO users they manage**
3. **QCTO_ADMIN**: Can view as **QCTO users they manage** (within their provinces/organization)
4. **INSTITUTION_ADMIN**: Can view as **users in their institution** (INSTITUTION_STAFF, STUDENTS)

### Implementation

1. **User Selection**:
   - **PLATFORM_ADMIN**: In "All Users" page (`/platform-admin/users`), can select any user
   - **QCTO_SUPER_ADMIN**: In "QCTO Team" page (`/qcto/team`), can select QCTO users they manage
   - **QCTO_ADMIN**: In "QCTO Team" page (`/qcto/team`), can select QCTO users they manage (within scope)
   - **INSTITUTION_ADMIN**: In "Staff" page (`/institution/staff`) or "Learners" page (`/institution/learners`), can select users in their institution
   - Click "View Dashboard" or "View As User" button

2. **Dashboard Rendering**:
   - Dashboard automatically renders based on selected user's role
   - Shows data as if logged in as that user (with their permissions/filters)
   - Navigation menu adapts to that user's role

3. **Supported User Types**:
   - ✅ **STUDENT** → Student Dashboard
   - ✅ **INSTITUTION_ADMIN** → Institution Dashboard
   - ✅ **INSTITUTION_STAFF** → Institution Dashboard
   - ✅ **QCTO_SUPER_ADMIN** → QCTO Dashboard
   - ✅ **QCTO_ADMIN** → QCTO Dashboard (filtered to their provinces)
   - ✅ **QCTO_USER** → QCTO Dashboard (filtered to their provinces + submissions)
   - ✅ **QCTO_REVIEWER** → QCTO Dashboard (shows assigned reviews)
   - ✅ **QCTO_AUDITOR** → QCTO Dashboard (audit-focused)
   - ✅ **QCTO_VIEWER** → QCTO Dashboard (read-only)

4. **Context Preservation**:
   - Dashboard shows data scoped to that user's context
   - Institution users see only their institution's data
   - QCTO users see data filtered by their provinces
   - Students see only their own data

5. **Navigation**:
   - Can navigate within that user's area (e.g., Institution pages, QCTO pages)
   - Can view their submissions, readiness records, etc.
   - Can see what they see

6. **Exit Mode**:
   - Clear "Exit View As" button
   - Returns to Platform Admin dashboard
   - Preserves Platform Admin context

### Access Rules

1. **PLATFORM_ADMIN**:
   - ✅ Can view as ANY user (Student, Institution, QCTO)
   - ✅ No restrictions

2. **QCTO_SUPER_ADMIN**:
   - ✅ Can view as QCTO users they manage (QCTO_ADMIN, QCTO_USER, QCTO_REVIEWER, QCTO_AUDITOR, QCTO_VIEWER)
   - ❌ Cannot view as Institution or Student users

3. **QCTO_ADMIN**:
   - ✅ Can view as QCTO users they manage (within their provinces or organization)
   - ❌ Cannot view as Institution or Student users
   - ❌ Cannot view as QCTO users outside their scope

4. **INSTITUTION_ADMIN**:
   - ✅ Can view as users in their institution (INSTITUTION_STAFF, STUDENTS)
   - ❌ Cannot view as QCTO users
   - ❌ Cannot view as users from other institutions

### Use Cases

1. **User Support**:
   - User reports an issue → Admin views their dashboard
   - See exactly what the user sees
   - Identify the problem quickly

2. **Debugging**:
   - Investigate why a user can't see certain data
   - Verify permissions are working correctly
   - Test user experience

3. **Training**:
   - Show users how to use features
   - Demonstrate workflows
   - Guide users through processes

4. **Quality Assurance**:
   - Verify dashboards render correctly for each role
   - Test different user scenarios
   - Ensure data filtering works properly

5. **Management**:
   - QCTO Admins can check what their team members see
   - Institution Admins can assist their staff and students
   - Ensure proper access and permissions

---

## Additional Statistics for Platform Admin

*(Note: These comprehensive statistics are only available to PLATFORM_ADMIN. QCTO and Institution Admins see statistics scoped to their areas.)*

### Platform-Wide Statistics

#### Institution Metrics
- Total institutions (by status: APPROVED, DRAFT, SUSPENDED)
- Institutions by province
- Institutions by type (TVET, PRIVATE_SDP, NGO, UNIVERSITY, OTHER)
- Active institutions (with recent activity)
- New institutions (created in last 7/30 days)
- Institution growth trends

#### Learner Metrics
- Total learners (across all institutions)
- Learners by institution
- Learners by province
- Learners by enrolment status
- New learners (created in last 7/30 days)
- Learner growth trends

#### Enrolment Metrics
- Total enrolments (by status: ACTIVE, COMPLETED, TRANSFERRED, ARCHIVED)
- Enrolments by institution
- Enrolments by province
- Enrolments by qualification
- Completion rates
- Average enrolment duration
- Enrolment trends

#### User Metrics
- Total users (by role, by status)
- Users by institution
- Users by province (for QCTO users)
- Active users (logged in last 7/30 days)
- Daily/weekly active users
- User growth trends
- User engagement metrics (login frequency, session duration)

#### Submission Metrics
- Total submissions (by status, by institution, by province)
- Submissions by type (READINESS, ACCREDITATION, LEARNER_EVIDENCE, etc.)
- Average review time
- Overdue submissions/reviews
- Submission approval/rejection rates
- Submission trends

#### QCTO Request Metrics
- Total QCTO requests (by status, by institution)
- Request approval/rejection rates
- Average response time
- Request trends

#### Readiness Metrics
- Total readiness records (by status, by institution)
- Readiness submission rates
- Readiness approval/rejection rates
- Average review time
- Readiness trends

#### Document Metrics
- Total documents (by type, by institution)
- Document upload rates
- Document storage usage
- Document trends

#### Invite Metrics
- Total invites (by status, by role)
- Invite acceptance rates
- Invite delivery rates
- Invite trends

### QCTO Statistics (Aggregated)

- QCTO team size (by role)
- QCTO reviews completed (by province, by reviewer)
- QCTO requests created/approved/rejected
- QCTO evidence flags (active, resolved)
- QCTO audit logs
- QCTO user activity
- QCTO provincial assignments

### Institution Statistics (Aggregated)

- Institution submissions (by status)
- Institution readiness records (by status)
- Institution learners (by enrolment status)
- Institution attendance rates
- Institution document uploads
- Institution activity levels

### Student Statistics (Aggregated)

- Total students (by institution, by province)
- Student enrolments (by status)
- Student attendance rates
- Student completion rates
- Student engagement metrics

### Provincial Statistics

- Institutions by province
- Learners by province
- Submissions by province
- QCTO reviews by province
- Activity by province
- Provincial growth trends

### Time-Based Analytics

- Growth trends (institutions, learners, users)
- Activity trends (submissions, reviews, logins)
- Performance metrics (review times, approval rates)
- Engagement metrics (daily/weekly active users)
- Seasonal patterns

### System Health Metrics

- Database status (healthy, degraded, down)
- Recent errors (count, types, frequency)
- API response times
- Storage usage
- Email delivery rates
- Notification delivery rates
- System uptime
- Performance metrics

### Audit & Compliance Metrics

- Total audit logs
- Audit log trends
- Compliance check results
- Data quality metrics
- Security events

---

## Implementation Notes

### Route Access

**PLATFORM_ADMIN** can access:
- `/platform-admin/*` (own area)
- `/qcto/*` (view QCTO dashboards)
- `/institution/*` (view institution dashboards)
- `/student/*` (view student dashboards)

**QCTO_SUPER_ADMIN** and **QCTO_ADMIN** can access:
- `/qcto/*` (view QCTO dashboards for managed users)
- Cannot access `/institution/*` or `/student/*` (unless viewing as those users - but they can't)

**INSTITUTION_ADMIN** can access:
- `/institution/*` (view institution dashboards for their users)
- `/student/*` (view student dashboards for students in their institution)
- Cannot access `/qcto/*` (unless viewing as QCTO user - but they can't)

### API Access
- Platform Admin API calls should include a `viewAsUserId` parameter when viewing as another user
- Backend should return data scoped to that user's context
- Platform Admin's own permissions are preserved (can still see everything)

### UI Components

**PLATFORM_ADMIN**:
- User selector dropdown in Platform Admin dashboard
- "View As User" button in Users list (`/platform-admin/users`)

**QCTO_SUPER_ADMIN** and **QCTO_ADMIN**:
- "View Dashboard" button in QCTO Team list (`/qcto/team`)
- Only shows for QCTO users they manage

**INSTITUTION_ADMIN**:
- "View Dashboard" button in Staff list (`/institution/staff`)
- "View Dashboard" button in Learners list (`/institution/learners`)
- Only shows for users in their institution

**All Admins**:
- "Exit View As" banner when viewing as another user
- Context indicator showing which user's view is active
- Clear visual distinction between admin view and user view

### Security
- Only admins with user management permissions can use "View As User" feature
- Admins can only view as users they manage/have access to
- Audit logs should record when an admin views as another user (who, when, which user)
- No write operations allowed when viewing as another user (read-only)
- Clear visual indicators that you're viewing as another user
- Cannot escalate permissions (e.g., QCTO_ADMIN cannot view as PLATFORM_ADMIN)

---

## Future Enhancements

1. **View As User with Actions**: Allow Platform Admin to perform actions on behalf of users (with audit trail)
2. **Session Replay**: Record and replay user sessions for debugging
3. **Comparison View**: Compare two users' dashboards side-by-side
4. **Custom Dashboards**: Allow Platform Admin to create custom dashboard views
5. **Real-time Monitoring**: Live updates of system metrics
6. **Alert System**: Notifications for critical metrics (errors, performance issues)

---

**Status**: 📋 **Proposed Feature**

**Priority**: 🔥 **High** (Essential for support and debugging)
