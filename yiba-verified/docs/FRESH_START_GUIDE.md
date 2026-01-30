# Fresh Start Guide — Reset Everything and New Logins

If you deleted database data but your **browser still has an old session**, you can get stuck (e.g. onboarding page not opening, or redirects in a loop). The app thinks you're still logged in as a user that no longer exists or has different data.

Follow these steps to **remove everything and start fresh** with new logins.

---

## Step 1: Reset the database (delete all data + reseed)

From the project root (e.g. `yiba-verified`):

```bash
npm run db:reset
```

When prompted **"Are you sure you want to continue? (yes/no)"**, type **yes** and press Enter.

This will:

1. **Drop all data** in the database  
2. **Re-run migrations** (empty tables)  
3. **Seed** with fresh test users and data  

After it finishes, the script will print the **new login credentials** (see Step 3 below).

---

## Step 2: Clear your browser session (important)

Your browser still has the **old login** (cookie/session). You must clear it so the app doesn’t use that stale session.

**Option A — Clear site data (recommended)**  
1. Open your app (e.g. `http://localhost:3000`).  
2. Open DevTools (F12 or right‑click → Inspect).  
3. Go to **Application** (Chrome) or **Storage** (Firefox).  
4. Under **Storage** → **Cookies**, select your site (e.g. `http://localhost:3000`).  
5. Right‑click → **Clear** (or delete the cookies for this site).  
6. Optionally clear **Local Storage** and **Session Storage** for this origin.  
7. Close DevTools and **refresh the page** (or go to `/login`).

**Option B — Sign out then clear**  
1. Go to your app and try to open **Account** or any page that has a “Sign out” (or call the signout URL).  
2. If the app is broken, use Option A or C.

**Option C — Use a private/incognito window**  
1. Open a **new Incognito/Private** window.  
2. Go to your app (e.g. `http://localhost:3000/login`).  
3. Use one of the new logins from Step 3. No old session will be used.

After Step 1 + Step 2, you can log in with the **new** accounts below.

---

## Step 3: New login credentials (after reset)

These are the accounts created by the seed. All have **onboarding completed** so you won’t get stuck on onboarding.

### Platform Admin (full access)

| Email | Password | Use for |
|-------|----------|--------|
| `admin@yiba.local` | `Admin@12345` | Primary dev admin |
| `admin@yibaverified.co.za` | `Admin@123!` | Secondary platform admin |

**URL after login:** `/platform-admin`

---

### QCTO

| Email | Password | Role |
|-------|----------|------|
| `qcto-superadmin@yibaverified.co.za` | `QctoAdmin@123!` | QCTO Super Admin |
| `qcto@yibaverified.co.za` | `Qcto@123!` | QCTO User (Gauteng) |

**URL after login:** `/qcto`

---

### Institution

| Email | Password | Role |
|-------|----------|------|
| `instadmin@yibaverified.co.za` | `Inst@123!` | Institution Admin |
| `staff@yibaverified.co.za` | `Staff@123!` | Institution Staff |

**URL after login:** `/institution`

---

### Students (all use same password)

**Password for all:** `Student@123!`

| Email |
|-------|
| `student@yibaverified.co.za` |
| `lerato.student@yibaverified.co.za` |
| `sipho.student@yibaverified.co.za` |
| `thandi.student@yibaverified.co.za` |
| `bongani.student@yibaverified.co.za` |

**URL after login:** `/student`

---

## Quick checklist

1. Run **`npm run db:reset`** and type **yes** when prompted.  
2. **Clear cookies** (and optionally storage) for your app’s origin, or use an **incognito** window.  
3. Open **`/login`** and sign in with one of the emails above.  
4. You should land on the correct dashboard (no stuck onboarding).

---

## If you still see “stuck on onboarding”

- Make sure you **cleared cookies** for the exact origin (e.g. `http://localhost:3000`).  
- Try an **incognito/private** window and log in again.  
- Confirm the DB was reset: run **`npm run db:reset`** again and type **yes**, then clear browser and log in with `admin@yiba.local` / `Admin@12345`.
