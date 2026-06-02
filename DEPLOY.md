# Deployment Guide

Two services to deploy:
- **Frontend** → [Vercel](https://vercel.com) (free)
- **Backend** → [Railway](https://railway.app) (free tier available)

---

## Step 1 — Deploy the Backend on Railway

### A. Create a Railway account
1. Go to [railway.app](https://railway.app) and sign up with GitHub

### B. Create a new project
1. Click **"New Project"**
2. Choose **"Deploy from GitHub repo"**
3. Select your `civic-accountability-platform` repository
4. When it asks for the root directory, type: `backend`

### C. Add a PostgreSQL database
1. In your Railway project, click **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway will auto-create `DATABASE_URL` — it shows up in your service's environment variables automatically

### D. Set environment variables
In your Railway backend service, go to **Variables** and add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | (auto-filled by Railway PostgreSQL) |
| `JWT_SECRET` | any random 32+ character string (e.g. use [random.org](https://random.org)) |
| `JWT_EXPIRY` | `15m` |
| `JWT_REFRESH_EXPIRY` | `7d` |
| `BCRYPT_ROUNDS` | `12` |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `FRONTEND_URL` | your Vercel URL (fill in after Step 2) |
| `CORS_ORIGIN` | your Vercel URL (fill in after Step 2) |
| `SENDGRID_API_KEY` | (optional — leave blank to use console logs) |
| `SENDGRID_FROM_EMAIL` | `noreply@yourdomain.com` |
| `GOOGLE_MAPS_API_KEY` | (optional — leave blank to use mock geocoding) |

### E. Run the database seed
Once deployed, open the Railway **Shell** tab and run:
```bash
npx tsx src/scripts/seed.ts
```
This creates the admin account and test data.

### F. Get your backend URL
Railway gives you a URL like: `https://civic-accountability-production.up.railway.app`
Save this — you'll need it for the frontend.

---

## Step 2 — Deploy the Frontend on Vercel

### A. Create a Vercel account
1. Go to [vercel.com](https://vercel.com) and sign up with GitHub

### B. Import your project
1. Click **"Add New Project"**
2. Import your `civic-accountability-platform` repository
3. Set **Root Directory** to `frontend`
4. Framework preset will auto-detect as **Vite** ✓

### C. Set environment variables
In Vercel project settings → **Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | your Railway backend URL (e.g. `https://civic-accountability-production.up.railway.app`) |

### D. Deploy
Click **Deploy**. Vercel builds and deploys automatically.

### E. Copy your Vercel URL
It will look like: `https://civic-accountability-platform.vercel.app`

### F. Update Railway CORS
Go back to Railway → Variables and update:
- `FRONTEND_URL` → your Vercel URL
- `CORS_ORIGIN` → your Vercel URL

---

## Step 3 — Test the Live Site

1. Open your Vercel URL
2. Register a new account
3. Submit a complaint
4. Track it with the case number

---

## Admin Access

After seeding the database (Step 1E), login with:
- **Email:** `admin@civicaccountability.com`
- **Password:** `admin123!`
- **URL:** `https://your-vercel-url.vercel.app/admin`

> ⚠️ Change this password immediately after first login in production!

---

## Automatic Deploys

Once connected:
- Every `git push` to `main` → **auto-deploys** to both Railway and Vercel
- GitHub Actions runs type checks on every push/PR before deploying

---

## Environment Variables Summary

### Backend (Railway)
```
DATABASE_URL=           # Auto-provided by Railway PostgreSQL
JWT_SECRET=             # Random 32+ char string
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
BCRYPT_ROUNDS=12
NODE_ENV=production
PORT=3000
FRONTEND_URL=           # Your Vercel URL
CORS_ORIGIN=            # Your Vercel URL
SENDGRID_API_KEY=       # Optional
SENDGRID_FROM_EMAIL=    # Optional
GOOGLE_MAPS_API_KEY=    # Optional
```

### Frontend (Vercel)
```
VITE_API_URL=           # Your Railway backend URL
```
