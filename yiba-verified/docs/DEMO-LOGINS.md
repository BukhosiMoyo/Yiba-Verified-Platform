# Demo Account Login Credentials

Demo accounts are **only** created when you run the **demo seed**. They are separate from the [system/dev logins](SYSTEM-LOGINS.md).

## Create demo accounts first

Run the demo seed:

```bash
npm run seed:demo
```

Or from the `yiba-verified` directory:

```bash
DEMO_MODE=true npx tsx prisma/seed.ts
```

---

## Password (all demo users)

**Password:** `Demo@123!`

---

## Platform admins (3–5)

| Email | Role |
|-------|------|
| `thabo.mokoena@demo.yibaverified.local` | PLATFORM_ADMIN |
| `lerato.khumalo@demo.yibaverified.local` | PLATFORM_ADMIN |
| `sipho.dlamini@demo.yibaverified.local` | PLATFORM_ADMIN |
| `nomvula.nkosi@demo.yibaverified.local` | PLATFORM_ADMIN |
| `bongani.sithole@demo.yibaverified.local` | PLATFORM_ADMIN |

---

## QCTO user

| Email | Role |
|-------|------|
| `qcto.demo@demo.yibaverified.local` | QCTO_USER |

---

## Institution admins and staff

Per institution, the **slug** is the first 8 alphanumeric characters of the registration number (hyphens removed), lowercased.  
Example: `DEMO-2023-0001` → `demo2023`.

- **Institution admin:** `admin.{slug}@demo.yibaverified.local`  
  e.g. `admin.demo2023@demo.yibaverified.local`
- **Staff (1–3 per institution):**  
  `staff0.{slug}@demo.yibaverified.local`, `staff1.{slug}@demo.yibaverified.local`, `staff2.{slug}@demo.yibaverified.local`

---

## Quick copy‑paste (after `npm run seed:demo`)

| Role | Email | Password |
|------|-------|----------|
| Platform Admin | `thabo.mokoena@demo.yibaverified.local` | `Demo@123!` |
| QCTO | `qcto.demo@demo.yibaverified.local` | `Demo@123!` |
| Institution Admin (example) | `admin.demo2023@demo.yibaverified.local` | `Demo@123!` |

---

## Wipe demo data

To remove all demo institutions, users, learners, etc.:

```bash
npm run seed:demo:wipe
```

---

## Two seed modes

| Command | Creates |
|---------|---------|
| `npx prisma db seed` | **Dev/system** accounts only: `admin@yiba.local`, `qcto@yibaverified.co.za`, etc. See [SYSTEM-LOGINS.md](SYSTEM-LOGINS.md). |
| `npm run seed:demo` | **Demo** accounts only: `*@demo.yibaverified.local`. |

You can run both: system seed first, then demo seed. Both sets of accounts will exist.
