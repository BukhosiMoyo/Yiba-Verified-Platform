# Verification Badge System - Strategy & Best Practices

## Philosophy

> "Verification badges should represent **trust earned**, not just email confirmation."

The badge system should:
1. **Build Trust** - Help users identify legitimate, compliant accounts
2. **Motivate Compliance** - Encourage users to complete requirements
3. **Be Meaningful** - Each tier should represent real achievement
4. **Be Revocable** - Lost if standards aren't maintained

---

## Proposed Badge Tiers

### 🔵 Blue Checkmark - Verified Account
**For:** Students, Institution Staff, General Users
**Meaning:** "This account has been verified and is in good standing"

| Requirement | Description |
|-------------|-------------|
| Email Verified | Confirmed email ownership |
| Profile Complete | All required fields filled (>80%) |
| Phone Verified | Mobile number confirmed via OTP |
| Account Age | Active for 7+ days |
| No Violations | No warnings or suspensions |
| **Role-Specific** | |
| └─ Students | ID number verified, enrolled in program |
| └─ Staff | Added by verified institution admin |

---

### 🟡 Gold Checkmark - Official/Government Account  
**For:** QCTO Staff, Government Officials, Reviewers
**Meaning:** "This is an official government representative"

| Requirement | Description |
|-------------|-------------|
| All Blue Requirements | ✓ |
| QCTO Role Assigned | Has official QCTO role in system |
| Official Verification | Government email OR manual verification |
| Onboarding Complete | Finished QCTO onboarding wizard |
| Province Assigned | Has assigned review provinces |
| Active Participation | Completed at least 1 review/action |

---

### ⚫ Black Checkmark - Platform Admin
**For:** Platform Administrators, Super Admins
**Meaning:** "This is a Yiba Verified platform administrator"

| Requirement | Description |
|-------------|-------------|
| Platform Admin Role | Has PLATFORM_ADMIN role |
| Internal Team Member | Verified employee/contractor |
| 2FA Enabled | Two-factor authentication active |

---

### 🟢 Green Checkmark - Accredited Institution
**For:** Institution Admins of accredited institutions
**Meaning:** "This institution is accredited and compliant"

| Requirement | Description |
|-------------|-------------|
| All Blue Requirements | ✓ |
| Institution Accredited | Has valid accreditation |
| Readiness Approved | Passed readiness assessment |
| Documents Complete | All required docs uploaded |
| Compliance Score | Above threshold (e.g., 80%) |
| No Violations | No compliance issues |

---

## Badge Revocation Triggers

Badges should be **revocable** to maintain meaning:

| Trigger | Action |
|---------|--------|
| Email becomes unverified | Lose Blue badge |
| Account suspended | Lose all badges |
| Compliance violation | Lose Green badge |
| Accreditation expires | Lose Green badge |
| Role removed | Lose Gold badge |
| Inactive >6 months | Badge review required |

---

## Visual Design

```
Badge Colors:
┌─────────────────────────────────────────────────────┐
│  🔵 Blue    │ #3B82F6 │ Standard verified           │
│  🟡 Gold    │ #F59E0B │ Government/Official         │
│  ⚫ Black   │ #1F2937 │ Platform Admin              │
│  🟢 Green   │ #10B981 │ Accredited Institution      │
│  ⚪ Gray    │ #9CA3AF │ Unverified (no badge shown) │
└─────────────────────────────────────────────────────┘
```

### Badge Placement
1. **Avatar Overlay** - Small badge on bottom-right of avatar
2. **Name Badge** - Pill next to name (optional, for emphasis)
3. **Profile Page** - Full badge with explanation

### Tooltip on Hover
When hovering over badge, show:
- Badge type name
- "Verified since [date]"
- Quick summary of what it means

---

## User Journey to Verification

### For Students (Blue Badge)
```
1. Sign up with email         → Email verification sent
2. Verify email               → ✓ Email verified
3. Complete profile           → ✓ Profile complete  
4. Verify phone (OTP)         → ✓ Phone verified
5. Get enrolled by institution→ ✓ Enrolled
6. Wait 7 days                → ✓ Account age
                              → 🔵 BLUE BADGE EARNED!
```

### For Institution Staff (Blue Badge)
```
1. Receive invite from admin  → Account created
2. Accept invite & set password
3. Verify email               → ✓ Email verified
4. Complete profile           → ✓ Profile complete
5. Wait 7 days                → ✓ Account age
                              → 🔵 BLUE BADGE EARNED!
```

### For Institution Admin (Green Badge)
```
1. Complete Blue Badge requirements
2. Institution submits readiness  → Under review
3. Readiness approved             → ✓ Accredited
4. All documents uploaded         → ✓ Compliant
5. Maintain good standing         → ✓ No violations
                                  → 🟢 GREEN BADGE EARNED!
```

### For QCTO Staff (Gold Badge)
```
1. Invited by QCTO admin      → Account created
2. Complete onboarding wizard → ✓ Onboarded
3. Assigned to province(s)    → ✓ Assigned
4. Complete first review      → ✓ Active
                              → 🟡 GOLD BADGE EARNED!
```

---

## Database Schema

```prisma
model User {
  // ... existing fields ...
  
  // Verification status (computed or cached)
  verification_level    VerificationLevel @default(NONE)
  verification_date     DateTime?
  verification_revoked  DateTime?
  verification_reason   String?
  
  // Compliance tracking
  profile_completeness  Int @default(0) // 0-100
  phone_verified        Boolean @default(false)
  phone_verified_at     DateTime?
  last_violation_at     DateTime?
  violation_count       Int @default(0)
}

enum VerificationLevel {
  NONE
  BLUE      // Standard verified
  GREEN     // Accredited institution
  GOLD      // Government/QCTO
  BLACK     // Platform admin
}
```

---

## Verification Progress UI

### Profile Page - Verification Status Card
```
┌─────────────────────────────────────────────────────────┐
│ 🔵 Verification Status                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  You're 2 steps away from getting verified!             │
│                                                         │
│  ✅ Email verified                                      │
│  ✅ Profile complete (92%)                              │
│  ⬜ Phone verification                    [Verify Now]  │
│  ⬜ Account age (3/7 days)                              │
│                                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░ 67%           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Already Verified
```
┌─────────────────────────────────────────────────────────┐
│ 🔵 Verified Account                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ✓ Your account has been verified                       │
│                                                         │
│  Verified since: January 15, 2026                       │
│                                                         │
│  This badge shows that:                                 │
│  • Your identity has been confirmed                     │
│  • Your profile is complete                             │
│  • Your account is in good standing                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Add verification fields to User model
- [ ] Create verification level calculation logic
- [ ] Add phone verification (OTP)
- [ ] Track profile completeness

### Phase 2: Badge Display
- [ ] Create BadgeIcon component with all tiers
- [ ] Add to user avatars across the app
- [ ] Add tooltips with verification info
- [ ] Update profile page with status card

### Phase 3: Progress Tracking
- [ ] Create verification progress API
- [ ] Build progress UI component
- [ ] Add "steps to verify" guidance
- [ ] Send notifications when eligible

### Phase 4: Advanced
- [ ] Automatic badge revocation
- [ ] Compliance monitoring for Green badges
- [ ] Activity tracking for Gold badges
- [ ] Badge history/audit log

---

## Best Practices Summary

1. **Make it Achievable** - Clear, actionable steps
2. **Show Progress** - Users should see how close they are
3. **Explain Value** - Why verification matters
4. **Be Consistent** - Same badge means same thing everywhere
5. **Revoke Fairly** - Clear rules, warnings before removal
6. **Don't Over-Badge** - Avoid badge fatigue (max 1 badge per user)
7. **Accessibility** - Don't rely only on color (use icons too)

---

## Questions to Decide

1. **Account Age Requirement** - 7 days? 14 days? None?
2. **Phone Verification** - Required or optional for Blue?
3. **Profile Completeness Threshold** - 80%? 100%?
4. **Institution Staff** - Auto-verify if institution is verified?
5. **QCTO Without Activity** - Give Gold on assignment or first action?
6. **Grace Period** - How long before revoking for violations?

---

## What Do You Think?

This creates a meaningful verification system where:
- **Blue** = Basic trust (most users)
- **Gold** = Government authority
- **Green** = Institutional credibility  
- **Black** = Platform authority

The badge becomes something users **work toward** and **maintain**, not just receive automatically.

Would you like me to start implementing this system?
