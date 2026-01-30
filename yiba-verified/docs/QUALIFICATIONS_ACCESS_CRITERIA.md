# Qualifications access criteria

This doc explains **who** can access qualifications and **what** they see, so you can get access when searching or applying (e.g. in Readiness / Form 5).

## Who can access qualifications?

| Area | Who can access |
|------|----------------|
| **Institution Qualifications** (`/institution/qualifications`) | `INSTITUTION_ADMIN`, `INSTITUTION_STAFF`, `PLATFORM_ADMIN` |
| **QCTO Qualifications** (`/qcto/qualifications`) | QCTO roles + `INSTITUTION_ADMIN`, `INSTITUTION_STAFF`, `PLATFORM_ADMIN` |
| **Platform Admin Qualifications** (`/platform-admin/qualifications`) | `PLATFORM_ADMIN` only |

Institution users use the **Institution** qualifications area (sidebar: **Qualifications** under the institution section).

## Criteria for institution users (your case)

To **see and search** qualifications as an institution user, **all** of the following must be true:

1. **Role**  
   Your account must have role `INSTITUTION_ADMIN` or `INSTITUTION_STAFF`.

2. **Linked to an institution**  
   Your user must be linked to at least one institution. The app resolves this by:
   - **Preferred:** `UserInstitution` rows (multi-institution), or  
   - **Legacy:** `User.institution_id` set to an institution.

   If you are **not** linked to any institution (e.g. account not verified, onboarding not finished, or invite not fully accepted), the API returns **403** with:  
   `"Institution ID required for institution roles"`  
   and you will not see any qualifications.

3. **What you see**  
   For that institution, you see:
   - Qualifications with **status = ACTIVE**, **or**
   - Qualifications with **status = DRAFT** (so you can search and apply for readiness even when no ACTIVE exist yet), **or**
   - Qualifications **linked to your institution** via a readiness (Form 5) record (any status).

   So:
   - If the **qualification registry** has no ACTIVE or DRAFT qualifications and your institution has no readiness records yet, the list will be **empty** (no error, just “No qualifications found”). In that case a platform admin or QCTO user must add qualifications to the registry first.
   - The **Qualifications** page default filter is **Active**; other statuses (Inactive, Retired, Draft) only show if you change the filter and the qualification is in the allowed set above.

## What you need to do to have access

1. **Ensure you are linked to an institution**
   - Complete **institution onboarding** if you are the first admin (so the institution exists and your user is linked).
   - If you joined via **invite**, ensure you accepted the invite and that your role is `INSTITUTION_ADMIN` or `INSTITUTION_STAFF` and that the invite created a `UserInstitution` (or set `User.institution_id`).
   - “Account not verified” usually means the user is not yet linked to an institution or onboarding is incomplete.

2. **Use the right place**
   - Go to **Institution** → **Qualifications** in the sidebar (not the QCTO Qualifications area).
   - When applying in **Readiness (Form 5)**, the qualification picker uses the **same** institution API (`/api/institutions/qualifications`), so the same criteria apply.

3. **If the list is empty**
   - Check that the **qualification registry** has qualifications with status **ACTIVE** (QCTO or Platform Admin manage that).
   - Until your institution has at least one readiness record, you will only see **ACTIVE** qualifications, not Inactive/Retired/Draft (unless you have a readiness link).

## Quick checklist

- [ ] Role is `INSTITUTION_ADMIN` or `INSTITUTION_STAFF`
- [ ] User is linked to an institution (`UserInstitution` or `User.institution_id`)
- [ ] Institution onboarding completed (if you created the institution)
- [ ] Using **Institution** → **Qualifications** (or the Form 5 qualification picker)
- [ ] Registry has **ACTIVE** qualifications (or you have readiness-linked qualifications)

If you still get **403**, the most likely cause is **no institution linked** to your user. Completing onboarding or properly accepting an institution invite should fix it.
