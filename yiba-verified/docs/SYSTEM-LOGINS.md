# System Login Credentials

This document contains the test user credentials for the Yiba Verified platform. These accounts are created by the database seed script (`prisma/seed.ts`).

## 🔑 Primary Development Login

**Platform Administrator**
- **Email:** `admin@yiba.local`
- **Password:** `Admin@12345`
- **Role:** `PLATFORM_ADMIN`
- **Access:** Full platform administration access

## 📋 Additional Test Accounts

### QCTO User
- **Email:** `qcto@yibaverified.co.za`
- **Password:** `Qcto@123!`
- **Role:** `QCTO_USER`
- **Access:** QCTO dashboard and review functionality

### Institution Administrator
- **Email:** `instadmin@yibaverified.co.za`
- **Password:** `Inst@123!`
- **Role:** `INSTITUTION_ADMIN`
- **Access:** Institution management dashboard
- **Institution:** Test Institution (TEST-INST-001)

### Institution Staff
- **Email:** `staff@yibaverified.co.za`
- **Password:** `Staff@123!`
- **Role:** `INSTITUTION_STAFF`
- **Access:** Institution staff dashboard
- **Institution:** Test Institution (TEST-INST-001)

### Student
- **Email:** `student@yibaverified.co.za`
- **Password:** `Student@123!`
- **Role:** `STUDENT`
- **Access:** Student dashboard
- **Linked Learner:** National ID 9001015009087

## User Roles & Access

| Role | Route Access | Description |
|------|-------------|------------|
| `PLATFORM_ADMIN` | `/platform-admin` | Full platform administration |
| `QCTO_USER` | `/qcto` | QCTO review and approval workflows |
| `INSTITUTION_ADMIN` | `/institution` | Institution-level administration |
| `INSTITUTION_STAFF` | `/institution` | Institution staff operations |
| `STUDENT` | `/student` | Student portal access |

## Seeding the Database

To create these accounts in your database, run:

```bash
npx prisma db seed
```

Or if you have a custom seed script configured:

```bash
npm run seed
```

## Notes

- All passwords follow a pattern: `[Role]@123!` or `Admin@12345` for the primary admin
- The primary admin account (`admin@yiba.local`) is updated on each seed run, ensuring the password is always current
- Other accounts are only created if they don't exist (upsert behavior)
- All accounts are set to `ACTIVE` status
- The test institution and learner records are also created during seeding
