# Audit Logs Feature - Explanation

## Overview
The Audit Logs feature provides a comprehensive, immutable record of all changes made to critical entities in the system. It ensures accountability, traceability, and compliance by tracking who changed what, when, and why.

## What Gets Tracked

### Entity Types Tracked
The system tracks changes to these entity types:
- **INSTITUTION** - Institution records
- **USER** - User accounts
- **LEARNER** - Learner/student records
- **ENROLMENT** - Student enrolments
- **READINESS** - Readiness assessment records
- **DOCUMENT** - Document uploads and changes
- **ATTENDANCE_RECORD** - Attendance records
- **QCTO_REQUEST** - QCTO requests to institutions
- **SUBMISSION_RESOURCE** - Resources added to submissions
- **SUBMISSION** - Institution submissions to QCTO
- **QUALIFICATION** - Qualification records

### Change Types Tracked
For each entity, the system tracks:
- **CREATE** - When a new record is created
- **UPDATE** - When an existing record is modified
- **DELETE** - When a record is deleted
- **STATUS_CHANGE** - When a status field changes (e.g., submission status, readiness status)

## What Information is Stored

Each audit log entry contains:

1. **Entity Information**
   - `entity_type` - What type of entity was changed (e.g., LEARNER, SUBMISSION)
   - `entity_id` - The ID of the specific entity that was changed
   - `field_name` - Which field was changed (e.g., "first_name", "status")
   - `old_value` - The value before the change (serialized as JSON string)
   - `new_value` - The value after the change (serialized as JSON string)

2. **Who Made the Change**
   - `changed_by` - User ID of the person who made the change
   - `role_at_time` - The role of the user at the time of the change (important for accountability)
   - `changed_at` - Timestamp of when the change occurred

3. **Context Information**
   - `institution_id` - Which institution the change relates to (if applicable)
   - `reason` - Optional reason/justification for the change
   - `related_submission_id` - If the change is related to a submission
   - `related_qcto_request_id` - If the change is related to a QCTO request

4. **Change Metadata**
   - `change_type` - CREATE, UPDATE, DELETE, or STATUS_CHANGE

## How It Works

### Transactional Guarantee
**Critical Feature**: Audit logs are written in the **same database transaction** as the data change. This means:
- ✅ If the audit log fails to write, the entire operation is rolled back
- ✅ You can never have a data change without an audit trail
- ✅ Data integrity is guaranteed - no silent failures

### Implementation Pattern

All data mutations use the `mutateWithAudit` wrapper function:

```typescript
const learner = await mutateWithAudit({
  entityType: "LEARNER",
  changeType: "CREATE",
  fieldName: "learner_id",
  oldValue: null,
  newValue: learnerData,
  institutionId: institutionId,
  reason: "New student enrollment",
  
  // RBAC checks
  assertCan: async (tx, ctx) => {
    // Custom permission checks
  },
  
  // The actual mutation
  mutation: async (tx, ctx) => {
    return await tx.learner.create({ data: learnerData });
  },
});
```

This ensures:
1. Authentication is verified
2. RBAC permissions are checked
3. Institution scoping is enforced
4. The mutation executes
5. The audit log is written **in the same transaction**

### Value Serialization
All values (old_value, new_value) are automatically serialized:
- Strings → stored as-is
- Numbers/Booleans → converted to string
- Dates → ISO string format
- Arrays → JSON string
- Objects → JSON string

This ensures any data type can be audited.

## Access Control

### Who Can View Audit Logs
- **PLATFORM_ADMIN** - Can view all audit logs
- **QCTO_USER** (and all QCTO roles) - Can view all audit logs (AUDIT_VIEW capability)
- **Other roles** - Cannot view audit logs (403 Forbidden)

### Filtering Capabilities
Audit logs can be filtered by:
- Entity type (e.g., only LEARNER changes)
- Entity ID (e.g., all changes to a specific learner)
- Change type (CREATE, UPDATE, DELETE, STATUS_CHANGE)
- Institution ID
- User who made the change
- Date range (start_date, end_date)
- Related submission or QCTO request

## Use Cases

### 1. Compliance & Accountability
- Track who approved/rejected submissions
- See when readiness assessments were reviewed
- Monitor all changes to learner data

### 2. Debugging & Troubleshooting
- Find out when a record was changed
- See what the previous value was
- Identify who made an unexpected change

### 3. Audit Trails for Reviews
- QCTO can see complete history of submission reviews
- Track status changes through the workflow
- Link changes to specific submissions or requests

### 4. Security & Fraud Detection
- Monitor unauthorized access attempts
- Track changes made by different roles
- Identify suspicious patterns

## Important Design Decisions

### 1. Role at Time of Change
The `role_at_time` field stores the user's role **at the moment of the change**, not their current role. This is important because:
- Users can change roles over time
- You need to know what permissions they had when making the change
- Prevents confusion if someone's role changes later

### 2. Transactional Guarantee
The transactional approach ensures:
- **No orphaned changes** - Every data change has an audit log
- **Atomic operations** - Either both succeed or both fail
- **Data integrity** - Can't have data without audit trail

### 3. Field-Level Tracking
Each field change creates a separate audit log entry:
- If you update 3 fields, you get 3 audit log entries
- This provides granular tracking
- Makes it easy to see exactly what changed

### 4. Immutability
Audit logs are **never modified or deleted**:
- Once written, they remain forever
- Provides true historical record
- Cannot be tampered with

## Potential Issues to Check

### ✅ Correct Implementation
1. **All mutations use `mutateWithAudit`** - Check that data-changing operations use the wrapper
2. **Transaction safety** - Audit logs are in the same transaction
3. **Role preservation** - `role_at_time` captures the role at change time
4. **Value serialization** - Complex objects are properly serialized

### ⚠️ Things to Verify
1. **Coverage** - Are all important entities being audited?
2. **Field names** - Are field names descriptive enough?
3. **Reason field** - Is it being used where important decisions are made?
4. **Performance** - Large audit logs might need pagination/archiving strategy

## Example Audit Log Entry

```json
{
  "audit_id": "uuid",
  "entity_type": "SUBMISSION",
  "entity_id": "submission-123",
  "field_name": "status",
  "old_value": "UNDER_REVIEW",
  "new_value": "APPROVED",
  "changed_by": "user-456",
  "role_at_time": "QCTO_REVIEWER",
  "changed_at": "2024-01-15T10:30:00Z",
  "reason": "All requirements met, approved for accreditation",
  "institution_id": "inst-789",
  "change_type": "STATUS_CHANGE",
  "related_submission_id": "submission-123"
}
```

This tells us:
- A QCTO Reviewer approved a submission
- Status changed from UNDER_REVIEW to APPROVED
- The change happened on Jan 15, 2024
- There's a reason explaining why it was approved
- It's linked to a specific submission

## Summary

The Audit Logs feature provides:
- ✅ **Complete traceability** - Every change is recorded
- ✅ **Accountability** - Know who did what and when
- ✅ **Compliance** - Meets audit requirements
- ✅ **Data integrity** - Transactional guarantee ensures no lost audit trails
- ✅ **Security** - Only authorized roles can view logs
- ✅ **Flexibility** - Can filter and search by many criteria

The logic appears sound and follows best practices for audit logging systems.
