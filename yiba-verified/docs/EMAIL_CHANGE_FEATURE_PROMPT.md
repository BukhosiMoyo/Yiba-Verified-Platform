# Email Change Feature Implementation Prompt

## Overview
Implement a secure email change feature that allows users to update their account email address with proper verification, security checks, and notifications following industry best practices.

---

## Security Best Practices

### 1. Double Verification Flow
- **Verify ownership of NEW email** - Send verification link to new email
- **Notify OLD email** - Alert user about the change request (in case of account compromise)
- **Require current password** - Confirm identity before initiating change

### 2. Rate Limiting
- Maximum 3 email change requests per 24 hours
- Cooldown period between requests (e.g., 1 hour)
- Block rapid successive attempts

### 3. Token Security
- Verification tokens expire in 24 hours
- Single-use tokens (invalidate after use)
- Cryptographically secure random tokens
- Store hashed tokens in database

### 4. Notification Requirements
- Email to OLD address: "Email change requested"
- Email to NEW address: "Verify your new email"
- Email to OLD address: "Email successfully changed" (after completion)
- In-app notification for all steps

---

## User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. User clicks "Change Email" on Profile page                  │
├─────────────────────────────────────────────────────────────────┤
│  2. Modal opens with:                                           │
│     - Current email (read-only)                                 │
│     - New email input                                           │
│     - Current password input                                    │
│     - "Request Change" button                                   │
├─────────────────────────────────────────────────────────────────┤
│  3. On submit:                                                  │
│     - Validate password                                         │
│     - Check new email not already in use                        │
│     - Check rate limits                                         │
│     - Create pending email change record                        │
│     - Send verification email to NEW address                    │
│     - Send notification email to OLD address                    │
│     - Show success message with instructions                    │
├─────────────────────────────────────────────────────────────────┤
│  4. User clicks verification link in NEW email                  │
├─────────────────────────────────────────────────────────────────┤
│  5. System verifies token and:                                  │
│     - Updates user's email address                              │
│     - Invalidates all existing sessions (security)              │
│     - Sends confirmation to OLD email                           │
│     - Sends welcome to NEW email                                │
│     - Creates audit log entry                                   │
│     - Redirects to login page                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Changes

### New Table: `EmailChangeRequest`

```prisma
model EmailChangeRequest {
  id              String    @id @default(uuid()) @map("email_change_id")
  userId          String    @map("user_id")
  user            User      @relation(fields: [userId], references: [user_id])
  currentEmail    String    @map("current_email")
  newEmail        String    @map("new_email")
  tokenHash       String    @map("token_hash")  // Store hashed token
  status          EmailChangeStatus @default(PENDING)
  expiresAt       DateTime  @map("expires_at")
  verifiedAt      DateTime? @map("verified_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  ipAddress       String?   @map("ip_address")
  userAgent       String?   @map("user_agent")

  @@map("email_change_requests")
  @@index([userId])
  @@index([tokenHash])
  @@index([status, expiresAt])
}

enum EmailChangeStatus {
  PENDING
  VERIFIED
  EXPIRED
  CANCELLED
}
```

---

## API Endpoints

### 1. POST `/api/account/email/request-change`
**Request email change**

Request Body:
```json
{
  "newEmail": "newemail@example.com",
  "currentPassword": "userPassword123"
}
```

Response:
```json
{
  "success": true,
  "message": "Verification email sent to your new address",
  "expiresAt": "2026-01-25T12:00:00Z"
}
```

Validations:
- New email format valid
- New email not already registered
- Password correct
- Rate limit not exceeded
- New email different from current

### 2. GET `/api/account/email/verify?token=xxx`
**Verify new email and complete change**

Response (success):
- Redirect to `/login?emailChanged=true`

Response (error):
- Redirect to `/account/profile?error=token_expired` or similar

### 3. POST `/api/account/email/cancel`
**Cancel pending email change request**

Request Body:
```json
{
  "requestId": "uuid"
}
```

### 4. GET `/api/account/email/pending`
**Get pending email change request (if any)**

Response:
```json
{
  "pending": true,
  "newEmail": "new***@example.com",  // Partially masked
  "expiresAt": "2026-01-25T12:00:00Z",
  "createdAt": "2026-01-24T12:00:00Z"
}
```

---

## Email Templates

### 1. To NEW Email: "Verify Your New Email"
```
Subject: Verify your new email address for Yiba Verified

Hi [Name],

You requested to change your Yiba Verified account email to this address.

Click the button below to verify this email address:

[Verify Email Address] (button)

This link expires in 24 hours.

If you didn't request this change, you can safely ignore this email.

Security tip: Never share this link with anyone.
```

### 2. To OLD Email: "Email Change Requested"
```
Subject: ⚠️ Email change requested for your Yiba Verified account

Hi [Name],

Someone requested to change the email address on your Yiba Verified account.

Current email: [old@email.com]
Requested new email: [new@email.com] (partially masked)
Requested at: [date/time]
IP Address: [xxx.xxx.xxx.xxx]

If this was you:
Check your new email inbox for the verification link.

If this wasn't you:
1. Log in immediately and change your password
2. Contact support at support@yibaverified.co.za

This is an automated security notification.
```

### 3. To OLD Email: "Email Successfully Changed"
```
Subject: Your Yiba Verified email has been changed

Hi [Name],

The email address on your Yiba Verified account has been successfully changed.

Previous email: [old@email.com]
New email: [new@email.com]
Changed at: [date/time]

All active sessions have been logged out for security.

If you didn't make this change:
Contact support immediately at support@yibaverified.co.za

This is an automated security notification.
```

---

## UI Components

### 1. Profile Page - Email Section
```
┌─────────────────────────────────────────────────────────────┐
│ Email Address                                               │
│                                                             │
│ lerato.khumalo@gmail.com                    [Change Email]  │
│ ✓ Verified                                                  │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⏳ Pending email change to new***@example.com           │ │
│ │    Expires in 23 hours                    [Cancel]      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2. Change Email Modal
```
┌─────────────────────────────────────────────────────────────┐
│ Change Email Address                                    [X] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Current Email                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ lerato.khumalo@gmail.com                    (read-only) │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ New Email Address                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Confirm Your Password                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ••••••••••                                          👁  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ⓘ A verification link will be sent to your new email.      │
│   Your current email will be notified of this change.      │
│                                                             │
│                              [Cancel]  [Request Change]     │
└─────────────────────────────────────────────────────────────┘
```

### 3. Success State (after request)
```
┌─────────────────────────────────────────────────────────────┐
│ ✉️ Check Your New Email                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ We've sent a verification link to:                          │
│ new.email@example.com                                       │
│                                                             │
│ Click the link in that email to complete the change.        │
│                                                             │
│ The link expires in 24 hours.                               │
│                                                             │
│ Didn't receive it?                                          │
│ • Check your spam folder                                    │
│ • [Resend verification email] (available after 60s)         │
│                                                             │
│                                              [Close]        │
└─────────────────────────────────────────────────────────────┘
```

---

## Audit Logging

Create audit log entries for:
- `EMAIL_CHANGE_REQUESTED` - When user initiates change
- `EMAIL_CHANGE_VERIFIED` - When new email is verified
- `EMAIL_CHANGE_CANCELLED` - When user cancels request
- `EMAIL_CHANGE_EXPIRED` - When request expires (background job)

Include in logs:
- User ID
- Old email (masked)
- New email (masked)
- IP address
- User agent
- Timestamp

---

## Implementation Order

### Phase 1: Backend Foundation
1. Create Prisma migration for `EmailChangeRequest` table
2. Add `EmailChangeStatus` enum
3. Create utility functions for token generation/hashing
4. Implement rate limiting logic

### Phase 2: API Endpoints
1. `POST /api/account/email/request-change`
2. `GET /api/account/email/verify`
3. `GET /api/account/email/pending`
4. `POST /api/account/email/cancel`

### Phase 3: Email Service
1. Create email templates (using existing email service)
2. Implement send functions for all 3 email types
3. Test email delivery

### Phase 4: UI Components
1. Update Profile page with email section
2. Create `ChangeEmailModal` component
3. Add pending change banner
4. Create verification success/error pages

### Phase 5: Testing & Security
1. Test full flow end-to-end
2. Test rate limiting
3. Test token expiration
4. Test edge cases (same email, already used email, etc.)
5. Security review

---

## Error Handling

| Error Code | Message | When |
|------------|---------|------|
| `EMAIL_IN_USE` | This email is already registered | New email exists in system |
| `INVALID_PASSWORD` | Incorrect password | Password doesn't match |
| `RATE_LIMITED` | Too many requests. Try again in X hours | Rate limit exceeded |
| `PENDING_REQUEST` | You already have a pending email change | Existing pending request |
| `TOKEN_EXPIRED` | This verification link has expired | Token past expiry |
| `TOKEN_INVALID` | Invalid verification link | Token not found or already used |
| `SAME_EMAIL` | New email must be different | New = current email |

---

## Security Considerations

1. **Session Invalidation**: Log out all sessions after email change
2. **Password Re-verification**: Always require password before change
3. **Notification to Old Email**: Always notify (cannot be disabled)
4. **IP/Device Logging**: Record for security audit
5. **Token Hashing**: Never store plain tokens
6. **HTTPS Only**: Verification links must use HTTPS
7. **No Email in URL**: Token should be random, not email-based
8. **Cleanup Job**: Background job to expire old requests

---

## Files to Create/Modify

### New Files
- `src/app/api/account/email/request-change/route.ts`
- `src/app/api/account/email/verify/route.ts`
- `src/app/api/account/email/pending/route.ts`
- `src/app/api/account/email/cancel/route.ts`
- `src/components/account/ChangeEmailModal.tsx`
- `src/components/account/EmailSection.tsx`
- `src/lib/email/emailChangeTemplates.ts`
- `prisma/migrations/xxx_add_email_change_requests/migration.sql`

### Modified Files
- `prisma/schema.prisma` - Add EmailChangeRequest model
- `src/app/account/profile/page.tsx` - Add email section
- `src/lib/email/index.ts` - Add email change functions

---

## Success Criteria

- [ ] User can request email change with password verification
- [ ] Verification email sent to new address
- [ ] Notification email sent to old address
- [ ] User can click link to verify and complete change
- [ ] All sessions logged out after change
- [ ] Confirmation email sent to old address after change
- [ ] Rate limiting prevents abuse
- [ ] Tokens expire after 24 hours
- [ ] Audit logs created for all actions
- [ ] UI shows pending change status
- [ ] User can cancel pending change
- [ ] Error states handled gracefully
