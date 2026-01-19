# QCTO API Endpoints Testing Guide

## Prerequisites

1. **Server running** (usually on port 3000 or 3001):
   ```bash
   npm run dev
   ```

2. **DEV_API_TOKEN** set in `.env` file

3. **Prisma migration applied**:
   ```bash
   npx prisma migrate dev --name add_submission_qcto_request_models
   ```

## Setup Test Environment Variables

```bash
export BASE_URL="http://localhost:3000"  # or 3001
export DEV_API_TOKEN=$(grep -E '^DEV_API_TOKEN=' .env | sed -E 's/^DEV_API_TOKEN="?(.*)"?$/\1/')
```

Or manually:
```bash
export BASE_URL="http://localhost:3000"
export DEV_API_TOKEN="your-dev-token-here"
```

## Test Endpoints

### 1. GET /api/qcto/submissions - List Submissions

**Basic list:**
```bash
curl -sS "$BASE_URL/api/qcto/submissions?limit=10" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
```

**Filter by status:**
```bash
curl -sS "$BASE_URL/api/qcto/submissions?status=APPROVED&limit=10" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
```

**Filter by institution (PLATFORM_ADMIN only):**
```bash
curl -sS "$BASE_URL/api/qcto/submissions?institution_id=<INSTITUTION_ID>&limit=10" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
```

**Expected Response (200 OK):**
```json
{
  "count": 0,
  "items": []
}
```

**Check auth mode (development only):**
```bash
curl -sS -v "$BASE_URL/api/qcto/submissions?limit=10" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" 2>&1 | grep "X-AUTH-MODE"
# Should show: X-AUTH-MODE: devtoken
```

### 2. GET /api/qcto/submissions/[submissionId] - View Single Submission

```bash
SUBMISSION_ID="<SUBMISSION_ID>"
curl -sS "$BASE_URL/api/qcto/submissions/$SUBMISSION_ID" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
```

**Expected Response (200 OK):**
```json
{
  "submission_id": "...",
  "institution_id": "...",
  "status": "APPROVED",
  "submitted_at": "...",
  "institution": { ... },
  "submissionResources": [ ... ]
}
```

**Expected Response (404 Not Found):**
```json
{
  "error": "Submission not found: <submissionId>",
  "code": "NOT_FOUND"
}
```

### 3. GET /api/qcto/requests - List QCTO Requests

**Basic list:**
```bash
curl -sS "$BASE_URL/api/qcto/requests?limit=10" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
```

**Filter by status:**
```bash
curl -sS "$BASE_URL/api/qcto/requests?status=PENDING&limit=10" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
```

**Filter by institution (PLATFORM_ADMIN only):**
```bash
curl -sS "$BASE_URL/api/qcto/requests?institution_id=<INSTITUTION_ID>&limit=10" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
```

**Expected Response (200 OK):**
```json
{
  "count": 0,
  "items": []
}
```

### 4. POST /api/qcto/requests - Create New QCTO Request

**First, get an institution ID:**
```bash
INSTITUTION_ID=$(curl -sS "$BASE_URL/api/dev/institutions?limit=1" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  | jq -r '.items[0].institution_id')
echo "Institution ID: $INSTITUTION_ID"
```

**Create request with resources:**
```bash
curl -X POST "$BASE_URL/api/qcto/requests" \
  -H "Content-Type: application/json" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  -d "{
    \"institution_id\": \"$INSTITUTION_ID\",
    \"request_type\": \"READINESS_REVIEW\",
    \"title\": \"Test QCTO Request\",
    \"description\": \"This is a test request for readiness review\",
    \"resources\": [
      {
        \"resource_type\": \"READINESS\",
        \"resource_id_value\": \"test-readiness-123\",
        \"notes\": \"Test resource\"
      }
    ]
  }" | jq
```

**Create request without resources:**
```bash
curl -X POST "$BASE_URL/api/qcto/requests" \
  -H "Content-Type: application/json" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  -d "{
    \"institution_id\": \"$INSTITUTION_ID\",
    \"title\": \"Simple Test Request\",
    \"description\": \"Test request without resources\"
  }" | jq
```

**Expected Response (201 Created):**
```json
{
  "request_id": "...",
  "institution_id": "...",
  "title": "Test QCTO Request",
  "status": "PENDING",
  "requested_at": "...",
  "institution": { ... },
  "requestResources": [ ... ]
}
```

**Expected Response (400 Validation Error):**
```json
{
  "error": "Missing required field: institution_id",
  "code": "VALIDATION_ERROR"
}
```

**Expected Response (404 Not Found - institution):**
```json
{
  "error": "Institution not found: <institution_id>",
  "code": "NOT_FOUND"
}
```

### 5. GET /api/qcto/requests/[requestId] - View Single Request

```bash
REQUEST_ID="<REQUEST_ID>"
curl -sS "$BASE_URL/api/qcto/requests/$REQUEST_ID" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
```

**Expected Response (200 OK):**
```json
{
  "request_id": "...",
  "institution_id": "...",
  "title": "...",
  "status": "PENDING",
  "institution": { ... },
  "requestResources": [ ... ]
}
```

**Expected Response (404 Not Found):**
```json
{
  "error": "QCTO request not found: <requestId>",
  "code": "NOT_FOUND"
}
```

## Test Authorization

### Unauthorized Access (Should Fail)

**No token:**
```bash
curl -sS "$BASE_URL/api/qcto/submissions" | jq
# Expected: 401 Unauthorized
```

**Invalid token:**
```bash
curl -sS "$BASE_URL/api/qcto/submissions" \
  -H "X-DEV-TOKEN: invalid-token" | jq
# Expected: 401 Unauthorized
```

### Unauthorized Role (Should Fail)

If your dev token is for a non-QCTO/non-PLATFORM_ADMIN role:
```bash
curl -sS "$BASE_URL/api/qcto/submissions" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
# Expected: 403 Forbidden with "Role <ROLE> cannot access QCTO endpoints"
```

## Automated Test Script

Run the automated test script (requires server to be running):

```bash
# Make sure server is running first!
npm run dev

# In another terminal:
bash scripts/test-qcto-endpoints.sh
```

Or customize the BASE_URL:
```bash
BASE_URL="http://localhost:3000" bash scripts/test-qcto-endpoints.sh
```

## Test Checklist

- [ ] GET /api/qcto/submissions returns 200 with count and items
- [ ] GET /api/qcto/submissions?status=APPROVED filters correctly
- [ ] GET /api/qcto/submissions/[submissionId] returns 200 for existing submission
- [ ] GET /api/qcto/submissions/[submissionId] returns 404 for non-existent submission
- [ ] GET /api/qcto/requests returns 200 with count and items
- [ ] GET /api/qcto/requests?status=PENDING filters correctly
- [ ] POST /api/qcto/requests creates request with resources (201)
- [ ] POST /api/qcto/requests creates request without resources (201)
- [ ] POST /api/qcto/requests returns 400 for missing required fields
- [ ] POST /api/qcto/requests returns 404 for non-existent institution
- [ ] GET /api/qcto/requests/[requestId] returns 200 for existing request
- [ ] GET /api/qcto/requests/[requestId] returns 404 for non-existent request
- [ ] Unauthorized access (no token) returns 401
- [ ] Unauthorized role returns 403
- [ ] X-AUTH-MODE header present in development responses

## Troubleshooting

### Error: "Cannot find module '@/lib/prisma'"
- **Fix:** Make sure you're running from the project root
- **Fix:** Check `tsconfig.json` has path aliases configured

### Error: "Model 'qCTORequest' does not exist"
- **Fix:** Run `npx prisma generate` to regenerate Prisma client
- **Fix:** Check if migration was applied: `npx prisma migrate status`

### Error: "Role X cannot access QCTO endpoints"
- **Fix:** Ensure your `DEV_API_TOKEN` is for a user with `QCTO_USER` or `PLATFORM_ADMIN` role
- **Fix:** Check `DEV_API_USER_EMAIL` in `.env` corresponds to a QCTO/Admin user

### Empty results (count: 0, items: [])
- **This is normal!** The endpoints work correctly, you just don't have test data yet
- **To test with data:** Create submissions/requests in Prisma Studio or via seed script

### Server not running
- **Fix:** Start the server: `npm run dev`
- **Fix:** Check what port it's running on (might be 3000 instead of 3001)

## Next Steps

Once all tests pass:

1. ✅ **Create test data** (submissions, requests) for full testing
2. ✅ **Test with real resources** (use `canReadForQCTO()` helper to verify resource access)
3. ✅ **Create QCTO UI pages** for viewing submissions and requests
4. ✅ **Add request approval workflow** (institution approving QCTO requests)
