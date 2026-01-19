# **Wireframe V1 -- Overview**

**Project:** Yiba Wise -- Compliance & QCTO Oversight App\
**Version:** v1.0\
**Date:** 2026-01-14\
**Status:** Approved for wireframing

## **1. Purpose of This Document**

This document defines the **high-level wireframe structure and system
boundaries** for the Yiba Wise Compliance & QCTO Oversight Application.

It serves as the **single reference point** for:

-   Product decisions

-   Wireframing

-   Feature scope

-   Future development alignment

Anything not aligned to this document is **out of scope** unless
formally updated.

## **2. System Context (Two-System Architecture)**

Yiba Wise operates as **two distinct but aligned systems**:

### **2.1 System A: Yiba Wise Website (Tutor LMS)**

**Status:** Existing -- not rebuilt\
**Purpose:** Learning & education delivery

Handles:

-   Courses and learning content

-   Lessons, quizzes, assignments

-   Learner progress within courses

Does **not** handle:

-   QCTO compliance

-   Programme Delivery Readiness

-   Institutional governance

-   Evidence management

-   Audit trails

### **2.2 System B: Compliance & QCTO Oversight App (This Project)**

**Status:** To be built\
**Purpose:** Regulatory compliance, oversight, verification

Handles:

-   Programme Delivery Readiness (Form 5 -- Phase 2)

-   Learner Management Information System (LMIS)

-   Institutional profiles and readiness

-   Evidence and document management

-   Audit trails and change history

-   QCTO dashboards and reviews

-   POPIA-aligned data governance

### **2.3 Relationship Between the Two Systems**

-   Systems are **technically independent**

-   Linked via **logical identifiers**, not deep integration:

    -   Learner National ID

    -   Institution ID

    -   Qualification / Curriculum Code

-   Optional technical integration may be added later (out of scope for
    > V1)

## **3. Objectives of the Compliance App (V1)**

The Compliance App aims to:

1.  Digitise QCTO Programme Delivery Readiness (Form 5)

2.  Provide a central, auditable LMIS

3.  Enable QCTO to review institutions remotely

4.  Reduce manual submissions and site visits

5.  Ensure data integrity through audit trails

6.  Support POPIA-compliant learner data handling

## **4. In-Scope Features (V1)**

### **4.1 Core Modules**

**Institution Management**

-   Institution profiles

-   Accreditation status

-   Contact details

-   Delivery modes (Face-to-Face / Blended / Mobile)

**Programme Delivery Readiness (Form 5)**

-   Structured readiness checklist

-   Evidence uploads per criterion

-   Readiness status tracking

-   QCTO review & remarks

**Learner Management Information System (LMIS)**

-   Learner master records

-   Enrolments across institutions

-   Attendance & readiness indicators

-   Learner history over time

**Evidence & Document Vault**

-   CVs, contracts, MOUs, policies, OHS documents

-   Structured categorisation

-   Version control

**Audit Trail**

-   Track who changed what, when, and why

-   Before/after value comparison

-   Visible to QCTO and Admin

**QCTO Dashboard**

-   Institution list (grid & list views)

-   Learner search

-   Readiness status overview

-   Flags and review notes

## **5. User Roles (High-Level)**

### **5.1 Platform Super Admin (Yiba Wise)**

-   Full system access

-   User and role management

-   Configuration and oversight

### **5.2 QCTO User**

-   View all institutions and learners

-   Review readiness submissions

-   Access audit logs

-   Add remarks and flags

-   Export reports

### **5.3 Institution Admin**

-   Manage institution profile

-   Add staff users

-   Capture learner and readiness data

-   Upload evidence

-   Submit for QCTO review

### **5.4 Institution Sub-Roles**

-   Data Capturer (limited edit access)

-   Facilitator / Assessor

-   Read-only Viewer

### **5.5 Student**

-   View personal profile

-   View enrolment history

-   View certificates and progress

-   Limited self-service access

## **6. Out-of-Scope (V1)**

The following are **explicitly excluded** from Version 1:

-   Course delivery and content hosting

-   Lesson, quiz, or assignment functionality

-   Deep LMS API integration

-   Financial or billing systems

-   Public-facing marketing features

## **7. Design Principles**

-   **Compliance-first**, not LMS-first

-   **Auditability over convenience**

-   **Clear separation of roles**

-   **Minimal student-facing complexity**

-   **Scalable to national oversight use**

## **8. Version Control & Updates**

-   This document represents **Wireframe V1**

-   Any change requires:

    -   Version increment (v1.1 / v2.0)

    -   Summary of change

    -   Date updated

## **9. Next Documents Dependent on This File**

This overview directly informs:

-   Wireframe-V1-Screens.md

-   Wireframe-V1-Forms-Fields.md

-   Wireframe-V1-Workflows.md

-   Role-Permissions-Matrix.xlsx

-   Audit-Log-Spec.md
