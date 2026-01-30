# View As User — Token-Based Impersonation System

## Overview

Replace the current cookie-based "View As User" system with a token-based impersonation system similar to hosting companies (cPanel, Plesk, etc.). This provides better security, auditability, and user experience.

## Current System (Cookie-Based)

- Uses cookies to store viewing-as state
- Sidebar and navigation change dynamically
- Issues with route access and navigation
- No expiration mechanism
- Mixed with regular session

## New System (Token-Based)

### Features

1. **One-Time Login Links**: Generate secure, expiring tokens for impersonation
2. **Separate Session**: Impersonation sessions are tracked separately from regular logins
3. **Auto-Expiration**: Links expire after logout, inactivity, or time limit
4. **No Login Logs**: Impersonation sessions don't appear in user's login history
5. **Incognito Support**: Option to open in new incognito/private window
6. **Full Access**: Complete access to the user's account and dashboard
7. **User Stats View**: Still show user stats on their profile page (read-only)

## Implementation Plan

### Phase 1: Database Schema

**New Model: `ImpersonationSession`**

```prisma
model ImpersonationSession {
  id              String    @id @default(uuid())
  token           String    @unique // Secure random token
  impersonator_id String    // User ID of the admin viewing as
  target_user_id  String    // User ID being viewed as
  created_at      DateTime  @default(now())
  expires_at      DateTime  // Expiration time (default: 1 hour)
  last_activity   DateTime  @default(now()) // For inactivity timeout
  status          String    @default("ACTIVE") // ACTIVE, EXPIRED, REVOKED, COMPLETED
  ip_address      String?   // For audit trail
  user_agent      String?   // For audit trail
  
  // Relations
  impersonator User @relation("Impersonations", fields: [impersonator_id], references: [user_id], onDelete: Cascade)
  target_user  User @relation("Impersonated", fields: [target_user_id], references: [user_id], onDelete: Cascade)
  
  @@index([token])
  @@index([impersonator_id])
  @@index([target_user_id])
  @@index([status])
  @@index([expires_at])
}
```

**Update User Model:**
```prisma
model User {
  // ... existing fields ...
  impersonations     ImpersonationSession[] @relation("Impersonations")
  impersonated       ImpersonationSession[] @relation("Impersonated")
}
```

### Phase 2: Token Generation API

**New Endpoint: `POST /api/view-as/generate-link`**

- Validates that requester can view as target user
- Generates secure random token (32+ characters)
- Creates `ImpersonationSession` record
- Returns:
  ```json
  {
    "token": "abc123...",
    "link": "/view-as/abc123...",
    "fullUrl": "https://app.com/view-as/abc123...",
    "expiresAt": "2024-01-22T10:30:00Z",
    "expiresIn": 3600
  }
  ```

**Security:**
- Token is cryptographically secure (crypto.randomBytes)
- Expires after 1 hour (configurable)
- Inactivity timeout: 15 minutes (configurable)
- One-time use (optional, or allow multiple uses until expiration)

### Phase 3: Impersonation Login Route

**New Route: `GET /view-as/[token]`**

- Validates token (exists, not expired, not revoked, active)
- Checks inactivity timeout
- Creates a special NextAuth session for the target user
- Marks session as "ACTIVE"
- Redirects to target user's dashboard
- Updates `last_activity` timestamp

**Session Creation:**
- Use NextAuth's session callback to detect impersonation
- Store `impersonation_session_id` in JWT token
- Mark session as impersonation (for audit/logging purposes)

### Phase 4: Activity Tracking

**Middleware/API Updates:**
- On each request, update `last_activity` timestamp
- Check inactivity timeout (15 minutes)
- Auto-logout if inactive

**New Endpoint: `POST /api/view-as/heartbeat`**
- Called periodically (every 5 minutes) when impersonating
- Updates `last_activity` timestamp
- Returns expiration status

### Phase 5: Logout & Expiration

**Logout:**
- `POST /api/view-as/logout` or regular logout
- Marks session as "COMPLETED"
- Clears NextAuth session
- Redirects to impersonator's dashboard

**Auto-Expiration:**
- Middleware checks `expires_at` and `last_activity`
- Auto-redirects to logout if expired
- Shows expiration message

### Phase 6: UI Updates

**User Profile Pages:**
- Replace "View As User" button with "Generate Login Link" button
- Shows modal with:
  - Login link (copyable)
  - QR code (optional)
  - Expiration time
  - "Open in New Window" button (opens incognito if possible)
  - "Copy Link" button

**Active Impersonations:**
- New page: `/platform-admin/impersonations` (or in account menu)
- Lists active impersonation sessions
- Can revoke sessions
- Shows activity status

### Phase 7: Audit & Logging

**Separate Audit Trail:**
- Impersonation sessions logged separately
- Not included in user's regular login history
- Track:
  - Who impersonated whom
  - When
  - Duration
  - Actions taken (optional, via audit logs with impersonation flag)
  - IP address, user agent

**Audit Log Updates:**
- Add `impersonation_session_id` field to audit logs
- Filter out impersonation actions from regular user logs (or mark clearly)

### Phase 8: Security Considerations

1. **Token Security:**
   - Long, random tokens (32+ bytes)
   - HTTPS only
   - Rate limiting on token generation

2. **Access Control:**
   - Only privileged users can generate links
   - Same rules as current `canViewAsUser` function

3. **Expiration:**
   - Time-based: 1 hour default
   - Inactivity-based: 15 minutes default
   - Both configurable

4. **Revocation:**
   - Admins can revoke active sessions
   - Auto-revoke on password change
   - Auto-revoke on account deactivation

5. **Incognito Mode:**
   - JavaScript can't force incognito, but we can:
     - Open in new window
     - Show instructions to user
     - Use `target="_blank"` with `rel="noopener noreferrer"`

## Migration Plan

1. **Keep Current System Temporarily:**
   - Don't remove cookie-based system immediately
   - Add new token-based system alongside
   - Allow both to work during transition

2. **Gradual Migration:**
   - Update UI to use token-based system
   - Keep cookie-based as fallback
   - Remove cookie-based after testing

3. **Data Migration:**
   - No data migration needed (new system, new table)

## Benefits

1. **Better Security:**
   - Time-limited access
   - Inactivity timeout
   - Separate audit trail
   - Can be revoked

2. **Better UX:**
   - Opens in separate window/tab
   - Full access to user's account
   - Clear expiration
   - No confusion with regular session

3. **Better Auditability:**
   - Separate tracking of impersonations
   - Doesn't pollute user's login history
   - Clear audit trail

4. **More Flexible:**
   - Can share links (with caution)
   - Can set custom expiration times
   - Can track multiple active sessions

## API Endpoints

1. `POST /api/view-as/generate-link` - Generate impersonation link
2. `GET /view-as/[token]` - Login via impersonation token
3. `POST /api/view-as/heartbeat` - Update activity timestamp
4. `POST /api/view-as/logout` - End impersonation session
5. `GET /api/view-as/sessions` - List active impersonation sessions (admin)
6. `POST /api/view-as/sessions/[id]/revoke` - Revoke a session (admin)

## Files to Create/Modify

**New Files:**
- `prisma/migrations/.../add_impersonation_session.sql`
- `src/app/view-as/[token]/page.tsx` - Impersonation login page
- `src/app/api/view-as/generate-link/route.ts`
- `src/app/api/view-as/heartbeat/route.ts`
- `src/app/api/view-as/sessions/route.ts`
- `src/app/api/view-as/sessions/[id]/revoke/route.ts`
- `src/lib/impersonation.ts` - Impersonation utilities
- `src/components/shared/GenerateImpersonationLink.tsx` - UI component

**Modified Files:**
- `prisma/schema.prisma` - Add ImpersonationSession model
- `src/lib/auth.ts` - Handle impersonation sessions in JWT callback
- `src/middleware.ts` - Check impersonation session expiration
- `src/components/shared/ViewAsUserButton.tsx` - Replace with GenerateLink button
- `src/app/platform-admin/users/[userId]/page.tsx` - Update button
- `src/app/qcto/team/page.tsx` - Update button
- `src/app/institution/staff/page.tsx` - Update button
- Remove cookie-based View As User code

## Implementation Order

1. Schema changes (ImpersonationSession model)
2. Token generation API
3. Impersonation login route
4. Activity tracking & expiration
5. UI components (GenerateLink button, modal)
6. Logout & session management
7. Audit logging
8. Remove old cookie-based system
9. Testing

## Configuration

Environment variables:
- `IMPERSONATION_TOKEN_EXPIRY=3600` (1 hour in seconds)
- `IMPERSONATION_INACTIVITY_TIMEOUT=900` (15 minutes in seconds)
- `IMPERSONATION_MAX_ACTIVE_SESSIONS=5` (per admin)

## Notes

- Incognito mode: JavaScript cannot force incognito, but we can:
  - Open link in new window
  - Show instructions to user
  - Use `window.open(url, '_blank', 'noopener,noreferrer')`
  - User can manually open in incognito if desired

- Login logs: Impersonation sessions are stored in `ImpersonationSession` table, not in regular login history

- Multiple sessions: An admin can have multiple active impersonation sessions (for different users)
