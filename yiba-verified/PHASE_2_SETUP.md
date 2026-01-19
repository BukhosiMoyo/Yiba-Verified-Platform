# Phase 2: Auth Foundation - Setup Instructions

## Files Created/Updated

### Core Auth Files
1. `src/lib/auth.ts` - NextAuth configuration with Credentials provider
2. `src/lib/password.ts` - bcrypt password hashing utilities
3. `src/lib/prisma.ts` - Prisma client singleton
4. `src/lib/get-server-session.ts` - Helper for server-side session access
5. `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API route handler

### Auth UI Pages
6. `src/app/auth/login/page.tsx` - Login page with role-based redirects
7. `src/app/auth/unauthorized/page.tsx` - Unauthorized access page
8. `src/app/auth/logout/page.tsx` - Logout page

### Layout Updates (Server-Side Protection)
9. `src/app/platform-admin/layout.tsx` - Uses getServerSession, redirects if no session/wrong role
10. `src/app/qcto/layout.tsx` - Uses getServerSession, redirects if no session/wrong role
11. `src/app/institution/layout.tsx` - Uses getServerSession, redirects if no session/wrong role
12. `src/app/student/layout.tsx` - Uses getServerSession, redirects if no session/wrong role

### Component Updates
13. `src/components/layout/Topbar.tsx` - Uses signOut from next-auth/react, shows session data
14. `src/app/layout.tsx` - Root layout with SessionProvider wrapper
15. `src/app/providers.tsx` - SessionProvider client component
16. `src/app/globals.css` - Tailwind base styles

### Prisma Schema Updates
17. `prisma/schema.prisma` - Added:
    - User.password_hash, User.emailVerified, User.image
    - Account model (NextAuth adapter)
    - Session model (NextAuth adapter)
    - VerificationToken model (NextAuth adapter)

### Migration
18. `prisma/migrations/20250115000000_add_nextauth_tables/migration.sql` - SQL migration for NextAuth tables

### Seed Script
19. `prisma/seed.ts` - Seed script with test accounts

## Required Dependencies

Install these packages:

```bash
npm install next-auth@beta @auth/prisma-adapter bcryptjs
npm install -D @types/bcryptjs
```

## Environment Variables

Add to `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/yibaverified"
NEXTAUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"  # Or your production URL
```

## Setup Steps

### 1. Install Dependencies
```bash
npm install next-auth@beta @auth/prisma-adapter bcryptjs
npm install -D @types/bcryptjs
```

### 2. Run Prisma Migration
```bash
# Apply the NextAuth tables migration
npx prisma migrate dev --name add_nextauth_tables

# Or if using the SQL migration directly:
psql $DATABASE_URL -f prisma/migrations/20250115000000_add_nextauth_tables/migration.sql
```

### 3. Seed Database
```bash
# Add to package.json scripts:
# "db:seed": "tsx prisma/seed.ts"

# Run seed:
npm run db:seed
# OR
npx tsx prisma/seed.ts
```

### 4. Start Development Server
```bash
npm run dev
```

## Test Accounts

After seeding, use these accounts:

| Role | Email | Password |
|------|-------|----------|
| PLATFORM_ADMIN | admin@yibaverified.co.za | Admin@123! |
| QCTO_USER | qcto@yibaverified.co.za | Qcto@123! |
| INSTITUTION_ADMIN | instadmin@yibaverified.co.za | Inst@123! |
| INSTITUTION_STAFF | staff@yibaverified.co.za | Staff@123! |
| STUDENT | student@yibaverified.co.za | Student@123! |

## Session Structure

The session includes:
- `userId` - User's UUID
- `email` - User's email
- `name` - User's full name
- `role` - User's role (PLATFORM_ADMIN, QCTO_USER, etc.)
- `institutionId` - User's institution ID (nullable)

## Role-Based Redirects

After login, users are redirected based on role:
- PLATFORM_ADMIN → `/platform-admin`
- QCTO_USER → `/qcto`
- INSTITUTION_ADMIN → `/institution`
- INSTITUTION_STAFF → `/institution`
- STUDENT → `/student`

## Security Features

1. **Server-Side Protection**: All layouts check session server-side
2. **Role Validation**: Layouts verify role matches route area
3. **Deny-by-Default**: No session = redirect to login
4. **Wrong Role**: Redirect to unauthorized page
5. **Password Hashing**: bcrypt with 12 salt rounds
6. **JWT Strategy**: Session stored in JWT (no database lookups per request)

## Verification Checklist

- [ ] Dependencies installed
- [ ] Environment variables set
- [ ] Migration applied
- [ ] Database seeded
- [ ] Can login with test accounts
- [ ] Role-based redirects work
- [ ] Session includes role + institutionId
- [ ] Logout works
- [ ] Unauthorized page shows for wrong role
- [ ] Middleware still works (route-level protection)

## Notes

- SessionProvider is in root layout (providers.tsx)
- All layouts are now async server components
- Topbar uses useSession hook for client-side session access
- Login page fetches session after signIn to determine redirect
- Passwords are hashed with bcrypt (12 rounds)
- No plaintext passwords stored
