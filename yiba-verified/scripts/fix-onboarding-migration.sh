#!/bin/bash
# Helper script to fix the onboarding migration
# Run this after creating the migration file with --create-only

MIGRATION_DIR=$(find prisma/migrations -type d -name "*add_student_onboarding" | head -1)

if [ -z "$MIGRATION_DIR" ]; then
    echo "❌ Migration directory not found. Please run: npx prisma migrate dev --create-only --name add_student_onboarding"
    exit 1
fi

MIGRATION_FILE="$MIGRATION_DIR/migration.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

# Check if fix already applied
if grep -q "UPDATE \"Learner\"" "$MIGRATION_FILE"; then
    echo "✅ Migration file already has the fix applied."
    exit 0
fi

# Create backup
cp "$MIGRATION_FILE" "$MIGRATION_FILE.backup"
echo "📋 Created backup: $MIGRATION_FILE.backup"

# Add the fix at the beginning of the file
FIX_SQL="-- Update existing NULL values before making column required
UPDATE \"Learner\" 
SET \"disability_status\" = 'NO' 
WHERE \"disability_status\" IS NULL;

"

# Prepend the fix to the migration file
echo "$FIX_SQL$(cat "$MIGRATION_FILE")" > "$MIGRATION_FILE"

echo "✅ Added fix to migration file: $MIGRATION_FILE"
echo ""
echo "📝 Next steps:"
echo "   1. Review the migration file to ensure it looks correct"
echo "   2. Run: npx prisma migrate dev"
echo ""
