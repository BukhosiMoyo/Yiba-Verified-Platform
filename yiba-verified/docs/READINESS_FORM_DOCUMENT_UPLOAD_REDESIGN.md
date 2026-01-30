# Readiness Form Document Upload Redesign - Implementation Plan

## Overview
Redesign the readiness form to have section-specific document uploads with smart suggestions, better visual design, and a completion helper sidebar.

## Key Requirements

### 1. Document Upload System

#### A. Section-Specific Document Uploads
- **Remove**: The generic "Supporting Documents" card at the bottom
- **Add**: Document upload sections directly below each form section that requires documents
- Each section should show:
  - Required document types for that section
  - Uploaded documents for that section (if any)
  - Ability to upload new documents
  - Ability to select from existing documents in the vault

#### B. Smart Document Suggestions
- When user clicks to upload, show:
  - **Plus button** to upload new document
  - **Suggested documents** from their document vault that match the section's requirements
  - Documents should be filtered by:
    - Document type relevance
    - Previous uploads for similar readiness records
    - Institution's document vault

#### C. Document Display Design
- **Pill-style cards** for uploaded/selected documents (NOT table-style pills)
- Each document pill should show:
  - Document icon/thumbnail
  - Document name
  - Document type badge
  - View button (opens modal)
  - Remove/unlink button
- Design should be modern, clean, and visually distinct

#### D. Document Naming Suggestions
- When uploading a new document:
  1. Ask user: "Which document is this?" (dropdown/list of required document types for that section)
  2. System suggests a proper filename based on:
     - Document type
     - Section name
     - Qualification title
     - SAQA ID
  3. If user's filename doesn't match suggestion, show: "Do you want to rename this to [suggested name]?"

#### E. Document Viewing
- Click on any document pill → Opens modal/popup
- Modal shows:
  - Document preview (if possible)
  - Document metadata (name, type, size, upload date)
  - Download button
  - Close button

### 2. Visual Design Improvements

#### A. Background Pattern
- **Current**: Dot pattern is on the form card itself
- **New**: Dot pattern should be on the page background, behind:
  - The header/top section
  - The form card
  - The sidebar/helper
- Form card should have:
  - Enhanced drop shadow
  - Better contrast
  - Clean white/light background (no pattern overlay)

#### B. Text Visibility
- Increase text contrast
- Larger font sizes where appropriate
- Better spacing for readability
- Ensure WCAG AA compliance for accessibility

#### C. Form Card Enhancement
- Stronger visual separation from background
- Better shadows and borders
- More prominent appearance

### 3. Helper Sidebar (Replaces Tips)

#### A. Completion Status Display
- Show progress for each step:
  - ✅ Completed sections (green checkmark)
  - ⚠️ Incomplete sections (warning icon)
  - 📄 Document status per section:
    - "Documents uploaded" (if all required docs are uploaded)
    - "Missing documents" (if required docs are missing)
    - "No documents required" (if section doesn't need docs)

#### B. Interactive Navigation
- Click on any incomplete section → Jump directly to that section
- Click on section with missing documents → Jump to that section's document upload area
- Visual indicators:
  - Green = Complete
  - Yellow/Orange = Incomplete
  - Red = Missing required items

#### C. Section Summary
- For each step, show:
  - Step name
  - Completion status
  - Document count (e.g., "3/5 documents uploaded")
  - Quick action buttons

### 4. Document Organization

#### A. Section-Specific Attachment
- Documents uploaded in a section are tagged with:
  - Section name (e.g., "Section 3: Registration & Legal")
  - Document type (e.g., "Registration Proof")
  - Criterion key (if applicable)

#### B. QCTO Review View
- When QCTO reviews, documents are organized by section
- Each section shows its attached documents
- Easy navigation between sections and their documents

### 5. Implementation Details

#### A. Document Upload Component
- Create: `SectionDocumentUpload.tsx`
- Props:
  - `sectionName`: string (e.g., "Registration & Legal")
  - `sectionNumber`: number
  - `requiredDocumentTypes`: string[]
  - `readinessId`: string
  - `institutionId`: string
  - `onDocumentUploaded`: callback
  - `onDocumentRemoved`: callback

#### B. Document Suggestion System
- API endpoint: `/api/institutions/documents/suggestions`
- Parameters:
  - `institutionId`
  - `sectionName`
  - `documentType`
  - `readinessId` (optional, for similar records)
- Returns: Array of suggested documents with relevance score

#### C. Document Naming Service
- Function: `suggestDocumentName(documentType, sectionName, qualificationTitle, saqaId)`
- Returns: Suggested filename string
- Example: "Registration_Proof_SAQA12345_Section3.pdf"

#### D. Helper Sidebar Component
- Create: `ReadinessFormHelper.tsx`
- Replaces: `ReadinessFormSidebar.tsx` (tips)
- Shows:
  - Step-by-step completion status
  - Document upload status per section
  - Quick navigation
  - Overall progress

#### E. Document Modal Component
- Create: `DocumentViewModal.tsx`
- Shows document preview/download
- Clean, modern design

### 6. Required Document Types by Section

Map each section to its required documents:

1. **Qualification** - None (immutable after submission)
2. **Self-Assessment** - Supporting evidence (optional)
3. **Registration & Legal** - Registration Proof, Tax Compliance PIN, Professional Body Registration
4. **Infrastructure** - Proof of Ownership/Lease, Furniture & Equipment Checklist
5. **Learning Materials** - Sample Learning Material (≥50% coverage)
6. **OHS** - Evacuation Plan, OHS Audit Report, OHS Appointment Letter
7. **LMS & Online** - LMS Licence Proof (if Blended/Mobile)
8. **WBL** - WBL Agreement, Logbook Template, Monitoring Schedule
9. **Policies** - Finance Policy, HR Policy, Teaching & Learning Policy, Assessment Policy, Appeals Policy, OHS Policy, Refunds Policy
10. **Facilitators** - CV, Contract/SLA, SAQA Evaluation, Work Permit (per facilitator)

### 7. Design Specifications

#### A. Document Upload Area
- **Layout**: Card with rounded corners, subtle border
- **Upload Button**: Large, prominent, with plus icon
- **Document Pills**: 
  - Rounded pill shape
  - Document icon on left
  - Name in middle
  - Actions (view/remove) on right
  - Hover effects
  - Color coding by status (uploaded, suggested, required)

#### B. Helper Sidebar
- **Width**: 2/6 of screen (as per current layout)
- **Sticky**: Yes, stays visible while scrolling
- **Sections**: Collapsible/expandable
- **Colors**: 
  - Green for complete
  - Yellow/Orange for incomplete
  - Red for missing required
- **Icons**: Clear, recognizable icons for each status

#### C. Background Pattern
- **Position**: `fixed` or `absolute` on page background
- **Z-index**: Behind all content
- **Opacity**: Subtle (20-30%)
- **Pattern**: Dot grid (as currently designed)

### 8. User Flow

1. User fills out form section
2. Scrolls down to document upload area for that section
3. Sees:
   - Required documents list
   - Uploaded documents (if any) as pills
   - "Add Document" button with plus icon
4. Clicks "Add Document" → Modal opens with:
   - Upload new file option
   - Suggested documents from vault
5. User selects/uploads document
6. Document appears as pill in the section
7. Helper sidebar updates to show document status
8. User can click pill to view document
9. User can remove document if needed
10. Process repeats for each section

### 9. Technical Implementation Steps

1. **Create document mapping** - Map each section to required document types
2. **Build SectionDocumentUpload component** - Main upload component
3. **Build DocumentSuggestionService** - API/service for suggestions
4. **Build DocumentNamingService** - Filename suggestion logic
5. **Build DocumentViewModal** - Document preview modal
6. **Build ReadinessFormHelper** - Replacement for tips sidebar
7. **Update ReadinessFormStepContent** - Add document upload areas
8. **Update ReadinessFormFullPage** - Remove bottom documents card, add helper sidebar
9. **Update background styling** - Move pattern to background
10. **Enhance form card styling** - Better shadows, contrast
11. **Test document attachment** - Ensure documents link to correct sections
12. **Test QCTO review view** - Verify documents show by section

### 10. API Endpoints Needed

- `GET /api/institutions/documents/suggestions` - Get suggested documents
- `POST /api/institutions/readiness/[readinessId]/documents` - Upload document (already exists, may need updates)
- `DELETE /api/institutions/readiness/[readinessId]/documents/[documentId]` - Remove document link
- `GET /api/institutions/readiness/[readinessId]/documents/[documentId]` - Get document details
- `GET /api/institutions/readiness/[readinessId]/completion` - Get completion status (for helper)

### 11. Database Considerations

- Ensure `document` table has:
  - `section_name` field (or similar)
  - `criterion_key` field (for specific criteria)
  - `document_type` field (for categorization)
  - `related_entity` = "READINESS"
  - `related_entity_id` = readiness_id

### 12. Success Criteria

- ✅ Documents are section-specific, not generic
- ✅ Smart suggestions work correctly
- ✅ Document pills look modern and clean
- ✅ Helper sidebar shows accurate completion status
- ✅ Background pattern is behind content, not on form
- ✅ Form card has better visibility
- ✅ Text is more readable
- ✅ Document naming suggestions work
- ✅ Document viewing modal works
- ✅ QCTO can see documents organized by section
- ✅ User can navigate quickly to incomplete sections
- ✅ Overall UX is smooth and intuitive

## Implementation Priority

1. **Phase 1**: Move background pattern, enhance form card, improve text visibility
2. **Phase 2**: Create section-specific document upload components
3. **Phase 3**: Build document suggestion system
4. **Phase 4**: Build helper sidebar with completion status
5. **Phase 5**: Add document naming suggestions
6. **Phase 6**: Polish and test
