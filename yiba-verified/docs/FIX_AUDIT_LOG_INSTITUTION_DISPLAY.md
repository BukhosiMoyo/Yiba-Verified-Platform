# Fix Audit Log Institution Display - Comprehensive Prompt

## Problem Statement
The audit log modal is displaying raw UUIDs (e.g., `23326c1a-868c-4288-a227-3e4742d42ed4`) instead of human-readable institution names (e.g., "Test Institution") in the OLD VALUE and NEW VALUE sections when the `field_name` is `institution_id`.

## Root Cause Analysis

1. **Data Storage**: When `institution_id` changes, the audit log stores the UUID as a string (via `serializeValue()`), which may be:
   - Plain string: `"23326c1a-868c-4288-a227-3e4742d42ed4"`
   - JSON stringified: `"\"23326c1a-868c-4288-a227-3e4742d42ed4\""`

2. **Data Resolution**: The page component (`/app/platform-admin/audit-logs/page.tsx`) attempts to resolve institutions but may have issues:
   - The resolution logic may not correctly parse the stored values
   - The resolved data may not be passed correctly to the client component
   - The client component type may not include the resolved fields

3. **Display Logic**: The `getDisplayValue()` function in `AuditLogDetailModal.tsx` may not correctly:
   - Identify when a value is an institution_id UUID
   - Match the UUID to the resolved institution data
   - Handle both JSON-stringified and plain string UUIDs

## Required Fixes

### 1. Fix Institution Resolution in Page Component
**File**: `yiba-verified/src/app/platform-admin/audit-logs/page.tsx`

**Requirements**:
- When `field_name === "institution_id"`, resolve BOTH `old_value` and `new_value` to institution records
- Handle both JSON-stringified UUIDs and plain string UUIDs
- Ensure the resolved institutions are included in the returned log objects
- The resolved data should have structure: `{ institution_id, legal_name, trading_name }`

**Implementation Steps**:
1. After fetching raw logs, iterate through each log
2. If `log.field_name === "institution_id"`:
   - Parse `old_value` (try JSON.parse, fallback to plain string)
   - If it's a valid UUID string, query institution by `institution_id`
   - Do the same for `new_value`
   - Attach `oldInstitution` and `newInstitution` to the log object
3. Ensure the resolved institutions are properly typed and included in the response

### 2. Update TypeScript Types
**File**: `yiba-verified/src/app/platform-admin/audit-logs/AuditLogsTableClient.tsx`

**Requirements**:
- The `AuditLogEntry` type MUST include:
  ```typescript
  oldInstitution?: {
    institution_id: string;
    legal_name: string | null;
    trading_name: string | null;
  } | null;
  newInstitution?: {
    institution_id: string;
    legal_name: string | null;
    trading_name: string | null;
  } | null;
  ```

### 3. Fix Display Logic in Modal
**File**: `yiba-verified/src/components/platform-admin/AuditLogDetailModal.tsx`

**Requirements**:
- The `getDisplayValue()` function MUST:
  1. Check if `fieldName === "institution_id"` FIRST (before JSON parsing)
  2. If institution data exists (`oldInstitution` or `newInstitution`), immediately return the institution name
  3. Use `trading_name` if available, fallback to `legal_name`, fallback to `institution_id`
  4. Handle the `isOld` parameter correctly to select the right institution

**Implementation**:
```typescript
function getDisplayValue(
  value: string | null, 
  fieldName: string | null, 
  oldInstitution?: { institution_id: string; legal_name: string | null; trading_name: string | null } | null,
  newInstitution?: { institution_id: string; legal_name: string | null; trading_name: string | null } | null,
  isOld: boolean = false
): string {
  if (value === null || value === undefined || value === "") {
    return "(empty)";
  }
  
  // PRIORITY 1: Handle institution_id resolution FIRST
  if (fieldName === "institution_id") {
    const inst = isOld ? oldInstitution : newInstitution;
    if (inst) {
      // If we have resolved institution data, use it immediately
      return inst.trading_name || inst.legal_name || inst.institution_id;
    }
    // If no institution data but it's a UUID, we should have resolved it
    // Fall through to show the UUID (this shouldn't happen if resolution works)
  }
  
  // PRIORITY 2: Handle other field types (phone, email, etc.)
  // ... rest of the function
}
```

### 4. Ensure Data Flow
**Verification Checklist**:
- [ ] Page component resolves institutions for `institution_id` fields
- [ ] Resolved data is included in the log objects passed to `AuditLogsTableClient`
- [ ] `AuditLogsTableClient` passes the full log entry (including `oldInstitution`/`newInstitution`) to the modal
- [ ] Modal receives and uses the institution data in `getDisplayValue()`
- [ ] `DiffView` component correctly passes `oldInstitution` and `newInstitution` to `getDisplayValue()`

### 5. Handle Edge Cases
- **Same UUID in old and new**: Both should resolve to the same institution name
- **Null/empty values**: Should display "(empty)" not UUIDs
- **Invalid UUIDs**: Should display the raw value if it's not a valid UUID
- **Missing institution**: If UUID doesn't match any institution, show UUID (shouldn't happen in production)

## Testing Requirements

After implementing fixes, verify:
1. **Institution Change**: Change a user's institution → audit log should show institution names, not UUIDs
2. **Phone Number Change**: Change a user's phone → should show phone numbers, not UUIDs
3. **Name Change**: Change a user's name → should show names correctly
4. **Multiple Changes**: Change multiple fields → each should display correctly
5. **Empty to Value**: Set institution from null to a value → should show "(empty)" → "Institution Name"
6. **Value to Empty**: Remove institution → should show "Institution Name" → "(empty)"

## Files to Modify

1. `yiba-verified/src/app/platform-admin/audit-logs/page.tsx` - Add institution resolution
2. `yiba-verified/src/app/platform-admin/audit-logs/AuditLogsTableClient.tsx` - Update type definition
3. `yiba-verified/src/components/platform-admin/AuditLogDetailModal.tsx` - Fix display logic

## Success Criteria

✅ When viewing an audit log entry where `field_name === "institution_id"`:
- OLD VALUE shows institution name (e.g., "Test Institution") or "(empty)"
- NEW VALUE shows institution name (e.g., "Test Institution") or "(empty)"
- Raw (Technical) section still shows UUIDs for debugging
- Related section shows institution link correctly

✅ All other field types (phone, email, name, etc.) display correctly without showing UUIDs
