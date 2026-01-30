# Submissions vs Requests: How They Relate

## Overview

The Yiba Verified system uses **two complementary mechanisms** for QCTO to access institution data:

1. **Submissions** - Institution-initiated (push model)
2. **Requests** - QCTO-initiated (pull model)

Both mechanisms use the same **access control model**: QCTO can only view resources that are either:
- Linked to an **APPROVED Submission**, OR
- Linked to an **APPROVED QCTORequest**

---

## 1. Submissions (Institution → QCTO)

### What is a Submission?
A **Submission** is a **compliance pack** that institutions create and submit to QCTO. It's the institution's way of proactively sharing data.

### Workflow:
```
1. Institution creates submission (status: DRAFT)
   ↓
2. Institution adds resources to submission:
   - Readiness records
   - Learners
   - Enrolments
   - Documents
   - Facilitators
   ↓
3. Institution submits to QCTO (status: SUBMITTED)
   ↓
4. QCTO reviews (status: UNDER_REVIEW)
   ↓
5. QCTO approves/rejects (status: APPROVED / REJECTED)
```

### Key Characteristics:
- **Institution-initiated**: Institution decides what to share
- **Batch operation**: Multiple resources bundled together
- **Compliance-focused**: Often for annual reports, readiness assessments, etc.
- **Status flow**: DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED

### Example Use Cases:
- Annual compliance report
- Form 5 readiness assessment submission
- Bulk learner data submission
- Document vault submission

### Access Control:
Once a submission is **APPROVED**, QCTO can access all resources linked to it via `SubmissionResource` records.

---

## 2. Requests (QCTO → Institution)

### What is a QCTORequest?
A **QCTORequest** is a **data request** that QCTO creates to ask institutions for specific information. It's QCTO's way of requesting data on-demand.

### Workflow:
```
1. QCTO creates request (status: PENDING)
   - Specifies what resources they need
   - Can request specific items or "all" of a type
   ↓
2. Institution reviews request
   ↓
3. Institution approves/rejects (status: APPROVED / REJECTED)
   ↓
4. If APPROVED: QCTO gains access to requested resources
```

### Key Characteristics:
- **QCTO-initiated**: QCTO decides what they need
- **Targeted**: Can request specific resources or bulk data
- **On-demand**: Created when QCTO needs specific information
- **Status flow**: PENDING → APPROVED/REJECTED

### Example Use Cases:
- Request facilitator qualifications
- Request learner academic history
- Request specific documents
- Request assessment results
- Bulk data request (all facilitators, all learners, etc.)

### Access Control:
Once a request is **APPROVED**, QCTO can access all resources linked to it via `QCTORequestResource` records.

---

## 3. How They Work Together

### Complementary Systems:
- **Submissions** = Institution proactively shares data
- **Requests** = QCTO proactively requests data

### Same Access Model:
Both use the same underlying access control:
- Resources are linked via `SubmissionResource` or `QCTORequestResource`
- QCTO can access resources if they're in an **APPROVED** submission OR request
- Access is checked via `canReadForQCTO()` function

### Resource Types Supported:
Both support the same resource types:
- `READINESS` - Readiness assessments
- `LEARNER` - Learner profiles
- `ENROLMENT` - Enrolment records
- `DOCUMENT` - Documents
- `INSTITUTION` - Institution data
- `FACILITATOR` - Facilitator profiles

### Special Features:

#### Profile Linking (Requests Only):
When QCTO requests documents, they can specify that documents should be **linked to user profiles** (facilitators, learners, etc.) when the institution approves. This is stored in the `notes` field as JSON.

#### Bulk Requests:
Both systems support bulk operations:
- **Submissions**: Can include multiple resources of different types
- **Requests**: Can request "all" of a type (using `resource_id_value = "*"`)

---

## 4. Access Control Logic

### How QCTO Access is Determined:

```typescript
// Simplified logic from canReadForQCTO()
1. Check if resource is in APPROVED Submission
   → If yes: ✅ Access granted
   
2. Check if resource is in APPROVED QCTORequest
   → If yes: ✅ Access granted
   
3. Special cases:
   - For ENROLMENT: Also check if learner is in APPROVED submission/request
   - For FACILITATOR: Also check if linked readiness is APPROVED
   
4. If none of the above: ❌ Access denied
```

### Province Filtering:
QCTO users with assigned provinces can only see resources from institutions in those provinces (unless they're PLATFORM_ADMIN or QCTO_SUPER_ADMIN).

---

## 5. Key Differences Summary

| Aspect | Submissions | Requests |
|--------|-------------|----------|
| **Initiated by** | Institution | QCTO |
| **Purpose** | Compliance reporting | On-demand data access |
| **Workflow** | DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED | PENDING → APPROVED |
| **Typical use** | Annual reports, readiness assessments | Specific data requests |
| **Profile linking** | No | Yes (for documents) |
| **Bulk operations** | Yes (multiple resources) | Yes (can request "all") |
| **Review process** | QCTO reviews | Institution reviews |

---

## 6. Database Schema

### Submission Model:
```prisma
model Submission {
  submission_id   String
  institution_id  String
  status          SubmissionStatus  // DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED
  submissionResources SubmissionResource[]
}

model SubmissionResource {
  resource_id       String
  submission_id     String
  resource_type     SubmissionResourceType
  resource_id_value String  // The actual ID of the resource
}
```

### QCTORequest Model:
```prisma
model QCTORequest {
  request_id     String
  institution_id String
  requested_by   String  // QCTO user
  status         QCTORequestStatus  // PENDING, APPROVED, REJECTED
  requestResources QCTORequestResource[]
}

model QCTORequestResource {
  resource_id       String
  request_id        String
  resource_type     SubmissionResourceType
  resource_id_value String  // The actual ID, or "*" for "all"
  notes             String? // Can contain JSON with link_to_profile info
}
```

---

## 7. Real-World Example

### Scenario: QCTO needs to verify a facilitator's qualifications

**Option 1: Via Submission**
- Institution already submitted a readiness record that includes facilitator data
- QCTO can access facilitator because readiness is in an APPROVED submission

**Option 2: Via Request**
- QCTO creates a request: "Request Facilitator Data" for specific facilitator
- Institution approves the request
- QCTO can now access the facilitator's profile, qualifications, certifications

**Both paths lead to the same result**: QCTO can view the facilitator data.

---

## 8. Best Practices

### When to Use Submissions:
- Regular compliance reporting (annual, quarterly)
- Proactive data sharing
- Bulk data uploads
- Form 5 readiness assessments

### When to Use Requests:
- Specific data needed for investigation
- On-demand access to particular resources
- Documents that need profile linking
- Targeted data requests

---

## Summary

**Submissions and Requests are two sides of the same coin:**
- Both grant QCTO access to institution resources
- Both use the same access control model
- Both support the same resource types
- They complement each other: submissions for proactive sharing, requests for on-demand access

The key is that **QCTO can only see resources that are explicitly shared** through either mechanism, ensuring data privacy and controlled access.
