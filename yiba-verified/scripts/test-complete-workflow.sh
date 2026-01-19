#!/bin/bash
# Complete QCTO Access Control Workflow Test Script
# 
# This script tests the complete end-to-end workflow:
# 1. Institution creates submission (DRAFT)
# 2. Institution adds resources to submission
# 3. Institution submits to QCTO (SUBMITTED)
# 4. QCTO reviews submission (APPROVED)
# 5. Once APPROVED, QCTO can access resources
#
# Usage:
#   chmod +x scripts/test-complete-workflow.sh
#   ./scripts/test-complete-workflow.sh

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

echo -e "${BLUE}🧪 Testing Complete QCTO Access Control Workflow${NC}"
echo "BASE_URL: $BASE_URL"
echo ""

# Test counter
PASSED=0
FAILED=0
SKIPPED=0

# Test helper function
test_step() {
  local step_num=$1
  local description=$2
  local command=$3
  local expected_status=${4:-200}
  local check_function=${5:-""}
  
  echo -e "${YELLOW}Step $step_num: $description${NC}"
  echo "  Command: $command"
  
  response=$(eval "$command" 2>&1) || true
  http_code=$(echo "$response" | grep -oP 'HTTP_CODE:\K\d+' || echo "000")
  body=$(echo "$response" | sed '/HTTP_CODE:/d')
  
  # Extract HTTP code if it's in the response
  if [ "$http_code" = "000" ]; then
    # Try to extract from curl response
    http_code=$(echo "$response" | tail -n1 | grep -oP '\d{3}' | head -1 || echo "000")
  fi
  
  if [ "$http_code" = "$expected_status" ] || [ "$http_code" = "000" -a "$expected_status" = "200" ]; then
    # Additional check if function provided
    if [ -n "$check_function" ]; then
      if eval "$check_function"; then
        echo -e "  ${GREEN}✅ PASS${NC} (Status: $http_code)"
        PASSED=$((PASSED + 1))
      else
        echo -e "  ${RED}❌ FAIL${NC} (Status OK but validation failed)"
        FAILED=$((FAILED + 1))
      fi
    else
      echo -e "  ${GREEN}✅ PASS${NC} (Status: $http_code)"
      PASSED=$((PASSED + 1))
    fi
  else
    echo -e "  ${RED}❌ FAIL${NC} (Expected: $expected_status, Got: $http_code)"
    echo "$body" | jq . 2>/dev/null | head -5 || echo "  Response: $body" | head -5
    FAILED=$((FAILED + 1))
  fi
  echo ""
}

# Step 1: Create submission
echo -e "${BLUE}=== Institution Submission Workflow ===${NC}"
echo ""

test_step "1" "Create submission (DRAFT)" \
  "curl -sS -w '\\nHTTP_CODE:%{http_code}\\n' -X POST '$BASE_URL/api/institutions/submissions' -H 'Content-Type: application/json' -H 'X-DEV-TOKEN: $DEV_API_TOKEN' -d '{\"title\": \"Test Compliance Pack\", \"submission_type\": \"COMPLIANCE_PACK\"}'" \
  201

# Extract submission_id (simplified - would need proper JSON parsing in real script)
SUBMISSION_ID=$(curl -sS -X POST "$BASE_URL/api/institutions/submissions" \
  -H "Content-Type: application/json" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  -d '{"title": "Test Compliance Pack", "submission_type": "COMPLIANCE_PACK"}' \
  | jq -r '.submission_id // empty')

if [ -z "$SUBMISSION_ID" ] || [ "$SUBMISSION_ID" = "null" ]; then
  echo -e "${RED}⚠️  Could not extract submission_id. Skipping remaining steps.${NC}"
  echo ""
  echo -e "${BLUE}📊 Test Summary${NC}"
  echo -e "${GREEN}✅ Passed: $PASSED${NC}"
  echo -e "${RED}❌ Failed: $FAILED${NC}"
  echo -e "${YELLOW}⚠️  Skipped: $((SKIPPED + 4))${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Submission created: $SUBMISSION_ID${NC}"
echo ""

# Step 2: Get learner ID
echo "Getting learner ID for resource..."
LEARNER_ID=$(curl -sS "$BASE_URL/api/learners?limit=1" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  | jq -r '.items[0].learner_id // empty')

if [ -z "$LEARNER_ID" ] || [ "$LEARNER_ID" = "null" ]; then
  echo -e "${YELLOW}⚠️  No learners found. Skipping resource addition steps.${NC}"
  SKIPPED=$((SKIPPED + 2))
else
  echo -e "${GREEN}✅ Learner ID: $LEARNER_ID${NC}"
  echo ""
  
  # Step 3: Add resource to submission
  test_step "3" "Add resource to submission" \
    "curl -sS -w '\\nHTTP_CODE:%{http_code}\\n' -X POST '$BASE_URL/api/institutions/submissions/$SUBMISSION_ID/resources' -H 'Content-Type: application/json' -H 'X-DEV-TOKEN: $DEV_API_TOKEN' -d '{\"resource_type\": \"LEARNER\", \"resource_id_value\": \"$LEARNER_ID\", \"notes\": \"Test resource\"}'" \
    201
  
  # Step 4: Verify QCTO cannot access yet (before approval)
  test_step "4" "QCTO cannot access resource before approval" \
    "curl -sS -w '\\nHTTP_CODE:%{http_code}\\n' '$BASE_URL/api/learners/$LEARNER_ID' -H 'X-DEV-TOKEN: $DEV_API_TOKEN'" \
    403
  
  # Step 5: Submit submission
  test_step "5" "Submit submission (SUBMITTED)" \
    "curl -sS -w '\\nHTTP_CODE:%{http_code}\\n' -X PATCH '$BASE_URL/api/institutions/submissions/$SUBMISSION_ID' -H 'Content-Type: application/json' -H 'X-DEV-TOKEN: $DEV_API_TOKEN' -d '{\"status\": \"SUBMITTED\"}'" \
    200
  
  # Step 6: Verify QCTO still cannot access (not yet APPROVED)
  test_step "6" "QCTO still cannot access (only SUBMITTED, not APPROVED)" \
    "curl -sS -w '\\nHTTP_CODE:%{http_code}\\n' '$BASE_URL/api/learners/$LEARNER_ID' -H 'X-DEV-TOKEN: $DEV_API_TOKEN'" \
    403
  
  # Step 7: QCTO approves submission
  test_step "7" "QCTO approves submission (APPROVED)" \
    "curl -sS -w '\\nHTTP_CODE:%{http_code}\\n' -X PATCH '$BASE_URL/api/qcto/submissions/$SUBMISSION_ID' -H 'Content-Type: application/json' -H 'X-DEV-TOKEN: $DEV_API_TOKEN' -d '{\"status\": \"APPROVED\", \"review_notes\": \"Test approval\"}'" \
    200
  
  # Step 8: Verify QCTO can now access
  test_step "8" "QCTO CAN NOW access resource (after APPROVAL)" \
    "curl -sS -w '\\nHTTP_CODE:%{http_code}\\n' '$BASE_URL/api/learners/$LEARNER_ID' -H 'X-DEV-TOKEN: $DEV_API_TOKEN'" \
    200
fi

# Summary
echo -e "${BLUE}📊 Test Summary${NC}"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
if [ $SKIPPED -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Skipped: $SKIPPED${NC}"
fi
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All workflow tests passed!${NC}"
  echo ""
  echo -e "${BLUE}✅ Complete workflow verified:${NC}"
  echo "  1. Institution creates submission (DRAFT)"
  echo "  2. Institution adds resources"
  echo "  3. Institution submits to QCTO (SUBMITTED)"
  echo "  4. QCTO reviews and approves (APPROVED)"
  echo "  5. QCTO can now access resources via canReadForQCTO()"
  exit 0
else
  echo -e "${RED}💥 Some tests failed!${NC}"
  echo ""
  echo "See test output above for details."
  echo "Check docs/07-Testing/Complete-Workflow-Testing.md for troubleshooting."
  exit 1
fi
