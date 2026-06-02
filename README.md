# Civic Accountability Platform

A government transparency system that routes citizen complaints to elected officials and tracks their responses.

## Status: Phase 1 — Foundation

**Phase 1 complete:**
- JWT authentication (register, login, email verification)
- Address geocoding → district lookup → elected officials
- Full PostgreSQL schema with Prisma ORM
- Philadelphia officials seed data (City Council, State House, State Senate)
- React frontend with auth forms and address lookup

## Tech Stack
- **Backend:** Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + TanStack Query
- **Auth:** JWT (HS256) with refresh tokens, bcrypt password hashing

## Project Structure
```
civic-accountability-platform/
├── backend/          Express API server
├── frontend/         React app
├── data/             Seed data (Philadelphia officials)
└── docs/             Documentation
```

See [QUICK_START.md](./QUICK_START.md) for setup instructions.
