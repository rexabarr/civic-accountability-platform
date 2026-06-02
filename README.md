# Civic Accountability Platform

A government transparency system for Philadelphia that routes citizen complaints to elected officials and tracks their responses publicly — with a neutral verification system that prevents false closures.

## Status: Phases 1–4 Complete — Local dev ready, production deployment pending

## What's Built

- **Resident portal** — Register, submit complaints (20+ types), track by case number, share on social
- **Public tracking** — Anyone can view complaint status, activity timeline, and case details
- **Staff/Rep portal** — Government staff register with `.gov` email, get assigned district complaints, post updates and mark resolved
- **Neutral verification system** — "Resolved" enters a 7-day window; resident can dispute once; another resident reporting same issue auto-reopens it; admin team not involved
- **Email notifications** — New complaints → officials + department; resolution → resident gets 7-day dispute window email
- **Admin panel** — Dashboard stats, staff account approvals, all complaints view, officials contact editor
- **Leaderboard** — Public official response rankings with A–F grades

## Tech Stack
- **Backend:** Node.js 24 + Express + TypeScript + Prisma + PostgreSQL (SQLite in dev)
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + TanStack Query + Zustand
- **Auth:** JWT (HS256) with refresh tokens, bcrypt password hashing
- **Email:** SendGrid (optional — falls back to console in dev)

## Project Structure
```
civic-accountability-platform/
├── backend/          Express API server + Prisma ORM
├── frontend/         React SPA
├── data/             Seed data (Philadelphia officials + complaint types)
├── .claude/          Claude Code commands (/save, launch config)
├── .github/          GitHub Actions CI (TypeScript check + build)
├── DEPLOY.md         Railway + Vercel deployment guide
└── README.md
```

## Quick Start (local dev)

```bash
# Backend
cd backend
npm install
npx prisma migrate dev
npx tsx src/scripts/seed.ts   # creates admin + complaint types + officials
npm run dev                   # http://localhost:3000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

**Admin login:** `admin@civicaccountability.com` / `admin123!`

## Deployment

See [DEPLOY.md](./DEPLOY.md) for step-by-step Railway (backend) + Vercel (frontend) setup.

## GitHub
Repository: https://github.com/rexabarr/civic-accountability-platform
