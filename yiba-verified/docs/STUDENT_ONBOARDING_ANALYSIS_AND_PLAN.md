# Student Onboarding Analysis & Implementation Plan

## Executive Summary

This document provides a comprehensive analysis of the current Student onboarding state and a detailed implementation plan for a guided, step-by-step onboarding wizard that ensures all required information is collected before students can access the full dashboard.

---

## 1. Current State Analysis

### 1.1 User Creation Flow

**How Students Are Created:**
- Students are **invited by institutions** via the `/api/invites` endpoint
- Invite contains: `email`, `role` (STUDENT), `institution_id`
- Student accepts invite at `/invite?token=...`
- During acceptance (`/api/invites/accept`):
  - User account is created with: `first_name`, `last_name`, `email`, `password_hash`, `role`, `institution_id`
  - **No Learner record is created** (commented out in code: "This depends on your domain logic - for now we'll skip it as it requires more data")
  - User is immediately redirected to `/student` dashboard after sign-in

**Current Gap:**
- No onboarding flow exists
- Students land directly on dashboard with sidebar navigation
- Learner record is never created automatically
- Required profile data is never collected

### 1.2 Data Models

#### User Model (from schema.prisma)
```prisma
model User {
  user_id        String    @id @default(uuid())
  institution_id String?
  role           UserRole  // STUDENT
  first_name     String
  last_name      String
  email          String    @unique
  phone          String?   // Optional, not required
  password_hash  String?
  status         String    @default("ACTIVE")
  // ... other fields
  learner        Learner?  @relation("StudentLearner")
}
```

#### Learner Model (from schema.prisma)
```prisma
model Learner {
  learner_id         String      @id @default(uuid())
  institution_id     String      // Required
  user_id            String?     @unique // Links to User
  national_id        String      @unique // Required - this is ID number
  alternate_id       String?
  first_name         String      // Required
  last_name          String      // Required
  birth_date         DateTime    // Required - this is date of birth
  gender_code        String      // Required
  nationality_code   String      // Required
  home_language_code String?
  disability_status  String?     // Optional but should be collected
  popia_consent      Boolean     // Required
  consent_date       DateTime    // Required
  // ... relations
}
```

**Key Observations:**
- Learner model has many required fields that are NOT collected during invite acceptance
- User and Learner are separate entities (one-to-one relationship)
- Learner record must be created separately after User creation

### 1.3 Current Student Experience

**First Login Flow:**
1. Student accepts invite → creates User account
2. Auto sign-in → redirects to `/student`
3. Student sees full dashboard with:
   - Greeting banner
   - Metric cards
   - Profile & CV section
   - Enrolments table (currently showing mock data)
   - Recent updates timeline
4. Sidebar navigation is fully visible
5. No guidance or onboarding

**Current Student Pages:**
- `/student` - Dashboard (main landing)
- `/student/profile` - Profile & CV (uses mock data)
- `/student/enrolments` - Enrolments list
- `/student/attendance` - Attendance view
- `/student/certificates` - Certificates (placeholder)

**Current Profile Data:**
- StudentProfileClient uses **mock data** (not real API)
- No connection to Learner model
- Profile fields are editable but not persisted
- No validation of required fields

### 1.4 Existing Onboarding Elements

**WelcomeModal Component:**
- Shows a simple "Welcome to Yiba Verified" dialog
- Appears once per session (up to 5 times lifetime)
- Only offers a "tour" (not implemented) or "skip"
- **Not related to data collection**
- Appears 900ms after login (after announcement modal)

**No Data Collection Onboarding:**
- No wizard exists
- No step-by-step flow
- No validation of required fields
- No blocking mechanism for incomplete profiles

---

## 2. Required vs Optional Fields

### 2.1 REQUIRED Fields (Must Complete Before Dashboard Access)

Based on the requirements and the Learner model schema, these fields are **mandatory**:

1. **ID Number** (`national_id` in Learner)
   - Must be unique
   - Must be collected and validated

2. **Date of Birth** (`birth_date` in Learner)
   - DateTime field
   - Used for age verification and compliance

3. **Phone Number** (`phone` in User)
   - Currently optional in schema, but required per requirements
   - Should be added to User model or collected separately

4. **Address** (NOT in current schema)
   - Physical address required per requirements
   - **Schema extension needed**: Add `address` field to Learner or User

5. **Province** (NOT in current schema)
   - Required per requirements
   - **Schema extension needed**: Add `province` field to Learner
   - Can reuse `PROVINCES` constant from `/lib/provinces`

6. **Next of Kin** (NOT in current schema)
   - Required per requirements
   - **Schema extension needed**: Create `NextOfKin` model or add fields to Learner
   - Should include: name, relationship, phone, address

7. **Disability Status** (`disability_status` in Learner)
   - Currently optional in schema, but required per requirements
   - Should be a required field with options (Yes/No/Prefer not to say)

8. **Ethnicity** (NOT in current schema)
   - Required per requirements (e.g., Black, Coloured, Indian, White, etc.)
   - **Schema extension needed**: Add `ethnicity` field to Learner

**Additional Required Fields from Learner Model:**
- `gender_code` - Required in schema
- `nationality_code` - Required in schema
- `popia_consent` - Required (consent checkbox)
- `consent_date` - Required (auto-set when consent given)

### 2.2 OPTIONAL Fields (Can Skip for Now, Add Later)

These should be available in the wizard but allow "Skip for now":

1. **Past Degrees**
   - Not in current schema
   - Should be stored in a `PastQualification` model or similar
   - Allow multiple entries
   - "Add more" functionality

2. **Past Certificates**
   - Similar to degrees
   - Could be part of qualifications or separate

3. **Prior Learning**
   - Work experience before current institution
   - Could link to existing workplace evidence system

4. **Experience History**
   - Past employment/workplace evidence
   - Should integrate with existing workplace evidence system

**Note:** These optional sections should remain accessible later in the profile/CV area.

---

## 3. Schema Changes Required

### 3.1 Learner Model Extensions

```prisma
model Learner {
  // ... existing fields ...
  
  // NEW REQUIRED FIELDS
  address            String?     // Physical address
  province           String?     // Province (from PROVINCES constant)
  ethnicity          String?     // Ethnicity (Black, Coloured, Indian, White, etc.)
  disability_status String      // Change from optional to required
  
  // Next of Kin (could be separate model or embedded)
  next_of_kin_name       String?
  next_of_kin_relationship String?
  next_of_kin_phone      String?
  next_of_kin_address    String?
  
  // Onboarding tracking
  onboarding_completed   Boolean  @default(false)
  onboarding_completed_at DateTime?
}
```

### 3.2 User Model Extensions

```prisma
model User {
  // ... existing fields ...
  
  // Make phone required (or keep optional but validate in onboarding)
  phone String? // Keep optional in schema, validate in onboarding
  
  // Onboarding tracking
  onboarding_completed   Boolean  @default(false)
  onboarding_completed_at DateTime?
}
```

### 3.3 New Models for Optional Data

```prisma
// Past qualifications (degrees, certificates)
model PastQualification {
  id              String   @id @default(uuid())
  learner_id      String
  title           String
  institution     String?
  year_completed  Int?
  document_id     String?  // Link to Document if certificate uploaded
  created_at      DateTime @default(now())
  
  learner         Learner  @relation(fields: [learner_id], references: [learner_id])
  document        Document? @relation(fields: [document_id], references: [document_id])
  
  @@index([learner_id])
}

// Prior learning/experience
model PriorLearning {
  id              String   @id @default(uuid())
  learner_id      String
  title           String   // e.g., "Workplace Experience", "Informal Training"
  description     String?
  institution     String?  // Workplace or training provider
  start_date      DateTime?
  end_date        DateTime?
  created_at      DateTime @default(now())
  
  learner         Learner  @relation(fields: [learner_id], references: [learner_id])
  
  @@index([learner_id])
}
```

---

## 4. Onboarding Wizard Design

### 4.1 Wizard Structure

**Full-Page Wizard (No Sidebar)**
- Replaces entire layout when active
- No navigation sidebar
- No topbar (or minimal topbar with "Exit" option)
- Progress indicator (steps or progress bar)
- Step-by-step navigation (Next/Back buttons)
- Autosave after each step
- Resumable if user leaves

### 4.2 Wizard Steps

#### Step 1: Welcome & Introduction
- **Purpose:** Explain what's happening
- **Content:**
  - Welcome message
  - Brief explanation of Yiba Verified
  - What information will be collected
  - Why it's needed (compliance, verification)
- **Actions:** "Get Started" button
- **Skip:** No

#### Step 2: Personal Information (REQUIRED)
- **Fields:**
  - ID Number (national_id) - text input, validation
  - Date of Birth (birth_date) - date picker
  - Phone Number (phone) - text input, validation
  - Gender (gender_code) - dropdown/radio
  - Nationality (nationality_code) - dropdown
  - Home Language (home_language_code) - dropdown (optional)
- **Prefill:** Use data from User if available (name, email)
- **Validation:** All fields required except home_language_code
- **Autosave:** Yes
- **Skip:** No

#### Step 3: Address & Location (REQUIRED)
- **Fields:**
  - Physical Address (address) - textarea
  - Province (province) - dropdown (from PROVINCES)
- **Validation:** Both required
- **Autosave:** Yes
- **Skip:** No

#### Step 4: Next of Kin (REQUIRED)
- **Fields:**
  - Full Name (next_of_kin_name) - text input
  - Relationship (next_of_kin_relationship) - dropdown (Parent, Spouse, Sibling, Other)
  - Phone Number (next_of_kin_phone) - text input
  - Address (next_of_kin_address) - textarea (optional)
- **Validation:** Name, relationship, phone required
- **Autosave:** Yes
- **Skip:** No

#### Step 5: Additional Information (REQUIRED)
- **Fields:**
  - Disability Status (disability_status) - radio (Yes/No/Prefer not to say)
  - Ethnicity (ethnicity) - dropdown (Black, Coloured, Indian, White, Other)
- **Validation:** Both required
- **Autosave:** Yes
- **Skip:** No

#### Step 6: POPIA Consent (REQUIRED)
- **Content:**
  - POPIA consent text/explanation
  - Checkbox: "I consent to the processing of my personal information"
- **Validation:** Must be checked
- **Autosave:** Yes (sets consent_date)
- **Skip:** No

#### Step 7: Past Qualifications (OPTIONAL)
- **Purpose:** Collect past degrees/certificates
- **Fields per item:**
  - Qualification Title
  - Institution
  - Year Completed
  - Upload Certificate (optional)
- **Actions:**
  - "Add Qualification" button
  - "Skip for now" button
- **Behavior:**
  - If skipped, can add later in profile
  - If items added, show list with "Add more" option
- **Autosave:** Yes (saves each item as added)

#### Step 8: Prior Learning & Experience (OPTIONAL)
- **Purpose:** Collect work experience/prior learning
- **Fields per item:**
  - Title/Role
  - Institution/Workplace
  - Description
  - Start Date
  - End Date (or "Present")
- **Actions:**
  - "Add Experience" button
  - "Skip for now" button
- **Behavior:**
  - If skipped, can add later in profile
  - If items added, show list with "Add more" option
- **Autosave:** Yes (saves each item as added)

#### Step 9: Review & Complete
- **Purpose:** Review all entered information
- **Content:**
  - Summary of all required fields
  - Summary of optional fields (if any added)
  - "Edit" links to go back to specific steps
- **Actions:**
  - "Complete Onboarding" button (creates Learner record, marks onboarding complete)
  - "Go Back" to edit
- **Validation:** All required fields must be complete

### 4.3 Wizard Behavior Rules

1. **Trigger Conditions:**
   - On first login (if `onboarding_completed === false`)
   - If critical required information is missing later (re-trigger)
   - If Learner record doesn't exist

2. **Blocking:**
   - Full dashboard access blocked until onboarding complete
   - Sidebar hidden during onboarding
   - Can only access onboarding wizard
   - "Exit" option should warn about incomplete profile

3. **Autosave:**
   - Save progress after each step
   - Store in temporary table or User/Learner draft fields
   - Resume from last completed step if user returns

4. **Resumability:**
   - If user closes browser/leaves, return to last completed step
   - Show progress indicator showing which steps are done
   - Allow jumping back to completed steps to edit

5. **Validation:**
   - Client-side validation on each step
   - Server-side validation on submit
   - Clear error messages
   - Highlight invalid fields

6. **Accessibility:**
   - Simple, clear language
   - Large, readable text
   - Obvious next/back buttons
   - Progress indicator always visible
   - Help text for each field

---

## 5. Implementation Plan

### Phase 1: Schema & Database Changes

**Tasks:**
1. Create migration to extend Learner model:
   - Add `address`, `province`, `ethnicity` fields
   - Change `disability_status` to required (non-nullable)
   - Add next of kin fields
   - Add `onboarding_completed` and `onboarding_completed_at` fields

2. Create migration to extend User model:
   - Add `onboarding_completed` and `onboarding_completed_at` fields
   - (Keep `phone` optional in schema, validate in application)

3. Create new models:
   - `PastQualification` model
   - `PriorLearning` model

4. Update Prisma schema and generate client

**Files to Modify:**
- `prisma/schema.prisma`
- Create new migration file

**Estimated Time:** 2-3 hours

---

### Phase 2: API Endpoints

**Tasks:**
1. Create `/api/student/onboarding/status` (GET)
   - Returns onboarding completion status
   - Returns current step if in progress
   - Returns saved data if resuming

2. Create `/api/student/onboarding/save` (POST)
   - Saves progress for a specific step
   - Validates step data
   - Stores in draft state (temporary fields or separate table)

3. Create `/api/student/onboarding/complete` (POST)
   - Validates all required fields
   - Creates Learner record
   - Links User to Learner
   - Marks onboarding as complete
   - Returns success/error

4. Create `/api/student/onboarding/resume` (GET)
   - Returns saved progress for resuming

5. Update `/api/invites/accept` (POST)
   - Set `onboarding_completed = false` for new STUDENT users

**Files to Create:**
- `src/app/api/student/onboarding/status/route.ts`
- `src/app/api/student/onboarding/save/route.ts`
- `src/app/api/student/onboarding/complete/route.ts`
- `src/app/api/student/onboarding/resume/route.ts`

**Files to Modify:**
- `src/app/api/invites/accept/route.ts`

**Estimated Time:** 4-6 hours

---

### Phase 3: Onboarding Wizard Component

**Tasks:**
1. Create main wizard component (`StudentOnboardingWizard.tsx`)
   - Full-page layout (no sidebar)
   - Progress indicator
   - Step navigation
   - Autosave logic
   - Form validation

2. Create individual step components:
   - `WelcomeStep.tsx`
   - `PersonalInfoStep.tsx`
   - `AddressStep.tsx`
   - `NextOfKinStep.tsx`
   - `AdditionalInfoStep.tsx`
   - `POPIAConsentStep.tsx`
   - `PastQualificationsStep.tsx`
   - `PriorLearningStep.tsx`
   - `ReviewStep.tsx`

3. Create shared components:
   - `OnboardingProgressBar.tsx`
   - `OnboardingStepWrapper.tsx`
   - `OnboardingNavigation.tsx` (Next/Back buttons)

**Files to Create:**
- `src/components/student/onboarding/StudentOnboardingWizard.tsx`
- `src/components/student/onboarding/steps/WelcomeStep.tsx`
- `src/components/student/onboarding/steps/PersonalInfoStep.tsx`
- `src/components/student/onboarding/steps/AddressStep.tsx`
- `src/components/student/onboarding/steps/NextOfKinStep.tsx`
- `src/components/student/onboarding/steps/AdditionalInfoStep.tsx`
- `src/components/student/onboarding/steps/POPIAConsentStep.tsx`
- `src/components/student/onboarding/steps/PastQualificationsStep.tsx`
- `src/components/student/onboarding/steps/PriorLearningStep.tsx`
- `src/components/student/onboarding/steps/ReviewStep.tsx`
- `src/components/student/onboarding/OnboardingProgressBar.tsx`
- `src/components/student/onboarding/OnboardingStepWrapper.tsx`
- `src/components/student/onboarding/OnboardingNavigation.tsx`

**Estimated Time:** 12-16 hours

---

### Phase 4: Integration & Routing

**Tasks:**
1. Create onboarding page route (`/student/onboarding`)
   - Server component that checks onboarding status
   - Renders wizard if incomplete
   - Redirects to dashboard if complete

2. Update student layout (`/student/layout.tsx`)
   - Check onboarding status
   - Redirect to `/student/onboarding` if incomplete
   - Hide sidebar during onboarding (or render wizard without AppShell)

3. Update middleware (if needed)
   - Allow access to `/student/onboarding` even if onboarding incomplete

4. Update invite acceptance redirect
   - After sign-in, redirect to `/student/onboarding` instead of `/student`

**Files to Create:**
- `src/app/student/onboarding/page.tsx`

**Files to Modify:**
- `src/app/student/layout.tsx`
- `src/app/invite/page.tsx` (redirect logic)
- `src/middleware.ts` (if needed)

**Estimated Time:** 3-4 hours

---

### Phase 5: Validation & Error Handling

**Tasks:**
1. Implement client-side validation for each step
2. Implement server-side validation in API endpoints
3. Add clear error messages
4. Add field-level validation feedback
5. Test edge cases (network errors, validation failures, etc.)

**Files to Modify:**
- All step components
- All API route handlers

**Estimated Time:** 4-6 hours

---

### Phase 6: Optional Features Enhancement

**Tasks:**
1. Implement "Add more" functionality for past qualifications
2. Implement "Add more" functionality for prior learning
3. Add file upload for certificates
4. Integrate with existing Document model for uploads

**Files to Modify:**
- `PastQualificationsStep.tsx`
- `PriorLearningStep.tsx`
- API endpoints for file uploads

**Estimated Time:** 4-6 hours

---

### Phase 7: Testing & Refinement

**Tasks:**
1. Test complete onboarding flow
2. Test resume functionality
3. Test validation edge cases
4. Test with different user scenarios
5. Accessibility testing
6. Mobile responsiveness testing
7. Performance testing (autosave frequency)

**Estimated Time:** 6-8 hours

---

## 6. Technical Considerations

### 6.1 Data Storage Strategy

**Option A: Draft Fields in User/Learner**
- Store incomplete data directly in User/Learner models
- Pros: Simple, no extra tables
- Cons: Pollutes main models with incomplete data

**Option B: Separate OnboardingProgress Table**
- Store progress in dedicated table
- Pros: Clean separation, easy to query
- Cons: Extra table, need to migrate data on completion

**Recommendation:** Option B (separate table) for cleaner architecture

```prisma
model OnboardingProgress {
  id                    String   @id @default(uuid())
  user_id               String   @unique
  current_step          Int      @default(1)
  personal_info         Json?    // Store step data as JSON
  address_info          Json?
  next_of_kin_info      Json?
  additional_info       Json?
  popia_consent         Boolean? @default(false)
  past_qualifications   Json?    // Array of qualification objects
  prior_learning         Json?    // Array of learning objects
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
  
  user                  User     @relation(fields: [user_id], references: [user_id])
}
```

### 6.2 Autosave Strategy

- **Frequency:** Save on step completion (when "Next" clicked)
- **Debouncing:** Not needed for step-based saves
- **Error Handling:** Show toast on save failure, allow retry
- **Offline:** Store in localStorage as backup, sync when online

### 6.3 Validation Strategy

- **Client-side:** Immediate feedback on field blur/change
- **Server-side:** Validate on save and on complete
- **ID Number Validation:** Check format (South African ID format)
- **Phone Validation:** Check format (South African phone format)
- **Date Validation:** Ensure birth_date is in the past, reasonable age

### 6.4 Security Considerations

- **ID Number:** Encrypt at rest (sensitive PII)
- **Next of Kin Data:** Encrypt at rest
- **Access Control:** Only user can access their own onboarding data
- **Rate Limiting:** Prevent abuse of save endpoints

---

## 7. User Experience Flow

### 7.1 First-Time User Journey

1. **Invite Email** → Click link
2. **Accept Invite** → Enter name, password
3. **Auto Sign-In** → Redirect to `/student/onboarding`
4. **Welcome Step** → Read introduction, click "Get Started"
5. **Step 2-6** → Complete required information (autosave after each)
6. **Step 7-8** → Add optional information or skip
7. **Review Step** → Review all information, edit if needed
8. **Complete** → Create Learner record, mark onboarding complete
9. **Redirect** → `/student` dashboard (full access)

### 7.2 Returning User (Incomplete Onboarding)

1. **Login** → Redirect to `/student/onboarding`
2. **Resume** → Show progress, start from last incomplete step
3. **Complete** → Finish remaining steps
4. **Redirect** → `/student` dashboard

### 7.3 Returning User (Complete Onboarding)

1. **Login** → Redirect to `/student` dashboard
2. **Normal Access** → Full dashboard, all features available

---

## 8. Success Criteria

✅ **Required:**
- All required fields collected before dashboard access
- Wizard is full-page (no sidebar distraction)
- Progress is saved and resumable
- Clear, simple language throughout
- Validation prevents invalid data
- Autosave works reliably

✅ **Nice to Have:**
- Optional fields can be added later
- Smooth animations between steps
- Helpful tooltips/explanations
- Mobile-responsive design
- Accessibility compliance (WCAG 2.1 AA)

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Users abandon onboarding | High | Clear progress indicator, autosave, resumable |
| Data validation failures | Medium | Comprehensive client + server validation |
| Performance issues with autosave | Low | Debounce, optimize API calls |
| Schema migration issues | Medium | Test migrations thoroughly, backup data |
| Incomplete data in production | High | Strict validation, cannot skip required steps |

---

## 10. Future Enhancements (Post-MVP)

1. **Institution Pre-fill:** If institution has some student data, pre-fill fields
2. **Bulk Import:** Allow institutions to import student data
3. **Onboarding Analytics:** Track completion rates, drop-off points
4. **Multi-language Support:** Support multiple languages for low-literacy users
5. **Video Tutorials:** Add video explanations for complex steps
6. **Progress Emails:** Send reminder emails if onboarding incomplete

---

## 11. Implementation Checklist

### Pre-Implementation
- [ ] Review and approve this plan
- [ ] Confirm schema changes with team
- [ ] Set up development environment
- [ ] Create feature branch

### Phase 1: Schema
- [ ] Update Prisma schema
- [ ] Create migration
- [ ] Test migration on dev database
- [ ] Generate Prisma client

### Phase 2: API
- [ ] Create onboarding status endpoint
- [ ] Create save endpoint
- [ ] Create complete endpoint
- [ ] Create resume endpoint
- [ ] Update invite acceptance
- [ ] Test all endpoints

### Phase 3: Components
- [ ] Create wizard component
- [ ] Create all step components
- [ ] Create shared components
- [ ] Implement autosave
- [ ] Implement validation

### Phase 4: Integration
- [ ] Create onboarding page
- [ ] Update student layout
- [ ] Update routing logic
- [ ] Test redirects

### Phase 5: Polish
- [ ] Add error handling
- [ ] Add loading states
- [ ] Add success messages
- [ ] Test edge cases

### Phase 6: Testing
- [ ] Test complete flow
- [ ] Test resume functionality
- [ ] Test validation
- [ ] Test mobile responsiveness
- [ ] Test accessibility

### Post-Implementation
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Fix bugs
- [ ] Deploy to production
- [ ] Monitor completion rates

---

## 12. Estimated Total Time

**Conservative Estimate:** 35-45 hours
**Optimistic Estimate:** 25-35 hours

**Breakdown:**
- Schema & Database: 2-3 hours
- API Endpoints: 4-6 hours
- Wizard Components: 12-16 hours
- Integration & Routing: 3-4 hours
- Validation & Error Handling: 4-6 hours
- Optional Features: 4-6 hours
- Testing & Refinement: 6-8 hours

---

## Conclusion

This plan provides a comprehensive roadmap for implementing a guided, step-by-step onboarding wizard for students. The implementation is designed to:

1. **Collect all required information** before dashboard access
2. **Provide a simple, guided experience** suitable for users with varying digital literacy
3. **Respect existing architecture** and extend it carefully
4. **Ensure data quality** through validation
5. **Support resumability** and autosave

The phased approach allows for incremental development and testing, reducing risk and ensuring quality at each stage.
