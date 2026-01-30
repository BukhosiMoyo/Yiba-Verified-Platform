# Evidence Flags System

## Overview

Evidence Flags is a QCTO feature that allows QCTO reviewers to mark documents that need attention, review, or follow-up. It's a quality control mechanism for tracking problematic or questionable evidence submitted by institutions.

## Purpose

- **Quality Control**: QCTO can flag documents that have issues, are incomplete, or need verification
- **Review Tracking**: Track which documents have been flagged and by whom
- **Workflow Management**: Manage the resolution of flagged documents
- **Audit Trail**: Maintain a record of all flagging activities

## How It Works

### 1. Flagging a Document

**Who can flag:**
- QCTO_USER
- QCTO_SUPER_ADMIN
- QCTO_ADMIN
- QCTO_REVIEWER
- PLATFORM_ADMIN

**Process:**
1. QCTO reviewer views a document (typically during readiness review or submission review)
2. Reviewer identifies an issue with the document
3. Reviewer flags the document via API endpoint: `POST /api/qcto/documents/[documentId]/flag`
4. Reviewer provides a **reason** (required) explaining why the document is flagged
5. System creates an `EvidenceFlag` record with status `ACTIVE`
6. Document status is updated from `UPLOADED` to `FLAGGED` (if it was previously UPLOADED)

**Flag Data Structure:**
```typescript
{
  flag_id: string (UUID)
  document_id: string (references Document)
  flagged_by: string (user_id of QCTO reviewer)
  reason: string (required - explanation for flagging)
  status: "ACTIVE" | "RESOLVED" (default: "ACTIVE")
  created_at: DateTime
  resolved_at: DateTime? (null until resolved)
  resolved_by: string? (user_id of who resolved it)
}
```

### 2. Viewing Evidence Flags

**Access:**
- Page: `/qcto/evidence-flags`
- Requires: `EVIDENCE_VIEW` capability
- Available to: QCTO roles and PLATFORM_ADMIN

**Features:**
- **List View**: Table format showing all flag details
- **Grid View**: Card-based layout for visual browsing
- **Search**: Search by:
  - Flag reason text
  - Document file name
  - Flagged by user name/email
- **Filtering**: Filter by status:
  - `ACTIVE` - Currently flagged documents
  - `RESOLVED` - Previously flagged, now resolved
- **Pagination**: Configurable rows per page (10, 20, 50, 100)
- **Export**: Export flags to CSV/Excel

**Display Information:**
- Document name and type
- Institution name (derived from document's related entity)
- Flag reason
- Status badge (ACTIVE = amber, RESOLVED = green)
- Who flagged it and when
- Who resolved it and when (if resolved)
- Quick view (for PDF documents)
- View document link (for PLATFORM_ADMIN)

### 3. Resolving Flags

**How flags get resolved:**

Flags are automatically resolved when a document is **accepted** by QCTO:

1. QCTO reviewer accepts a document via: `POST /api/qcto/documents/[documentId]/accept`
2. System updates document status to `ACCEPTED`
3. System automatically resolves all `ACTIVE` flags for that document:
   - Sets flag status to `RESOLVED`
   - Sets `resolved_at` to current timestamp
   - Sets `resolved_by` to the user who accepted the document

**Note:** There's no separate "unflag" or "resolve flag" endpoint. Flags are resolved as a side effect of accepting the document.

### 4. Document Status Flow

```
UPLOADED → FLAGGED (when flagged)
FLAGGED → ACCEPTED (when accepted, flags auto-resolved)
UPLOADED → ACCEPTED (if accepted without flagging)
```

## Database Schema

### EvidenceFlag Model

```prisma
model EvidenceFlag {
  flag_id        String    @id @default(uuid())
  document_id    String
  flagged_by     String
  reason         String
  status         String    @default("ACTIVE")
  created_at     DateTime  @default(now())
  resolved_at    DateTime?
  resolved_by    String?
  
  document       Document  @relation(...)
  flaggedByUser User      @relation("EvidenceFlaggedBy", ...)
  resolvedByUser User?     @relation("EvidenceResolvedBy", ...)
  
  @@index([document_id])
  @@index([flagged_by])
  @@index([status])
}
```

### Document Status Enum

```prisma
enum DocumentStatus {
  UPLOADED    // Initial state
  FLAGGED     // Flagged by QCTO
  ACCEPTED    // Accepted by QCTO (flags resolved)
}
```

## API Endpoints

### Flag a Document
```
POST /api/qcto/documents/[documentId]/flag
Body: { reason: string }
Response: { flag_id, document_id, reason, status, flagged_by, created_at }
```

### Accept a Document (resolves flags)
```
POST /api/qcto/documents/[documentId]/accept
Response: { document_id, status: "ACCEPTED", message }
```

### List Evidence Flags
```
GET /api/qcto/evidence-flags
Query params:
  ?q=string          - Search query
  ?status=ACTIVE|RESOLVED  - Filter by status
  ?limit=number       - Page size (default 50, max 200)
  ?offset=number      - Pagination offset
Response: { count: number, items: EvidenceFlag[] }
```

### Export Evidence Flags
```
GET /api/export/evidence-flags
Query params:
  ?status=ACTIVE|RESOLVED  - Optional status filter
Response: CSV/Excel file
```

## Use Cases

### 1. Incomplete Documentation
- Institution submits readiness form but a required document is missing or incomplete
- QCTO flags the document with reason: "Missing required certification document"

### 2. Quality Issues
- Document quality is poor (blurry, illegible, etc.)
- QCTO flags with reason: "Document quality insufficient - cannot verify content"

### 3. Verification Needed
- Document needs additional verification or cross-checking
- QCTO flags with reason: "Requires verification with external authority"

### 4. Compliance Concerns
- Document doesn't meet compliance requirements
- QCTO flags with reason: "Does not meet Form 5 Section 3.3 requirements"

### 5. Follow-up Required
- Institution needs to provide additional information
- QCTO flags with reason: "Institution must provide updated version"

## Workflow Example

1. **Institution submits readiness form** with supporting documents
2. **QCTO reviewer reviews** the submission
3. **Reviewer finds issue** with a facilitator's qualification document
4. **Reviewer flags the document** with reason: "Qualification document expired - requires current certificate"
5. **Flag appears** in Evidence Flags page with status ACTIVE
6. **Institution is notified** (via notification system) about the flag
7. **Institution uploads** updated document
8. **QCTO reviewer reviews** the new document
9. **Reviewer accepts** the document
10. **Flag is automatically resolved** (status changes to RESOLVED)
11. **Resolved flag** appears in Evidence Flags page (filtered by RESOLVED status)

## Permissions

### Capabilities Required
- `EVIDENCE_VIEW`: Required to view the Evidence Flags page
- `QCTO_REVIEW_FLAG`: Required to flag documents (included in QCTO review capabilities)

### Roles with Access
- **QCTO_USER**: Can flag and view flags
- **QCTO_SUPER_ADMIN**: Can flag and view flags
- **QCTO_ADMIN**: Can flag and view flags
- **QCTO_REVIEWER**: Can flag and view flags
- **QCTO_AUDITOR**: Can view flags (read-only)
- **QCTO_VIEWER**: Can view flags (read-only)
- **PLATFORM_ADMIN**: Can flag and view flags (full access)

## Best Practices

1. **Clear Reasons**: Always provide detailed, specific reasons when flagging documents
2. **Timely Resolution**: Review and resolve flags promptly to keep workflow moving
3. **Communication**: Use flag reasons to communicate clearly with institutions
4. **Documentation**: Flag reasons serve as audit trail - be professional and clear
5. **Follow-up**: Monitor ACTIVE flags regularly to ensure they're addressed

## Integration Points

- **Readiness Reviews**: Flags can be created during Form 5 readiness reviews
- **Submission Reviews**: Flags can be created during submission reviews
- **Document Vault**: Flags appear in institution's document vault view
- **Notifications**: Institutions receive notifications when documents are flagged
- **Audit Logs**: All flagging activities are logged in audit trail
