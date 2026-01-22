# Production Seed Script - Complete Guide

## Overview

This document describes the production seed script (`prisma/seed.production.ts`) that creates comprehensive, realistic production-like data for testing and finalizing fixes before going to production.

## ⚠️ WARNING

**This script will DELETE ALL existing data in the database!** Use only in development/staging environments.

## What It Does

The production seed script:

1. **Deletes ALL existing data** from the database (in correct dependency order)
2. **Creates comprehensive realistic data** including:
   - QCTO Organization
   - 15 Qualifications
   - 3 Platform Administrators
   - 4 QCTO Users (Super Admin, Reviewer, Auditor, Viewer)
   - 15 Institutions (with realistic South African names and addresses)
   - Institution Admins and Staff (1-3 staff per institution)
   - 25-50 Learners per institution (375-750 total learners)
   - Student Users (70% of learners have user accounts)
   - Enrolments (1-2 per learner)
   - Readiness Records (3-8 per institution)
   - Submissions (5-15 per institution)
   - Attendance Records (for active enrolments)
   - Invites (3-8 per institution)
   - Audit Logs (500-1000 records)

## Key Features

### Realistic Data
- **All emails use @gmail.com** domain
- **Realistic South African phone numbers** (+27 format)
- **All new fields populated** with realistic data:
  - Learner fields: disability_status, address, province, ethnicity, next_of_kin details
  - Readiness fields: all sections populated based on status
  - Institution fields: contact details, addresses, delivery modes
  - Enrolment fields: attendance_percentage, assessment_centre_code, etc.

### Complete Coverage
- Data across all entities in the system
- Realistic relationships between entities
- Various statuses and states (ACTIVE, COMPLETED, DRAFT, APPROVED, etc.)
- Historical data (dates spread over past 2 years)

### South African Context
- South African names (first names and surnames)
- South African ID numbers (format: YYMMDDSSSSCAZ)
- South African provinces
- South African cities
- Realistic addresses

## How to Run

### Option 1: Using npm script (Recommended)

```bash
npm run seed:production
```

### Option 2: Direct execution

```bash
PRODUCTION_MODE=true npm run seed
```

### Option 3: Using tsx directly

```bash
PRODUCTION_MODE=true tsx prisma/seed.production.ts
```

## Login Credentials

**All users use the same password:** `Password123!`

The script will output a summary of created users with their email addresses, organized by role:
- Platform Admins
- QCTO Users (with roles)
- Institution Admins (sample)
- Institution Staff (sample)
- Students (sample)

## Data Structure

### Institutions
- 15 institutions with realistic South African names
- Mix of statuses: 12 APPROVED, 2 DRAFT, 1 SUSPENDED
- All provinces represented
- Various institution types (TVET, PRIVATE_SDP, NGO, UNIVERSITY, OTHER)
- Multiple delivery modes per institution

### Users
- **Platform Admins**: 3 users with @gmail.com emails
- **QCTO Users**: 4 users (Super Admin, Reviewer, Auditor, Viewer)
- **Institution Admins**: 1 per institution (15 total)
- **Institution Staff**: 1-3 per institution (15-45 total)
- **Students**: ~70% of learners have user accounts (~260-525 students)

### Learners
- 25-50 learners per institution
- All new fields populated:
  - `disability_status`: YES, NO, or PREFER_NOT_TO_SAY
  - `address`: Full street address
  - `province`: One of 9 South African provinces
  - `ethnicity`: BLACK, COLOURED, INDIAN, WHITE, OTHER
  - `next_of_kin_name`: Realistic name
  - `next_of_kin_relationship`: PARENT, SPOUSE, SIBLING, GUARDIAN, OTHER
  - `next_of_kin_phone`: Realistic phone number
  - `next_of_kin_address`: Full address
  - `public_profile_enabled`: 30% have public profiles enabled
  - `public_profile_id`: Generated for enabled profiles

### Enrolments
- 1-2 enrolments per learner
- Various statuses: 70% ACTIVE, 15% COMPLETED, 10% TRANSFERRED, 5% ARCHIVED
- Attendance percentages calculated for active/completed enrolments
- Assessment centre codes assigned
- Readiness and FLC statuses set

### Readiness Records
- 3-8 per institution (45-120 total)
- Various statuses: NOT_STARTED, IN_PROGRESS, SUBMITTED, UNDER_REVIEW, etc.
- All sections populated based on status:
  - Self-assessment
  - Registration & Legal Compliance
  - Infrastructure & Physical Resources
  - Learning Material Alignment
  - OHS (Occupational Health & Safety)
  - LMS & Online Delivery Capability
  - Workplace-Based Learning (WBL)
  - Policies & Procedures
  - Human Resources

### Submissions
- 5-15 per institution (75-225 total)
- Various types: READINESS, ACCREDITATION, LEARNER_EVIDENCE, COMPLIANCE_PACK, ANNUAL_REPORT
- Various statuses: DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, RETURNED_FOR_CORRECTION
- Linked resources (readiness, learners, enrolments)

### Attendance Records
- Created for 20 active enrolments
- 5-15 records per enrolment
- Various statuses: PRESENT, LATE, EXCUSED, ABSENT
- Attendance percentages automatically recomputed

### Other Data
- **Invites**: 3-8 per institution with various statuses
- **Audit Logs**: 500-1000 records tracking changes across entities
- **Qualifications**: 15 occupational certificates

## Email Format

All user emails follow these patterns:
- **Platform Admins**: `{firstname}.{lastname}@gmail.com`
- **QCTO Users**: `qcto.{role}{number}@gmail.com`
- **Institution Admins**: `admin.{institutionname}{number}@gmail.com`
- **Institution Staff**: `staff{number}.{institutionname}{number}@gmail.com`
- **Students**: `{firstname}.{lastname}{number}@gmail.com`

## Phone Number Format

All phone numbers follow South African format:
- Format: `+27{prefix}{middle}{last}`
- Prefixes: 60-89, 71-79, 81-84
- Example: `+27601234567`

## Notes

1. **Data will be deleted**: This script deletes ALL existing data before creating new data
2. **Deterministic but varied**: Uses random generation for realistic variety
3. **Complete relationships**: All foreign keys and relationships are properly maintained
4. **Realistic dates**: Dates spread over past 2 years for historical context
5. **Status variety**: Entities have various statuses to test different states

## Troubleshooting

### If the script fails:
1. Check database connection
2. Ensure all migrations are applied: `npx prisma migrate dev`
3. Check for foreign key constraints
4. Review error messages for specific issues

### If you need to reset:
Simply run the script again - it will delete all data and recreate everything.

## Next Steps After Seeding

1. **Test login** with various user roles
2. **Verify data** appears correctly in the UI
3. **Test workflows** (submissions, reviews, etc.)
4. **Check reports** and exports
5. **Verify all new fields** are populated and displayed correctly

## Production Deployment

**Remember**: This seed data is for testing only. Before going to production:
1. Delete all seed data
2. Set up real production data
3. Update user passwords
4. Configure proper email domains
5. Set up real institutions and users

---

**Created**: Production seed script for comprehensive testing
**Last Updated**: 2024
