# Docker Database Setup

**Project:** Yiba Verified  
**Document:** Docker-DB-Setup.md  
**Version:** v1.0  
**Date:** 2026-01-16  
**Location:** 06-Development/

---

## Overview

This document describes how to set up and work with the PostgreSQL database running in a Docker container for local development.

**Note:** You do NOT need `psql` installed on your Mac. All database operations are performed via Prisma commands.

---

## 1. Docker Container Management

### Start the Database Container

```bash
docker run -d \
  --name yiba-postgres \
  -e POSTGRES_DB=yiba_verified \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_HOST_AUTH_METHOD=trust \
  -p 5432:5432 \
  postgres:16
```

Or if the container already exists:

```bash
docker start yiba-postgres
```

### Stop the Container

```bash
docker stop yiba-postgres
```

### Remove the Container (⚠️ Destroys all data)

```bash
docker rm -f yiba-postgres
```

### Check Container Status

```bash
docker ps --filter "name=yiba-postgres"
```

---

## 2. Environment Configuration

### `.env` File

Your `.env` file should contain:

```env
DATABASE_URL="postgresql://postgres@localhost:5432/yiba_verified?schema=public"
NEXTAUTH_SECRET="(your-secret-here)"
NEXTAUTH_URL="http://localhost:3000"
```

**Note:** The container is configured with `POSTGRES_HOST_AUTH_METHOD=trust`, so no password is required in the connection string. The format `postgresql://postgres@localhost:5432/...` (without password) works correctly.

---

## 3. Database Migrations

### Apply Migrations

```bash
npx prisma migrate dev
```

This command will:
- Detect schema changes
- Create a new migration if needed
- Apply pending migrations
- Generate Prisma Client

### Check Migration Status

```bash
npx prisma migrate status
```

### Reset Database (⚠️ Destroys all data)

**For development only!** This will drop the database, recreate it, apply all migrations, and run the seed script:

```bash
npx prisma migrate reset
```

To skip seeding:

```bash
npx prisma migrate reset --skip-seed
```

---

## 4. Prisma Client Generation

After schema changes or migrations:

```bash
npx prisma generate
```

This is automatically run by `prisma migrate dev`, but you may need to run it manually if you edit the schema without creating a migration.

---

## 5. Database Seeding

### Run Seed Script

```bash
npx prisma db seed
```

This will create test data including a primary development login account and additional test users.

**Note:** The seed script uses `tsx` to run TypeScript. If you encounter errors, ensure `tsx` is installed:

```bash
npm install --save-dev tsx
```

**Note:** The seed script uses `upsert`, so it's safe to run multiple times. It will update existing users if they already exist.

### Seeded Login Credentials

**🔑 Primary Development Login:**
- **Email:** `admin@yiba.local`
- **Password:** `Admin@12345`
- **Role:** `PLATFORM_ADMIN`

**📋 Additional Test Accounts:**
- **PLATFORM_ADMIN:** `admin@yibaverified.co.za` / `Admin@123!`
- **QCTO_USER:** `qcto@yibaverified.co.za` / `Qcto@123!`
- **INSTITUTION_ADMIN:** `instadmin@yibaverified.co.za` / `Inst@123!`
- **INSTITUTION_STAFF:** `staff@yibaverified.co.za` / `Staff@123!`
- **STUDENT:** `student@yibaverified.co.za` / `Student@123!`

---

## 6. Development Workflow

### Initial Setup

1. Start the Docker container:
   ```bash
   docker start yiba-postgres
   ```

2. Apply migrations:
   ```bash
   npx prisma migrate dev
   ```

3. Seed the database (creates test accounts including `admin@yiba.local`):
   ```bash
   npx prisma db seed
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Login with seeded credentials:
   - Navigate to `http://localhost:3000/auth/login`
   - Email: `admin@yiba.local`
   - Password: `Admin@12345`
   - Email: `admin@yiba.local`
   - Password: `Admin@12345`

### Daily Development

1. Start the container (if stopped):
   ```bash
   docker start yiba-postgres
   ```

2. Start the dev server:
   ```bash
   npm run dev
   ```

### After Schema Changes

1. Create and apply migration:
   ```bash
   npx prisma migrate dev --name descriptive_name
   ```

2. Prisma Client is automatically regenerated.

---

## 7. Troubleshooting

### Connection Issues

**Test connectivity without `psql`:**

```bash
npx prisma db pull
```

If this succeeds (even if the database is empty), your connection is working.

**Common issues:**

- **P1000 (Authentication failed):** Check that the container uses `POSTGRES_HOST_AUTH_METHOD=trust` or update your `DATABASE_URL` to include a password.
- **Connection refused:** Ensure the container is running (`docker ps`) and port 5432 is not in use by another service.

### Migration Issues

**P3006 (Shadow database error):**

If you see errors about shadow database creation, try:

```bash
npx prisma migrate reset
```

This will reset the database and apply all migrations from scratch.

**Migration history inconsistent:**

If migrations are out of sync, you can reset (dev only):

```bash
# Remove old migrations (backup first if needed)
rm -rf prisma/migrations/*

# Create fresh baseline
npx prisma migrate dev --name init
```

---

## 8. Database Introspection

To inspect the current database schema:

```bash
npx prisma db pull
```

This will update your `schema.prisma` file to match the database. **Use with caution** - it may overwrite manual schema changes.

---

## 9. Production Considerations

⚠️ **Important:** The setup described here is for **development only**.

For production:
- Use password-based authentication
- Set `POSTGRES_PASSWORD` environment variable
- Update `DATABASE_URL` to include the password: `postgresql://postgres:password@host:5432/dbname`
- Use `prisma migrate deploy` instead of `prisma migrate dev`
- Never use `prisma migrate reset` in production

---

## 10. Quick Reference

| Task | Command |
|------|---------|
| Start container | `docker start yiba-postgres` |
| Stop container | `docker stop yiba-postgres` |
| Apply migrations | `npx prisma migrate dev` |
| Check status | `npx prisma migrate status` |
| Reset DB (dev) | `npx prisma migrate reset` |
| Generate client | `npx prisma generate` |
| Seed database | `npx prisma db seed` |
| Test connection | `npx prisma db pull` |
| Start dev server | `npm run dev` |

---

## 11. Compliance-Grade Development

### Mutation Pattern Enforcement

**Before pushing, run:**
```bash
npm run check:mutations
```

This is **required for compliance-grade development**. The script verifies that all API mutations go through `mutateWithAudit()`, ensuring:
- Authentication enforcement
- RBAC (deny-by-default)
- Institution scoping
- QCTO read-only restrictions
- Transactional audit logging

See `docs/06-Development/API-Mutation-Pattern.md` for the complete mutation pattern documentation.

---

**End of Document**
