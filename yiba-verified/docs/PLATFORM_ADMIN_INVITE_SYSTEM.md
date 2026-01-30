# Platform Admin Advanced Invite System

## Overview
The Platform Admin can invite users with any role in the system. The invite form is role-first, meaning the form starts with role selection and dynamically shows different fields based on the selected role.

## User Roles and Invite Requirements

### 1. PLATFORM_ADMIN
- **Fields Required**: Email only
- **Additional Info**: Simple invite - just role and email
- **No additional linking required**

### 2. QCTO_SUPER_ADMIN
- **Fields Required**: Email only
- **Additional Info**: Simple invite - just role and email
- **No province assignment needed** (has access to all provinces)

### 3. QCTO_ADMIN
- **Fields Required**: Email + Province (default_province)
- **Additional Info**: Must link to a specific province
- **Province Selection**: Required - sets the user's default_province and assigned_provinces

### 4. QCTO_USER
- **Fields Required**: Email + Province (default_province)
- **Additional Info**: Must link to a specific province
- **Province Selection**: Required - sets the user's default_province and assigned_provinces

### 5. QCTO_REVIEWER
- **Fields Required**: Email + Province (default_province)
- **Additional Info**: Must link to a specific province
- **Province Selection**: Required - sets the user's default_province and assigned_provinces

### 6. QCTO_AUDITOR
- **Fields Required**: Email + Province (default_province)
- **Additional Info**: Must link to a specific province
- **Province Selection**: Required - sets the user's default_province and assigned_provinces

### 7. QCTO_VIEWER
- **Fields Required**: Email + Province (default_province)
- **Additional Info**: Must link to a specific province
- **Province Selection**: Required - sets the user's default_province and assigned_provinces

### 8. INSTITUTION_ADMIN
- **Fields Required**: Email + Institution
- **Additional Info**: Must link to a specific institution
- **Institution Selection**: 
  - Uses live search (not dropdown) because there are many institutions
  - Search should show institution name and indicate who the current admin is (if any)
  - Displays: Institution name, registration number, current admin name/email (if exists)

### 9. INSTITUTION_STAFF
- **Fields Required**: Email + Institution
- **Additional Info**: Must link to a specific institution
- **Institution Selection**: 
  - Uses live search (not dropdown) because there are many institutions
  - Search by institution name or registration number

### 10. STUDENT
- **Fields Required**: Email + Institution
- **Additional Info**: Must link to a specific institution
- **Institution Selection**: 
  - Uses live search (not dropdown) because there are many institutions
  - Search by institution name or registration number

## Form Flow

1. **Step 1: Select Role**
   - User selects role from dropdown
   - All roles are available: PLATFORM_ADMIN, QCTO_SUPER_ADMIN, QCTO_ADMIN, QCTO_USER, QCTO_REVIEWER, QCTO_AUDITOR, QCTO_VIEWER, INSTITUTION_ADMIN, INSTITUTION_STAFF, STUDENT

2. **Step 2: Dynamic Fields Based on Role**
   - **Simple Roles** (PLATFORM_ADMIN, QCTO_SUPER_ADMIN): Show email field only
   - **QCTO Roles with Province** (QCTO_ADMIN, QCTO_USER, QCTO_REVIEWER, QCTO_AUDITOR, QCTO_VIEWER): Show email + province selector
   - **Institution Roles** (INSTITUTION_ADMIN, INSTITUTION_STAFF, STUDENT): Show email + institution live search

3. **Step 3: Submit**
   - Validate all required fields
   - Create invite with appropriate linking (institution_id or province)
   - Send invite email

## Technical Implementation Details

### Database Schema
- `Invite` model needs to store `default_province` field for QCTO roles
- `Invite` model already has `institution_id` for institution roles

### API Endpoints
- `POST /api/invites` - Enhanced to accept `default_province` for QCTO roles
- `GET /api/platform-admin/institutions/search?q=...` - New endpoint for institution live search (returns institution with current admin info)

### UI Components
- Role selector dropdown (all roles)
- Province selector (for QCTO roles) - uses PROVINCES constant
- Institution live search component (for institution roles) - searchable, shows admin info for INSTITUTION_ADMIN role

### Validation Rules
- Email: Required, valid format, unique
- Role: Required, must be valid UserRole
- Province: Required for QCTO_USER, QCTO_REVIEWER, QCTO_AUDITOR, QCTO_VIEWER
- Institution: Required for INSTITUTION_ADMIN, INSTITUTION_STAFF, STUDENT

## User Experience

### For Simple Roles
- Quick invite: Just select role, enter email, send

### For QCTO Roles with Province
- Select role → Select province → Enter email → Send

### For Institution Roles
- Select role → Search and select institution (with live search) → Enter email → Send
- For INSTITUTION_ADMIN: Shows current admin info when searching institutions

## Notes
- All QCTO roles except QCTO_SUPER_ADMIN require province assignment (QCTO_ADMIN, QCTO_USER, QCTO_REVIEWER, QCTO_AUDITOR, QCTO_VIEWER all need provinces)
- Institution search must be live/searchable because there are many institutions
- When inviting INSTITUTION_ADMIN, the search should show if there's already an admin for that institution
