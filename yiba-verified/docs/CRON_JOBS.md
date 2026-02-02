# Cron Job Audit & Safe Removal Record
**Date:** 2026-02-02
**Reason:** Unblocking Vercel deployment on Hobby Plan (Limit: 1 Cron Job).

The following Cron Jobs were removed from `vercel.json` to comply with plan limits. They should be restored or re-architected when upgrading to Pro or when an external scheduler is available.

## Removed Jobs

### 1. Email Queue Worker
*   **Path:** `/api/cron/email-queue`
*   **Original Schedule:** `* * * * *` (Every minute)
*   **Purpose:** Processes the `EmailQueue` table. Required by `NotificationService` to send emails triggering from Compliance, Inactivity, and Profile alerts.
*   **Impact of Removal:** Automated system emails (e.g. "Action Required") will be queued in the database but **never sent**.
*   **Re-enabling Plan:**
    *   **Option A (Pro Plan):** Restore `vercel.json` config.
    *   **Option B (Hobby Plan):** Refactor `NotificationService` to send emails directly using Resend/Nodemailer (avoiding the queue) so a worker isn't needed.

### 2. Compliance Triggers
*   **Path:** `/api/cron/triggers/compliance`
*   **Original Schedule:** `0 8 * * *` (Daily at 8am)
*   **Purpose:** Checks for expiring accreditations and documents. Queues emails to `EmailQueue`.
*   **Impact of Removal:** No expiry warnings sent to users.
*   **Re-enabling Plan:** Can be combined with other daily triggers into a single "Daily Maintenance" job to fit within Hobby limits.

### 3. Inactivity Triggers
*   **Path:** `/api/cron/triggers/inactivity`
*   **Original Schedule:** `0 9 * * *` (Daily at 9am)
*   **Purpose:** Sends re-engagement emails to users inactive for 30+ days.
*   **Impact of Removal:** No re-engagement emails.

### 4. Profile Triggers
*   **Path:** `/api/cron/triggers/profile`
*   **Original Schedule:** `0 10 * * *` (Daily at 10am)
*   **Purpose:** Nudges users with `< 80%` profile completeness.
*   **Impact of Removal:** No profile completion nudges.

## Restoration Instructions
To restore these jobs, add the following back to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/email-queue",
      "schedule": "* * * * *"
    },
    {
      "path": "/api/cron/triggers/compliance",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/triggers/inactivity",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/triggers/profile",
      "schedule": "0 10 * * *"
    }
  ]
}
```
