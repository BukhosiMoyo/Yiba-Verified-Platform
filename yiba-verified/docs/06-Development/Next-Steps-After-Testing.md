# Next Steps After Testing

## Current Status ✅

**Completed Features:**
- ✅ Authentication & RBAC (dev-token + NextAuth)
- ✅ Institution module (basic CRUD)
- ✅ LMIS Core (Learners + Enrolments)
- ✅ Submission workflow (DRAFT → SUBMITTED → APPROVED)
- ✅ QCTO request workflow (PENDING → APPROVED)
- ✅ QCTO review workflow (review submissions)
- ✅ Access control (`canReadForQCTO()` helper)
- ✅ Audit logging (`mutateWithAudit()`)
- ✅ Testing documentation

**Ready for Production:**
- ✅ Core workflows are complete and tested
- ✅ RBAC enforced correctly
- ✅ Audit trail working

---

## Recommended Next Steps (Priority Order)

### 🔴 HIGH PRIORITY: Production Readiness

#### 1. **Audit Log Viewer UI** (Milestone 6)
**Why:** Critical for transparency and compliance tracking

**Tasks:**
- Create audit log API endpoint (`GET /api/audit-logs`)
  - Filter by entity type, user, date range, institution
  - Pagination support
- Build audit log viewer UI (`/platform-admin/audit-logs`)
  - Table view with filters
  - Diff viewer (before/after values)
  - Export to CSV
- Add audit log links to relevant pages (submission detail, learner detail, etc.)

**Deliverables:**
- `src/app/api/audit-logs/route.ts`
- `src/app/platform-admin/audit-logs/page.tsx`
- `src/components/shared/AuditLogViewer.tsx`

---

#### 2. **Platform Admin Dashboard** (Milestone 1 - Enhancement)
**Why:** Platform admins need a central view of system health

**Tasks:**
- Create dashboard API (`GET /api/platform-admin/stats`)
  - Total institutions, learners, enrolments
  - Pending submissions/requests
  - Recent activity summary
- Build dashboard UI (`/platform-admin/page.tsx`)
  - Widgets for key metrics
  - Recent submissions/requests
  - Quick links to important views
  - Charts/graphs (optional, nice-to-have)

**Deliverables:**
- `src/app/api/platform-admin/stats/route.ts`
- Enhanced `src/app/platform-admin/page.tsx`
- Dashboard components

---

#### 3. **QCTO Dashboard Enhancement** (Milestone 1 - Enhancement)
**Why:** QCTO users need better oversight and filtering

**Tasks:**
- Enhance QCTO dashboard (`/qcto/page.tsx`)
  - Pending submissions count
  - Recent activity feed
  - Filtered views (by status, institution, date)
  - Quick actions (review, approve, reject)
- Add statistics API (`GET /api/qcto/stats`)

**Deliverables:**
- `src/app/api/qcto/stats/route.ts`
- Enhanced `src/app/qcto/page.tsx`

---

### 🟡 MEDIUM PRIORITY: Core Features

#### 4. **Form 5 Readiness Module** (Milestone 3)
**Why:** Core feature for institutions to demonstrate readiness

**Tasks:**
- Design readiness schema (if not in `Submission`)
  - Sections/Criteria structure
  - Evidence uploads per criterion
  - Status per section (COMPLETE, IN_PROGRESS, INCOMPLETE)
- Create readiness API endpoints
  - `GET /api/institutions/readiness/[qualificationId]`
  - `POST /api/institutions/readiness/[qualificationId]/sections/[sectionId]`
  - `PATCH /api/institutions/readiness/[qualificationId]/sections/[sectionId]`
- Build readiness UI (`/institution/readiness/[qualificationId]`)
  - Form 5 sections display
  - Evidence upload per section
  - Status indicators
  - Submit for review button

**Deliverables:**
- Prisma schema updates (if needed)
- Readiness API routes
- Readiness UI pages

---

#### 5. **Evidence Vault + Versioning** (Milestone 4)
**Why:** Structured document storage with version history

**Tasks:**
- Extend document schema (if not in `SubmissionResource`)
  - File storage (S3/local)
  - Version tracking
  - Categories/tags
- Create document API endpoints
  - `POST /api/institutions/documents` (upload)
  - `GET /api/institutions/documents/[documentId]/versions`
  - `PATCH /api/institutions/documents/[documentId]` (replace = new version)
- Build document viewer UI (`/institution/documents`)
  - Document list with categories
  - Version history viewer
  - Upload/replace interface

**Deliverables:**
- Document storage schema
- Document API routes
- Document management UI

---

#### 6. **Reports & Export** (Milestone 7)
**Why:** QCTO and Platform Admins need data exports

**Tasks:**
- Create export API endpoints
  - `GET /api/export/learners?format=csv`
  - `GET /api/export/enrolments?format=csv`
  - `GET /api/export/submissions?format=csv`
- Add export buttons to relevant pages
  - Institution submissions page
  - QCTO submissions page
  - Platform admin audit logs

**Deliverables:**
- Export API routes (CSV/JSON)
- Export UI components

---

### 🟢 LOW PRIORITY: Enhancements & Polish

#### 7. **Notifications System**
**Why:** Users need to know when actions require their attention

**Tasks:**
- Create notifications schema
  - User notifications table
  - Notification types (submission_reviewed, request_approved, etc.)
- Build notifications API
  - `GET /api/notifications`
  - `PATCH /api/notifications/[notificationId]` (mark read)
- Add notification UI
  - Notification bell icon (header)
  - Notification dropdown/list
  - In-app notifications for status changes

**Deliverables:**
- Notifications schema
- Notifications API
- Notification UI components

---

#### 8. **UI/UX Enhancements**
**Why:** Better user experience and visual polish

**Tasks:**
- Add loading states (skeletons)
- Improve error messages (user-friendly)
- Add confirmation dialogs for destructive actions
- Improve mobile responsiveness
- Add tooltips/help text
- Improve form validation feedback
- Add toast notifications for success/error

**Deliverables:**
- Enhanced UI components
- Better error handling
- Mobile-responsive layouts

---

#### 9. **Performance Optimization**
**Why:** Better performance for large datasets

**Tasks:**
- Add pagination to all list endpoints (if not already)
- Implement infinite scroll or "load more" buttons
- Add database indexes (verify with `EXPLAIN`)
- Optimize N+1 queries (use Prisma `include` efficiently)
- Add caching for read-heavy endpoints (Redis, optional)
- Implement query result caching (React Query/SWR)

**Deliverables:**
- Optimized queries
- Better pagination
- Performance benchmarks

---

#### 10. **Security & Compliance Review**
**Why:** Ensure POPIA compliance and security best practices

**Tasks:**
- Review RBAC enforcement (all endpoints)
- Audit authentication flows (dev-token vs NextAuth)
- Verify POPIA consent tracking (learner data)
- Review audit log coverage (all mutations logged?)
- Security scanning (dependencies, SQL injection, XSS)
- Rate limiting (API endpoints)
- Input validation review (all user inputs)

**Deliverables:**
- Security audit report
- Fixes for any vulnerabilities
- Security documentation

---

#### 11. **Documentation Improvements**
**Why:** Better developer and user documentation

**Tasks:**
- Complete API documentation (OpenAPI/Swagger)
- User guides (institution, QCTO, platform admin)
- Developer onboarding guide
- Architecture documentation
- Deployment guide
- Troubleshooting guide

**Deliverables:**
- Comprehensive documentation
- User guides
- Developer guides

---

## Suggested Implementation Order

### Phase 1: Production Readiness (1-2 weeks)
1. ✅ Audit Log Viewer UI
2. ✅ Platform Admin Dashboard
3. ✅ QCTO Dashboard Enhancement

### Phase 2: Core Features (2-3 weeks)
4. ✅ Form 5 Readiness Module
5. ✅ Evidence Vault + Versioning
6. ✅ Reports & Export

### Phase 3: Enhancements (1-2 weeks)
7. ✅ Notifications System
8. ✅ UI/UX Enhancements
9. ✅ Performance Optimization

### Phase 4: Security & Docs (1 week)
10. ✅ Security & Compliance Review
11. ✅ Documentation Improvements

---

## Quick Wins (Can Do Anytime)

These are small improvements that can be done quickly:

- **Add "last updated" timestamps** to all list views
- **Add status badges** (colored indicators for DRAFT, SUBMITTED, APPROVED, etc.)
- **Add search/filter UI** to existing list pages
- **Add breadcrumbs** navigation
- **Add "copy ID" buttons** for debugging
- **Add confirmation dialogs** for destructive actions
- **Improve empty states** (better messaging when no data)
- **Add loading spinners** for all async operations

---

## What NOT to Do Now (V2 Parking Lot)

Per Milestones document, these are NOT in V1 scope:
- ❌ Deep Tutor LMS integration
- ❌ SMS / 2FA
- ❌ Advanced analytics and anomaly detection
- ❌ Automated readiness scoring
- ❌ External integrations (SETA, QCTO internal systems)

---

## Decision Time 🎯

**Recommended next step:** Start with **Audit Log Viewer UI** (Phase 1, Task 1)

**Why:**
- Critical for transparency and compliance
- Users can see what's happening in the system
- Platform admins need this for oversight
- Relatively straightforward to implement
- Builds on existing `mutateWithAudit()` infrastructure

**Alternative:** If Form 5 is more urgent, start with **Form 5 Readiness Module** (Phase 2, Task 4)

---

## Summary

After testing, the **top 3 priorities** are:

1. 🔴 **Audit Log Viewer UI** - Critical for transparency
2. 🔴 **Platform Admin Dashboard** - Central oversight view
3. 🔴 **QCTO Dashboard Enhancement** - Better QCTO experience

**Recommendation:** Start with Audit Log Viewer, then Platform Admin Dashboard, then QCTO Dashboard. This gives you the core oversight capabilities needed for production, then you can tackle the bigger features (Form 5, Evidence Vault) in Phase 2.

---

**What would you like to tackle next?** 🚀
