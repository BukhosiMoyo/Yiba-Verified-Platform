# User Roles and Responsibilities

This document outlines all user types in the Yiba Verified system and their specific responsibilities and permissions.

## Overview

The system has **10 distinct user roles** organized into 4 main categories:
1. **Platform Administration** (1 role)
2. **QCTO (Quality Council for Trades and Occupations)** (6 roles)
3. **Institution** (2 roles)
4. **Student** (1 role)

---

## 1. Platform Administration

### PLATFORM_ADMIN
**Purpose**: System administrators with full access to manage the entire platform.

**Responsibilities**:
- Manage all institutions, users, and learners across the platform
- Create and manage user accounts and invites
- View and export audit logs
- Access system health monitoring
- Create platform-wide announcements
- Full access to all data (no province filtering)
- Can impersonate other users for support purposes

**Key Capabilities**:
- Institution profile editing
- Staff invitation and role assignment
- Form 5 (Readiness) viewing, editing, and submission
- Evidence/document management
- Learner management (view, create, edit, archive)
- Enrolment management
- Attendance capture and viewing
- Audit log viewing and export
- Reports viewing and export
- Feature approval and alerts

**Access Areas**: `/platform-admin`, `/account`, `/announcements`

---

## 2. QCTO Roles

All QCTO roles have access to the `/qcto` area and are subject to **province-based filtering** (except QCTO_SUPER_ADMIN). QCTO users can only access data from institutions in their assigned provinces.

### QCTO_SUPER_ADMIN
**Purpose**: Highest-level QCTO administrator with national scope.

**Responsibilities**:
- Manage QCTO team members and invites
- Review readiness submissions and make recommendations
- Assign reviews to other QCTO staff
- Access audit logs and export data
- Configure QCTO settings
- **No province restrictions** - can access all provinces

**Key Capabilities**:
- QCTO team management
- Review readiness submissions
- Assign reviews to reviewers
- Audit log access
- Data export
- QCTO settings configuration
- Form 5 viewing
- Evidence viewing
- Review flagging and recommendations
- Learner viewing
- Attendance viewing
- Reports viewing and export

**Province Filtering**: ❌ None (national access)

---

### QCTO_ADMIN
**Purpose**: Provincial QCTO administrator with full access within assigned provinces.

**Responsibilities**:
- Manage QCTO team members within their province
- Review readiness submissions and make recommendations
- Assign reviews to reviewers
- Access audit logs and export data
- Full access to all QCTO features within assigned provinces

**Key Capabilities**:
- QCTO team management
- Review readiness submissions
- Assign reviews to reviewers
- Audit log access
- Data export
- Form 5 viewing
- Evidence viewing
- Review flagging and recommendations
- Learner viewing
- Attendance viewing
- Reports viewing and export

**Province Filtering**: ✅ Filtered by `assigned_provinces` (can have multiple provinces)

**Note**: Similar to QCTO_SUPER_ADMIN but restricted to assigned provinces.

---

### QCTO_USER ⭐
**Purpose**: Standard QCTO user with submission/request-based data access within assigned provinces.

**Responsibilities**:
- Review readiness submissions (Form 5) that institutions have submitted
- Flag evidence and documents for review
- Record recommendations on readiness submissions
- View learners, enrolments, and attendance data **only if**:
  - The data is linked to an **APPROVED submission** (institution submitted it), OR
  - The data is linked to an **APPROVED QCTORequest** (QCTO requested, institution approved)
- Export audit logs and reports
- View institutions within assigned provinces that have approved submissions or requests

**Key Capabilities**:
- Form 5 viewing
- Evidence viewing
- Review flagging and recommendations
- Review readiness submissions
- Audit log viewing and export
- Data export
- Learner viewing (submission/request-based access)
- Attendance viewing (submission/request-based access)
- Reports viewing and export

**Province Filtering**: ✅ Filtered by `assigned_provinces` (can have multiple provinces)

**Data Access Model**: 
- **Submission-based**: Can view resources (readiness, learners, documents) that institutions have submitted and QCTO has approved
- **Request-based**: Can view resources that QCTO requested and institutions approved
- **Deny-by-default**: If data isn't explicitly shared via submission or request, QCTO_USER cannot see it

**This is the most restricted QCTO role** - designed for reviewers who need controlled access to institution data.

---

### QCTO_REVIEWER
**Purpose**: Specialized reviewer focused on reviewing readiness submissions.

**Responsibilities**:
- Review readiness submissions (Form 5)
- Flag evidence and documents
- Record recommendations
- View learners and attendance (read-only)
- View audit logs (read-only)
- View reports (read-only)

**Key Capabilities**:
- Review readiness submissions
- Form 5 viewing
- Evidence viewing
- Review flagging and recommendations
- Learner viewing
- Attendance viewing
- Audit log viewing (read-only)
- Reports viewing (read-only)

**Province Filtering**: ✅ Filtered by `assigned_provinces`

**Note**: More limited than QCTO_USER - cannot export data or access audit exports.

---

### QCTO_AUDITOR
**Purpose**: Specialized role for auditing and compliance checking.

**Responsibilities**:
- Access audit logs and export them
- Export data for compliance reporting
- View reports
- Read-only access to audit trails

**Key Capabilities**:
- Audit log reading
- Data export
- Audit log viewing and export
- Reports viewing and export

**Province Filtering**: ✅ Filtered by `assigned_provinces`

**Note**: Very limited role focused solely on audit and compliance activities.

---

### QCTO_VIEWER
**Purpose**: Read-only access for viewing QCTO data.

**Responsibilities**:
- View Form 5 (Readiness) submissions
- View evidence and documents
- View learners and attendance
- View audit logs (read-only)
- View reports (read-only)

**Key Capabilities**:
- Form 5 viewing
- Evidence viewing
- Learner viewing
- Attendance viewing
- Audit log viewing (read-only)
- Reports viewing (read-only)

**Province Filtering**: ✅ Filtered by `assigned_provinces`

**Note**: Most limited QCTO role - pure read-only access with no review, flagging, or export capabilities.

---

## 3. Institution Roles

### INSTITUTION_ADMIN
**Purpose**: Administrator for an educational institution with full management capabilities.

**Responsibilities**:
- Manage institution profile and settings
- Invite and manage staff members
- Assign roles to staff
- Deactivate staff accounts
- Create and manage readiness submissions (Form 5)
- Upload and manage evidence/documents
- Create and manage learners
- Create and manage enrolments
- Capture and view attendance
- Create submissions to share data with QCTO
- Approve/reject QCTO requests for data access
- View audit logs and reports
- Export reports

**Key Capabilities**:
- Institution profile editing
- Staff invitation and role assignment
- Staff deactivation
- Form 5 viewing, editing, and submission
- Evidence/document management (view, upload, replace)
- Learner management (view, create, edit, archive)
- Enrolment creation and status editing
- Attendance capture and viewing
- Audit log viewing
- Reports viewing and export

**Access Areas**: `/institution`, `/account`, `/announcements`

---

### INSTITUTION_STAFF
**Purpose**: Staff member at an institution with limited, assignment-based permissions.

**Responsibilities**:
- View Form 5 (Readiness) submissions (assigned only)
- Edit Form 5 submissions (assigned only)
- Upload and replace evidence/documents (assigned only)
- View learners
- Create and edit learners (assigned only)
- Create enrolments (assigned only)
- Capture and view attendance
- View audit logs (own actions only)
- View reports

**Key Capabilities**:
- Form 5 viewing and editing (assigned-only)
- Evidence viewing, uploading, and replacing (assigned-only)
- Learner viewing, creating, and editing (assigned-only)
- Enrolment creation (assigned-only)
- Attendance capture and viewing
- Audit log viewing (own actions only)
- Reports viewing

**Access Areas**: `/institution`, `/account`, `/announcements`

**Note**: Most capabilities are "assigned-only" - meaning the staff member can only work on resources (readiness, learners, etc.) that have been specifically assigned to them by an INSTITUTION_ADMIN.

---

## 4. Student Role

### STUDENT
**Purpose**: Learners enrolled at institutions who can view their own academic information.

**Responsibilities**:
- View own learner profile and academic information
- View own enrolments
- View own attendance records
- View own certificates
- Manage public profile and CV
- View announcements

**Key Capabilities**:
- Learner viewing (self-only)
- Attendance viewing (self-only)

**Access Areas**: `/student`, `/account`, `/announcements`

**Note**: All access is restricted to the student's own data only. Backend routes enforce self-only access.

---

## Summary Table

| Role | Province Filtering | Data Access Model | Key Distinction |
|------|-------------------|-------------------|-----------------|
| **PLATFORM_ADMIN** | ❌ None | Full access | System-wide administrator |
| **QCTO_SUPER_ADMIN** | ❌ None | Full QCTO access | National QCTO admin |
| **QCTO_ADMIN** | ✅ Assigned provinces | Full QCTO access | Provincial QCTO admin |
| **QCTO_USER** | ✅ Assigned provinces | Submission/Request-based | Standard QCTO reviewer |
| **QCTO_REVIEWER** | ✅ Assigned provinces | Review-focused | Specialized reviewer |
| **QCTO_AUDITOR** | ✅ Assigned provinces | Audit-focused | Compliance auditor |
| **QCTO_VIEWER** | ✅ Assigned provinces | Read-only | View-only access |
| **INSTITUTION_ADMIN** | N/A | Own institution | Institution administrator |
| **INSTITUTION_STAFF** | N/A | Assigned resources | Limited staff member |
| **STUDENT** | N/A | Own data only | Self-service learner |

---

## QCTO_USER Explained

**QCTO_USER** is the standard QCTO role designed for reviewers who need controlled access to institution data. Unlike other QCTO roles:

1. **Submission-based access**: Can only view data that institutions have explicitly submitted via the Submissions system
2. **Request-based access**: Can view data that QCTO has requested and institutions have approved
3. **Province filtering**: Limited to institutions in assigned provinces
4. **Deny-by-default**: If data hasn't been shared via submission or request, it's not accessible

This ensures QCTO users can only access data that has been properly shared through the formal submission/request workflow, maintaining data privacy and compliance.

### QCTO_USER Capabilities vs Other QCTO Roles

**QCTO_USER has ALL capabilities of QCTO_REVIEWER, QCTO_AUDITOR, and QCTO_VIEWER combined**, plus additional capabilities:

| Capability | QCTO_USER | QCTO_REVIEWER | QCTO_AUDITOR | QCTO_VIEWER |
|------------|-----------|---------------|--------------|-------------|
| FORM5_VIEW | ✅ | ✅ | ❌ | ✅ |
| EVIDENCE_VIEW | ✅ | ✅ | ❌ | ✅ |
| QCTO_REVIEW_FLAG | ✅ | ✅ | ❌ | ❌ |
| QCTO_RECORD_RECOMMENDATION | ✅ | ✅ | ❌ | ❌ |
| QCTO_REVIEW | ✅ | ✅ | ❌ | ❌ |
| QCTO_AUDIT_READ | ✅ | ❌ | ✅ | ❌ |
| QCTO_EXPORT | ✅ | ❌ | ✅ | ❌ |
| LEARNER_VIEW | ✅ | ✅ | ❌ | ✅ |
| ATTENDANCE_VIEW | ✅ | ✅ | ❌ | ✅ |
| AUDIT_VIEW | ✅ | ✅ | ✅ | ✅ |
| AUDIT_EXPORT | ✅ | ❌ | ✅ | ❌ |
| REPORTS_VIEW | ✅ | ✅ | ✅ | ✅ |
| REPORTS_EXPORT | ✅ | ❌ | ✅ | ❌ |

**What QCTO_USER CANNOT do**:
- ❌ **QCTO_ASSIGN**: Cannot assign reviews to other reviewers (only QCTO_SUPER_ADMIN, QCTO_ADMIN, QCTO_REVIEWER, and QCTO_AUDITOR can assign)
- ❌ **QCTO_TEAM_MANAGE**: Cannot manage QCTO team members (only QCTO_SUPER_ADMIN and QCTO_ADMIN can)
- ❌ **QCTO_SETTINGS**: Cannot configure QCTO settings (only QCTO_SUPER_ADMIN can)

### Review Workflow and Approval

**QCTO_USER does NOT "accept" or "approve" reviews done by other roles**. The review system works as follows:

1. **Multiple reviewers can work on the same review simultaneously** (fail-safe feature)
2. **Any QCTO role with QCTO_REVIEW capability can review** readiness submissions:
   - QCTO_SUPER_ADMIN, QCTO_ADMIN: Can review without assignment
   - QCTO_USER, QCTO_REVIEWER: Can review (assignment is tracked but not strictly enforced)
3. **Reviews are independent**: Each reviewer can record their own recommendation
4. **No approval hierarchy**: There's no workflow where QCTO_USER approves reviews done by QCTO_REVIEWER, QCTO_AUDITOR, or QCTO_VIEWER
5. **Final recommendation**: Any reviewer with QCTO_RECORD_RECOMMENDATION capability can set the final recommendation status (RECOMMENDED/REJECTED)

**In practice**: QCTO_USER, QCTO_REVIEWER, QCTO_AUDITOR, and QCTO_VIEWER all work on reviews independently. QCTO_SUPER_ADMIN and QCTO_ADMIN can also assign reviews to organize work, but there's no approval chain where one role must approve another's work.

---

## Province Assignment

For QCTO roles (except QCTO_SUPER_ADMIN), users have:
- `default_province`: Primary province (required for most QCTO roles)
- `assigned_provinces`: Array of provinces the user can access (can be multiple)

Users can only access institutions and their data if the institution's province is in the user's `assigned_provinces` array.

---

## Account Navigation

All roles have access to:
- Profile
- Security
- Logs
- Notifications

Role-specific account pages:
- **PLATFORM_ADMIN**: Admin Preferences
- **Institution roles**: Organisation
- **QCTO roles**: Scope / Assignments (province management)
- **STUDENT**: Academic Profile
