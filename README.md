# Civic Accountability Platform

A Philadelphia government transparency platform where residents submit complaints about city services, elected officials and city departments are notified, and complaints are publicly tracked with neutral verification to prevent false closures.

**Live Demo:** https://frontend-kappa-smoky-61.vercel.app

---

## Quick Start (5 minutes)

### 1. Clone and install
```bash
git clone https://github.com/rexabarr/civic-accountability-platform.git
cd civic-accountability-platform

# Backend
cd backend
npm install
cp .env.example .env  # Edit with your API keys
npm run dev

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

### 2. Open browser
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Database UI: `cd backend && npx prisma studio`

### 3. Test
- **Register** a new resident account
- **Submit** a complaint (try "police misconduct" to see AI screening block it)
- **Login as admin**: `admin@civicaccountability.com` / `admin123!`
- **View audit log** and admin controls

---

## Stack Overview

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js 24, Express 4, TypeScript |
| **Frontend** | React 18, Vite 5, TailwindCSS, TypeScript |
| **Database** | SQLite (dev) / PostgreSQL (prod) via Prisma ORM |
| **AI** | Claude Haiku (Anthropic API) for screening & urgency scoring |
| **Geocoding** | Nominatim (OpenStreetMap) — free, no key needed |
| **Email** | SendGrid (optional; console fallback) |
| **Deployment** | Railway (backend), Vercel (frontend) |

---

## Project Phases

All phases complete and deployed to production.

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Auth, registration, email verification, geocoding | ✅ Complete |
| 2 | Complaint submission, public tracking, sharing | ✅ Complete |
| 3 | Resident dispute system, auto-resolve, verification | ✅ Complete |
| 4 | Staff portal, admin panel, leaderboard, image upload | ✅ Complete |
| 5 | AI priority scoring, official portal, audit log, screening | ✅ Complete |

---

## Live Services

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | https://frontend-kappa-smoky-61.vercel.app | React app (auto-deploys on push) |
| **Backend API** | https://civic-accountability-platform-production.up.railway.app | Express API (auto-deploys on push) |
| **Database** | PostgreSQL on Railway | Persists all data |

---

## Local Development

### Environment Variables (backend/.env)

```env
# Database
DATABASE_URL="file:./dev.db"

# Auth
JWT_SECRET=your_secret_key_min_32_chars
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# AI (optional; falls back to heuristics if missing)
ANTHROPIC_API_KEY=sk-ant-...

# Email (optional; logs to console if missing)
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@civicaccountability.com

# Server
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# Cron jobs (required if using /api/cron/*)
CRON_SECRET=your_cron_secret
```

### Commands

**Backend:**
```bash
cd backend
npm run dev              # Start dev server with auto-reload
npm run build           # TypeScript → JavaScript
npx tsc --noEmit       # Type-check without building
npx prisma studio     # Browse/edit database
npx prisma migrate dev # Create new migration
npm run test           # Run tests
```

**Frontend:**
```bash
cd frontend
npm run dev            # Start Vite dev server (http://localhost:5173)
npm run build         # Build for production
npx tsc --noEmit     # Type-check
```

### Health Check
```bash
curl http://localhost:3000/health
# Expected: { "status": "ok" }
```

---

## Deployment

### Auto-Deploy on Push
Both backend and frontend auto-deploy on `git push origin main`:
- **Backend** → Railway detects → runs build command in `backend/railway.toml` → seeds DB → starts
- **Frontend** → Vercel detects → runs build → deploys
- No manual steps needed

### Manual Deployment
If needed, you can redeploy manually:

**Backend (Railway):**
1. Go to https://railway.app → civic-accountability-platform service
2. Click **Deploy** tab → **Redeploy** button

**Frontend (Vercel):**
1. Go to https://vercel.com → frontend project
2. Click **Deployments** → **Redeploy** on latest

---

## Test Accounts

### Resident
- **Email:** any email (e.g., test@example.com)
- **Password:** any password
- Self-register via the landing page

### Admin
- **Email:** `admin@civicaccountability.com`
- **Password:** `admin123!`

### Staff
- **Email:** `kenyatta.staff@phila.gov`
- **Password:** `Staff123!`

---

## Key Features

### AI Complaint Screening
Blocks out-of-scope submissions before saving:
- Police misconduct → Philadelphia Civilian Review Board
- Active lawsuits → legal aid
- Personal disputes → community mediation
- Emergencies (fire, medical) → 911
- Hate speech, spam, defamatory content → blocked

Residents see helpful redirect guidance instead of generic error.

### AI Urgency Scoring
Claude Haiku scores complaints 0–100 at submission:
- **Top 20% of open complaints** → Critical
- **Next 20%** → High
- **Next 30%** → Moderate
- **Bottom 30%** → Routine

Auto-promotes lower-priority complaints as higher ones resolve.

### Full Audit Log
Every action logged permanently:
- Complaint deletion (with reason)
- Status override
- Staff approval
- Who resolved complaint & when

### Elected Official Portal
Officials can:
- View complaints from their district
- Post public responses
- Flag complaints for admin review

---

## Next Steps

See **[WHERE_WE_ARE.md](WHERE_WE_ARE.md)** for current status and what's remaining.

See **[CLAUDE.md](CLAUDE.md)** for how to work on this project in Claude Code.

---

## Resources

- **GitHub:** https://github.com/rexabarr/civic-accountability-platform
- **Live Demo:** https://frontend-kappa-smoky-61.vercel.app
- **Railway:** https://railway.app
- **Vercel:** https://vercel.com

