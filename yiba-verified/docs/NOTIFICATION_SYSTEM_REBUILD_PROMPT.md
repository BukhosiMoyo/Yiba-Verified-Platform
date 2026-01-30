# Notification System Rebuild Prompt

## Overview

Build a comprehensive, role-aware notification system for Yiba Verified with modern UX patterns, smooth animations, and contextual notifications for all platform features.

---

## Part 1: Notification Strategy by User Role

### 1. PLATFORM_ADMIN
System administrators who manage the entire platform.

| Event | Notification Title | Priority |
|-------|-------------------|----------|
| New institution registered | "New Institution Registered" | HIGH |
| Institution status changed | "Institution Status Updated" | MEDIUM |
| New user registered | "New User Registered" | LOW |
| System error/alert | "System Alert" | URGENT |
| Bulk invite completed | "Bulk Invite Completed" | MEDIUM |
| Daily summary available | "Daily Platform Summary" | LOW |
| Security alert (failed logins) | "Security Alert" | URGENT |

### 2. QCTO_SUPER_ADMIN
QCTO organization super administrators.

| Event | Notification Title | Priority |
|-------|-------------------|----------|
| New QCTO team member joined | "New Team Member" | MEDIUM |
| Team invite accepted | "Invite Accepted" | LOW |
| Review assignment created | "New Review Assignment" | HIGH |
| Monthly compliance report ready | "Compliance Report Ready" | MEDIUM |

### 3. QCTO_ADMIN / QCTO_USER / QCTO_REVIEWER
QCTO staff who review institutions and submissions.

| Event | Notification Title | Priority |
|-------|-------------------|----------|
| New submission received | "New Submission to Review" | HIGH |
| Submission assigned to you | "Submission Assigned" | HIGH |
| QCTO request approved by institution | "Request Approved" | HIGH |
| QCTO request rejected by institution | "Request Rejected" | MEDIUM |
| Readiness review due soon | "Review Deadline Approaching" | MEDIUM |
| Institution responded to request | "Institution Response Received" | HIGH |
| Document flagged for attention | "Document Flagged" | MEDIUM |
| Review reminder (stale review) | "Review Reminder" | LOW |

### 4. QCTO_AUDITOR
Auditors who check compliance.

| Event | Notification Title | Priority |
|-------|-------------------|----------|
| Audit assignment created | "New Audit Assignment" | HIGH |
| Compliance issue detected | "Compliance Issue Found" | URGENT |
| Audit deadline approaching | "Audit Deadline" | MEDIUM |
| Institution data updated | "Institution Data Changed" | LOW |

### 5. QCTO_VIEWER
View-only QCTO access.

| Event | Notification Title | Priority |
|-------|-------------------|----------|
| Report available | "New Report Available" | LOW |
| Weekly summary | "Weekly Summary" | LOW |

### 6. INSTITUTION_ADMIN
Institution administrators who manage their institution.

| Event | Notification Title | Priority |
|-------|-------------------|----------|
| Submission reviewed | "Submission Reviewed" | HIGH |
| Submission approved | "Submission Approved" | HIGH |
| Submission rejected | "Submission Rejected" | URGENT |
| Submission returned for correction | "Corrections Required" | HIGH |
| QCTO request received | "New QCTO Request" | HIGH |
| Readiness recommended | "Readiness Approved" | HIGH |
| Readiness rejected | "Readiness Rejected" | URGENT |
| Document flagged | "Document Flagged" | MEDIUM |
| Staff member joined | "New Staff Member" | LOW |
| Invite accepted | "Invite Accepted" | LOW |
| Accreditation expiring | "Accreditation Expiring" | URGENT |
| Review comment added | "New Review Comment" | MEDIUM |
| Evidence flag created | "Evidence Flagged" | HIGH |
| Evidence flag resolved | "Evidence Flag Resolved" | LOW |

### 7. INSTITUTION_STAFF
Staff members who work at institutions.

| Event | Notification Title | Priority |
|-------|-------------------|----------|
| Task assigned | "New Task Assigned" | HIGH |
| Submission status changed | "Submission Update" | MEDIUM |
| Document review required | "Document Review Needed" | MEDIUM |
| Readiness section needs update | "Section Update Required" | MEDIUM |
| Deadline approaching | "Deadline Reminder" | HIGH |

### 8. STUDENT
Learners enrolled in programs.

| Event | Notification Title | Priority |
|-------|-------------------|----------|
| Enrolment confirmed | "Enrolment Confirmed" | HIGH |
| Assessment results available | "Assessment Results" | HIGH |
| Certificate available | "Certificate Ready" | HIGH |
| Profile update required | "Profile Update Needed" | MEDIUM |
| Attendance alert | "Attendance Alert" | MEDIUM |
| Course update | "Course Update" | LOW |
| Announcement from institution | "Institution Announcement" | MEDIUM |

---

## Part 2: Notification Types (Database Enum)

Expand the `NotificationType` enum to include:

```prisma
enum NotificationType {
  // Submissions
  SUBMISSION_RECEIVED
  SUBMISSION_REVIEWED
  SUBMISSION_APPROVED
  SUBMISSION_REJECTED
  SUBMISSION_RETURNED
  SUBMISSION_ASSIGNED
  
  // QCTO Requests
  REQUEST_RECEIVED
  REQUEST_APPROVED
  REQUEST_REJECTED
  REQUEST_EXPIRED
  
  // Readiness
  READINESS_SUBMITTED
  READINESS_REVIEWED
  READINESS_RECOMMENDED
  READINESS_REJECTED
  READINESS_RETURNED
  
  // Documents
  DOCUMENT_FLAGGED
  DOCUMENT_UNFLAGGED
  DOCUMENT_REQUIRED
  
  // Evidence
  EVIDENCE_FLAGGED
  EVIDENCE_RESOLVED
  
  // Invites
  INVITE_ACCEPTED
  INVITE_EXPIRED
  BULK_INVITE_COMPLETED
  
  // Team
  TEAM_MEMBER_JOINED
  TEAM_MEMBER_LEFT
  
  // Assignments
  REVIEW_ASSIGNED
  AUDIT_ASSIGNED
  TASK_ASSIGNED
  
  // Students
  ENROLMENT_CONFIRMED
  ASSESSMENT_RESULTS
  CERTIFICATE_READY
  ATTENDANCE_ALERT
  
  // Deadlines
  DEADLINE_APPROACHING
  DEADLINE_PASSED
  EXPIRATION_WARNING
  
  // System
  SYSTEM_ALERT
  SYSTEM_MAINTENANCE
  ANNOUNCEMENT
  
  // Comments
  COMMENT_ADDED
  COMMENT_REPLY
}
```

---

## Part 3: Visual Design System

### Notification Categories & Colors

```typescript
const NOTIFICATION_CATEGORIES = {
  submission: {
    icon: FileText,
    color: "blue",
    bgLight: "bg-blue-50",
    bgDark: "dark:bg-blue-950/30",
    text: "text-blue-600",
    border: "border-blue-200",
  },
  request: {
    icon: MessageSquare,
    color: "purple",
    bgLight: "bg-purple-50",
    bgDark: "dark:bg-purple-950/30",
    text: "text-purple-600",
    border: "border-purple-200",
  },
  readiness: {
    icon: ClipboardCheck,
    color: "green",
    bgLight: "bg-green-50",
    bgDark: "dark:bg-green-950/30",
    text: "text-green-600",
    border: "border-green-200",
  },
  document: {
    icon: FileWarning,
    color: "amber",
    bgLight: "bg-amber-50",
    bgDark: "dark:bg-amber-950/30",
    text: "text-amber-600",
    border: "border-amber-200",
  },
  team: {
    icon: Users,
    color: "indigo",
    bgLight: "bg-indigo-50",
    bgDark: "dark:bg-indigo-950/30",
    text: "text-indigo-600",
    border: "border-indigo-200",
  },
  student: {
    icon: GraduationCap,
    color: "teal",
    bgLight: "bg-teal-50",
    bgDark: "dark:bg-teal-950/30",
    text: "text-teal-600",
    border: "border-teal-200",
  },
  system: {
    icon: AlertCircle,
    color: "red",
    bgLight: "bg-red-50",
    bgDark: "dark:bg-red-950/30",
    text: "text-red-600",
    border: "border-red-200",
  },
  deadline: {
    icon: Clock,
    color: "orange",
    bgLight: "bg-orange-50",
    bgDark: "dark:bg-orange-950/30",
    text: "text-orange-600",
    border: "border-orange-200",
  },
};
```

### Priority Indicators

```typescript
const PRIORITY_CONFIG = {
  LOW: {
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-700",
    ring: "ring-gray-200",
  },
  MEDIUM: {
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700",
    ring: "ring-blue-200",
  },
  HIGH: {
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700",
    ring: "ring-amber-200",
  },
  URGENT: {
    dot: "bg-red-500 animate-pulse",
    badge: "bg-red-100 text-red-700",
    ring: "ring-red-300",
  },
};
```

---

## Part 4: Panel Design

### Layout Structure

```
┌──────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────┐ │
│ │  🔔 Notifications                    [✕]     │ │  <- Header
│ │      12 unread                               │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │  [All] [Unread] [Submissions] [Requests] ... │ │  <- Filter tabs
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │  📢 ANNOUNCEMENTS (if any)                   │ │  <- Announcements section
│ │  ┌────────────────────────────────────────┐  │ │
│ │  │ 🔴 System Maintenance Tomorrow         │  │ │
│ │  │    Scheduled downtime from 2-4 AM      │  │ │
│ │  │    Platform Admin · 2h ago             │  │ │
│ │  └────────────────────────────────────────┘  │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │  TODAY                                       │ │  <- Grouped by date
│ │  ┌────────────────────────────────────────┐  │ │
│ │  │ 🔵● Submission Approved               │  │ │
│ │  │    Your compliance pack was approved   │  │ │
│ │  │    📄 Submission · 10m ago            │  │ │
│ │  └────────────────────────────────────────┘  │ │
│ │  ┌────────────────────────────────────────┐  │ │
│ │  │ 🟣  New QCTO Request                  │  │ │
│ │  │    QCTO is requesting access to...     │  │ │
│ │  │    📨 Request · 1h ago                │  │ │
│ │  └────────────────────────────────────────┘  │ │
│ │                                              │ │
│ │  YESTERDAY                                   │ │
│ │  ┌────────────────────────────────────────┐  │ │
│ │  │ 🟢  Readiness Recommended             │  │ │
│ │  │    Your readiness record was...        │  │ │
│ │  │    ✅ Readiness · Yesterday at 3:45 PM │  │ │
│ │  └────────────────────────────────────────┘  │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │  [Archive All]      [Mark All as Read]       │ │  <- Footer actions
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Individual Notification Card

```
┌─────────────────────────────────────────────────────┐
│  ┌───┐                                              │
│  │ 📄│  Submission Approved               ● (unread)│
│  └───┘  Your compliance pack "Q4 Report"            │
│         has been approved by QCTO.                  │
│                                                     │
│         📄 Submission · High Priority · 10m ago     │
│         [View Submission →]                         │
└─────────────────────────────────────────────────────┘
```

---

## Part 5: Animation Specifications

### Panel Slide-In
```css
/* Container */
transition: all 500ms cubic-bezier(0.32, 0.72, 0, 1);

/* Closed state */
transform: translateX(calc(100% + 20px));
opacity: 0;

/* Open state */
transform: translateX(0);
opacity: 1;
```

### Overlay
```css
/* NO backdrop blur - clean dark overlay */
background: rgba(0, 0, 0, 0.4);
transition: opacity 500ms ease-out;
```

### Notification Item Entrance
```css
/* Staggered entrance for list items */
@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.notification-item {
  animation: slideInFromRight 300ms ease-out;
  animation-delay: calc(var(--index) * 50ms);
}
```

### Unread Pulse
```css
/* Subtle pulse for unread indicator */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.unread-dot {
  animation: pulse 2s infinite;
}
```

---

## Part 6: Component Structure

```
src/components/notifications/
├── NotificationBell.tsx        # Bell icon trigger with badge
├── NotificationPanel.tsx       # Main slide-in panel
├── NotificationList.tsx        # Scrollable notification list
├── NotificationItem.tsx        # Individual notification card
├── NotificationFilters.tsx     # Filter tabs (All, Unread, by type)
├── NotificationEmpty.tsx       # Empty state component
├── AnnouncementCard.tsx        # Announcement display
└── index.ts                    # Exports
```

---

## Part 7: API Endpoints

### Existing (Keep)
- `GET /api/notifications` - List notifications
- `PATCH /api/notifications/[id]` - Mark as read
- `GET /api/announcements` - List announcements

### New Endpoints Needed
- `POST /api/notifications/mark-all-read` - Mark all as read
- `POST /api/notifications/archive-all` - Archive all read
- `GET /api/notifications/unread-count` - Just the count (lightweight)
- `DELETE /api/notifications/[id]` - Delete notification

---

## Part 8: Features to Implement

### Core Features
1. **Unread Badge** - Real-time count with polling (30s)
2. **Filter Tabs** - All, Unread, by category
3. **Date Grouping** - Today, Yesterday, This Week, Older
4. **Mark as Read** - Click to mark, bulk mark all
5. **Navigation** - Click to go to relevant page
6. **Empty State** - Friendly illustration when no notifications

### Advanced Features
1. **Swipe to Archive** (mobile) - Gesture support
2. **Quick Actions** - Mark read, archive without opening
3. **Sound/Vibration** (optional) - For urgent notifications
4. **Keyboard Navigation** - Arrow keys, Enter to open
5. **Search** - Search within notifications
6. **Preferences** - Per-type enable/disable in settings

---

## Part 9: Best Practices

### Do's
- ✅ Group related notifications (batch similar events)
- ✅ Use clear, actionable titles
- ✅ Include relevant context (who, what, when)
- ✅ Provide direct action links
- ✅ Respect user preferences (allow disabling)
- ✅ Show timestamps in relative format ("2h ago")
- ✅ Use consistent iconography
- ✅ Support dark mode

### Don'ts
- ❌ Don't spam users (batch similar events)
- ❌ Don't use vague titles ("Something happened")
- ❌ Don't block main app flow for notifications
- ❌ Don't auto-mark as read on view
- ❌ Don't use intrusive sounds without consent
- ❌ Don't show expired/irrelevant notifications

---

## Part 10: Implementation Order

1. **Phase 1: Core UI**
   - NotificationBell with badge
   - NotificationPanel with smooth slide-in
   - Basic notification list
   - Mark as read functionality

2. **Phase 2: Visual Polish**
   - Category colors and icons
   - Priority indicators
   - Date grouping
   - Animations

3. **Phase 3: Filters & Search**
   - Filter tabs
   - Search within notifications
   - Empty states

4. **Phase 4: Backend Integration**
   - New API endpoints
   - Expanded notification types
   - Email notification preferences

5. **Phase 5: Advanced Features**
   - Keyboard navigation
   - Mobile gestures
   - Sound preferences

---

## Part 11: Database Schema Update

Add `priority` and `category` fields to Notification model:

```prisma
model Notification {
  notification_id   String           @id @default(uuid())
  user_id           String
  notification_type NotificationType
  category          String?          // submission, request, readiness, document, team, student, system, deadline
  priority          String           @default("MEDIUM") // LOW, MEDIUM, HIGH, URGENT
  title             String
  message           String           @db.Text
  entity_type       String?
  entity_id         String?
  action_url        String?          // Direct link to action
  is_read           Boolean          @default(false)
  is_archived       Boolean          @default(false)
  read_at           DateTime?
  created_at        DateTime         @default(now())
  expires_at        DateTime?        // Auto-cleanup old notifications
  
  user User @relation("UserNotifications", fields: [user_id], references: [user_id])

  @@index([user_id])
  @@index([is_read])
  @@index([is_archived])
  @@index([created_at])
  @@index([notification_type])
  @@index([category])
  @@index([priority])
}
```

---

## Summary

This notification system covers:
- **8 user roles** with role-specific notifications
- **40+ notification types** across all platform features
- **8 visual categories** with distinct colors
- **4 priority levels** with visual indicators
- **Smooth animations** without backdrop blur
- **Modern UX patterns** (grouping, filtering, search)
- **Best practices** for notification design
- **Phased implementation** plan
