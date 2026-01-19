#!/bin/bash
# Check that dev token authentication is properly guarded by NODE_ENV checks
# This script ensures dev auth is only active in development mode

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEV_AUTH_FILE="$PROJECT_ROOT/src/lib/api/devAuth.ts"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Checking dev token authentication guards..."

VIOLATIONS_FOUND=0

# Check that devAuth.ts exists
if [ ! -f "$DEV_AUTH_FILE" ]; then
  echo -e "${RED}❌ ERROR: devAuth.ts not found${NC}"
  exit 1
fi

# Check 1: getDevUserFromRequest must check NODE_ENV === "development"
if ! grep -q 'process\.env\.NODE_ENV !== "development"' "$DEV_AUTH_FILE"; then
  echo -e "${RED}❌ VIOLATION: getDevUserFromRequest missing NODE_ENV check${NC}"
  echo "  File: $DEV_AUTH_FILE"
  echo "  Required: Check for NODE_ENV !== \"development\" at start of function"
  echo ""
  VIOLATIONS_FOUND=$((VIOLATIONS_FOUND + 1))
fi

# Check 2: requireApiContext should only call getDevUserFromRequest if req is provided
# This is a softer check - the function signature already enforces this
if grep -q "getDevUserFromRequest" "$PROJECT_ROOT/src/lib/api/context.ts"; then
  if ! grep -q "if (req)" "$PROJECT_ROOT/src/lib/api/context.ts"; then
    echo -e "${YELLOW}⚠️  WARNING: requireApiContext calls getDevUserFromRequest without req check${NC}"
    echo "  File: $PROJECT_ROOT/src/lib/api/context.ts"
    echo "  Note: This may be acceptable if req is always provided, but verify"
    echo ""
  fi
fi

# Check 3: No direct usage of DEV_API_TOKEN without NODE_ENV guard
# Search for DEV_API_TOKEN usage outside devAuth.ts
OTHER_FILES=$(grep -r "DEV_API_TOKEN" "$PROJECT_ROOT/src" --exclude-dir=node_modules --exclude="devAuth.ts" 2>/dev/null || true)
if [ -n "$OTHER_FILES" ]; then
  echo -e "${YELLOW}⚠️  WARNING: DEV_API_TOKEN used outside devAuth.ts${NC}"
  echo "$OTHER_FILES" | while IFS= read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    echo "  File: $file"
  done
  echo "  Verify these usages are safe"
  echo ""
fi

# Check results
if [ $VIOLATIONS_FOUND -eq 0 ]; then
  echo -e "${GREEN}✅ Dev token authentication is properly guarded${NC}"
  echo "All dev auth code is protected by NODE_ENV === \"development\" checks"
  exit 0
else
  echo -e "${RED}❌ Found $VIOLATIONS_FOUND violation(s)${NC}"
  echo ""
  echo "Dev token authentication must be guarded by NODE_ENV checks"
  echo "See docs/06-Development/Dev-API-Token.md for details"
  exit 1
fi
