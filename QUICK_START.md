# Quick Start Guide

## Prerequisites
- Node.js >= 20
- PostgreSQL running locally
- (Optional) Redis for job queues

## 1. Database Setup
```sql
CREATE USER civic_user WITH PASSWORD 'civic_password';
CREATE DATABASE civic_accountability_dev OWNER civic_user;
GRANT ALL PRIVILEGES ON DATABASE civic_accountability_dev TO civic_user;
```

## 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET at minimum
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
# Server: http://localhost:3000
```

## 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# App: http://localhost:5173
```

## 4. Test the Flow
1. Open http://localhost:5173/register
2. Register with any email/password
3. Copy verification link from **backend console output**
4. Visit the link → email verified
5. Log in → Dashboard
6. Enter "123 Broad St, Philadelphia, PA" → see elected officials

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register-resident | Create account |
| POST | /api/auth/login | Login, get JWT |
| POST | /api/auth/logout | Logout |
| POST | /api/auth/refresh-token | Refresh JWT |
| GET  | /api/auth/verify-email/:token | Verify email |
| POST | /api/auth/resend-verification | Resend verification |
| GET  | /api/geocode?address= | Geocode + get officials |
| GET  | /api/districts?lat=&lng= | Get district info |

## Environment Variables (backend/.env)
```
DATABASE_URL=postgresql://civic_user:civic_password@localhost:5432/civic_accountability_dev
JWT_SECRET=any-long-random-string-here
GOOGLE_MAPS_API_KEY=optional-for-real-geocoding
```
Without GOOGLE_MAPS_API_KEY, addresses return mock Philadelphia coordinates.
