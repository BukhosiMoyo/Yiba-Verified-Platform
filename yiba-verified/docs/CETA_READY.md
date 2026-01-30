# CETA-Ready Design (No Build Yet)

This document describes how to add CETA (or another SETA) as a second regulatory body without redoing institution onboarding or duplicating core flows.

## Current design

- **Institution onboarding:** Single path for all institution types (TVET, PRIVATE_SDP, NGO, UNIVERSITY, EMPLOYER, OTHER). No "QCTO vs CETA" choice for institutions; they onboard once and can interact with whichever body(ies) they need.
- **Regulatory side:** QCTO is implemented as an organisation with its own table (`QCTOOrg`), roles (`QCTO_SUPER_ADMIN`, `QCTO_ADMIN`, `QCTO_USER`, `QCTO_REVIEWER`, etc.), and route area (`qcto`). Users are linked via `User.qcto_id` and role; capabilities and RBAC are role-based.
- **Provincial assignment:** QCTO users have `assigned_provinces` and `default_province` for scoping; the same pattern can be reused for CETA.

## Adding CETA (or another SETA) later

1. **Org and roles**
   - Add a CETA org table (e.g. `CETAOrg` or a generic `RegulatoryOrg` with `type: 'QCTO' | 'CETA'`).
   - Add CETA roles (e.g. `CETA_ADMIN`, `CETA_REVIEWER`) to `UserRole` and link users via `User.ceta_id` (or `User.regulatory_org_id` if generic).
   - Reuse the same RBAC pattern: new route area `ceta`, new capabilities (e.g. `CETA_READINESS_VIEW`), and `ROLE_ROUTE_ACCESS` entries for CETA roles.

2. **Institutions**
   - No change to institution onboarding. Institutions do not choose "QCTO only" or "CETA only"; they register once. CETA-specific data (e.g. CETA readiness, CETA submissions) would be added as separate models or sections keyed by regulatory org, similar to how readiness is keyed by institution today.

3. **Readiness / submissions**
   - Today readiness and submissions are QCTO-facing. For CETA, either:
     - Add parallel models (e.g. `CETAReadiness`, `CETASubmission`) and CETA-specific APIs and UI, or
     - Generalise to "regulatory readiness" with a `regulatory_org` or `type` field and branch logic by org.
   - Recommendation: keep QCTO flows as-is; add CETA as a parallel set of models and routes to avoid big-bang refactors and keep deployables small.

4. **No hardcoding**
   - Avoid hardcoding "QCTO" in places that would block a second org (e.g. middleware, nav, and capability checks should be role/area driven, not "if QCTO" only). The current codebase uses roles and route areas; adding a new area and roles is the intended extension point.

## Summary

- **Institution onboarding:** Leave as single path; no CETA-specific onboarding.
- **Regulatory side:** Add CETA org table, CETA roles, `User.ceta_id` (or generic link), new route area `ceta`, and new capabilities/nav. Optionally add CETA-specific readiness/submission models and UI.
- **No code change in this repo until CETA scope is confirmed;** this doc is the design reference.
