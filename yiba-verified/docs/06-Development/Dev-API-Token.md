# Dev API Token Authentication

**Project:** Yiba Verified  
**Document:** Dev-API-Token.md  
**Version:** v1.0  
**Date:** 2026-01-16  
**Location:** 06-Development/

---

## Overview

This document describes the **development-only** API token authentication feature that allows testing protected mutation endpoints (like `POST /api/learners`) from `curl` without using NextAuth session cookies.

**⚠️ SECURITY NOTE:** This feature is **ONLY active in development mode** (`NODE_ENV === "development"`). In production, dev token authentication is completely ignored and all requests must use NextAuth session authentication.

---

## Setup

### 1. Generate a Dev Token

Generate a secure random token using OpenSSL:

```bash
openssl rand -base64 32
```

Example output:
```
K8mP2nQ9rT5vX7wY3zA6bC1dE4fG8hI0jK2lM5nO8pQ1rS4tU7vW0xY3zA6bC
```

### 2. Add to `.env` File

Add the generated token to your `.env` file:

```env
DEV_API_TOKEN="<PASTE_DEV_TOKEN_HERE>"
```

**Optional:** Specify a different user email (defaults to `admin@yiba.local`):

```env
DEV_API_USER_EMAIL="admin@yiba.local"
```

### 3. Restart Dev Server

After adding the token, restart your development server:

```bash
npm run dev
```

---

## Usage

### Making Authenticated Requests

Include the `X-DEV-TOKEN` header in your API requests:

```bash
curl -X POST http://localhost:3000/api/learners \
  -H "Content-Type: application/json" \
  -H "X-DEV-TOKEN: <PASTE_DEV_TOKEN_HERE>" \
  -d '{
    "national_id": "9001015009088",
    "first_name": "Jane",
    "last_name": "Doe",
    "birth_date": "1990-01-01",
    "gender_code": "F",
    "nationality_code": "ZA",
    "popia_consent": true,
    "consent_date": "2024-01-01",
    "institution_id": "<INSTITUTION_ID_HERE>"
  }'
```

### Example: Create Learner

**Prerequisites:**
- Dev server running (`npm run dev`)
- Database seeded (run `npx prisma db seed`)
- `DEV_API_TOKEN` set in `.env`
- Get an institution ID from the database (seed script creates one with registration_number "TEST-INST-001")

**Ready-to-Copy curl Command:**

```bash
curl -X POST http://localhost:3000/api/learners \
  -H "Content-Type: application/json" \
  -H "X-DEV-TOKEN: <PASTE_DEV_TOKEN_HERE>" \
  -d '{
    "national_id": "9001015009088",
    "first_name": "Jane",
    "last_name": "Doe",
    "birth_date": "1990-01-01",
    "gender_code": "F",
    "nationality_code": "ZA",
    "popia_consent": true,
    "consent_date": "2024-01-01",
    "institution_id": "<INSTITUTION_ID_HERE>"
  }'
```

**Note:** Replace:
- `<PASTE_DEV_TOKEN_HERE>` with your `DEV_API_TOKEN` value from `.env`
- `<INSTITUTION_ID_HERE>` with an actual institution ID from your database

**To get institution ID:**
```bash
# Option 1: Query via Prisma Studio
npx prisma studio
# Navigate to Institution table and copy an institution_id

# Option 2: Query via SQL (if you have psql access)
# Or check the seed output - it prints the institution_id
```

**Expected Response (201 Created):**

```json
{
  "learner_id": "...",
  "national_id": "9001015009088",
  "first_name": "Jane",
  "last_name": "Doe",
  ...
}
```

**Expected Response (401 Unauthorized - without token):**

```json
{
  "error": "Unauthorized",
  "code": "UNAUTHENTICATED"
}
```

---

## Dev-Only Endpoints

### GET /api/dev/institutions

Lists institutions for quick access to `institution_id` values during development/testing.

**Security:**
- Returns **404** in production (endpoint doesn't exist)
- Requires valid `X-DEV-TOKEN` header in development
- Only accessible to `PLATFORM_ADMIN` role (via dev token)

**Query Parameters:**
- `?q=searchText` - Search in `legal_name`, `trading_name`, or `registration_number` (case-insensitive)
- `?limit=number` - Limit results (default: 50, max: 100)

**Response Format:**
```json
{
  "count": 2,
  "items": [
    {
      "institution_id": "uuid-here",
      "legal_name": "Test Institution",
      "trading_name": "Test Institution",
      "province": "Gauteng",
      "registration_number": "TEST-INST-001"
    }
  ]
}
```

**Example: List All Institutions**
```bash
curl -sS http://localhost:3000/api/dev/institutions \
  -H "X-DEV-TOKEN: <PASTE_DEV_TOKEN_HERE>" | jq
```

**Example: Search Institutions**
```bash
curl -sS "http://localhost:3000/api/dev/institutions?q=yiba&limit=20" \
  -H "X-DEV-TOKEN: <PASTE_DEV_TOKEN_HERE>" | jq
```

**Example: Production Check (Returns 404)**
```bash
# In production mode, endpoint doesn't exist
NODE_ENV=production npm run dev
curl -i http://localhost:3000/api/dev/institutions
# Expected: HTTP/1.1 404 Not Found
```

### Workflow: Get Institution ID → Create Learner

**Step 1:** Get institution ID:
```bash
curl -sS http://localhost:3000/api/dev/institutions \
  -H "X-DEV-TOKEN: <PASTE_DEV_TOKEN_HERE>" | jq '.items[0].institution_id'
```

**Step 2:** Copy the `institution_id` and use it in your learner creation:
```bash
curl -X POST http://localhost:3000/api/learners \
  -H "Content-Type: application/json" \
  -H "X-DEV-TOKEN: <PASTE_DEV_TOKEN_HERE>" \
  -d '{
    "national_id": "9001015009088",
    "first_name": "Jane",
    "last_name": "Doe",
    "birth_date": "1990-01-01",
    "gender_code": "F",
    "nationality_code": "ZA",
    "popia_consent": true,
    "consent_date": "2024-01-01",
    "institution_id": "<INSTITUTION_ID_FROM_STEP_1>"
  }'
```

---

## How It Works

1. **Development Check**: Only active when `NODE_ENV === "development"`
2. **Token Validation**: Compares `X-DEV-TOKEN` header with `DEV_API_TOKEN` env var using timing-safe comparison
3. **User Lookup**: Fetches user from database (default: `admin@yiba.local`, or `DEV_API_USER_EMAIL` if set)
4. **Context Creation**: Returns `ApiContext` with `userId`, `role`, and `institutionId`
5. **Fallback**: If dev token auth fails, falls back to NextAuth session authentication

---

## Security Considerations

### Development Only

- Dev token authentication is **completely disabled** in production
- The code checks `NODE_ENV !== "development"` and returns `null` immediately
- Production deployments will only accept NextAuth session authentication

### Timing-Safe Comparison

- Token comparison uses Node.js `crypto.timingSafeEqual()` to prevent timing attacks
- Ensures constant-time comparison regardless of token length differences

### RBAC Still Enforced

- All mutations still go through `mutateWithAudit()`
- RBAC rules are still enforced via `assertCan()`
- Institution scoping rules still apply
- QCTO read-only restrictions still enforced
- Audit logging still occurs

---

## Troubleshooting

### 401 Unauthorized

**Possible causes:**
- `DEV_API_TOKEN` not set in `.env`
- Token in header doesn't match `DEV_API_TOKEN`
- User email (`admin@yiba.local` or `DEV_API_USER_EMAIL`) doesn't exist in database
- Running in production mode (`NODE_ENV !== "development"`)

**Solution:**
1. Verify `.env` has `DEV_API_TOKEN` set
2. Check token matches exactly (no extra spaces)
3. Run `npx prisma db seed` to create the admin user
4. Ensure `NODE_ENV=development` (or not set, defaults to development)

### User Not Found

**Error:** Dev token auth returns `null` (falls back to NextAuth)

**Solution:**
- Ensure database is seeded: `npx prisma db seed`
- Verify user exists: `admin@yiba.local` (or `DEV_API_USER_EMAIL` if set)

---

## Testing

### Verify Dev Token Auth Works

**Test 1: Without token (should return 401)**
```bash
curl -X POST http://localhost:3000/api/learners \
  -H "Content-Type: application/json" \
  -d '{"national_id":"1234567890123","first_name":"Test"}'
```

**Test 2: With token (should return 201 or validation error)**
```bash
curl -X POST http://localhost:3000/api/learners \
  -H "Content-Type: application/json" \
  -H "X-DEV-TOKEN: <PASTE_DEV_TOKEN_HERE>" \
  -d '{
    "national_id": "9001015009089",
    "first_name": "Test",
    "last_name": "User",
    "birth_date": "1990-01-01",
    "gender_code": "M",
    "nationality_code": "ZA",
    "popia_consent": true,
    "consent_date": "2024-01-01",
    "institution_id": "<INSTITUTION_ID_HERE>"
  }'
```

**Test 3: Dev endpoint without token (should return 401)**
```bash
curl -i http://localhost:3000/api/dev/institutions
# Expected: HTTP/1.1 401 Unauthorized
```

**Test 4: Dev endpoint with token (should return 200)**
```bash
curl -sS http://localhost:3000/api/dev/institutions \
  -H "X-DEV-TOKEN: <PASTE_DEV_TOKEN_HERE>" | jq
# Expected: JSON with count and items array
```

**Test 5: Dev endpoint in production (should return 404)**
```bash
NODE_ENV=production npm run dev
curl -i http://localhost:3000/api/dev/institutions
# Expected: HTTP/1.1 404 Not Found
```

### Run Verification Scripts

```bash
# Check mutation pattern compliance
npm run check:mutations

# Check dev token auth is properly guarded
npm run check:devtoken
```

---

## Listing Learners

### GET /api/learners

Lists learners with RBAC enforcement. Supports both dev token (development) and NextAuth session authentication.

**Security:**
- Development: `X-DEV-TOKEN` header - must be `PLATFORM_ADMIN`
- NextAuth session:
  - `PLATFORM_ADMIN`: can list across institutions, but `institution_id` query param is required
  - `INSTITUTION_ADMIN`/`INSTITUTION_STAFF`: can only list their own institution (institution_id is overridden)
  - `QCTO_USER`/`STUDENT`: 403 (not allowed)

**Query Parameters:**
- `institution_id` (required for PLATFORM_ADMIN, ignored for institution roles)
- `q` (optional search: matches `first_name`, `last_name`, or `national_id`)
- `limit` (optional, default: 50, max: 200)

**Response Format:**
```json
{
  "count": 2,
  "items": [
    {
      "learner_id": "uuid-here",
      "institution_id": "uuid-here",
      "national_id": "9001015009087",
      "first_name": "Test",
      "last_name": "Student",
      "birth_date": "1990-01-01T00:00:00.000Z",
      "gender_code": "M",
      "nationality_code": "ZA",
      ...
    }
  ]
}
```

**Example: List learners with dev token**
```bash
# First, get an institution ID
export DEV_API_TOKEN="<PASTE_DEV_TOKEN_HERE>"
INSTITUTION_ID=$(curl -sS http://localhost:3000/api/dev/institutions \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq -r '.items[0].institution_id')

# Then list learners for that institution
curl -sS "http://localhost:3000/api/learners?institution_id=$INSTITUTION_ID&limit=20" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
```

**Example: Search learners**
```bash
curl -sS "http://localhost:3000/api/learners?institution_id=$INSTITUTION_ID&q=900101" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
```

**Example: Without institution_id (PLATFORM_ADMIN - returns 400)**
```bash
curl -i "http://localhost:3000/api/learners?limit=20" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN"
# Expected: HTTP/1.1 400 Bad Request
# Error: "PLATFORM_ADMIN must provide institution_id query parameter"
```

**Example: Complete workflow (get institution → list learners → create learner)**
```bash
export DEV_API_TOKEN="<PASTE_DEV_TOKEN_HERE>"

# Step 1: Get institution ID
INSTITUTION_ID=$(curl -sS http://localhost:3000/api/dev/institutions \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq -r '.items[0].institution_id')

# Step 2: List existing learners
curl -sS "http://localhost:3000/api/learners?institution_id=$INSTITUTION_ID&limit=20" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq

# Step 3: Create a new learner
curl -X POST http://localhost:3000/api/learners \
  -H "Content-Type: application/json" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  -d "{
    \"national_id\": \"9001015009088\",
    \"first_name\": \"Jane\",
    \"last_name\": \"Doe\",
    \"birth_date\": \"1990-01-01\",
    \"gender_code\": \"F\",
    \"nationality_code\": \"ZA\",
    \"popia_consent\": true,
    \"consent_date\": \"2024-01-01\",
    \"institution_id\": \"$INSTITUTION_ID\"
  }"
```

---

## Getting a Single Learner

### GET /api/learners/[learnerId]

Retrieves a single learner by ID with RBAC enforcement. Supports both dev token (development) and NextAuth session authentication.

**Security:**
- Development: `X-DEV-TOKEN` header - supports any role (PLATFORM_ADMIN, INSTITUTION_ADMIN, INSTITUTION_STAFF)
- NextAuth session:
  - `PLATFORM_ADMIN`: can read any learner, but if `institution_id` query param is provided, it must match the learner's `institution_id` (extra safety)
  - `INSTITUTION_ADMIN`/`INSTITUTION_STAFF`: can only read learners for their own institution (institution_id is enforced from session)
  - `QCTO_USER`/`STUDENT`: 403 (not allowed)

**Query Parameters:**
- `institution_id` (optional, only for PLATFORM_ADMIN - if provided, must match learner's institution_id)

**Response Format:**
```json
{
  "learner_id": "uuid-here",
  "institution_id": "uuid-here",
  "national_id": "9001015009087",
  "first_name": "Test",
  "last_name": "Student",
  "birth_date": "1990-01-01T00:00:00.000Z",
  "gender_code": "M",
  "nationality_code": "ZA",
  "home_language_code": "en",
  "disability_status": null,
  "popia_consent": true,
  "consent_date": "2024-01-01T00:00:00.000Z",
  "user_id": null,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Example: Get learner with dev token**
```bash
# Replace <LEARNER_ID> with an actual learner_id from your database
curl -sS http://localhost:3000/api/learners/<LEARNER_ID> \
  -H "X-DEV-TOKEN: <PASTE_DEV_TOKEN_HERE>" | jq
```

**Example: Get learner with NextAuth session**
```bash
curl -sS http://localhost:3000/api/learners/<LEARNER_ID> \
  -H "Cookie: next-auth.session-token=<SESSION_TOKEN>" | jq
```

**Example: PLATFORM_ADMIN with institution_id safety check**
```bash
# If you provide institution_id, it must match the learner's institution_id
curl -sS "http://localhost:3000/api/learners/<LEARNER_ID>?institution_id=<INSTITUTION_ID>" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
```

**Common Errors:**

- **401 Unauthorized** - Missing or invalid authentication token
  ```json
  {
    "error": "Unauthorized",
    "code": "UNAUTHENTICATED"
  }
  ```

- **403 Forbidden** - User doesn't have permission or institution mismatch
  ```json
  {
    "error": "Cannot read learners from other institutions",
    "code": "FORBIDDEN"
  }
  ```

- **404 Not Found** - Learner doesn't exist or is soft-deleted
  ```json
  {
    "error": "Learner not found",
    "code": "NOT_FOUND"
  }
  ```

**Example: Complete workflow (list learners → get learner details)**
```bash
export DEV_API_TOKEN="<PASTE_DEV_TOKEN_HERE>"

# Step 1: Get institution ID
INSTITUTION_ID=$(curl -sS http://localhost:3000/api/dev/institutions \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq -r '.items[0].institution_id')

# Step 2: List learners
curl -sS "http://localhost:3000/api/learners?institution_id=$INSTITUTION_ID&limit=20" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq

# Step 3: Get learner ID from the list and fetch details
LEARNER_ID=$(curl -sS "http://localhost:3000/api/learners?institution_id=$INSTITUTION_ID&limit=1" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq -r '.items[0].learner_id')

curl -sS "http://localhost:3000/api/learners/$LEARNER_ID" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
```

---

## Enrolments API

### GET /api/dev/qualifications

Lists qualifications for development/testing purposes. Same security as `/api/dev/institutions`.

**Security:**
- Returns **404** in production (endpoint doesn't exist)
- Requires valid `X-DEV-TOKEN` header in development
- Only accessible to `PLATFORM_ADMIN` role (via dev token)

**Query Parameters:**
- `?q=searchText` - Search in `name` or `code` (case-insensitive)
- `?limit=number` - Limit results (default: 50, max: 100)

**Example: List all qualifications**
```bash
export BASE_URL="http://localhost:3001"
export DEV_API_TOKEN="<PASTE_DEV_TOKEN_HERE>"
curl -sS "$BASE_URL/api/dev/qualifications" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
```

**Example: Search qualifications**
```bash
curl -sS "$BASE_URL/api/dev/qualifications?q=plumber&limit=20" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
```

### POST /api/enrolments

Creates a new enrolment linking a learner to a qualification.

**Security:**
- Development: `X-DEV-TOKEN` header - must be `PLATFORM_ADMIN`
- NextAuth session: `PLATFORM_ADMIN`, `INSTITUTION_ADMIN`, `INSTITUTION_STAFF`
- Institution scoping enforced (learner must belong to user's institution for institution roles)

**Request Body:**
- `learner_id` (required) - UUID of the learner
- `qualification_id` (optional) - UUID of qualification (if provided, qualification must exist)
- `qualification_title` (optional) - Title of qualification (fallback if qualification_id not provided)
- Must provide **either** `qualification_id` **OR** `qualification_title`
- `start_date` (optional) - ISO date string, defaults to today
- `expected_completion_date` (optional) - ISO date string
- `enrolment_status` (optional) - "ACTIVE" | "COMPLETED" | "TRANSFERRED" | "ARCHIVED", defaults to "ACTIVE"

**Validations:**
- Learner must exist and not be deleted
- If `qualification_id` provided, qualification must exist and not be deleted
- No duplicate active enrolments (same learner + (qualification_id OR qualification_title) + not deleted)

**Example: Create enrolment with qualification_id**
```bash
export BASE_URL="http://localhost:3001"
export DEV_API_TOKEN="<PASTE_DEV_TOKEN_HERE>"

# Get required IDs first
INSTITUTION_ID=$(curl -sS "$BASE_URL/api/dev/institutions" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq -r '.items[0].institution_id')
LEARNER_ID=$(curl -sS "$BASE_URL/api/learners?institution_id=$INSTITUTION_ID&limit=1" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq -r '.items[0].learner_id')
QUALIFICATION_ID=$(curl -sS "$BASE_URL/api/dev/qualifications" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq -r '.items[0].qualification_id')

# Create enrolment
curl -X POST "$BASE_URL/api/enrolments" \
  -H "Content-Type: application/json" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  -d "{
    \"learner_id\": \"$LEARNER_ID\",
    \"qualification_id\": \"$QUALIFICATION_ID\",
    \"start_date\": \"2024-01-01\",
    \"enrolment_status\": \"ACTIVE\"
  }" | jq
```

**Example: Create enrolment with qualification_title (fallback)**
```bash
curl -X POST "$BASE_URL/api/enrolments" \
  -H "Content-Type: application/json" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  -d "{
    \"learner_id\": \"$LEARNER_ID\",
    \"qualification_title\": \"Plumber\",
    \"start_date\": \"2024-01-01\",
    \"enrolment_status\": \"ACTIVE\"
  }" | jq
```

### GET /api/enrolments

Lists enrolments with RBAC enforcement. Institution-scoped results.

**Security:**
- Development: `X-DEV-TOKEN` header - must be `PLATFORM_ADMIN`
- NextAuth session:
  - `PLATFORM_ADMIN`: can list across institutions, but `institution_id` query param is required
  - `INSTITUTION_ADMIN`/`INSTITUTION_STAFF`: can only list their own institution (institution_id is overridden)
  - `QCTO_USER`/`STUDENT`: 403 (not allowed)

**Query Parameters:**
- `institution_id` (required for PLATFORM_ADMIN, ignored for institution roles)
- `q` (optional search: matches learner national_id, learner name, or qualification name)
- `limit` (optional, default: 50, max: 200)

**Example: List enrolments with dev token**
```bash
export BASE_URL="http://localhost:3001"
export DEV_API_TOKEN="<PASTE_DEV_TOKEN_HERE>"

INSTITUTION_ID=$(curl -sS "$BASE_URL/api/dev/institutions" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq -r '.items[0].institution_id')

curl -sS "$BASE_URL/api/enrolments?institution_id=$INSTITUTION_ID&limit=20" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
```

**Example: Search enrolments**
```bash
curl -sS "$BASE_URL/api/enrolments?institution_id=$INSTITUTION_ID&q=900101" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
```

### GET /api/enrolments/[enrolmentId]

Retrieves a single enrolment by ID with RBAC enforcement.

**Security:**
- Development: `X-DEV-TOKEN` header - supports any role
- NextAuth session:
  - `PLATFORM_ADMIN`: can read any enrolment
  - `INSTITUTION_ADMIN`/`INSTITUTION_STAFF`: can only read enrolments for their own institution
  - `QCTO_USER`/`STUDENT`: 403 (not allowed)

**Example: Get enrolment by ID**
```bash
# Get enrolment ID from list
ENROLMENT_ID=$(curl -sS "$BASE_URL/api/enrolments?institution_id=$INSTITUTION_ID&limit=1" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq -r '.items[0].enrolment_id')

# Fetch enrolment details
curl -sS "$BASE_URL/api/enrolments/$ENROLMENT_ID" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
```

### Complete Enrolment Workflow

**Step 1:** Get IDs
```bash
export BASE_URL="http://localhost:3001"
export DEV_API_TOKEN="<PASTE_DEV_TOKEN_HERE>"

INSTITUTION_ID=$(curl -sS "$BASE_URL/api/dev/institutions" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq -r '.items[0].institution_id')
LEARNER_ID=$(curl -sS "$BASE_URL/api/learners?institution_id=$INSTITUTION_ID&limit=1" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq -r '.items[0].learner_id')
QUALIFICATION_ID=$(curl -sS "$BASE_URL/api/dev/qualifications" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq -r '.items[0].qualification_id')
```

**Step 2:** Create enrolment
```bash
curl -X POST "$BASE_URL/api/enrolments" \
  -H "Content-Type: application/json" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  -d "{
    \"learner_id\": \"$LEARNER_ID\",
    \"qualification_id\": \"$QUALIFICATION_ID\",
    \"start_date\": \"2024-01-01\",
    \"enrolment_status\": \"ACTIVE\"
  }" | jq
```

**Step 3:** List enrolments
```bash
curl -sS "$BASE_URL/api/enrolments?institution_id=$INSTITUTION_ID&limit=20" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
```

**Step 4:** Get enrolment details
```bash
ENROLMENT_ID=$(curl -sS "$BASE_URL/api/enrolments?institution_id=$INSTITUTION_ID&limit=1" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq -r '.items[0].enrolment_id')
curl -sS "$BASE_URL/api/enrolments/$ENROLMENT_ID" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
```

---

## Related Documentation

- `API-Mutation-Pattern.md`: Mutation pattern and RBAC enforcement
- `Docker-DB-Setup.md`: Database setup and seeding

---

**End of Document**
