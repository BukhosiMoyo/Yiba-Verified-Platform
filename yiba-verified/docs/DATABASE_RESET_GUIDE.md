# Database Reset Guide

## Quick Reset (Recommended)

Run this command to reset the entire database and create fresh test accounts:

```bash
cd yiba-verified
npm run db:reset
```

When prompted **"Are you sure you want to continue? (yes/no)"**, type **yes**.

To skip the prompt (e.g. for scripting): `npm run db:reset -- --force`

This will:
1. ⚠️ **DELETE ALL DATA** from your database
2. Re-run all migrations to create fresh tables
3. Seed with clean test data

**If you had an account logged in in your browser:** clear your browser cookies for this site (or use an incognito window) after reset, then go to `/login`. See **[FRESH_START_GUIDE.md](FRESH_START_GUIDE.md)** for the full “fresh start” steps and correct login credentials.

## Manual Reset (Alternative)

If you prefer to run the commands separately:

```bash
cd yiba-verified

# Reset database (drops all data and re-runs migrations)
npx prisma migrate reset --force

# Seed with test data
npm run seed
```

## Test Accounts

After reset, you'll have these accounts ready to use. **Clear browser cookies** (or use incognito) before logging in; see [FRESH_START_GUIDE.md](FRESH_START_GUIDE.md).

### Platform Admin
- **Email:** `admin@yiba.local` — **Password:** `Admin@12345`
- **Email:** `admin@yibaverified.co.za` — **Password:** `Admin@123!`
- **URL:** `/platform-admin`

### QCTO Super Admin
- **Email:** `qcto-superadmin@yibaverified.co.za` — **Password:** `QctoAdmin@123!`
- **URL:** `/qcto`

### QCTO User (Gauteng)
- **Email:** `qcto@yibaverified.co.za` — **Password:** `Qcto@123!`
- **URL:** `/qcto`

### Institution Admin
- **Email:** `instadmin@yibaverified.co.za` — **Password:** `Inst@123!`
- **URL:** `/institution`

### Institution Staff
- **Email:** `staff@yibaverified.co.za` — **Password:** `Staff@123!`
- **URL:** `/institution`

### Students (5 accounts)
All students use password: **`Student@123!`**

- `student@yibaverified.co.za`
- `lerato.student@yibaverified.co.za`
- `sipho.student@yibaverified.co.za`
- `thandi.student@yibaverified.co.za`
- `bongani.student@yibaverified.co.za`
- **URL:** `/student`

## Testing Impersonation

After reset, you can test the impersonation feature:

1. Login as Platform Admin (`admin@test.com`)
2. Go to `/platform-admin/users`
3. Click on any user (e.g., one of the students)
4. Click "Generate Login Link"
5. Open the link in a new incognito window to test

## Seed Options

You can also seed specific datasets:

```bash
# Standard development seed (default)
npm run seed

# Demo mode seed (special demo data)
npm run seed:demo

# Production seed (minimal production data)
npm run seed:production
```

## Notes

- The reset script will ask for confirmation before deleting data
- Make sure your dev server is running after reset
- All accounts are created with strong passwords for security
- Student accounts include linked Learner records with sample data
