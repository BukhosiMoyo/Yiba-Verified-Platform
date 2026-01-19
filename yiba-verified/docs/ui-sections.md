# Yiba Verified - UI Structure Documentation

This document describes the current UI structure of the Yiba Verified application. It is organized by user role and lists all pages, their routes, layouts, and UI components in order.

---

## Global UI Structure

### Root Layout (`/`)
- **Layout:** `src/app/layout.tsx`
- **Providers:** NextAuth providers wrapper
- **Global Styles:** `globals.css`

### App Shell Layout (Authenticated Routes)
- **Component:** `src/components/layout/AppShell.tsx`
- **Structure:**
  - Sidebar (desktop - always visible, mobile - sheet overlay)
  - Topbar (header bar)
  - Main content area (scrollable container with max-width and padding)

### Topbar Component
- **Component:** `src/components/layout/Topbar.tsx`
- **Sections:**
  - Mobile menu button (hamburger icon, mobile only)
  - Notification Bell component (with unread count badge)
  - User name and role badge (hidden on small screens)
  - Logout button (icon)

### Sidebar Component
- **Component:** `src/components/layout/Sidebar.tsx`
- **Sections:**
  - Logo/Brand header ("Yiba Verified" title)
  - Navigation menu (scrollable list of nav items with icons)
  - Each nav item shows icon and label, highlights active route

### Notification System
- **NotificationBell:** `src/components/shared/NotificationBell.tsx`
  - Bell icon with unread count badge
  - Opens NotificationDropdown on click
- **NotificationDropdown:** `src/components/shared/NotificationDropdown.tsx`
  - Card with notification list
  - Unread count badge in header
  - List of notifications (title, message, timestamp)
  - "View All Notifications" button at bottom
- **Notifications Page:** `/notifications`
  - Full-page notification list using NotificationList component

### Marketing Layout (Unauthenticated Routes)
- **MarketingNav:** `src/components/marketing/MarketingNav.tsx`
  - Logo/brand link
  - Navigation links: Home, Features, How it works, Security, Pricing, Contact
  - Login button
- **MarketingFooter:** `src/components/marketing/MarketingFooter.tsx`
  - Four columns: Company, Product, Legal, Contact
  - Links in each column
  - Copyright notice at bottom

---

## Platform Admin Pages

**Layout:** `src/app/platform-admin/layout.tsx`
- Uses `AppShell` with Platform Admin navigation items
- Sidebar navigation items:
  - Dashboard (`/platform-admin`)
  - Institutions (`/platform-admin/institutions`)
  - Learners (`/platform-admin/learners`)
  - Qualifications (`/platform-admin/qualifications`)
  - Users (`/platform-admin/users`) - requires `STAFF_INVITE` capability
  - Audit Logs (`/platform-admin/audit-logs`) - requires `AUDIT_VIEW` capability
  - Reports (`/platform-admin/reports`) - requires `REPORTS_VIEW` capability
  - System Health (`/platform-admin/system-health`)

### Dashboard (`/platform-admin`)
- **Page:** `src/app/platform-admin/page.tsx`
- **Sections:**
  - Page header (title "Main Dashboard", description)
  - Primary metric cards (6 cards in grid):
    - Active Institutions (with icon, total count)
    - Active Users (with icon, total count)
    - Pending Reviews (with icon, submission counts)
    - Active Learners (with icon, total count)
    - Enrolments (with icon, total count)
    - Submissions (with icon, pending count)
  - Additional stats row (3 cards):
    - QCTO Requests (with icon, total and pending count)
  - Recent Activity card:
    - Card header with title, description, and "View all audit logs" link
    - Table with columns: Timestamp, User, Action, Entity, Field, Institution
    - Empty state if no activity

### Institutions (`/platform-admin/institutions`)
- **Page:** `src/app/platform-admin/institutions/page.tsx`
- **Sections:**
  - Page header (title, description)
  - Search card:
    - Card header with title, description, search count
    - Search input field (with search icon)
    - Institutions table (responsive):
      - Columns: Legal Name, Trading Name, Province, Registration Number, Status, Created, Actions
      - Status badges (Approved, Pending, Rejected, Suspended)
      - "View" button in Actions column
    - Empty state if no institutions
    - Pagination controls (Previous/Next buttons, result count)

### Learners (`/platform-admin/learners`)
- **Page:** `src/app/platform-admin/learners/page.tsx`
- **Sections:**
  - Page header (title, description)
  - Search and filter card:
    - Card header with title, description, result count
    - Search input (by national ID, first name, last name)
    - Institution filter dropdown
    - Learners table (responsive):
      - Columns: National ID, First Name, Last Name, Institution, Created, Actions
      - "View" button in Actions column
    - Empty state if no learners
    - Pagination controls

### Audit Logs (`/platform-admin/audit-logs`)
- **Page:** `src/app/platform-admin/audit-logs/page.tsx`
- **Sections:**
  - Page header (title, description)
  - Export button
  - AuditLogFilters component (filter form)
  - Summary section (showing X of Y entries, pagination links)
  - Audit logs table:
    - Columns: Timestamp, User, Action, Entity, Field, Change, Reason, Related
    - Action badges (Created, Updated, Deleted, Status Changed)
    - AuditLogDiffViewer component in Change column
    - Links to related entities (institution, submission, request)

---

## Institution Admin / Staff Pages

**Layout:** `src/app/institution/layout.tsx`
- Uses `AppShell` with Institution navigation items
- Sidebar navigation items:
  - Dashboard (`/institution`)
  - Institution Profile (`/institution/profile`) - requires `INSTITUTION_PROFILE_EDIT`
  - Staff (`/institution/staff`) - requires `STAFF_INVITE`
  - Learners (`/institution/learners`) - requires `LEARNER_VIEW`
  - Enrolments (`/institution/enrolments`) - requires `LEARNER_VIEW`
  - Submissions (`/institution/submissions`) - requires `LEARNER_VIEW`
  - QCTO Requests (`/institution/requests`) - requires `LEARNER_VIEW`
  - Readiness (Form 5) (`/institution/readiness`) - requires `FORM5_VIEW`
  - Evidence Vault (`/institution/documents`) - requires `EVIDENCE_VIEW`
  - Reports (`/institution/reports`) - requires `REPORTS_VIEW`

### Dashboard (`/institution`)
- **Page:** `src/app/institution/page.tsx`
- **Sections:**
  - Page header (title "Institution Dashboard", description)
  - Metric cards (4 cards in grid):
    - Active Learners (count, change indicator)
    - Readiness Status (fraction submitted)
    - Evidence Documents (total uploaded)
    - Flagged Items (count requiring attention)
  - Recent Learners card:
    - Card header (title, description)
    - Table: Name, National ID, Qualification, Status, Enrolled date
  - Recent Activity card:
    - Card header (title, description)
    - Activity feed list (bullet points with activity description and timestamp)

### Enrolments (`/institution/enrolments`)
- **Page:** `src/app/institution/enrolments/page.tsx`
- **Sections:**
  - Page header (title, description)
  - Enrolments card:
    - Card header (title, description with count)
    - Table (responsive):
      - Columns: Learner, National ID, Qualification, Start Date, Expected Completion, Status, Actions
      - Status badges (Active, Completed, Transferred, Archived)
      - "View" link in Actions column
    - Empty state if no enrolments

### Submissions (`/institution/submissions`)
- **Page:** `src/app/institution/submissions/page.tsx`
- **Sections:**
  - Page header (title, description)
  - Action buttons: Export button, "Create Submission" button
  - Submissions card:
    - Card header (title, description with count and status filter)
    - Table (responsive):
      - Columns: Title, Type, Status, Submitted, Reviewed, Resources, Actions
      - Status badges (Draft, Submitted, Under Review, Approved, Rejected, Returned for Correction)
      - "View" link in Actions column
    - Empty state with "Create Your First Submission" button

### Readiness (`/institution/readiness`)
- **Page:** `src/app/institution/readiness/page.tsx`
- **Sections:**
  - Page header (title "Form 5 Readiness", description)
  - "Create Readiness Record" button
  - Readiness Records card:
    - Card header (title, description)
    - Table (responsive):
      - Columns: Qualification, SAQA ID, NQF Level, Delivery Mode, Status, Documents, Updated, Actions
      - Status badges (Not Started, In Progress, Submitted, Under Review, etc.)
      - "View / Edit" link in Actions column
    - Empty state with "Create Readiness Record" action

### Documents / Evidence Vault (`/institution/documents`)
- **Page:** `src/app/institution/documents/page.tsx`
- **Sections:**
  - Page header (title "Evidence Vault", description)
  - "Upload Document" button
  - Documents card:
    - Card header (title, description with count)
    - DocumentFilters component (filter controls)
    - Table (responsive):
      - Columns: File Name, Type, Entity, Version, Status, Size, Uploaded By, Uploaded At, Actions
      - Status badges (Uploaded, Flagged, Accepted)
      - Flag count badge on file name if flagged
      - Version badge
      - "View" link in Actions column
    - Empty state with "Upload Document" button

### QCTO Requests (`/institution/requests`)
- **Page:** `src/app/institution/requests/page.tsx`
- **Sections:**
  - Page header (title, description)
  - Requests card:
    - Card header (title, description with count and status filter)
    - Table (responsive):
      - Columns: Title, Type, Status, Requested By, Requested, Reviewed, Expires, Resources, Actions
      - Status badges (Pending, Approved, Rejected)
      - Expired indicator if applicable
      - "Review" or "View" link in Actions column
    - Empty state

---

## QCTO Pages

**Layout:** `src/app/qcto/layout.tsx`
- Uses `AppShell` with QCTO navigation items
- Sidebar navigation items:
  - Dashboard (`/qcto`)
  - Submissions (`/qcto/submissions`)
  - Requests (`/qcto/requests`)
  - Institutions (`/qcto/institutions`)
  - Readiness Reviews (`/qcto/readiness`) - requires `FORM5_VIEW`
  - Evidence Flags (`/qcto/evidence-flags`) - requires `EVIDENCE_VIEW`
  - Audit Logs (`/qcto/audit-logs`) - requires `AUDIT_VIEW`
  - Reports (`/qcto/reports`) - requires `REPORTS_VIEW`

### Dashboard (`/qcto`)
- **Page:** `src/app/qcto/page.tsx`
- **Sections:**
  - Page header (title "QCTO Dashboard", description)
  - Metric cards (5 cards in grid):
    - Pending Reviews (submission counts)
    - Approved (approved submissions count)
    - Total Submissions (total and rejected count)
    - Pending Requests (pending and total count)
    - Pending Readiness (readiness count)
  - Pending Reviews card:
    - Card header (title, description, "View all submissions" link)
    - Table: Title, Institution, Submitted, Status, Actions
    - Status badges
    - "Review" link in Actions column
    - Empty state if no pending reviews
  - Recent Reviews card:
    - Card header (title, description, "View all reviewed submissions" link)
    - Activity feed list (status badge, submission link, institution, timestamps)
    - Empty state if no recent reviews
  - Pending Readiness Reviews card (conditional - only if pending > 0):
    - Card header (title, description, "View all readiness records" link)
    - Table: Qualification, Institution, SAQA ID, Status, Actions
    - "Review" link in Actions column

### Submissions (`/qcto/submissions`)
- **Page:** `src/app/qcto/submissions/page.tsx`
- **Sections:**
  - Page header (title, description)
  - Export button
  - Submissions card:
    - Card header (title, description with count and status filter)
    - Table (responsive):
      - Columns: Institution, Title, Type, Status, Submitted, Reviewed, Resources, Actions
      - Status badges
      - "View" link in Actions column
    - Empty state

### Requests (`/qcto/requests`)
- **Page:** `src/app/qcto/requests/page.tsx`
- **Sections:**
  - Page header (title, description)
  - Requests card:
    - Card header (title, description with count and status filter)
    - Table:
      - Columns: Institution, Title, Type, Status, Requested, Reviewed, Expires, Resources, Actions
      - Status badges
      - Expired indicator if applicable
      - "View" link in Actions column
    - Empty state

### Readiness (`/qcto/readiness`)
- **Page:** `src/app/qcto/readiness/page.tsx`
- **Sections:**
  - Page header (title "Form 5 Readiness Records", description)
  - Readiness Records card:
    - Card header (title, description with count and status filter)
    - Table (responsive):
      - Columns: Qualification, SAQA ID, Institution, NQF Level, Delivery Mode, Status, Documents, Recommendation, Actions
      - Status badges
      - Recommendation badge if present
      - "Review" link in Actions column
    - Empty state

---

## Student Pages

**Layout:** `src/app/student/layout.tsx`
- Uses `AppShell` with Student navigation items
- Sidebar navigation items:
  - Dashboard (`/student`)
  - My Profile (`/student/profile`) - requires `LEARNER_VIEW`
  - My Enrolments (`/student/enrolments`) - requires `LEARNER_VIEW`
  - Attendance (`/student/attendance`) - requires `ATTENDANCE_VIEW`
  - Certificates (`/student/certificates`) - requires `LEARNER_VIEW`

### Dashboard (`/student`)
- **Page:** `src/app/student/page.tsx`
- **Sections:**
  - Page header (title "Student Dashboard", description)
  - Metric cards (4 cards in grid):
    - Active Enrolments (count)
    - Attendance (percentage)
    - Certificates (count)
    - Progress (percentage)
  - My Enrolments card:
    - Card header (title, description)
    - Table: Qualification, Institution, Start Date, Status, Progress
  - Recent Updates card:
    - Card header (title, description)
    - Activity feed list (bullet points with update description and timestamp)

---

## Marketing Pages

These pages use the `MarketingNav` and `MarketingFooter` components, not the `AppShell`.

### Home (`/`)
- **Page:** `src/app/page.tsx`
- **Sections:**
  - MarketingNav component
  - Hero section:
    - Badge ("QCTO Compliance Platform")
    - Main heading
    - Description text
    - Two buttons: "Request Demo", "Learn More"
  - Features Preview section:
    - Section header (heading, description)
    - Three feature cards in grid:
      - Institutional Management card
      - QCTO Review & Approval card
      - Learner Progress Tracking card
    - Each card has title, description, and "Learn more" link
  - CTA Section:
    - Section header (heading, description)
    - Two buttons: "Get in Touch", "Sign In"
  - MarketingFooter component

### Features (`/features`)
- **Page:** `src/app/features/page.tsx`
- **Sections:**
  - MarketingNav component
  - Page header section (heading, description)
  - Institutional Features section:
    - Badge ("For Institutions")
    - Section heading
    - Four feature cards in grid (Readiness Documentation, Evidence Vault, Learner Management, Submission Tracking)
  - Separator
  - QCTO Features section:
    - Badge ("For QCTO Reviewers")
    - Section heading
    - Four feature cards in grid (Review Workflows, Decision Management, Audit Trails, Dashboard Insights)
  - Separator
  - Learner Features section:
    - Badge ("For Learners")
    - Section heading
    - Two feature cards in grid (Profile Management, Progress Tracking)
  - CTA section ("Request Demo" button)
  - MarketingFooter component

### Contact (`/contact`)
- **Route:** `/contact`

### Pricing (`/pricing`)
- **Route:** `/pricing`

### How It Works (`/how-it-works`)
- **Route:** `/how-it-works`

### Security (`/security`)
- **Route:** `/security`

---

## Authentication Pages

### Login (`/auth/login`)
- **Page:** `src/app/auth/login/page.tsx`
- **Sections:**
  - Centered card on page:
    - Card header: Title "Yiba Verified", description "Sign in to your account"
    - Login form:
      - Email input field (with label)
      - Password input field (with label)
      - Error message display (conditional)
      - Submit button ("Sign in" / "Signing in..." when loading)

### Logout (`/auth/logout`)
- **Route:** `/auth/logout`

### Unauthorized (`/auth/unauthorized`)
- **Route:** `/auth/unauthorized`

---

## Notifications Page

### Notifications (`/notifications`)
- **Page:** `src/app/notifications/page.tsx`
- **Layout:** Uses `AppShell` (inherited from parent route if authenticated)
- **Sections:**
  - Page header (title "Notifications", description)
  - NotificationList component (displays all notifications with filtering)

---

## Common UI Components

### Cards (`src/components/ui/card.tsx`)
- Card structure: CardHeader (with CardTitle, CardDescription), CardContent

### Tables (`src/components/ui/table.tsx`)
- Responsive tables wrapped in ResponsiveTable component
- Table structure: TableHeader, TableRow, TableHead, TableBody, TableRow, TableCell

### Buttons (`src/components/ui/button.tsx`)
- Various variants: default, outline, ghost, destructive
- Sizes: default, sm, lg, icon

### Badges (`src/components/ui/badge.tsx`)
- Status indicators with variants: default, secondary, destructive, outline

### Inputs (`src/components/ui/input.tsx`)
- Text input fields
- Search inputs with icon prefix

### Select (`src/components/ui/select.tsx`)
- Dropdown selects: SelectTrigger, SelectContent, SelectItem

### Forms
- Various form components for creating/editing entities
- Validation and error handling

### Modals / Dialogs
- Dialog component (`src/components/ui/dialog.tsx`) for modals
- Alert Dialog (`src/components/ui/alert-dialog.tsx`) for confirmations

### Empty States (`src/components/shared/EmptyState.tsx`)
- Displayed when no data available
- Icon, title, description, optional action button

### Loading States (`src/components/shared/LoadingTable.tsx`)
- Skeleton loading for tables

### Export Button (`src/components/shared/ExportButton.tsx`)
- Button to export data

---

## Notes

- All authenticated pages use the `AppShell` layout with role-specific sidebar navigation
- Marketing pages use `MarketingNav` and `MarketingFooter` instead
- Tables are wrapped in `ResponsiveTable` component for mobile responsiveness
- Empty states are shown when data lists are empty
- Pagination is present on list pages where applicable
- Status badges are used throughout to indicate entity states
- Filters are available on many list pages (search, status filters, etc.)
- Detail pages exist for most entities (e.g., `/institution/submissions/[submissionId]`, `/institution/readiness/[readinessId]`) but are not fully documented here as they vary in structure
