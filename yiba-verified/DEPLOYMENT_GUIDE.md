# Yiba Verified - Deployment & Hosting Guide

This guide outlines the recommended infrastructure, estimated costs, and step-by-step instructions for deploying the **Yiba Verified** platform.

---

## 🏗 Recommended Technology Stack

We recommend the **"Modern Vercel Stack"** for its ease of use, scalability, and developer experience.

| Component | Provider | Description |
| :--- | :--- | :--- |
| **Frontend / API** | **[Vercel](https://vercel.com)** | The creators of Next.js. Offers the best performance and easiest CI/CD for Next.js apps. |
| **Database** | **[Neon](https://neon.tech)** | Serverless PostgreSQL. It scales to zero when not in use (saving money) and works perfectly with Prisma. |
| **File Storage** | **[AWS S3](https://aws.amazon.com/s3/)** | Industry standard object storage for documents and images. |
| **Emails** | **[Resend](https://resend.com)** | Modern email API with excellent deliverability and developer experience. |
| **Maps** | **[Google Maps](https://cloud.google.com/maps-platform/)** | Required for location services. |

---

## 💰 Estimated Costs

### Option 1: The "Bootstrapper" (MVP / Testing)
*Best for: Initial launch, demos, and testing phases.*

| Service | Tier | Cost |
| :--- | :--- | :--- |
| **Vercel** | Hobby | **Free** (Personal / Non-commercial) |
| **Neon** | Free Tier | **Free** (0.5GB storage) |
| **AWS S3** | Standard | **<$1.00/mo** (Pay for usage) |
| **Resend** | Free | **Free** (100 emails/day) |
| **Google Maps** | Free Tier | **Free** ($200 monthly credit) |
| **Domain** | - | **~$15/year** |
| **TOTAL** | | **~$1.50 / month** |

### Option 2: The "Production" (Scale)
*Best for: Live business operations with paying customers.*

| Service | Tier | Cost |
| :--- | :--- | :--- |
| **Vercel** | Pro | **$20/mo** per seat |
| **Neon** | Launch | **$19/mo** (10GB storage) |
| **AWS S3** | Standard | **~$5.00/mo** (varies by usage) |
| **Resend** | Pro | **$20/mo** (Unlimited daily sending) |
| **Google Maps** | Pay-as-you-go | **Varies** |
| **TOTAL** | | **~$65 - $100 / month** |

---

## 🚀 Deployment Instructions

### Prerequisites
Ensure you have the following accounts set up:
1.  [GitHub](https://github.com) (where your code lives)
2.  [Vercel](https://vercel.com)
3.  [Neon](https://neon.tech)
4.  [AWS Console](https://aws.amazon.com)
5.  [Resend](https://resend.com)

### Step 1: Database Setup (Neon)
1.  Log in to **Neon Console**.
2.  Click **"New Project"**.
3.  Name it `yiba-verified-prod`.
4.  Choose the region closest to your users (e.g., `AWS - Africa/Cape Town` if available, otherwise `Europe/Frankfurt` or `US East`).
5.  **Copy the Connection String**. It will look like: 
    `postgresql://neondb_owner:AbCdEf1234@ep-cool-frog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require`

### Step 2: Configure Environment Variables
You will need to gather the following secrets to give to Vercel later.

| Variable Name | Value Scoure |
| :--- | :--- |
| `DATABASE_URL` | From **Neon** (Step 1). |
| `NEXTAUTH_SECRET` | Generate a random string. (Run `openssl rand -base64 32` in terminal). |
| `NEXT_PUBLIC_APP_URL` | Your production URL (e.g., `https://yiba-verified.com`). |
| `AWS_ACCESS_KEY_ID` | From **AWS IAM**. |
| `AWS_SECRET_ACCESS_KEY` | From **AWS IAM**. |
| `AWS_REGION` | e.g., `af-south-1` (Cape Town) or your bucket region. |
| `AWS_BUCKET_NAME` | The name of your S3 bucket. |
| `RESEND_API_KEY` | From **Resend** Dashboard -> API Keys. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | From **Google Cloud Console**. |
| `STORAGE_PROVIDER` | Set to `s3` for production (requires AWS vars above). Defaults to `local`. |

### Step 3: Deploy to Vercel
1.  Go to the [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  **Import** your GitHub repository (`BukhosiMoyo/Yiba-Verified-Platform`).
4.  **Configure Project**:
    *   **Framework Preset**: Next.js (should be auto-detected).
    *   **Root Directory**: `./` (default).
5.  **Environment Variables**:
    *   Expand the "Environment Variables" section.
    *   Copy-paste all the variables from **Step 2** into this list.
6.  Click **"Deploy"**.

### Step 4: Database Migration
Once the first deployment finishes (or fails initially due to DB sync), you need to push your schema to the production database.

1.  In your local terminal, update your `.env` file to use the **Production Neon Connection String** temporarily (or pass it directly).
2.  Run the Prisma push command:
    ```bash
    npx prisma db push
    ```
    *(Note: This creates the tables in your production DB)*.
3.  Run the seed script (if you want default admin users):
    ```bash
    npm run seed:production
    ```

### Step 5: Final Verify
1.  Visit your new Vercel URL (e.g., `https://yiba-verified-platform.vercel.app`).
2.  Test the **Login** page.
3.  Test a **File Upload** (checks AWS S3).
4.  Check **Google Maps** loading.

All systems go! 🚀
