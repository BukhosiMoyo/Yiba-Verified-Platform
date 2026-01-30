#!/bin/bash

# Reset Database Script
# This script will:
# 1. Reset the database (drop all data)
# 2. Re-run all migrations
# 3. Seed with fresh test data

set -e # Exit on any error

echo "🔄 Starting database reset..."
echo ""

# Navigate to the yiba-verified directory
cd "$(dirname "$0")/.."

# Skip prompt if --force or -f is passed (e.g. npm run db:reset -- --force)
SKIP_PROMPT=false
for arg in "$@"; do
  if [[ "$arg" == "--force" || "$arg" == "-f" ]]; then
    SKIP_PROMPT=true
    break
  fi
done

if [[ "$SKIP_PROMPT" != "true" ]]; then
  echo "⚠️  WARNING: This will DELETE ALL DATA in your database!"
  echo "📍 Database: yiba_verified (localhost:5432)"
  echo ""
  read -p "Are you sure you want to continue? (yes/no): " -r
  echo ""

  if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Reset cancelled."
    exit 1
  fi
fi

echo "1️⃣  Resetting database (this will drop all data)..."
npx prisma migrate reset --force --skip-seed

echo ""
echo "2️⃣  Running migrations..."
npx prisma migrate deploy

echo ""
echo "3️⃣  Seeding database with fresh test data..."
npm run seed

echo ""
echo "✅ Database reset complete!"
echo ""
echo "📋 Test Accounts Created:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔑 PLATFORM ADMIN"
echo "   Email:    admin@yiba.local"
echo "   Password: Admin@12345"
echo "   URL:      /platform-admin"
echo ""
echo "   Email:    admin@yibaverified.co.za"
echo "   Password: Admin@123!"
echo "   URL:      /platform-admin"
echo ""
echo "👥 QCTO SUPER ADMIN"
echo "   Email:    qcto-superadmin@yibaverified.co.za"
echo "   Password: QctoAdmin@123!"
echo "   URL:      /qcto"
echo ""
echo "👥 QCTO USER (Gauteng)"
echo "   Email:    qcto@yibaverified.co.za"
echo "   Password: Qcto@123!"
echo "   URL:      /qcto"
echo ""
echo "🏫 INSTITUTION ADMIN"
echo "   Email:    instadmin@yibaverified.co.za"
echo "   Password: Inst@123!"
echo "   URL:      /institution"
echo ""
echo "👨‍🏫 INSTITUTION STAFF"
echo "   Email:    staff@yibaverified.co.za"
echo "   Password: Staff@123!"
echo "   URL:      /institution"
echo ""
echo "🎓 STUDENTS (5 accounts, password: Student@123!)"
echo "   student@yibaverified.co.za"
echo "   lerato.student@yibaverified.co.za"
echo "   sipho.student@yibaverified.co.za"
echo "   thandi.student@yibaverified.co.za"
echo "   bongani.student@yibaverified.co.za"
echo "   URL:      /student"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANT: Clear your browser cookies for this site (or use"
echo "   an incognito window), then go to /login. See docs/FRESH_START_GUIDE.md"
echo ""
echo "🚀 You can now login with any of these accounts!"
echo ""
