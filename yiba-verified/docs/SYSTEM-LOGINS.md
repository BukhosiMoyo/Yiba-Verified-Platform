# System Login Credentials

This document contains the **development/test** user credentials for the Yiba Verified platform. These accounts are created by the **default** database seed (`npx prisma db seed`).

> **Demo accounts** (e.g. `thabo.mokoena@demo.yibaverified.local` / `Demo@123!`) are created by a separate seed. See [DEMO-LOGINS.md](DEMO-LOGINS.md) and run `npm run seed:demo` first.

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

### Students (all use password: `Student@123!`)

| Email | Name | National ID |
|-------|------|-------------|
| `student@yibaverified.co.za` | Test Student | 9001015009087 |
| `lerato.student@yibaverified.co.za` | Lerato Dlamini | 9203155011082 |
| `sipho.student@yibaverified.co.za` | Sipho Khumalo | 9506205007085 |
| `thandi.student@yibaverified.co.za` | Thandi Nkosi | 9808125013081 |
| `bongani.student@yibaverified.co.za` | Bongani Sithole | 0012255015083 |

- **Role:** `STUDENT`
- **Access:** Student dashboard (`/student`)

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

This runs the **default** seed (no `DEMO_MODE`). It does **not** create demo users; for those, use `npm run seed:demo` and see [DEMO-LOGINS.md](DEMO-LOGINS.md).

## Notes

- All passwords follow a pattern: `[Role]@123!` or `Admin@12345` for the primary admin
- The primary admin account (`admin@yiba.local`) is updated on each seed run, ensuring the password is always current
- Other accounts are only created if they don't exist (upsert behavior)
- All accounts are set to `ACTIVE` status
- The test institution and learner records are also created during seeding
