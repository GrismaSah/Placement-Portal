# Backend — JAIN Placement Portal API

Express + MongoDB REST API. See the [root README](../README.md) for the full project overview and architecture.

## Setup

```bash
npm install
cp ../.env.example .env   # fill in real values
npm run dev                # nodemon, http://localhost:4000
```

Environment variables are documented in the root [`.env.example`](../.env.example) — copy it here as `.env`, nothing is re-listed below.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start with nodemon (auto-restart) |
| `npm start` | Start plain (production) |
| `npm run seed` | Seed demo accounts + jobs + enrollment allowlist |
| `npm run seed:accounts` | Just the demo Student/Recruiter/Admin accounts |
| `npm run seed:jobs` | Just the demo job listings |
| `npm run seed:allowlist` | Just the enrollment-number roster |

Re-run `npm run seed:accounts` whenever a Recruiter/Admin login gets stuck — a successful login clears their verification code, and with no SMTP configured there's no way to receive a new one otherwise. Demo code is `123456`.

## Routes

All mounted under `/api/v1/`:

| Prefix | Handles |
|---|---|
| `/user` | Student + Recruiter register, login, profile |
| `/admin` | Placement office login, recruiter approvals, analytics, student directory |
| `/job` | Post, edit, delete, list, search jobs |
| `/application` | Apply, review applicants, advance pipeline status |
| `/resume` | Upload/download resumes (GridFS) |
| `/notification` | In-app notification feed |

## Notes

- **Two account collections.** Students and Recruiters live in `users`; the placement office lives in a separate `admins` collection. Auth middleware checks both, since one JWT format is shared across all three roles.
- **Resumes live in GridFS**, not on disk — serverless functions have no persistent filesystem.
- **`server.js` is local-dev only.** It's the only place Socket.IO can run (a long-lived process). Vercel invokes the Express app directly per request instead, so live in-app notifications only work when running this file locally.
