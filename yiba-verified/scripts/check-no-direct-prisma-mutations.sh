#!/bin/bash
# Check for forbidden direct Prisma mutations in API routes
# This script scans src/app/api for direct prisma.*.create/update/delete/upsert calls
# and fails if any are found (exit code 1).

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
API_DIR="$PROJECT_ROOT/src/app/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Checking for direct Prisma mutations in API routes..."

# Patterns to search for (forbidden)
PATTERNS=(
  "prisma\.[a-zA-Z_]*\.create\("
  "prisma\.[a-zA-Z_]*\.update\("
  "prisma\.[a-zA-Z_]*\.delete\("
  "prisma\.[a-zA-Z_]*\.upsert\("
)

VIOLATIONS_FOUND=0

# Search for violations in src/app/api (excluding node_modules, .next, etc.)
for pattern in "${PATTERNS[@]}"; do
  # Use grep to find matches, excluding legitimate uses in mutations directory
  # We only want to flag direct calls in API routes, not in src/server/mutations/*
  while IFS= read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    line_num=$(echo "$line" | cut -d: -f2)
    content=$(echo "$line" | cut -d: -f3-)
    
    # Skip if file is in mutations directory (those use tx anyway)
    if [[ "$file" == *"/mutations/"* ]]; then
      continue
    fi
    
    # Skip if it's a comment
    if echo "$content" | grep -qE "^\s*//"; then
      continue
    fi
    
    # Found a violation
    echo -e "${RED}❌ VIOLATION FOUND:${NC}"
    echo -e "  ${YELLOW}File:${NC} $file"
    echo -e "  ${YELLOW}Line:${NC} $line_num"
    echo -e "  ${YELLOW}Content:${NC} $content"
    echo ""
    VIOLATIONS_FOUND=$((VIOLATIONS_FOUND + 1))
  done < <(grep -rnE "$pattern" "$API_DIR" 2>/dev/null || true)
done

# Check results
if [ $VIOLATIONS_FOUND -eq 0 ]; then
  echo -e "${GREEN}✅ No direct Prisma mutations found in API routes${NC}"
  echo "All mutations are properly using mutateWithAudit()"
  exit 0
else
  echo -e "${RED}❌ Found $VIOLATIONS_FOUND violation(s)${NC}"
  echo ""
  echo "All API mutations must go through mutateWithAudit() from @/server/mutations/mutate"
  echo "See docs/06-Development/API-Mutation-Pattern.md for details"
  exit 1
fi
