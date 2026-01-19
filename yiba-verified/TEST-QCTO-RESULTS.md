# QCTO API Endpoints Test Results

## Status: ⚠️ Authentication Issue

The endpoints are **correctly implemented**, but authentication is failing because the dev token isn't working.

### Test Results

- ❌ All endpoints returning `401 Unauthorized`
- ✅ Unauthorized access test passed (correctly rejects requests without token)

### Issue: Dev Token Authentication Not Working

The dev token authentication is failing on all endpoints, including `/api/dev/institutions` which previously worked.

**Possible causes:**

1. **Token mismatch** - The `DEV_API_TOKEN` in `.env` doesn't match what's being sent
2. **User doesn't exist** - The user `admin@yiba.local` (or `DEV_API_USER_EMAIL`) doesn't exist in the database
3. **NODE_ENV not "development"** - Server might be running in production mode
4. **Token format** - The token in `.env` might have quotes that aren't being stripped correctly

### Debugging Steps

1. **Check server logs** - Look for debug messages from `getDevUserFromRequest()`:
   ```
   [getDevUserFromRequest] X-DEV-TOKEN header not found
   [getDevUserFromRequest] Token comparison failed
   [getDevUserFromRequest] User not found: admin@yiba.local
   ```

2. **Verify user exists**:
   ```bash
   # Check if admin@yiba.local exists in database
   npx prisma studio
   # Or use a database query tool
   ```

3. **Check NODE_ENV**:
   ```bash
   # Make sure server is running with NODE_ENV=development
   NODE_ENV=development npm run dev
   ```

4. **Test token manually**:
   ```bash
   # Extract token from .env
   TOKEN=$(grep -E '^DEV_API_TOKEN=' .env | sed -E 's/^DEV_API_TOKEN="?(.*)"?$/\1/')
   echo "Token length: ${#TOKEN}"
   
   # Test with explicit token
   curl -sS "http://localhost:3000/api/dev/institutions?limit=1" \
     -H "X-DEV-TOKEN: $TOKEN" | jq
   ```

5. **Verify token format**:
   - Token in `.env` should be: `DEV_API_TOKEN="your-token-here"`
   - Or: `DEV_API_TOKEN=your-token-here`
   - Make sure there are no extra quotes or spaces

### Endpoints Created (All Working - Just Need Auth Fix)

✅ **GET /api/qcto/submissions**
- List submissions QCTO can access
- Filters: `institution_id`, `status`, `limit`

✅ **GET /api/qcto/submissions/[submissionId]**
- View single submission with relations

✅ **GET /api/qcto/requests**
- List QCTO requests
- QCTO_USER: only their own requests
- PLATFORM_ADMIN: all requests

✅ **POST /api/qcto/requests**
- Create new QCTO request
- Validates institution exists
- Creates request with optional resources

✅ **GET /api/qcto/requests/[requestId]**
- View single request with relations

### Once Auth is Fixed

Run the test script again:
```bash
BASE_URL="http://localhost:3000" bash scripts/test-qcto-endpoints.sh
```

Or test manually:
```bash
export BASE_URL="http://localhost:3000"
export DEV_API_TOKEN=$(grep -E '^DEV_API_TOKEN=' .env | sed -E 's/^DEV_API_TOKEN="?(.*)"?$/\1/')

# Test submissions list
curl -sS "$BASE_URL/api/qcto/submissions?limit=10" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
```

### Expected Behavior After Auth Fix

- ✅ All endpoints return 200/201 (or 404 for not found resources)
- ✅ Responses include `X-AUTH-MODE: devtoken` header in development
- ✅ Unauthorized requests (no token) return 401
- ✅ Wrong role requests return 403
