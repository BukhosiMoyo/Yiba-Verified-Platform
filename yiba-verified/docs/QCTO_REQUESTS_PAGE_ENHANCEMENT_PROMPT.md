# QCTO Requests Page Enhancement - Implementation Prompt

## Overview
The QCTO Requests page (`/qcto/requests`) currently only displays existing requests but lacks the ability to create new requests directly from the page. Users must navigate to individual institution pages to create requests, which is inefficient. This enhancement adds a "Create Request" button and a comprehensive request creation form directly on the requests listing page.

---

## Current State Analysis

### What Works:
- ✅ QCTO Requests listing page displays all requests
- ✅ Search and filter functionality (by status, search query)
- ✅ Pagination and export functionality
- ✅ Request detail pages
- ✅ Request creation from institution detail pages (via specialized forms)

### What's Missing:
- ❌ No "Create Request" button on the requests listing page
- ❌ No unified request creation interface
- ❌ Users must navigate to institution pages to create requests
- ❌ No quick way to create requests without knowing which institution page to visit

---

## Required Enhancements

### Phase 1: Add "Create Request" Button to Requests Page

#### Task 1.1: Add Create Request Button
**File**: `/src/app/qcto/requests/page.tsx`

**Requirements:**
- Add a prominent "Create Request" button in the header area (next to Export buttons)
- Button should open a modal/dialog for request creation
- Use appropriate icon (e.g., `Plus`, `FilePlus`, `RequestQuote`)
- Button should be visible and accessible at all times (not just when empty)

**Design:**
- Place button in the top-right area alongside Export buttons
- Use primary button style to indicate it's a primary action
- Button text: "Create Request" or "New Request"

---

### Phase 2: Create Unified Request Creation Form

#### Task 2.1: Create `CreateQCTORequestForm` Component
**File**: `/src/components/qcto/CreateQCTORequestForm.tsx` (new)

**Requirements:**
- Comprehensive form component for creating any type of QCTO request
- Must support all resource types: FACILITATOR, LEARNER, ENROLMENT, DOCUMENT, READINESS, INSTITUTION
- Must support bulk requests (using "*" for "all")
- Must support profile linking for documents
- Must allow selecting institution from a searchable list

**Form Fields:**
1. **Institution Selection** (Required)
   - Searchable dropdown/autocomplete
   - Shows institution name, registration number, province
   - Filters by QCTO user's accessible institutions (province-based)
   - Must be searchable by name or registration number

2. **Request Title** (Required)
   - Text input
   - Placeholder: "e.g., Request Facilitator Qualifications"

3. **Request Type** (Optional)
   - Dropdown with common types:
     - "FACILITATOR_DATA"
     - "LEARNER_DATA"
     - "ASSESSMENT_DATA"
     - "DOCUMENT_REQUEST"
     - "BULK_DATA"
     - "READINESS_REVIEW"
     - "COMPLIANCE_CHECK"
     - "DATA_EXPORT"
     - Custom (free text)

4. **Description** (Optional)
   - Textarea
   - Placeholder: "Optional description of what data you need..."

5. **Expiry Date** (Optional)
   - Date picker
   - Allows setting request expiration

6. **Resources Section**
   - Dynamic list of resources to request
   - Each resource has:
     - Resource Type (dropdown: FACILITATOR, LEARNER, ENROLMENT, DOCUMENT, READINESS, INSTITUTION)
     - Resource ID (text input, or "All" checkbox for bulk)
     - Notes (optional textarea)
     - For DOCUMENT type: Profile linking options (entity type, entity ID)

7. **Add Resource Button**
   - Allows adding multiple resources to a single request
   - Each resource can be removed individually

**Form Validation:**
- Institution is required
- Title is required
- At least one resource must be specified
- Resource ID is required unless "All" is selected
- Profile linking requires entity ID when enabled

**Submission:**
- Calls `/api/qcto/requests` POST endpoint
- Shows loading state during submission
- Shows success toast and refreshes request list
- Closes modal on success
- Shows error toast on failure

---

### Phase 3: Institution Search/Selection Component

#### Task 3.1: Create QCTO Institution Selector Component
**File**: `/src/components/qcto/QCTOInstitutionSelector.tsx` (new)

**Requirements:**
- Searchable dropdown/combobox for selecting institutions
- Uses `/api/qcto/institutions` endpoint (already exists, supports search)
- Shows institution name and registration number
- Filters results as user types
- Debounced search (wait 300ms after typing stops)
- Loading state while searching
- Empty state when no results
- Displays province in results
- Respects QCTO province filtering automatically (via API)

**Note:** The existing `InstitutionSearch` component uses `/api/platform-admin/institutions/search` which is for platform admins. We need a QCTO-specific version that uses the QCTO endpoint.

---

### Phase 4: Resource Selection Enhancement

#### Task 4.1: Enhance Resource Selection in Form
**Requirements:**
- For each resource type, provide appropriate selection method:
  - **FACILITATOR**: Search facilitators (if institution selected), or use "All"
  - **LEARNER**: Search learners (if institution selected), or use "All"
  - **ENROLMENT**: Search enrolments (if institution selected), or use "All"
  - **DOCUMENT**: Enter document IDs (comma-separated), or use "All"
  - **READINESS**: Search readiness records (if institution selected), or use "All"
  - **INSTITUTION**: Auto-fills with selected institution, or use "All"

- "All" option:
  - Checkbox that sets `resource_id_value` to "*"
  - When checked, disables resource ID input
  - Shows helpful text: "Request all [resource type] for this institution"

- Profile Linking (for DOCUMENT resources):
  - Checkbox: "Link documents to profile"
  - When enabled, shows:
    - Entity Type dropdown (FACILITATOR, LEARNER, READINESS, INSTITUTION)
    - Entity ID input (with search/autocomplete if possible)

---

### Phase 5: Integration & UX Improvements

#### Task 5.1: Integrate Form into Requests Page
**File**: `/src/app/qcto/requests/page.tsx`

**Requirements:**
- Import `CreateQCTORequestForm` component
- Add "Create Request" button that opens the form in a dialog
- After successful creation:
  - Refresh the requests list
  - Show success message
  - Optionally navigate to the new request detail page

#### Task 5.2: Update Empty State
**Requirements:**
- Update empty state message to mention the "Create Request" button
- Remove or update the text that says "Create requests from an institution's page"
- Make it clear users can create requests directly from this page

#### Task 5.3: Add Quick Actions
**Requirements:**
- Consider adding quick action buttons for common request types:
  - "Request Facilitator Data"
  - "Request Learner Data"
  - "Request Documents"
  - "Bulk Data Request"
- These could pre-fill the form with appropriate defaults

---

## Technical Implementation Details

### API Endpoint Usage
The form will use the existing `/api/qcto/requests` POST endpoint:

```typescript
POST /api/qcto/requests
Body: {
  institution_id: string;
  request_type?: string;
  title: string;
  description?: string;
  expires_at?: string;
  resources?: Array<{
    resource_type: "FACILITATOR" | "LEARNER" | "ENROLMENT" | "DOCUMENT" | "INSTITUTION" | "READINESS";
    resource_id_value: string; // or "*" for all
    notes?: string;
    link_to_profile?: {
      entity_type: "FACILITATOR" | "LEARNER" | "READINESS" | "INSTITUTION";
      entity_id: string;
    };
  }>;
}
```

### Component Structure
```
CreateQCTORequestForm (Dialog/Modal)
  ├── InstitutionSelector (Searchable dropdown)
  ├── RequestDetails (Title, Type, Description, Expiry)
  ├── ResourcesList (Dynamic list)
  │   └── ResourceItem (for each resource)
  │       ├── ResourceTypeSelector
  │       ├── ResourceIdInput (or "All" checkbox)
  │       ├── NotesInput
  │       └── ProfileLinkingSection (if DOCUMENT)
  └── FormActions (Cancel, Create Request)
```

### State Management
- Use React state for form fields
- Manage dynamic resource list with array state
- Handle loading states for async operations (institution search, resource search)
- Validate form before submission

---

## User Experience Flow

1. User clicks "Create Request" button on `/qcto/requests` page
2. Modal opens with request creation form
3. User searches and selects an institution
4. User enters request title and optional details
5. User adds one or more resources:
   - Selects resource type
   - Enters resource ID or selects "All"
   - Optionally adds notes
   - For documents: optionally enables profile linking
6. User can add more resources or remove existing ones
7. User clicks "Create Request"
8. Form validates and submits
9. On success: modal closes, list refreshes, success toast shown
10. On error: error toast shown, form remains open

---

## Design Considerations

### Visual Design:
- Modal should be large enough to accommodate the form (max-w-3xl or max-w-4xl)
- Use consistent spacing and typography
- Resource items should be clearly separated (cards or bordered sections)
- "Add Resource" button should be prominent
- Remove buttons should be visible but not too prominent

### Accessibility:
- All form fields should have proper labels
- Error messages should be clear and specific
- Loading states should be indicated
- Keyboard navigation should work throughout the form

### Performance:
- Debounce institution search (300ms)
- Limit search results (e.g., 20 institutions at a time)
- Lazy load resource search results when needed
- Optimize re-renders with proper React patterns

---

## Testing Checklist

- [ ] "Create Request" button appears on requests page
- [ ] Button opens modal with form
- [ ] Institution search works and filters correctly
- [ ] Form validation works (required fields, resource validation)
- [ ] Can add multiple resources
- [ ] Can remove resources
- [ ] "All" option works for bulk requests
- [ ] Profile linking works for document resources
- [ ] Form submission creates request successfully
- [ ] Request list refreshes after creation
- [ ] Success/error toasts appear correctly
- [ ] Modal closes on success
- [ ] Form resets after successful submission
- [ ] Works with province-filtered QCTO users
- [ ] Works with PLATFORM_ADMIN (no province restrictions)

---

## Success Criteria

✅ QCTO users can create requests directly from the requests listing page
✅ Form supports all resource types and request scenarios
✅ Institution selection is intuitive and searchable
✅ Bulk requests and profile linking work correctly
✅ Form validation prevents invalid submissions
✅ User experience is smooth and efficient
✅ No regression in existing request creation from institution pages

---

## Implementation Priority

**High Priority:**
1. Add "Create Request" button
2. Create basic request form (institution, title, single resource)
3. Integrate with existing API

**Medium Priority:**
4. Add multiple resources support
5. Add profile linking for documents
6. Add institution search/autocomplete

**Nice to Have:**
7. Quick action buttons for common request types
8. Resource-specific search/autocomplete
9. Form templates/presets

---

## Notes

- The existing request creation forms (CreateFacilitatorRequestForm, etc.) should continue to work
- This enhancement adds a unified interface but doesn't replace the specialized forms
- Both approaches can coexist - users can choose which method they prefer
- The unified form is more flexible but may be more complex for simple requests
