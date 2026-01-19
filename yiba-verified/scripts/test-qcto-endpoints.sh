#!/bin/bash
# Test script for QCTO API endpoints
# 
# Usage:
#   chmod +x scripts/test-qcto-endpoints.sh
#   ./scripts/test-qcto-endpoints.sh
#
# Or:
#   bash scripts/test-qcto-endpoints.sh

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"

# Get DEV_API_TOKEN from .env
if [ -f .env ]; then
  DEV_API_TOKEN=$(grep -E '^DEV_API_TOKEN=' .env | sed -E 's/^DEV_API_TOKEN="?(.*)"?$/\1/' || echo "")
else
  DEV_API_TOKEN=""
fi

if [ -z "$DEV_API_TOKEN" ]; then
  echo -e "${RED}❌ Error: DEV_API_TOKEN not found in .env${NC}"
  echo "Please set DEV_API_TOKEN in .env file"
  exit 1
fi

echo -e "${BLUE}🧪 Testing QCTO API Endpoints${NC}"
echo "BASE_URL: $BASE_URL"
echo ""

# Test counter
PASSED=0
FAILED=0

# Test helper function
test_endpoint() {
  local method=$1
  local endpoint=$2
  local description=$3
  local expected_status=${4:-200}
  local data=${5:-""}
  
  echo -e "${YELLOW}Testing: $description${NC}"
  echo "  $method $endpoint"
  
  if [ -n "$data" ]; then
    response=$(curl -sS -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
      -d "$data" 2>&1) || true
  else
    response=$(curl -sS -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
      -H "X-DEV-TOKEN: $DEV_API_TOKEN" 2>&1) || true
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" -eq "$expected_status" ]; then
    echo -e "  ${GREEN}✅ PASS${NC} (Status: $http_code)"
    if [ -n "$body" ] && [ "$body" != "null" ]; then
      echo "$body" | jq . 2>/dev/null | head -5 || echo "  (Response received)"
    fi
    PASSED=$((PASSED + 1))
  else
    echo -e "  ${RED}❌ FAIL${NC} (Expected: $expected_status, Got: $http_code)"
    if [ -n "$body" ]; then
      echo "$body" | jq . 2>/dev/null || echo "  Response: $body"
    fi
    FAILED=$((FAILED + 1))
  fi
  echo ""
}

# Test 1: GET /api/qcto/submissions
test_endpoint "GET" "/api/qcto/submissions?limit=10" \
  "List submissions (QCTO)" 200

# Test 2: GET /api/qcto/submissions with status filter
test_endpoint "GET" "/api/qcto/submissions?status=APPROVED&limit=10" \
  "List APPROVED submissions" 200

# Test 3: GET /api/qcto/requests
test_endpoint "GET" "/api/qcto/requests?limit=10" \
  "List QCTO requests" 200

# Test 4: GET /api/qcto/requests with status filter
test_endpoint "GET" "/api/qcto/requests?status=PENDING&limit=10" \
  "List PENDING requests" 200

# Test 5: POST /api/qcto/requests (create new request)
# First, get an institution ID (we'll use the dev institutions endpoint)
INSTITUTION_ID=$(curl -sS "$BASE_URL/api/dev/institutions?limit=1" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  | jq -r '.items[0].institution_id // empty' 2>/dev/null || echo "")

if [ -n "$INSTITUTION_ID" ] && [ "$INSTITUTION_ID" != "null" ]; then
  REQUEST_DATA=$(cat <<EOF
{
  "institution_id": "$INSTITUTION_ID",
  "request_type": "READINESS_REVIEW",
  "title": "Test QCTO Request - $(date +%s)",
  "description": "This is a test QCTO request created by the test script",
  "resources": [
    {
      "resource_type": "READINESS",
      "resource_id_value": "test-readiness-$(date +%s)",
      "notes": "Test resource"
    }
  ]
}
EOF
)
  test_endpoint "POST" "/api/qcto/requests" \
    "Create new QCTO request" 201 "$REQUEST_DATA"
else
  echo -e "${YELLOW}⚠️  Skipping POST /api/qcto/requests (no institution found)${NC}"
  echo ""
fi

# Test 6: Test unauthorized access (should fail)
echo -e "${YELLOW}Testing: Unauthorized access (should fail)${NC}"
echo "  GET /api/qcto/submissions (no token)"
response=$(curl -sS -w "\n%{http_code}" -X "GET" "$BASE_URL/api/qcto/submissions" 2>&1) || true
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" -eq "401" ]; then
  echo -e "  ${GREEN}✅ PASS${NC} (Status: 401 - Unauthorized as expected)"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${RED}❌ FAIL${NC} (Expected: 401, Got: $http_code)"
  FAILED=$((FAILED + 1))
fi
echo ""

# Summary
echo -e "${BLUE}📊 Test Summary${NC}"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}💥 Some tests failed!${NC}"
  exit 1
fi
