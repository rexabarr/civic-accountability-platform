# Claude Code Instructions

This document tells Claude Code (any session) how to work efficiently on this project.

---

## Session Start

1. Read WHERE_WE_ARE.md - current status
2. Read README.md - full reference
3. Use Bash tool for npm (not PowerShell on Windows)
4. Run: npx tsc --noEmit (both backend + frontend) before committing

---

## Key Info

Live Services (auto-deploy on git push):
- Frontend: https://frontend-kappa-smoky-61.vercel.app
- Backend: https://civic-accountability-platform-production.up.railway.app

Test Accounts:
- Admin: admin@civicaccountability.com / admin123!
- Staff: kenyatta.staff@phila.gov / Staff123!

Stack:
- Backend: Node.js/Express/TypeScript, Prisma ORM
- Frontend: React 18/Vite/TypeScript
- Database: PostgreSQL (prod), SQLite (dev)
- AI: Claude Haiku for screening + urgency scoring

---

## Common Tasks

### Add New Endpoint
1. Create route in backend/src/routes/[feature].ts
2. Register in backend/src/index.ts
3. Create hook in frontend/src/hooks/use[Feature].ts
4. Use hook in component
5. npx tsc --noEmit -> commit -> deploy

### Fix a Bug
1. npm run dev (both backend + frontend)
2. Check browser console + backend logs
3. Edit code -> refresh
4. npx tsc --noEmit -> commit -> deploy

### Add Database Field
1. Edit backend/prisma/schema.prisma
2. npx prisma migrate dev --name field_name
3. Commit -> auto-deploy

### Deploy
git push origin main
(Railway/Vercel auto-deploy within 30 seconds)

---

## Critical Files

- backend/railway.toml - build config
- backend/prisma/schema.prisma - all models
- backend/src/services/aiService.ts - AI screening + scoring
- backend/src/services/screeningPolicy.ts - screening categories
- backend/src/controllers/adminController.ts - admin logic
- frontend/src/pages/AdminPage.tsx - admin UI (7 tabs)
- frontend/src/pages/OfficialDashboardPage.tsx - official portal

---

## Development Patterns

Error handling (backend):
  throw new AppError(422, 'Message', { category: 'type', guidance: '...' });

Frontend gets:
  { error: "Message", category: "type", guidance: "..." }

AI Features (never block):
- Screening timeout -> default allow
- Scoring timeout -> heuristic fallback
- Always fail open

React Query:
  const mutation = useMutation({
    mutationFn: (data) => api.post('/api/endpoint', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['...'] });
    },
  });

---

## Before Committing

- npx tsc --noEmit (both)
- Test locally
- No console errors
- Review git diff

---

## Useful Commands

cd backend && npm run dev       # Backend
cd frontend && npm run dev      # Frontend
npx tsc --noEmit               # Type-check
npx prisma studio              # Browse DB
npx prisma migrate dev --name  # New migration
git push origin main           # Deploy

---

## 4 Remaining Gaps

1. Admin Invite Official endpoint (2 hrs)
2. TrackComplaintPage Status Timeline (1 hr)
3. StaffDashboard Status Logging (30 min)
4. ~~Production Deployment~~ DONE

See WHERE_WE_ARE.md for details.

---

## Quick Links

- Frontend: https://frontend-kappa-smoky-61.vercel.app
- Backend: https://civic-accountability-platform-production.up.railway.app
- GitHub: https://github.com/rexabarr/civic-accountability-platform
- WHERE_WE_ARE.md
- README.md

