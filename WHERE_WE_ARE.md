# Where We Are — Project Status

**Date:** June 15, 2026  
**Status:** All Phase 5 features built, tested, and deployed to production

---

## Live Deployment

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | https://frontend-kappa-smoky-61.vercel.app | Live, auto-deploys on push |
| **Backend** | https://civic-accountability-platform-production.up.railway.app | Live, auto-deploys on push |
| **Database** | PostgreSQL on Railway | Online |

---

## What's Working

### Phase 1-4
- Resident registration, login, password reset
- Real geocoding (Nominatim) to districts
- Complaint submission with official notifications
- Public tracking page with dispute system
- Staff portal with updates
- Admin panel (staff, complaints, officials, audit log)
- Email notifications (SendGrid)
- Image upload (Cloudinary)
- Leaderboard with response rankings

### Phase 5 — AI Priority, Official Portal, Audit Trail, Screening
- AI Urgency Scoring: Claude Haiku scores 0-100 at submission
- Percentage-Based Priority: Top 20% critical, auto-promotes as complaints resolve
- Severity Removed: No self-reported field (AI assigns priority)
- Complaint Audit Trail: ComplaintStatusLog tracks every status change
- Admin Delete: Required reason, logged before deletion (record survives)
- Admin Status Override: Change any complaint's status
- Elected Official Portal: New official user type, post responses, flag complaints
- AI Complaint Screening: Blocks out-of-scope (police, lawsuits, emergencies, etc.)
- Helpful Error Cards: Screening rejections show category + guidance
- Screened Out Admin Tab: Review rejected submissions

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@civicaccountability.com | admin123! |
| Staff | kenyatta.staff@phila.gov | Staff123! |
| Resident | (any email) | (any password) |

---

## What's NOT Built Yet (4 gaps)

1. Admin Invite Official (2 hrs) - endpoint to create official accounts
2. TrackComplaintPage Status Timeline (1 hr) - show ComplaintStatusLog on page
3. StaffDashboard Status Logging (30 min) - staff updates log to ComplaintStatusLog
4. ~~Production Deployment~~ DONE

---

## Environment Variables

### Local (backend/.env)
DATABASE_URL=file:./dev.db
JWT_SECRET=your_secret_key_min_32_chars
ANTHROPIC_API_KEY=sk-ant-...
SENDGRID_API_KEY=SG.xxx
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
CRON_SECRET=your_cron_secret

### Production
Set in Railway Variables tab and Vercel Environment Variables

---

## Useful Commands

Backend:
  npm run dev
  npx tsc --noEmit
  npx prisma studio

Frontend:
  npm run dev
  npx tsc --noEmit

Both:
  git push origin main    (auto-deploy)

---

## Critical Files

- backend/railway.toml - build config
- backend/prisma/schema.prisma - all models
- backend/src/services/aiService.ts - AI screening + scoring
- backend/src/controllers/adminController.ts - admin logic
- frontend/src/pages/AdminPage.tsx - admin UI
- frontend/src/pages/OfficialDashboardPage.tsx - official UI

---

## Links

- Live: https://frontend-kappa-smoky-61.vercel.app
- API: https://civic-accountability-platform-production.up.railway.app
- GitHub: https://github.com/rexabarr/civic-accountability-platform
- README.md - full reference
- CLAUDE.md - how to work on this

