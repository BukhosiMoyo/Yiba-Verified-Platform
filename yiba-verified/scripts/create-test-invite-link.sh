#!/bin/bash
# Script to create a test student invite via API
# Make sure your dev server is running first!

BASE_URL="${NEXT_PUBLIC_BASE_URL:-http://localhost:3000}"
TEST_EMAIL="test-student-$(date +%s)@test.yibaverified.local"

echo "Creating test student invite..."
echo "Email: $TEST_EMAIL"
echo ""

# You'll need to be authenticated as PLATFORM_ADMIN or INSTITUTION_ADMIN
# For now, this script shows you how to do it manually or via the UI

echo "📋 To create an invite link:"
echo ""
echo "Option 1: Use the Platform Admin UI"
echo "   1. Log in as admin@yiba.local (or your platform admin)"
echo "   2. Go to: $BASE_URL/platform-admin/invites"
echo "   3. Click 'Create Invite'"
echo "   4. Enter email: $TEST_EMAIL"
echo "   5. Select role: STUDENT"
echo "   6. Select an institution"
echo "   7. Copy the invite link from the response"
echo ""
echo "Option 2: Use the API directly (requires auth token)"
echo "   POST $BASE_URL/api/invites"
echo "   Body: {"
echo "     \"email\": \"$TEST_EMAIL\","
echo "     \"role\": \"STUDENT\","
echo "     \"institution_id\": \"<institution_id>\""
echo "   }"
echo ""
echo "Option 3: Run the TypeScript script (if server is running)"
echo "   npx tsx scripts/generate-test-invite.ts"
echo ""
